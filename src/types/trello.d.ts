export namespace Trello {
    namespace PowerUp {
        interface IFrame {
            alert(options: { message: string; duration?: number; display?: string }): void;
            popup(options: {
                title: string;
                url: string;
                height?: number;
                args?: Record<string, unknown>;
            }): void;
            closePopup(): void;
            arg(name: string, defaultValue?: string): string;
            getContext(): { board: string; card?: string; member?: string };
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
