export type CopyableAttribute =
    | 'labels'
    | 'members'
    | 'description'
    | 'due'
    | 'checklists'
    | 'customFields';

export interface FactoryConfig {
    enabled: boolean;
    copyAttributes: CopyableAttribute[];
    destinationListId: string; // Trello list ID, or 'same' for factory card's list
}
