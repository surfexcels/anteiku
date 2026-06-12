export const WORKSPACE_CHANGED_EVENT = "anteiku:workspace-changed";

export function notifyWorkspaceChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WORKSPACE_CHANGED_EVENT));
}
