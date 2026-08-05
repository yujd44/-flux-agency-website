/** Session flag + boot gate for the one-time Methodea logo intro. */
export const INTRO_SESSION_KEY = "methodea-intro-shown";

/** Sync script for <head> — runs before first paint to hide the site until intro finishes. */
export const INTRO_BOOT_SCRIPT = `(function(){try{document.documentElement.dataset.intro=sessionStorage.getItem("${INTRO_SESSION_KEY}")?"done":"wait";}catch(e){document.documentElement.dataset.intro="wait";}})();`;
