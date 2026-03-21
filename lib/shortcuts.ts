export const SCAN_SHORTCUT_LABEL = "Ctrl/Cmd + /";

export function isScanShortcut(event: KeyboardEvent) {
  return (event.ctrlKey || event.metaKey) && event.key === "/";
}
