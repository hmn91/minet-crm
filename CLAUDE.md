# MiNet CRM — Claude Code Reference

## Vibe Builder Project Reference

### ⛔ CONTEXT OVERFLOW RECOVERY
**When context gets full or you feel lost in a long session:**
1. Re-read the vibe-builder skill: `.claude/skills/vibe-builder/SKILL.md`
2. Re-read `IMPLEMENTATION_PLAN.md` to check current progress
3. Follow the workflow strictly — especially the checkpoints below!

### ⚠️ WORKFLOW CHECKPOINTS (MANDATORY - DO NOT SKIP!)
| After Phase | Action |
| --- | --- |
| Phase 3 (Coding) complete | → Create TEST_PLAN.md → **⛔ STOP for Human review** |
| Phase 4 (Test Plan) approved | → Execute tests autonomously |
| Phase 5 (Testing) complete | → Report results → Enter Phase 6 loop |

---

### Project Summary
- **App Name**: MiNet CRM
- **App Type**: PWA, mobile-first, privacy-first, offline-first
- **Tech Stack**: React 18 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui
- **Database**: Dexie.js (IndexedDB — local only, no backend)
- **State**: Zustand (`authStore`, `settingsStore`)
- **Forms**: React Hook Form + Zod
- **Router**: React Router v6
- **Deploy**: Docker + Nginx (multi-stage build)
- **Core Features**:
  - Contact management with Tier (A/B/C/D), relationship type, custom fields
  - Events with outcome, next steps, follow-up date
  - Reminders with Web Notifications API
  - Google Sign-In (identity only), profile page
  - PIN (6-digit, SubtleCrypto SHA-256) + Biometric (WebAuthn)
  - Backup: local JSON file + Google Drive (drive.file scope)
  - Auto-backup scheduler (daily/weekly/monthly) with max versions pruning

### Current Phase
- **Status**: Phase 3 (Coding) — mostly complete
- **Language**: All UI in Vietnamese
- **Node.js in WSL2**: Always use `source /home/ngochm/.nvm/nvm.sh && npm ...`

### Primary Documentation
- `IMPLEMENTATION_PLAN.md` — task tracking

### Key Paths
- Source: `src/` — all TypeScript/React code
- Types: `src/types/index.ts`
- DB: `src/lib/db.ts` (Dexie schema)
- Auth: `src/lib/auth.ts` (Google GIS), `src/lib/crypto.ts` (PIN/WebAuthn)
- Stores: `src/stores/authStore.ts`, `src/stores/settingsStore.ts`
- Hooks: `src/hooks/use*.ts`
- Pages: `src/pages/`
- Components: `src/components/ui/`, `src/components/layout/`

### Coding Guidelines
- Path alias `@/` maps to `./src/`
- Tailwind v4 — no `tailwind.config.ts`, uses `@import "tailwindcss"` in CSS
- shadcn/ui components are manually created in `src/components/ui/`
- `useLiveQuery` from `dexie-react-hooks` for reactive DB queries
- Google client ID from `import.meta.env.VITE_GOOGLE_CLIENT_ID`
- Never store Google access token in IndexedDB — in-memory only (authStore)
