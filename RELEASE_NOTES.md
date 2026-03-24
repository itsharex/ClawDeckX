## What's Changed

### ✨ New Features / 新功能

- register gateway stale/restart keys and add MCP Servers editor
- add subscription convergence, TTS speak, and send timeout recovery
- show gateway presence on nodes page
- add skills.install and system-presence RPC wrappers
- adapt to openclaw v2026.3.14 API changes
- add openclaw-weixin channel integration with QR login
- multi-account UI with auto-migration and styled forms
- add CLI fix fallback for doctor one-click repair button

### 🐛 Bug Fixes / 修复

- harden runtime apt install in prebuilt image
- decouple docker install version from compat
- add builder diagnostics for prebuilt image
- remove openclaw-cn compat and harden binary detection
- move QR login to post-save step in wizard flow
- align editor sections with upstream openclaw config schema
- bypass GitHub API rate limit with direct URL download
- fallback to direct pull when mirror image pull fails

### ♻️ Refactoring / 重构

- always use CLI fix for doctor one-click repair

### 📝 Documentation / 文档

- add note about quoting passwords with special characters
- add account lockout policy and prominent mirror warnings

---
**Full Changelog**: [v0.0.25...v0.0.26](https://github.com/ClawDeckX/ClawDeckX/compare/v0.0.25...v0.0.26)


