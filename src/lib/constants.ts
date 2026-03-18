import {CopyableAttribute} from '../types/factory';

export const IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
];

export const IMAGE_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff',
];

export const COPYABLE_ATTRIBUTE_LABELS: Record<CopyableAttribute, string> = {
    labels: 'Labels',
    members: 'Members',
    description: 'Description',
    due: 'Due Date',
    checklists: 'Checklists',
    customFields: 'Custom Fields',
};

export const DEFAULT_COPY_ATTRIBUTES: CopyableAttribute[] = [
    'labels',
    'members',
    'description',
];

export const STORAGE_KEY_FACTORY = 'factory';
export const STORAGE_KEY_PROCESSED = 'processed';
export const PROCESSED_PRUNE_THRESHOLD = 100;

export const ICON = {
    dark: '/static/icon-dark.png',
    light: '/static/icon-light.png',
};
