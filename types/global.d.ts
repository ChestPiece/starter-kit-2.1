declare global {
  interface WindowEventMap {
    "settings-update": CustomEvent;
  }
}
