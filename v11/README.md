# Bác Gấu V11 — Rigged Character

V11 uses a real rigged GLB character and never falls back to a procedural sphere/box bear.

## V11.1 visual direction: mature mentor

Bác Gấu must feel like a mature, wise, trustworthy adult companion for Muối: warm, calm, protective, emotionally safe, with deeper-set eyes, defined brows, a restrained smile, realistic soft brown fur, sturdy shoulders/paws, and a yellow hoodie that reads adult rather than babyish.

Avoid baby-bear proportions, oversized chibi eyes, toy-mascot styling, exaggerated grins, plastic fur, and bouncy childish motion.

The approved source reference is `reference/bacgau-mature-reference.jpg`; the machine-readable brief is `reference/character-brief.json`.

## Generation

GitHub Actions workflow `.github/workflows/v11-generate-character.yml` uses the repository secret `TRIPO_API_KEY` to generate and rig `public/character/bac-gau.glb` from the approved mature reference. The runtime then loads that exact GLB.
