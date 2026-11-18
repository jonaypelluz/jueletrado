/**
 * Chrome fires beforeinstallprompt once per document, possibly before React hydrates, and every page remounts the
 * footer. So the deferred event lives here, caught from module load on the client (an earlier one is picked up from
 * the root layout's inline script, see INSTALL_PROMPT_SCRIPT), not in a component.
 */

/** Chrome's install prompt event (not in the DOM typings). */
export type InstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
};

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

const set = (event: InstallPromptEvent | null) => {
    deferred = event;
    listeners.forEach((listener) => listener());
};

export const getInstallPrompt = (): InstallPromptEvent | null => deferred;

/** Hands the event to its one caller (a prompt can be shown once) and clears the store. */
export const takeInstallPrompt = (): InstallPromptEvent | null => {
    const event = deferred;
    if (event) set(null);
    return event;
};

export const subscribeInstallPrompt = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

/** Where the root layout's inline script keeps a prompt fired before this module loaded. */
type EarlyWindow = Window & { __installPrompt?: InstallPromptEvent | null };

if (typeof window !== 'undefined') {
    const early = window as EarlyWindow;
    deferred = early.__installPrompt ?? null;
    early.__installPrompt = null;
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        set(event as InstallPromptEvent);
    });
    window.addEventListener('appinstalled', () => set(null));
}

/**
 * Inline script for the root layout's <head>: catches a beforeinstallprompt fired before the app's JavaScript runs
 * and keeps it on window.__installPrompt for this store.
 */
export const INSTALL_PROMPT_SCRIPT =
    "addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__installPrompt=e});" +
    "addEventListener('appinstalled',function(){window.__installPrompt=null});";
