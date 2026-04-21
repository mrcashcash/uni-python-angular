// apiUrl intentionally empty. Real backend URL is injected at runtime via
// public/runtime-config.js (window.__APP_CONFIG__.apiUrl). If neither the
// runtime config nor an explicit build-time replacement is provided, the UI
// falls back to "MISCONFIGURED" — the correct signal for an undeployed build.
export const environment = {
  production: true,
  apiUrl: '',
};
