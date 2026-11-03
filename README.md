# Doom’s Day — The Last Pilgrimage
Procedural Three.js endless runner. Open `dist/index.html` through any static HTTP server. No build or external runtime dependencies required.

Controls: A/D or arrows, Space to jump, J to smash, mobile buttons. Five alternating biomes; animated monk; destructible trees, rocks, shrubs, cave arches and fossils; creature discoveries unlocked on the next run; browser-local persistence.

## Development
Serve `dist` with a static server. Run `node --check dist/game.js`.

## Current scope
First playable prototype. Models use procedural geometry and articulated groups; destruction uses fragment particles. Character species share a basic quadruped rig. Background mountains and ground are scenery. No final dark-lord encounter yet. Progress stays in this browser, not a cloud account. GPU browser verification was blocked by disabled WebGL in the testing environment.

## Daily workflow
09:00 Europe/Budapest: implement a coherent improvement on a new branch, validate, open PR and summarize in Hungarian. 10:00: merge only if the user has not objected or redirected the daily work and checks pass; update hosted version. Keep user steering authoritative. Record proposals and verification in the PR.

Hosted Site: appgprj_6ae44784d2c881919dbe7f702c75c025
Three.js license: dist/vendor/LICENSE-three.txt

## Fossil blessings
Each of the five biome fossils unlocks one permanent next-run blessing: desert increases forward hit range to 10.5 m, mountains block one collision per run, meadows raise starting/max health to four, lakes grant one extra shard per destroyed object, and rocky mountains lower hit cooldown to 0.4 s. Existing fossils are recognized automatically. Blessings are captured at run start; finding a fossil does not change the current run powers. Existing fossil healing/rewards remain. The book shows each discovered effect and current-run status, including a consumed shield.

Validate with `node --check dist/game.js` and `node --test tests/relics.test.mjs`. Serve `dist` through a static HTTP server; smash a fossil with J, inspect the book, then start another run to activate it. Existing browser saves retain the same storage key. GPU visual QA has not been performed for this change.
