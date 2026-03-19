import React, {useEffect, useState, useRef, useCallback} from 'react';
import {Trello} from '../types/trello';
import {FactoryConfig, CopyableAttribute} from '../types/factory';
import {getFactoryConfig, setFactoryConfig} from '../lib/factory-config';
import {ATTRIBUTE_GROUPS, DEFAULT_COPY_ATTRIBUTES, AttributeGroup} from '../lib/constants';

interface Props {
    t: Trello.PowerUp.IFrame;
}

interface CustomField {
    id: string;
    name: string;
    type: string;
}

function IndeterminateCheckbox({checked, indeterminate, onChange, ...props}: {
    checked: boolean;
    indeterminate: boolean;
    onChange: () => void;
    [key: string]: any;
}) {
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);
    return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} {...props} />;
}

function ConfigPopup({t}: Props) {
    const [enabled, setEnabled] = useState(false);
    const [copyAttributes, setCopyAttributes] = useState<CopyableAttribute[]>(DEFAULT_COPY_ATTRIBUTES);
    const [destinationListId, setDestinationListId] = useState('same');
    const [lists, setLists] = useState<Array<{id: string; name: string}>>([]);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const [config, boardLists, boardData] = await Promise.all([
                    getFactoryConfig(t),
                    t.lists('id', 'name'),
                    t.board('customFields'),
                ]);
                if (config) {
                    setEnabled(config.enabled);
                    setCopyAttributes(config.copyAttributes);
                    setDestinationListId(config.destinationListId);
                }
                setLists(boardLists);
                if (boardData && (boardData as any).customFields) {
                    setCustomFields((boardData as any).customFields);
                }
            } catch (err) {
                console.error('Failed to load config:', err);
            }
            setLoading(false);
        }
        load();
    }, [t]);

    const toggleAttribute = useCallback((attr: CopyableAttribute) => {
        setCopyAttributes(prev =>
            prev.includes(attr)
                ? prev.filter(a => a !== attr)
                : [...prev, attr]
        );
    }, []);

    const toggleGroup = useCallback((keys: CopyableAttribute[]) => {
        setCopyAttributes(prev => {
            const allSelected = keys.every(k => prev.includes(k));
            if (allSelected) {
                return prev.filter(a => !keys.includes(a));
            } else {
                return [...prev, ...keys.filter(k => !prev.includes(k))];
            }
        });
    }, []);

    function getGroupState(keys: CopyableAttribute[]): { checked: boolean; indeterminate: boolean } {
        const count = keys.filter(k => copyAttributes.includes(k)).length;
        if (count === 0) return { checked: false, indeterminate: false };
        if (count === keys.length) return { checked: true, indeterminate: false };
        return { checked: false, indeterminate: true };
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

    function renderGroup(group: AttributeGroup) {
        const keys = group.attributes.map(a => a.key);
        const state = getGroupState(keys);

        return (
            <div key={group.label} style={{marginBottom: '8px'}}>
                <label style={{display: 'block', margin: '4px 0', cursor: 'pointer', fontWeight: 600}}>
                    <IndeterminateCheckbox
                        checked={state.checked}
                        indeterminate={state.indeterminate}
                        onChange={() => toggleGroup(keys)}
                        style={{marginRight: '8px'}}
                    />
                    {group.label}
                </label>
                <div style={{paddingLeft: '20px'}}>
                    {group.attributes.map(attr => (
                        <label key={attr.key} style={{display: 'block', margin: '2px 0', cursor: 'pointer'}}>
                            <input
                                type="checkbox"
                                checked={copyAttributes.includes(attr.key)}
                                onChange={() => toggleAttribute(attr.key)}
                                style={{marginRight: '8px'}}
                            />
                            {attr.label}
                        </label>
                    ))}
                </div>
            </div>
        );
    }

    function renderCustomFields() {
        if (customFields.length === 0) return null;

        const keys = customFields.map(f => `customField:${f.id}` as CopyableAttribute);
        const state = getGroupState(keys);

        return (
            <div style={{marginBottom: '8px'}}>
                <label style={{display: 'block', margin: '4px 0', cursor: 'pointer', fontWeight: 600}}>
                    <IndeterminateCheckbox
                        checked={state.checked}
                        indeterminate={state.indeterminate}
                        onChange={() => toggleGroup(keys)}
                        style={{marginRight: '8px'}}
                    />
                    Custom Fields
                </label>
                <div style={{paddingLeft: '20px'}}>
                    {customFields.map(field => {
                        const key = `customField:${field.id}` as CopyableAttribute;
                        return (
                            <label key={field.id} style={{display: 'block', margin: '2px 0', cursor: 'pointer'}}>
                                <input
                                    type="checkbox"
                                    checked={copyAttributes.includes(key)}
                                    onChange={() => toggleAttribute(key)}
                                    style={{marginRight: '8px'}}
                                />
                                {field.name}
                            </label>
                        );
                    })}
                </div>
            </div>
        );
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
                    {ATTRIBUTE_GROUPS.map(group => renderGroup(group))}
                    {renderCustomFields()}

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
