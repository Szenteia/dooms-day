# Doom’s Day — The Last Pilgrimage
Procedural Three.js endless runner. Open `dist/index.html` through any static HTTP server. No build or external runtime dependencies required.

Controls: A/D or arrows, Space to jump, J to smash, mobile buttons. Five alternating biomes; animated monk; destructible trees, rocks, shrubs, cave arches and fossils; creature discoveries unlocked on the next run; browser-local persistence.

## Development
Serve `dist` with a static server. Run `node --check dist/game.js`.

## Current scope
First playable prototype. Models use procedural geometry and articulated groups; destruction uses the original model parts, with eight chips for solid rocks, spin, gravity, ground bounce and a timed shrink. At most 120 fragments stay active; pausing freezes debris and a new run clears it. Character species share a basic quadruped rig. Background mountains and ground are scenery. No final dark-lord encounter yet. Progress stays in this browser, not a cloud account. GPU browser verification was blocked by disabled WebGL in the testing environment.

## Daily workflow
09:00 Europe/Budapest: implement a coherent improvement on a new branch, validate, open PR and summarize in Hungarian. 10:00: merge only if the user has not objected or redirected the daily work and checks pass; update hosted version. Keep user steering authoritative. Record proposals and verification in the PR.

Hosted Site: appgprj_6ae44784d2c881919dbe7f702c75c025
Three.js license: dist/vendor/LICENSE-three.txt

## Model destruction verification
Run `node --test tests/destruction.test.mjs` and `node --check dist/game.js`.
To try: serve `dist`, start a run, approach trees, shrubs, stones, fossils or cave arches, and press J. Model pieces scatter with their original materials; collisions also break the obstacle without awarding shards or fossil discoveries. Pause to freeze debris; restart to clear it. Scenery mountains, terrain and creatures remain excluded.
