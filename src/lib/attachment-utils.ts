import {Trello} from '../types/trello';
import {IMAGE_MIME_TYPES, IMAGE_EXTENSIONS} from './constants';

export function isImageAttachment(attachment: Trello.PowerUp.Attachment): boolean {
    if (attachment.mimeType && IMAGE_MIME_TYPES.includes(attachment.mimeType)) {
        return true;
    }
    const ext = attachment.name?.toLowerCase().match(/\.[^.]+$/)?.[0];
    return ext ? IMAGE_EXTENSIONS.includes(ext) : false;
}

export function cleanFilenameForCardName(filename: string): string {
    return filename
        .replace(/\.[^.]+$/, '')       // strip extension
        .replace(/[_-]/g, ' ')         // underscores/hyphens to spaces
        .replace(/\s+/g, ' ')          // collapse whitespace
        .trim();
}

export function filterUnprocessedImages(
    attachments: Trello.PowerUp.Attachment[],
    processedIds: string[]
): Trello.PowerUp.Attachment[] {
    const processedSet = new Set(processedIds);
    return attachments.filter(a => isImageAttachment(a) && !processedSet.has(a.id));
}
