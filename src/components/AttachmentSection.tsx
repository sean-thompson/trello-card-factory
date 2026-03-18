import React, {useEffect, useState, useRef} from 'react';
import {Trello} from '../types/trello';
import {getFactoryConfig, markAttachmentProcessed} from '../lib/factory-config';
import {cleanFilenameForCardName} from '../lib/attachment-utils';
import {createCardFromFactory} from '../lib/card-creator';

interface Props {
    t: Trello.PowerUp.IFrame;
}

function AttachmentSection({t}: Props) {
    const attachmentId = t.arg('attachmentId');
    const attachmentName = t.arg('attachmentName');
    const attachmentUrl = t.arg('attachmentUrl');

    const [cardName, setCardName] = useState(cleanFilenameForCardName(attachmentName || ''));
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        t.sizeTo('#attachment-section-root').catch(() => {});
    }, [t]);

    async function handleCreate() {
        if (!attachmentId || !attachmentUrl || !cardName.trim()) return;
        setBusy(true);
        try {
            const config = await getFactoryConfig(t);
            if (!config || !config.enabled) {
                t.alert({message: 'Factory is not configured on this card', display: 'error'});
                setBusy(false);
                return;
            }

            await createCardFromFactory({
                t,
                config,
                cardName: cardName.trim(),
                attachmentId,
                attachmentName: attachmentName || cardName.trim(),
                attachmentUrl,
            });

            await markAttachmentProcessed(t, attachmentId);
            setDone(true);
            t.alert({message: `Card "${cardName.trim()}" created!`, display: 'success', duration: 5});
        } catch (err) {
            console.error('Failed to create card:', err);
            t.alert({message: 'Failed to create card. Please try again.', display: 'error'});
            setBusy(false);
        }
    }

    async function handleDismiss() {
        if (!attachmentId) return;
        setBusy(true);
        try {
            await markAttachmentProcessed(t, attachmentId);
            setDone(true);
        } catch (err) {
            console.error('Failed to dismiss:', err);
            setBusy(false);
        }
    }

    if (done) {
        return (
            <div id="attachment-section-root" style={{padding: '8px 0', fontSize: '13px', color: '#5e6c84'}}>
                Done
            </div>
        );
    }

    return (
        <div
            id="attachment-section-root"
            ref={rootRef}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 0',
            }}
        >
            <input
                type="text"
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                disabled={busy}
                placeholder="Card name"
                style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: '14px',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                }}
            />
            <button
                onClick={handleCreate}
                disabled={busy || !cardName.trim()}
                title="Create card"
                style={{
                    padding: '4px 12px',
                    fontSize: '14px',
                    backgroundColor: '#5aac44',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: busy ? 'wait' : 'pointer',
                    opacity: busy ? 0.6 : 1,
                }}
            >
                {busy ? '...' : '\u2713'}
            </button>
            <button
                onClick={handleDismiss}
                disabled={busy}
                title="Dismiss"
                style={{
                    padding: '4px 8px',
                    fontSize: '14px',
                    backgroundColor: 'transparent',
                    color: '#6b778c',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    cursor: busy ? 'wait' : 'pointer',
                }}
            >
                {'\u2717'}
            </button>
        </div>
    );
}

export default AttachmentSection;
