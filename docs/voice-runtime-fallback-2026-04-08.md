# Voice Runtime Fallback Baseline (2026-04-08)

This note locks in the last known-good voice/dashboard structure before the 3-mode consolidation work. It exists as the rollback reference for future voice/runtime changes.

## Baseline Snapshot

- Visible profiles: `premium_voice`, `lean_voice`, `tool_voice`, `ui_director`
- Runtime: shared chained `voice_pipeline`
- Model map:
  - `premium_voice`: `gpt-4o-mini-transcribe` -> `gpt-4.1` -> `gpt-4o-mini-tts`
  - `lean_voice`: `gpt-4o-mini-transcribe` -> `gpt-4.1-mini` -> `gpt-4o-mini-tts`
  - `tool_voice`: `gpt-4o-mini-transcribe` -> `gpt-4.1-mini` -> `gpt-4o-mini-tts`
  - `ui_director`: `gpt-4o-mini-transcribe` -> `gpt-4.1-mini` -> no TTS
- Turn flow: `capture -> transcribe -> respond/tool-call -> optional TTS -> complete`
- Debug window shape:
  - profile summary cards for all 4 visible profiles
  - compact export stream
  - pipeline stage ladder
  - recent activity stream
- Background behavior:
  - animated canvas mounted globally
  - overview orb and overview scene use the animated background

## Rollback Flag

The product now defaults to the 3-mode visible set, but the legacy 4-profile registry remains available through:

- `VITE_CORTEX_PROFILE_SET=legacy_four_mode`

The default product path is:

- `VITE_CORTEX_PROFILE_SET=default_three_mode`

## Legacy Profile Notes

- `tool_voice` is preserved as a compatibility alias for rollback and persisted-state migration.
- The 3-mode product path maps the old `tool_voice` behavior into the visible `lean_voice` / ECO slot.

## Why This Note Exists

Realtime/WebRTC remains an official OpenAI architecture, but this product intentionally standardizes the visible profiles on the chained voice pipeline because it offers:

- explicit transcript handling
- deterministic tool orchestration
- predictable UI-context injection
- more debuggable stage transitions

If a future runtime refactor regresses stability, restore the legacy profile set first before attempting a larger transport rewrite.
