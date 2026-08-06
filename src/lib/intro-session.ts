/** Session flag + boot gate for the one-time Methodea logo intro. */
export const INTRO_SESSION_KEY = "methodea-intro-shown";

/**
 * Sync script for <head> — runs before first paint.
 * LocaleLayout always SSR-renders data-intro="wait" + suppressHydrationWarning on <html>;
 * this script may flip to "done" for return visits so the main site never flashes wait→content.
 */
export const INTRO_BOOT_SCRIPT = `(function(){try{document.documentElement.dataset.intro=sessionStorage.getItem("${INTRO_SESSION_KEY}")?"done":"wait";}catch(e){document.documentElement.dataset.intro="wait";}})();`;

/**
 * Critical CSS inlined in <head> so the site cannot FOUC before globals.css loads.
 * Keeps pure black until LogoIntro sets data-intro="done".
 */
export const INTRO_BOOT_STYLE = `html[data-intro="wait"]{overflow:hidden!important;background:#05070a!important}html[data-intro="wait"] body{background:#05070a!important;background-image:none!important}html[data-intro="wait"] .page-frame{visibility:hidden!important;opacity:0!important;pointer-events:none!important}html[data-intro="wait"] #intro-boot-gate{display:block!important;position:fixed;inset:0;z-index:199;background:#05070a}#intro-boot-gate{display:none}`;
