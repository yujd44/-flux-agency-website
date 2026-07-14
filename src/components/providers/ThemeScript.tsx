const THEME_INIT_SCRIPT = `
(function () {
  try {
    var theme = window.localStorage.getItem("flux-theme");
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch (e) {}
})();
`;

/**
 * Runs synchronously before hydration to apply a persisted light-theme
 * choice to <html> ahead of first paint, avoiding a dark-then-light flash.
 * Dark requires no attribute since it's the CSS default.
 */
export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
