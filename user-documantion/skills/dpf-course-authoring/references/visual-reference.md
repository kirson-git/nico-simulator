# Visual reference

The user selected the diagrams and animations in the
[l-csi DOCA Sentry Guide](http://10.228.144.212:8088/l-csi-guide.html).
Its `#ideal` anchor is the target-architecture section; useful inline SVGs and
animations also appear in SR-IOV, BlueField modes, DPF, datapath, and policy.

The source was reviewed on 2026-10-11. Its private lab snapshot remains in the
original administration workspace and is not distributed with this repository.
The reusable conventions are recorded below; the simulator has no dependency on
that server. The guide is not authoritative current infrastructure inventory.

## Reusable visual grammar

| Meaning | Dark-theme color | Treatment |
| --- | --- | --- |
| Host / management | `#78aae6` | Blue region and border |
| DPU infrastructure | `#e3a456` | Amber region and border |
| Tenant / service | `#56c587` | Green accent |
| Ordered configuration step | `#b59bf0` | Number badge and moving token |
| Packet | `#ef7a6c` | Small token on forwarding path |
| Surface / text | `#182026` / `#e3e8ec` | High-contrast diagram canvas |

Use consistent meaning, not colors alone. Put component labels inside boxes,
arrow labels beside connectors, and the active step explanation below the
figure. Separate control paths (dashed) from forwarding paths (solid).

The guide uses native SVG `animateMotion` and `animate`, with
`pauseAnimations()` / `unpauseAnimations()`. Our course adds explicit stepping,
replay, paused startup, and lifecycle handling. Copy the approach, not the
guide's small font sizes or external Google Fonts dependencies.

## Course implementation

All paths below are relative to the repository root:

- `web/guide-diagrams.js`: SVGs and shared playback.
- `web/guide-diagrams.css`: scoped visual vocabulary.
- `web/dpu101.js`: chapters and original PNG animation.
- `web/course-nav.js`: complete course navigation.
- `web/dpu-config.js`: interactive YAML explanations.
- `server.mjs`: explicit static asset allowlist.
- `tests/guide-diagrams.mjs`: browser interaction checks.

New assets must be added to the server allowlist. Keep bundled fonts and images
working offline. Do not depend on the private reference server at lesson runtime.

Preserve the board photo and two user diagrams in `web/images/`. The modes lesson
offers an animated SVG comparison and a separate original-PNG animation view.
Explain hardware-generation mismatches in text adjacent to the original image.

## Checking the existing instance

The course entrypoints are `http://localhost:8780/#modes` and `/#software` on
the local course server (or through the user's existing SSH tunnel).

```bash
./workshop.sh --status
docker exec dpf-workshop npm test
```

Browser tests under `tests/` target `http://127.0.0.1:8780` and use
Playwright. See `user-documantion/testing.txt` for the browser runner.
The diagram tests only read pages and interact with browser-local state.
Do not substitute a cluster-reset or live provisioning test for a visual check.

Read `workshop.sh` before rebuilding/restarting the app. Its `--start` action
can create a training cluster if absent; verify the existing owned cluster
before using it for an app-only update.
