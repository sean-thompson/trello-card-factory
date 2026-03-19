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

    const selectedCustomFieldIds = config.copyAttributes
        .filter(a => a.startsWith('customField:'))
        .map(a => a.replace('customField:', ''));
    const hasCustomFields = selectedCustomFieldIds.length > 0;

    const sourceCard = await api.getCardData(token, appKey, factoryCardId, fields, {
        checklists: config.copyAttributes.includes('checklists'),
        customFieldItems: hasCustomFields,
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

    // Copy selected custom fields
    if (hasCustomFields && sourceCard.customFieldItems?.length) {
        for (const field of sourceCard.customFieldItems) {
            if (!selectedCustomFieldIds.includes(field.idCustomField)) continue;
            if (field.idValue) {
                // Dropdown/list fields use idValue
                await api.setCustomFieldValue(token, appKey, newCard.id, field.idCustomField, undefined, field.idValue);
            } else if (field.value && Object.keys(field.value).length > 0) {
                // Text, number, date, checkbox fields use value
                await api.setCustomFieldValue(token, appKey, newCard.id, field.idCustomField, field.value);
            }
        }
    }

    // Download the image via proxy (local /trello-image or production Worker)
    const proxyBase = process.env.TRELLO_IMAGE_PROXY_URL || '/trello-image';
    const proxyUrl = `${proxyBase}?url=${encodeURIComponent(attachmentUrl)}&token=${encodeURIComponent(token)}`;
    const imageRes = await fetch(proxyUrl);
    if (!imageRes.ok) {
        throw new Error(`Failed to download image via proxy: ${imageRes.status}`);
    }
    const rawBlob = await imageRes.blob();
    // Ensure the blob has the correct MIME type from the response
    const contentType = imageRes.headers.get('Content-Type') || 'application/octet-stream';
    const imageBlob = new Blob([rawBlob], { type: contentType });

    // Upload as a real file to the new card
    const newAttachment = await api.uploadAttachment(token, appKey, newCard.id, imageBlob, attachmentName);

    // Wait briefly for Trello to generate previews, then set as cover
    if (newAttachment && newAttachment.id) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await api.setCardCover(token, appKey, newCard.id, newAttachment.id);
    }

    // Remove the image from the factory card
    await api.deleteAttachment(token, appKey, factoryCardId, attachmentId);

    return newCard.id;
}
