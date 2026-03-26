## What's Changed

### ✨ New Features / 新功能

- fallback to model config contextWindow when gateway maxContextTokens is 0
- collapsible KPI dashboard in Activity page with i18n
- show agent name badge in session sidebar before kind badge
- enhance Activity KPI dashboard and session cards with missing data
- enhance UsagePanel with full session data visualization
- scope new session to selected agent filter
- buffered save for A2A and subagents, cleanup on delete
- add paginated session history endpoint

### 🐛 Bug Fixes / 修复

- correct A2A empty list defaults and toggle behavior
- resolve agent list clobbering and display name improvements
- render CustomSelect dropdown via portal to prevent clipping
- unified safePatch/safeApply with auto hash refresh and retry
- agent create shows default workspace path in Docker and validates empty workspace

### ⚡ Performance / 性能优化

- add 15s getCached TTL to sessionsUsage and usageCost endpoints
- add 30s in-memory cache to UsagePanel data loading

### 🎨 UI & Styling / 界面优化

- hide wildcard * chips in allowed agents and subagents lists
- group agent and kind badges together in session sidebar

### 🌐 Internationalization / 国际化

- add editSession key to all 13 locales
- add agent and chat locale keys for all 13 locales

### ♻️ Refactoring / 重构

- remove agent info and kind chip from UsagePanel (shown in sidebar)

---
**Full Changelog**: [v0.0.29...v0.0.30](https://github.com/ClawDeckX/ClawDeckX/compare/v0.0.29...v0.0.30)


