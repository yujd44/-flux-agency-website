/** Session flag + boot gate for the one-time Methodea logo intro. */
export const INTRO_SESSION_KEY = "methodea-intro-shown";

/**
 * Sync script for <head> — runs before first paint.
 * LocaleLayout always SSR-renders data-intro="wait" + suppressHydrationWarning on <html>;
 * this script may flip to "done" for return visits so the main site never flashes wait→content.
 */
export const INTRO_BOOT_SCRIPT = `(function(){try{document.documentElement.dataset.intro=sessionStorage.getItem("${INTRO_SESSION_KEY}")?"done":"wait";}catch(e){document.documentElement.dataset.intro="wait";}})();`;