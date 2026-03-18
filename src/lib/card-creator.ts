import {Trello} from '../types/trello';
import {FactoryConfig} from '../types/factory';
import * as api from './trello-api';

export async function createCardFromFactory(params: {
    t: Trello.PowerUp.IFrame;
    config: FactoryConfig;
    cardName: string;
    attachmentId: string;
    attachmentName: string;
    attachmentUrl: string;
}): Promise<string> {
    const {t, config, cardName, attachmentId, attachmentName, attachmentUrl} = params;

    const restApi = t.getRestApi();
    const authorized = await restApi.isAuthorized();
    if (!authorized) {
        await restApi.authorize({scope: 'read,write'});
    }
    const token = await restApi.getToken();
    const appKey = process.env.POWERUP_APP_KEY as string;
    const context = t.getContext();
    const factoryCardId = context.card as string;

    // Determine which fields to fetch from the factory card
    const fields = ['idList'];
    if (config.copyAttributes.includes('description')) fields.push('desc');
    if (config.copyAttributes.includes('labels')) fields.push('idLabels');
    if (config.copyAttributes.includes('members')) fields.push('idMembers');
    if (config.copyAttributes.includes('due')) fields.push('due', 'dueComplete');

    const sourceCard = await api.getCardData(token, appKey, factoryCardId, fields, {
        checklists: config.copyAttributes.includes('checklists'),
        customFieldItems: config.copyAttributes.includes('customFields'),
    });

    // Resolve destination list
    const destinationListId = config.destinationListId === 'same'
        ? sourceCard.idList
        : config.destinationListId;

    // Build create params
    const createParams: Parameters<typeof api.createCard>[2] = {
        name: cardName,
        idList: destinationListId,
        pos: 'top',
    };

    if (config.copyAttributes.includes('description') && sourceCard.desc) {
        createParams.desc = sourceCard.desc;
    }
    if (config.copyAttributes.includes('labels') && sourceCard.idLabels?.length) {
        createParams.idLabels = sourceCard.idLabels.join(',');
    }
    if (config.copyAttributes.includes('members') && sourceCard.idMembers?.length) {
        createParams.idMembers = sourceCard.idMembers.join(',');
    }
    if (config.copyAttributes.includes('due') && sourceCard.due) {
        createParams.due = sourceCard.due;
        createParams.dueComplete = sourceCard.dueComplete;
    }

    // Create the new card
    const newCard = await api.createCard(token, appKey, createParams);

    // Copy checklists
    if (config.copyAttributes.includes('checklists') && sourceCard.checklists?.length) {
        for (const checklist of sourceCard.checklists) {
            await api.copyChecklist(token, appKey, newCard.id, checklist.id);
        }
    }

    // Copy custom fields
    if (config.copyAttributes.includes('customFields') && sourceCard.customFieldItems?.length) {
        for (const field of sourceCard.customFieldItems) {
            if (field.value) {
                await api.setCustomFieldValue(token, appKey, newCard.id, field.idCustomField, field.value);
            }
        }
    }

    // Attach the image to the new card
    await api.addAttachment(token, appKey, newCard.id, attachmentUrl, attachmentName);

    // Remove the image from the factory card
    await api.deleteAttachment(token, appKey, factoryCardId, attachmentId);

    return newCard.id;
}
