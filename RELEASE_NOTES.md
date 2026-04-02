## What's Changed

### ✨ New Features / 新功能

- auto-scroll stream output to bottom on token update
- default expand first agent file preview and add skipExisting hint
- add agent file preview and edit panel in deploy configure step
- upgrade fallback file prompts to detailed per-file instructions with zh support
- show elapsed time and token count in agent live output stream
- add dedicated prompts for all 8 scenario templates
- show prompt source badge (Default/Template/Edited) on prompt label
- add rich agentFile prompt to default template; load it for step2
- show all scoped templates in AI write panel with multi-agent prefix label
- add scope field to separate single-agent vs multi-agent templates
- add workflowDescription placeholder with semantic descriptions per workflow type
- add _default template with generic step1 prompt; always pre-fill prompt-review textarea
- add per-file prompts in template JSON and type definitions
- add template picker to AI write panel for prompt selection
- add template-driven prompts and AI file write in Agents tab
- wizard-style step-by-step generation with SSE streaming

### 🐛 Bug Fixes / 修复

- rewrite files prompts - AGENTS.md structure, IDENTITY.md multi-line, HEARTBEAT.md judge-first, USER.md standard template
- fix all ZH prompt issues - heartbeat judge-first, identityMd multi-line format
- add Session Startup and Red Lines structure to all agentsMd prompts
- restore domain-specific agentFile prompts with correct format specs
- let AI decide if HEARTBEAT tasks needed, never force-fill
- rewrite agent file prompts with accurate OpenClaw file specs and formats
- overwrite workspace files when skipExisting=false, add updated status
- pass AI-generated soul/agentsMd/userMd/identityMd through to deploy
- reduce hard cap to 10min for wizard step1/step2
- replace fixed timeout with 120s idle timeout (activity-based)
- increase wizard step1/step2 LLM timeout to 480s (8 min)
- increase wizard step1/step2 LLM timeout from 120/180s to 300s
- update team size ranges to small 2-3, medium 4-6, large 7-10
- hide empty role/description lines from AI gen prompt header
- read role/description from selected agent, fix useEffect hoisting
- fix identity lookup to use identity[selectedId] instead of identity.name
- fix agent auto-advance stall using wzAgentsRef and wzRunAgentRef
- re-apply template prompt after async load; add prompt source badge
- hide internal default template from visible template list
- reset user-edited flag when returning from wizard or applying template
- increase agent-file timeout to 180s and max_tokens to 4096 for rich Markdown output
- retry useEffect loads correct template prompt, not always default
- skip auto-clear of prompt when template is being applied
- add missing id/version/type fields and register new templates in local loader
- remove duplicate Back buttons in wizard step2, keep footer only
- auto-regenerate step1 prompt when params change if not user-edited
- add wzEditPrompt/wzStoppedByUser i18n; fix single-agent start chaining
- remove debug logs; move Start button to footer with primary style
- remove old _default.json (renamed to default.json)
- rename _default template to default to fix Vite chunk 404
- bust stale cache and surface empty-load failure for prompt retry
- show config chips in wizard step1; retry prompt load on mount
- fix stale localStorage sources wiping built-in local source
- use Promise.allSettled for template loading; re-resolve prompt on file switch
- remove hardcoded fallback prompt; do not auto-start wizard step1
- add manifestPath to GitHub source to resolve manifest.json 404
- register _default template in loadLocalMultiAgent for zh prompt resolution
- remove hardcoded buildPrompt, wire prompt-review to wzStep1Prompt; use CustomSelect in AI gen panel

### 🎨 UI & Styling / 界面优化

- make prompt textareas collapsible and vertically resizable
- increase font sizes throughout wizard UI for readability
- match AI gen template picker style to exec security dropdown

### 🌐 Internationalization / 国际化

- add localized names for 4 new multi-agent templates in all 13 locales
- rename generateWizardBtn to 'Generate Team' in en/zh locales
- add 22 missing wizard i18n keys to all 13 cm_multi locales
- add promptPlaceholder key to all 13 cm_multi locales

### ♻️ Refactoring / 重构

- hardcode directLlm=true, remove toggle UI
- merge prompt-review step into input step; auto-load prompt on param change
- inline wizard into ScenarioTeamBuilder, delete GenerationWizard.tsx

### 🔧 Maintenance / 维护

- remove unused templates/official/manifest.json

---
**Full Changelog**: [v0.0.42...v0.1.0](https://github.com/ClawDeckX/ClawDeckX/compare/v0.0.42...v0.1.0)


