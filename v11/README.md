# Bác Gấu V11 — Rigged Character

V11 is a hard architectural reset for character quality. The browser no longer builds the bear from spheres/boxes. It loads a production GLB with real mesh, textures, skeleton, animation clips and facial morph targets.

## Character target
- Friendly cinematic 3D brown bear, rich fur, large expressive eyes, soft muzzle, natural paws.
- Yellow hoodie as the signature costume.
- Warm, smart, safe companion for Muối — not a toy-like procedural mascot.
- Reference quality is the latest approved Bác Gấu render from 22 Aug 2026.

## Pipeline
1. Character reference image -> Meshy/Tripo image-to-3D.
2. Smart topology/remesh before rigging.
3. Biped rig; Tripo preferred for rig flexibility, Meshy kept as A/B fallback.
4. Export GLB into `public/character/bac-gau.glb`.
5. Runtime inspects skeleton/morphs/clips before enabling interaction.
6. `AnimationMixer` blends idle/wave/listen/think/playful clips.
7. Audio analyser drives `jawOpen`; facial morphs drive blink/smile.
8. Chromium and WebKit test the same built artifact.

API keys are environment variables and are never committed.
