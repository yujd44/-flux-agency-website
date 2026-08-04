/**
 * Phase 1 is light-only. Clear any legacy flux-theme preference so a
 * previously saved "dark" value cannot fight the new architectural default.
 */
const THEME_INIT_SCRIPT = `
(function () {
  try {
    window.localStorage.removeItem("flux-theme");
    document.documentElement.removeAttribute("data-theme");
  } catch (e) {}
})();
`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
