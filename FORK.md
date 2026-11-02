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

## Column width

360–600px, default 360, browser-local key `columnSize`. Persistence no longer depends on `#columns` existing; mounting Columns reapplies the saved width. The slider has an accessible label. Focused desktop/mobile regression checks pass for absent columns, reload, mount, live 600px and reset.

## Link cards

Account setting `settings-hideLinkPreviews` defaults false. Only the upstream `StatusCard` branch is suppressed; native/inline quoted posts, text, collections and other upstream branches remain intact. Desktop/mobile regression checks cover defaults, live toggling, namespace preservation and reload.

## Media collapse

Account key `settings-hideMediaPreviews`, default false, is retained. This is deliberately **collapse**, not blur: when upstream would conceal media (sensitive, blur filter, `reading:expand:media=hide_all`) and there is no explicit reveal, attachment renderers unmount. Ordinary non-sensitive media still follows upstream's default/show-all preference. Preview mode and explicit reveals retain precedence.

Intentional improvement over the old fork: media-first ordinary `hide_all` and blur-filtered posts retain a separate reveal control even when their renderer is absent, so attachments are not stranded. Content-warning/sensitive media-first posts keep their existing Show content control. Show less unmounts media again. Shared control extraction leaves normal upstream behavior unchanged when the toggle is off.

18 desktop/mobile checks pass, covering actual height reduction, single/multiple attachments, large-post multi-media, sensitivity, filter override of show-all, CW reveal/re-collapse, media-first ordinary and CW layouts, live toggling and reload persistence.

## Compact layout

Browser-local `compactMode` is independent of account settings and light/dark/auto colors. The old `theme=plain` value migrates to compact + automatic colors. Unlike the old fork's direct storage read during render, a reactive browser-local state updates already-mounted cards immediately. Avatars move inline, with font-relative size **only in compact status headers**; non-compact upstream avatar sizing is unchanged. Existing username-only, metric hiding and translation menu behavior is retained. The fork's flat decks and simpler reply-tree styling are scoped to `html.is-compact`.

12 focused desktop/mobile checks pass: live existing-card toggles, light/dark, old-plain migration, reload, multi-column widths, nested contextual replies/hero alignment, upstream username/metric/translation controls and account initialization preserving browser-local layout. Screenshots are generated under ignored `test-results/compact-mode-*` (light/dark, columns and thread, desktop/mobile); implementation review inspected these for avatar and reply-tree alignment. Menu translation is checked without making a translation request.

## Final local validation / handoff

All commands below ran inside `nix develop path:.`; test server is owned by Playwright on dedicated port 5189, no shell backgrounding or reuse.

- `npm run build`: PASS on upstream baseline and final app.
- `npm run formatting-check`: PASS baseline and final (331 files).
- `npm run messages:compile`: PASS on the committed messages-only English catalog; `git diff --check`: PASS.
- `npm test -- --config playwright.chromium.config.js`: completed final run **172 passed, 2 skipped, 2 failed (3.6m)**. The only failures are the same baseline `tests/date-time-format.spec.js:176` en-SG assertion, resolving en-AU in both projects. The two skips are existing CloseWatcher behavior. All 36 new desktop/mobile feature/isolation cases pass in the combined run.
- `npm test -- --config playwright.local.config.js`: final **25 passed, 63 failed**. All failures require launching the missing WebKit executable; real Mobile Safari/WebKit remains unverified. The upstream config and its Mobile Safari default were not replaced or weakened.
- `npm test -- --config playwright.chromium.config.js tests/media-collapse.spec.js --grep 'large post' --repeat-each=3`: **6 passed** after waiting for the initial contextual thread fetch to settle. Earlier combined execution hit the tool timeout; its dedicated Vite process was terminated locally before rerunning successfully. No other agent's processes were touched.

Lingui's automatic extraction rewrites source locations while Vite runs. The committed English catalog deliberately restores the complete upstream catalog and appends only the four new labels, with no removed or changed upstream messages. Other locales and all application dependency manifests/lockfiles are unchanged.

### Remaining review items

- Safari/WebKit validation requires a working matching Playwright WebKit runtime; Chromium mobile emulation is not Safari evidence.
- Inherited slider debounce: closing Settings within 500ms of moving column width can discard the pending change. Normal settled persistence, absent-column storage and mount behavior are covered; independent reviewer identified this P2 follow-up. No last-minute scope expansion was made.
- Optional extra matrix coverage: media-first blur + show-all and explicit preview-mode rendering. Current checks cover ordinary media-first hide-all/CW, normal blur overriding show-all and explicit reveals; preview mode precedence is retained in code.
- Existing locale-test expectation, upstream install engine warning/audit findings and initial non-isolated run limitation above remain disclosed.
- No pushes, deployments, remote writes, real account credentials or deliberate live Mastodon calls. The owner subsequently authorized local workflow removal as a separate policy change below. The original fork/worktree and main/upstream history are untouched. `.pi-subagents/` is runtime coordination output, intentionally untracked and excluded from feature commits.

Review the six new commits with `git log --oneline a03425ea..HEAD`; no history rewrite is necessary. Parent owns independent acceptance review and any approved follow-up fixes.


## Hosted CI intentionally disabled for this fork

After the four UI features, the owner explicitly requested disabling inherited CI as part of this local change set. A separate commit removes **all ten** inherited hosted workflow files from `.github/workflows/`: autofix, bundle-size, custom-build, i18n-automerge, i18n-update-readme, main2prod, playwright, prodtag, rollbar-deploy and update-catalogs (all `.yml`). Removing definitions avoids triggering even skipped workflow records; job-level guards would not meet that intent. No GitHub repository Actions setting, remote API, local test script or browser/build gate was changed. This is an intentional fork policy difference, not a fifth UI feature.

The upstream workflow originals remain available at `upstream/main:.github/workflows/` and at this refresh's base commit. For a future restoration, first inspect the upstream definitions and obtain owner approval, then selectively restore with `git restore --source=upstream/main -- .github/workflows/<approved-file>.yml` in a time-travel-wrapped Git shell, review triggers/secrets/write permissions/deployment targets, and commit locally. Do not restore blindly: several inherited workflows can write, merge, tag or deploy.

Every future upstream refresh must explicitly audit `.github/workflows/` for newly added or restored definitions and remove them again unless the owner authorizes a policy change. Continue running the documented local checks manually. A future push still requires fresh owner approval and a safety preflight; **no push, PR, remote Actions change or deployment is authorized by this local policy commit**.
