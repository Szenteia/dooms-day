# Doom’s Day — The Last Pilgrimage
Procedural Three.js endless runner. Open `dist/index.html` through any static HTTP server. No build or external runtime dependencies required.

Controls: A/D or arrows, Space to jump, J to smash, mobile buttons. Five alternating biomes; animated monk; destructible trees, rocks, shrubs, cave arches and fossils; creature discoveries unlocked on the next run; browser-local persistence.

## Development
Serve `dist` with a static server. Run `node --check dist/game.js`.

## Current scope
First playable prototype. Models use procedural geometry and articulated groups; destruction uses the original model parts, with eight chips for solid rocks, spin, gravity, ground bounce and a timed shrink. At most 120 fragments stay active; pausing freezes debris and a new run clears it. Each creature species has its own animated rig. Background mountains and ground are scenery. No final dark-lord encounter yet. Progress stays in this browser, not a cloud account. GPU browser verification was blocked by disabled WebGL in the testing environment.

## Daily workflow
09:00 Europe/Budapest: implement a coherent improvement on a new branch, validate, open PR and summarize in Hungarian. 10:00: merge only if the user has not objected or redirected the daily work and checks pass; update hosted version. Keep user steering authoritative. Record proposals and verification in the PR.

Hosted Site: appgprj_6ae44784d2c881919dbe7f702c75c025
Three.js license: dist/vendor/LICENSE-three.txt

## Model destruction verification
Run `node --test tests/destruction.test.mjs` and `node --check dist/game.js`.
To try: serve `dist`, start a run, approach trees, shrubs, stones, fossils or cave arches, and press J. Model pieces scatter with their original materials; collisions also break the obstacle without awarding shards or fossil discoveries. Pause to freeze debris; restart to clear it. Scenery mountains, terrain and creatures remain excluded.

## Creature verification
Run `node --test tests/creatures.test.mjs` and `node --check dist/game.js`. Serve `dist` via a static HTTP server. Each biome has its own creature (first fox around 72 m); approach one to discover it. Models remain animated after discovery while in view. Returning in the next run keeps the existing unlock/blessing rules. Animation stops with gameplay pause. No new assets or runtime dependencies.

## Biome scenery
Each run seeds chunk vegetation independently: desert cacti, snowy alpine pines, meadow broadleaf trees and flowers, lakeside reeds, and stacked rocky outcrops/spires. These are regular destructible objects; their scale updates their collision radius. Startup chunks keep their central vegetation-free corridor. Vegetation is bounded to 12 placements per chunk and uses existing cached primitives/materials. A seed reproduces vegetation regardless of chunk generation order; background mountains still use the original random generator.

Check with `node --check dist/game.js` and `node --test tests/biome-scenery.test.mjs`. To try, serve `dist` with a static HTTP server. Biomes change every 420 m. Use J on the new scenery and start another run for a new layout. GPU visual QA has not been performed for this change.

## Fossil blessings
Each of the five biome fossils unlocks one permanent next-run blessing: desert increases forward hit range to 10.5 m, mountains block one collision per run, meadows raise starting/max health to four, lakes grant one extra shard per destroyed object, and rocky mountains lower hit cooldown to 0.4 s. Existing fossils are recognized automatically. Blessings are captured at run start; finding a fossil does not change the current run powers. Existing fossil healing/rewards remain. The book shows each discovered effect and current-run status, including a consumed shield.

Validate with `node --check dist/game.js` and `node --test tests/relics.test.mjs`. Serve `dist` through a static HTTP server; smash a fossil with J, inspect the book, then start another run to activate it. Existing browser saves retain the same storage key. GPU visual QA has not been performed for this change.

## Creature encounters
Move to the side indicated by the trail hint. Passing within 2.6 m sideways and 5 m along the trail discovers the creature and saves it immediately to the existing local save. A creature first discovered during the current run grants blessings only when approached in a later run, even if it appears again on the same trail. To try the first encounter, steer left toward the creature around 72 m and open the discovery book.
