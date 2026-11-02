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

## Biome scenery
Each run seeds chunk vegetation independently: desert cacti, snowy alpine pines, meadow broadleaf trees and flowers, lakeside reeds, and stacked rocky outcrops/spires. These are regular destructible objects; their scale updates their collision radius. Startup chunks keep their central vegetation-free corridor. Vegetation is bounded to 12 placements per chunk and uses existing cached primitives/materials. A seed reproduces vegetation regardless of chunk generation order; background mountains still use the original random generator.

Check with `node --check dist/game.js` and `node --test tests/biome-scenery.test.mjs`. To try, serve `dist` with a static HTTP server. Biomes change every 420 m. Use J on the new scenery and start another run for a new layout. GPU visual QA has not been performed for this change.
