# ADR-0003: Local-only persistence

High score, Stars, and settings (sound on/off) live in `localStorage`. No backend, no accounts, no leaderboard server — the game must run fully offline from GitHub Pages.

Trade-off accepted: scores are per-device. A leaderboard later means a new ADR and a real backend decision, not an incremental tweak.
