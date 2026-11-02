# Local upstream refresh

Branch `beltino/upstream-refresh` starts at upstream `a03425ea314c5be26d79e572a68a6d8f4b88e5de`.
The original fork and its four source feature commits are reference-only; no history is rewritten.
No push, deployment, remote issue/wiki writes or live account testing is part of this refresh.

## Tooling and checks

- `nix develop path:.` provides pinned Node 22.23.4 / npm 10.9.9 and Chromium.
- `npm ci` uses the unchanged upstream lockfile. Upstream installation reports a pseudolocale Node >=24 transitive engine warning and 20 audit findings; no dependency policy changes here.
- `npm run build` and `npm run formatting-check` pass on the upstream baseline.
- `npm test -- --config playwright.local.config.js` retains upstream's Mobile Safari/WebKit project, isolated at `127.0.0.1:5189`, without server reuse. WebKit is not installed (`webkit-2370/pw_run.sh` missing); that gate is unverified.
- `npm test -- --config playwright.chromium.config.js` is **additional** local desktop/mobile coverage, not a Safari substitute. Safe baseline: 136 passed, 2 skipped (CloseWatcher), 2 failed (existing date-time-format en-SG expectation resolves en-AU in this environment).
- Browser specs use a default-deny context fixture for all non-local-origin HTTP/WebSocket traffic, with service workers blocked. Explicit synthetic page routes take precedence. `tests/network-isolation.spec.js` verifies blocked unmatched HTTP/WS and successful synthetic HTTP/WS (2 projects pass). Blocked unmatched fixture URLs are attached to test results rather than weakening assertions.

### Initial run limitation

An initial batch did not stop after an unavailable Python helper, so the first Chromium baseline lacked the network guard. It also accidentally concatenated upstream WebKit projects. That run is not isolation evidence: synthetic fixtures may have attempted unmatched requests to `test.social`, `hachyderm.io` and mock-post image hosts. No real credentials were used; whether those requests reached servers was not captured. Subsequent work uses Node helpers, fail-fast batches and the verified guard; do not claim all baseline execution was externally isolated. The original upstream Playwright config is unchanged.

## Source feature references

- Column widths: `91bc7fada2fd8e47c22bd49a24ab98710710bc82`
- Link cards: `3bfa9ae1705de6ac29fe13eb32106a34742e914a`
- Media collapse: `6b5bec5d833146274771280e3dffd1babedee304`
- Compact layout: `1f2f2d554975649134d1bd0c2863e7a7420bf1ce`

All local Git shells must source `/tmp/beltino-time-travel-phanpy.sh` and use its `git` function for commits. Push URLs remain disabled. Generated build/test output stays ignored.
