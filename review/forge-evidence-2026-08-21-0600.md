# Bác Gấu Overnight Forge evidence — 2026-08-21 06:00 ICT

## Build/test loop completed

- Added `brain/brain-v2.mjs`: explicit vi-VN/en-US routing, emotional state classification, Brain→Body performance intent, parent hard-avoid precedence, basic memory updates.
- Added `tests/brain-v2-batch.test.mjs`: 240 synthetic bilingual/mixed conversation cases.
- First batch found 32 failures: Vietnamese profanity boundary miss and English sadness being overridden by school-topic routing.
- Fixed both generalized defects; rerun: **240/240 pass**.
- Added `tests/brain-v2-redteam.test.mjs`: 240 priority-conflict cases.
- First red-team found **144/240 failures**: distress + profanity was treated as discipline before emotion; parent hard-avoid could be bypassed by curiosity routing.
- Reordered policy precedence: hard parent boundary first, emotional distress before profanity correction.
- Red-team rerun: **240/240 pass**.
- Cumulative executed this forge cycle: **480 passing regression cases after fixes**, plus 176 pre-fix failures that directly produced code changes.

## States now differentiated

`happy`, `gentle`, `thinking`, `engaged`, `redirect`, `listening` each produce a distinct `body` performance intent, including bright eyes/lean-in, lowered gaze/open posture, eyes-up thinking pause, attentive lean, calm boundary, and quiet presence.

## Promotion decision

**DO NOT PROMOTE A USER REVIEW BUILD YET.** Brain gates improved, but the full review gates are not yet proven in one artifact. Specifically, no new Chromium/Edge-verified animated-body build and no fully verified dynamic vi-VN/en-US voice path were produced in this cycle. Existing v6/v7 visual/audio prototypes remain below the stated quality bar and must not be presented as a living-character milestone.

## Next highest-value work

1. Wire `brain-v2` state/body intents into the actual review runtime instead of the old hard-coded scenario object.
2. Replace static-image review with animation-capable character performance; do not promote until visual motion is visibly present.
3. Bundle/serve deterministic vi-VN and en-US audio with verified MIME/container/duration, then test scenario + typed-input playback paths.
4. Add DOM/runtime regression checks for missing assets, JS errors, state changes, audio metadata, and deployed-version markers.
