# Rocket Landing 3D

Immersive Three.js animation of a reusable rocket landing with deterministic phases, telemetry, and interactive controls.

## Demo

<video controls width="100%" preload="metadata">
  <source src="./docs/demo.webm" type="video/webm">
  Your browser does not support the video tag.
</video>

Download: [demo.webm](./docs/demo.webm)

Run:

```bash
npm install
npm run dev
```

Features:

- Cinematic phases: orbital, entry, descent, landing burn, leg deploy, touchdown, shutdown
- Continuous altitude curve with easing, terminal touchdown
- Telemetry: altitude, vertical speed, fuel, phase
- Controls: pause/resume, restart, phase step, timeline scrubber, camera modes (chase/orbit/pad/cinematic), quality selector
- Keyboard shortcuts: Space to pause, R to reset
- Reduced-motion support, WebGL fallback, accessible labels

## Visual CI

Visual regression tests with Playwright:

```bash
npm install
npm run visual:test
```

Artifacts are written to `test-results/artifacts/`:

- phase screenshots: orbital, entry, descent, landingBurn, legDeploy, touchdown, shutdown
- mobile.png smoke
- video and HTML report under `test-results/artifacts/`

Local usage:

```bash
npm run dev
# open http://localhost:5173/?testMode=1 for deterministic seeking via window.__test.seekTime(t)
```

The README demo is committed to `docs/demo.webm`. GitHub Actions artifacts remain ephemeral and are uploaded with retention, not committed.
