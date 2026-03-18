import React, {useEffect, useState} from 'react';
import {Trello} from '../types/trello';
import {FactoryConfig, CopyableAttribute} from '../types/factory';
import {getFactoryConfig, setFactoryConfig} from '../lib/factory-config';
import {COPYABLE_ATTRIBUTE_LABELS, DEFAULT_COPY_ATTRIBUTES} from '../lib/constants';

interface Props {
    t: Trello.PowerUp.IFrame;
}

const ALL_ATTRIBUTES = Object.keys(COPYABLE_ATTRIBUTE_LABELS) as CopyableAttribute[];

function ConfigPopup({t}: Props) {
    const [enabled, setEnabled] = useState(false);
    const [copyAttributes, setCopyAttributes] = useState<CopyableAttribute[]>(DEFAULT_COPY_ATTRIBUTES);
    const [destinationListId, setDestinationListId] = useState('same');
    const [lists, setLists] = useState<Array<{id: string; name: string}>>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const [config, boardLists] = await Promise.all([
                    getFactoryConfig(t),
                    t.lists('id', 'name'),
                ]);
                if (config) {
                    setEnabled(config.enabled);
                    setCopyAttributes(config.copyAttributes);
                    setDestinationListId(config.destinationListId);
                }
                setLists(boardLists);
            } catch (err) {
                console.error('Failed to load config:', err);
            }
            setLoading(false);
        }
        load();
    }, [t]);

    function toggleAttribute(attr: CopyableAttribute) {
        setCopyAttributes(prev =>
            prev.includes(attr)
                ? prev.filter(a => a !== attr)
                : [...prev, attr]
        );
    }

    async function handleSave() {
        setSaving(true);
        try {
            const config: FactoryConfig = {
                enabled,
                copyAttributes,
                destinationListId,
            };
            await setFactoryConfig(t, config);
            t.closePopup();
        } catch (err) {
            console.error('Failed to save config:', err);
            t.alert({message: 'Failed to save settings', display: 'error'});
            setSaving(false);
        }
    }

    async function handleDisable() {
        setSaving(true);
        try {
            const config: FactoryConfig = {
                enabled: false,
                copyAttributes,
                destinationListId,
            };
            await setFactoryConfig(t, config);
            t.closePopup();
        } catch (err) {
            console.error('Failed to save config:', err);
            setSaving(false);
        }
    }

    if (loading) {
        return <div style={{margin: '12px'}}>Loading...</div>;
    }

    return (
        <div style={{padding: '8px 12px'}}>
            {!enabled ? (
                <div>
                    <p style={{margin: '0 0 12px', fontSize: '14px'}}>
                        Turn this card into a factory to quickly create new cards by dropping images onto it.
                    </p>
                    <button
                        className="mod-primary"
                        style={{width: '100%'}}
                        onClick={() => setEnabled(true)}
                    >
                        Enable Card Factory
                    </button>
                </div>
            ) : (
                <div>
                    <h4 style={{margin: '0 0 8px'}}>Copy from this card:</h4>
                    {ALL_ATTRIBUTES.map(attr => (
                        <label key={attr} style={{display: 'block', margin: '4px 0', cursor: 'pointer'}}>
                            <input
                                type="checkbox"
                                checked={copyAttributes.includes(attr)}
                                onChange={() => toggleAttribute(attr)}
                                style={{marginRight: '8px'}}
                            />
                            {COPYABLE_ATTRIBUTE_LABELS[attr]}
                        </label>
                    ))}

                    <h4 style={{margin: '12px 0 8px'}}>Create new cards in:</h4>
                    <select
                        value={destinationListId}
                        onChange={e => setDestinationListId(e.target.value)}
                        style={{width: '100%', padding: '6px', marginBottom: '12px'}}
                    >
                        <option value="same">Same list as this card</option>
                        {lists.map(list => (
                            <option key={list.id} value={list.id}>{list.name}</option>
                        ))}
                    </select>

                    <button
                        className="mod-primary"
                        style={{width: '100%', marginBottom: '6px'}}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        className="mod-danger"
                        style={{width: '100%'}}
                        onClick={handleDisable}
                        disabled={saving}
                    >
                        Disable Factory
                    </button>
                </div>
            )}
        </div>
    );
}

export default ConfigPopup;
