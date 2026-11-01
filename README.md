# Doom’s Day — The Last Pilgrimage
Procedural Three.js endless runner. Open `dist/index.html` through any static HTTP server. No build or external runtime dependencies required.

Controls: A/D or arrows, Space to jump, J to smash, mobile buttons. Five alternating biomes; animated monk; destructible trees, rocks, shrubs, cave arches and fossils; creature discoveries unlocked on the next run; browser-local persistence.

## Development
Serve `dist` with a static server. Run `node --check dist/game.js`.

## Current scope
First playable prototype. Models use procedural geometry and articulated groups; destruction uses fragment particles. Five creature species have distinct procedural silhouettes and articulated animation: fox ears/tail, deer antlers/long legs, turtle shell, segmented dragon/fins, and a floating crystal guardian. Geometry and materials reuse the game caches. Background mountains and ground are scenery. No final dark-lord encounter yet. Progress stays in this browser, not a cloud account. GPU browser verification was blocked by disabled WebGL in the testing environment.

## Daily workflow
09:00 Europe/Budapest: implement a coherent improvement on a new branch, validate, open PR and summarize in Hungarian. 10:00: merge only if the user has not objected or redirected the daily work and checks pass; update hosted version. Keep user steering authoritative. Record proposals and verification in the PR.

Hosted Site: appgprj_6ae44784d2c881919dbe7f702c75c025
Three.js license: dist/vendor/LICENSE-three.txt

## Creature verification
Run `node --test tests/creatures.test.mjs` and `node --check dist/game.js`. Serve `dist` via a static HTTP server. Each biome has its own creature (first fox around 72 m); approach one to discover it. Models remain animated after discovery while in view. Returning in the next run keeps the existing unlock/blessing rules. Animation stops with gameplay pause. No new assets or runtime dependencies.
