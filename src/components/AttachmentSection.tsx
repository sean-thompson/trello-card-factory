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

    if (done) {
        return (
            <div id="attachment-section-root" style={{fontSize: '13px', color: '#5e6c84'}}>
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
                gap: '6px',
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
                    height: '24px',
                    padding: '0 6px',
                    margin: 0,
                    fontSize: '14px',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    boxSizing: 'border-box',
                }}
            />
            <button
                onClick={handleCreate}
                disabled={busy || !cardName.trim()}
                title="Create card"
                style={{
                    height: '24px',
                    padding: '0 10px',
                    margin: 0,
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
        </div>
    );
}

export default AttachmentSection;
