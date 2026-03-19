import {ICON, STORAGE_KEY_FACTORY, STORAGE_KEY_PROCESSED} from './lib/constants';
import {isImageAttachment} from './lib/attachment-utils';

window.TrelloPowerUp.initialize({
    'card-buttons': (t: any) => {
        return [{
            icon: ICON.dark,
            text: 'Card Factory',
            callback: (tc: any) => {
                return tc.popup({
                    title: 'Card Factory',
                    url: './connector.html',
                    height: 360,
                });
            }
        }];
    },

    'attachment-sections': async (t: any, options: {entries: any[]}) => {
        const config = await t.get('card', 'shared', STORAGE_KEY_FACTORY);
        if (!config) return [];

        let parsed;
        try {
            parsed = typeof config === 'string' ? JSON.parse(config) : config;
        } catch {
            return [];
        }
        if (!parsed.enabled) return [];

        const processedRaw = await t.get('card', 'shared', STORAGE_KEY_PROCESSED);
        let processedIds: string[] = [];
        try {
            const processedParsed = typeof processedRaw === 'string' ? JSON.parse(processedRaw) : processedRaw;
            if (Array.isArray(processedParsed)) processedIds = processedParsed;
        } catch { /* empty */ }

        const processedSet = new Set(processedIds);
        const unprocessed = options.entries.filter(
            (a: any) => isImageAttachment(a) && !processedSet.has(a.id)
        );

        if (unprocessed.length === 0) return [];

        return unprocessed.map((attachment: any) => ({
            claimed: [attachment],
            title: 'Create Card from Image',
            icon: ICON.dark,
            content: {
                type: 'iframe',
                url: t.signUrl('./attachment-section.html', {
                    attachmentId: attachment.id,
                    attachmentName: attachment.name,
                    attachmentUrl: attachment.url,
                }),
                height: 24,
            }
        }));
    },

    'card-badges': async (t: any) => {
        const config = await t.get('card', 'shared', STORAGE_KEY_FACTORY);
        if (!config) return [];

        let parsed;
        try {
            parsed = typeof config === 'string' ? JSON.parse(config) : config;
        } catch {
            return [];
        }
        if (!parsed.enabled) return [];

        return [{
            text: 'Factory',
            icon: ICON.dark,
            color: 'blue',
        }];
    },

    'card-detail-badges': async (t: any) => {
        const config = await t.get('card', 'shared', STORAGE_KEY_FACTORY);
        if (!config) return [];

        let parsed;
        try {
            parsed = typeof config === 'string' ? JSON.parse(config) : config;
        } catch {
            return [];
        }
        if (!parsed.enabled) return [];

        return [{
            title: 'Card Factory',
            text: 'Active',
            color: 'blue',
        }];
    },
});
