const TRELLO_API_BASE = 'https://api.trello.com/1';

function apiUrl(path: string, token: string, appKey: string, params?: Record<string, string>): string {
    const url = new URL(`${TRELLO_API_BASE}${path}`);
    url.searchParams.set('key', appKey);
    url.searchParams.set('token', token);
    if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    return url.toString();
}

export async function getCardData(
    token: string,
    appKey: string,
    cardId: string,
    fields: string[],
    options?: { checklists?: boolean; customFieldItems?: boolean }
): Promise<any> {
    const params: Record<string, string> = {
        fields: fields.join(','),
    };
    if (options?.checklists) params.checklists = 'all';
    if (options?.customFieldItems) params.customFieldItems = 'true';

    const res = await fetch(apiUrl(`/cards/${cardId}`, token, appKey, params));
    if (!res.ok) throw new Error(`Failed to get card: ${res.status}`);
    return res.json();
}

export async function createCard(
    token: string,
    appKey: string,
    params: {
        name: string;
        idList: string;
        desc?: string;
        idLabels?: string;
        idMembers?: string;
        due?: string | null;
        dueComplete?: boolean;
        pos?: string;
    }
): Promise<any> {
    const body: Record<string, string> = {
        name: params.name,
        idList: params.idList,
        pos: params.pos || 'top',
    };
    if (params.desc) body.desc = params.desc;
    if (params.idLabels) body.idLabels = params.idLabels;
    if (params.idMembers) body.idMembers = params.idMembers;
    if (params.due) body.due = params.due;
    if (params.dueComplete !== undefined) body.dueComplete = String(params.dueComplete);

    const res = await fetch(apiUrl('/cards', token, appKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Failed to create card: ${res.status}`);
    return res.json();
}

export async function copyChecklist(
    token: string,
    appKey: string,
    newCardId: string,
    sourceChecklistId: string
): Promise<any> {
    const res = await fetch(apiUrl(`/cards/${newCardId}/checklists`, token, appKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idChecklistSource: sourceChecklistId }),
    });
    if (!res.ok) throw new Error(`Failed to copy checklist: ${res.status}`);
    return res.json();
}

export async function setCustomFieldValue(
    token: string,
    appKey: string,
    cardId: string,
    customFieldId: string,
    value?: Record<string, unknown>,
    idValue?: string
): Promise<void> {
    const body: Record<string, unknown> = {};
    if (idValue) {
        body.idValue = idValue;
    } else if (value) {
        body.value = value;
    }
    const res = await fetch(apiUrl(`/cards/${cardId}/customField/${customFieldId}/item`, token, appKey), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Failed to set custom field: ${res.status}`);
}

export async function uploadAttachment(
    token: string,
    appKey: string,
    cardId: string,
    file: Blob,
    name: string
): Promise<any> {
    const formData = new FormData();
    formData.append('file', file, name);

    const res = await fetch(apiUrl(`/cards/${cardId}/attachments`, token, appKey), {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Failed to upload attachment: ${res.status} - ${errorBody}`);
    }
    return res.json();
}

export async function setCardCover(
    token: string,
    appKey: string,
    cardId: string,
    attachmentId: string
): Promise<void> {
    const res = await fetch(apiUrl(`/cards/${cardId}`, token, appKey), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            cover: { idAttachment: attachmentId, size: 'full' }
        }),
    });
    if (!res.ok) {
        console.warn('[Card Factory] Failed to set cover, continuing without it');
    }
}

export async function deleteAttachment(
    token: string,
    appKey: string,
    cardId: string,
    attachmentId: string
): Promise<void> {
    const res = await fetch(apiUrl(`/cards/${cardId}/attachments/${attachmentId}`, token, appKey), {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete attachment: ${res.status}`);
}
