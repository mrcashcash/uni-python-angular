// Runtime config — the deploy pipeline overwrites this file in the built
// artifact with the real backend URL. Keeping apiUrl empty means that, in the
// absence of a deploy-time override, the UI renders "MISCONFIGURED" rather
// than silently pointing at a stale dev URL.
window.__APP_CONFIG__ = { apiUrl: "" };
