import {Trello} from '../types/trello';
import {FactoryConfig} from '../types/factory';
import {STORAGE_KEY_FACTORY, STORAGE_KEY_PROCESSED, PROCESSED_PRUNE_THRESHOLD} from './constants';

export async function getFactoryConfig(t: Trello.PowerUp.IFrame): Promise<FactoryConfig | null> {
    const raw = await t.get('card', 'shared', STORAGE_KEY_FACTORY);
    if (!raw) return null;
    try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
        return null;
    }
}

export async function setFactoryConfig(t: Trello.PowerUp.IFrame, config: FactoryConfig): Promise<void> {
    await t.set('card', 'shared', STORAGE_KEY_FACTORY, JSON.stringify(config));
}

export async function getProcessedAttachments(t: Trello.PowerUp.IFrame): Promise<string[]> {
    const raw = await t.get('card', 'shared', STORAGE_KEY_PROCESSED);
    if (!raw) return [];
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export async function markAttachmentProcessed(t: Trello.PowerUp.IFrame, attachmentId: string): Promise<void> {
    let processed = await getProcessedAttachments(t);
    if (!processed.includes(attachmentId)) {
        processed.push(attachmentId);
    }
    // Prune old entries if list gets large
    if (processed.length > PROCESSED_PRUNE_THRESHOLD) {
        processed = processed.slice(-PROCESSED_PRUNE_THRESHOLD);
    }
    await t.set('card', 'shared', STORAGE_KEY_PROCESSED, JSON.stringify(processed));
}
