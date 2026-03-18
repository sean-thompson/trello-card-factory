export namespace Trello {
    namespace PowerUp {
        interface Attachment {
            id: string;
            name: string;
            url: string;
            mimeType?: string;
            date: string;
            edgeColor?: string;
            bytes?: number;
            previews?: AttachmentPreview[];
        }

        interface AttachmentPreview {
            url: string;
            width: number;
            height: number;
            bytes?: number;
        }

        interface AttachmentSection {
            claimed: Attachment[];
            title: string;
            icon: string;
            content: {
                type: 'iframe';
                url: string;
                height?: number;
            };
        }

        interface Label {
            id: string;
            name: string;
            color: string;
        }

        interface Member {
            id: string;
            fullName: string;
            username: string;
            avatar?: string;
        }

        interface List {
            id: string;
            name: string;
        }

        interface Board {
            id: string;
            name: string;
        }

        interface Card {
            id: string;
            name: string;
            desc: string;
            idList: string;
            idLabels: string[];
            idMembers: string[];
            labels: Label[];
            members: Member[];
            due: string | null;
            dueComplete: boolean;
            closed: boolean;
            url: string;
            shortLink: string;
            attachments: Attachment[];
            customFieldItems?: CustomFieldItem[];
            dateLastActivity: string;
        }

        interface CustomFieldItem {
            id: string;
            idCustomField: string;
            idModel: string;
            modelType: string;
            value: Record<string, unknown>;
        }

        interface Checklist {
            id: string;
            name: string;
            checkItems: CheckItem[];
        }

        interface CheckItem {
            id: string;
            name: string;
            state: 'complete' | 'incomplete';
        }

        interface CardButton {
            icon: string;
            text: string;
            callback: (t: IFrame) => void | Promise<void>;
            condition?: 'admin' | 'always' | 'edit' | 'readonly' | 'signedIn' | 'signedOut';
        }

        interface BadgeResult {
            text?: string;
            icon?: string;
            color?: string | null;
            refresh?: number;
            title?: string;
        }

        interface Context {
            board: string;
            card?: string;
            member: string;
            organization?: string;
            permissions?: {
                board: 'read' | 'write';
                card: 'read' | 'write';
                organization: 'read' | 'write';
            };
        }

        interface RestApi {
            getToken(): Promise<string>;
            isAuthorized(): Promise<boolean>;
            authorize(options: { scope: string }): Promise<void>;
            clearToken(): Promise<void>;
        }

        interface PopupOptions {
            title: string;
            url?: string;
            items?: Array<{ text: string; callback?: (t: IFrame) => void | Promise<void> }>;
            height?: number;
            args?: Record<string, string>;
            mouseEvent?: MouseEvent;
        }

        interface AlertOptions {
            message: string;
            duration?: number;
            display?: 'info' | 'warning' | 'error' | 'success';
        }

        interface IFrame {
            get(scope: string, visibility: string, key: string, defaultValue?: unknown): Promise<any>;
            set(scope: string, visibility: string, key: string, value: unknown): Promise<void>;
            remove(scope: string, visibility: string, key: string): Promise<void>;
            getRestApi(): RestApi;
            signUrl(url: string, args?: Record<string, string>): string;
            arg(name: string, defaultValue?: string): string;
            card(...fields: string[]): Promise<any>;
            cards(...fields: string[]): Promise<any[]>;
            list(...fields: string[]): Promise<any>;
            lists(...fields: string[]): Promise<any[]>;
            board(...fields: string[]): Promise<any>;
            member(...fields: string[]): Promise<any>;
            getContext(): Context;
            isMemberSignedIn(): boolean;
            memberCanWriteToModel(model: string): boolean;
            popup(options: PopupOptions): Promise<void>;
            closePopup(): void;
            modal(options: { url: string; title?: string; fullscreen?: boolean; height?: number; args?: Record<string, string> }): void;
            closeModal(): void;
            alert(options: AlertOptions): void;
            sizeTo(selector: string | HTMLElement): Promise<void>;
            showCard(idCard: string): Promise<void>;
            hideCard(): void;
            attach(options: { name: string; url: string }): Promise<void>;
            NotHandled(): Error;
        }
    }
}

interface TrelloPowerUp {
    initialize(capabilities: Record<string, Function>): void;
    iframe(options?: { appKey?: string; appName?: string }): Trello.PowerUp.IFrame;
}

declare global {
    interface Window {
        TrelloPowerUp: TrelloPowerUp;
    }
}
