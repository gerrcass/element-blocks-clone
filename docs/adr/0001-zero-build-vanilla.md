# ADR-0001: Zero-build vanilla stack

Ship as static files (`index.html`, `css/`, `js/`) with no bundler or framework, so GitHub Pages needs no build step and the rules stay testable in plain Node.

Alternatives: React/Vite — rejected: adds a build, lockfile, and upgrade surface for a single-screen game whose state is one Grid plus one Tray. Revisit only if a second screen (menu, leaderboard) lands.
