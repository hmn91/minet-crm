# MiNet CRM — Implementation Plan

> Cập nhật: 2026-02-23 | Trạng thái: **HOÀN THÀNH ✅**

---

## Phase 1: Project Setup & Docker ✅

- [x] Khởi tạo project: `npm create vite@latest minet-crm -- --template react-ts`
- [x] Cài dependencies: shadcn/ui (Radix UI), Dexie.js, dexie-react-hooks, Zustand, React Router v7, React Hook Form, Zod, date-fns, lucide-react, sonner, nanoid, clsx, tailwind-merge, class-variance-authority
- [x] Cấu hình Tailwind CSS v4 (via `@tailwindcss/vite`, không cần `tailwind.config.ts`)
- [x] Cấu hình vite-plugin-pwa với manifest (tên: MiNet CRM, theme: #2563eb)
- [x] Setup path aliases `@/` → `./src/`
- [x] Tạo `Dockerfile` (multi-stage), `docker-compose.yml`, `nginx.conf`
- [x] Kiểm tra `docker compose up` serve được app — HTTP 200 ✅
- [x] Tạo PWA icons: `public/icons/pwa-192x192.png`, `pwa-512x512.png`, `maskable-192x192.png`

---

## Phase 2: Data Layer ✅

- [x] Định nghĩa TypeScript interfaces — `src/types/index.ts`
- [x] Tạo Dexie.js schema — `src/lib/db.ts` với 9 bảng + helper functions
- [x] Tạo CRUD hooks: useContacts, useCompanies, useInteractions, useEvents, useReminders, useCustomFields
- [x] Tạo Zustand stores: authStore, settingsStore

---

## Phase 3: Authentication & Security ✅

- [x] `src/lib/crypto.ts` — hashPIN (SubtleCrypto SHA-256), verifyPIN, WebAuthn biometric
- [x] `src/lib/auth.ts` — Google GIS OAuth2
- [x] Màn hình Login — `src/pages/LoginPage.tsx` (Google Sign-In + manual fallback)
- [x] Màn hình PIN Lock — `src/pages/PinLockPage.tsx` (numpad, max 5 lần, lockout 30s, biometric)
- [x] PIN hashing với SubtleCrypto SHA-256
- [x] Biometric authentication với WebAuthn API
- [x] Auto-lock timer sau X phút — `AutoLockTimer` component trong `src/App.tsx`
- [x] Route guard: AuthGuard, PinGuard, GuestOnly trong `src/App.tsx`

---

## Phase 4: Core CRM Features ✅

- [x] Dashboard — `src/pages/Dashboard.tsx`
- [x] Contacts list — `src/pages/ContactsPage.tsx` (search, filter tier/type, group by tier)
- [x] Contact detail — `src/pages/ContactDetailPage.tsx` (tabs: Thông tin / Lịch sử / Nhắc nhở)
- [x] Add/Edit contact form — `src/pages/ContactFormPage.tsx` (custom fields động)
- [x] Custom Fields Manager — `src/pages/CustomFieldsPage.tsx`
- [x] Companies list & detail — `src/pages/CompaniesPage.tsx` (list + detail + add/edit/delete)
- [x] Interaction log — `src/pages/InteractionFormPage.tsx`

---

## Phase 5: Events Module ✅

- [x] Events list — `src/pages/EventsPage.tsx` (upcoming / past split)
- [x] Event detail — `src/pages/EventDetailPage.tsx` (outcome, next steps, follow-up date)
- [x] Add/Edit Event form — `src/pages/EventFormPage.tsx`
- [x] Liên kết event với contacts (nhiều người tham gia)
- [x] Event hiển thị trong timeline của contact

---

## Phase 6: Reminders & Notifications ✅

- [x] Reminder creation & management UI — `src/pages/RemindersPage.tsx`
- [x] Web Notifications API — `src/lib/notifications.ts`
- [x] Tính "số ngày chưa liên hệ" + auto-suggest contacts cần follow-up (Dashboard)
- [x] Trigger notification check khi app khởi động

---

## Phase 7: Profile Page ✅

- [x] Profile page — `src/pages/ProfilePage.tsx` (edit name, bio, title, org, avatar)
- [x] Đổi avatar: upload → resize 200px → lưu base64 local
- [x] Nút "Đăng xuất Google" (giữ lại dữ liệu CRM)

---

## Phase 8: Backup & Restore ✅

- [x] Backup/Restore local JSON — File System Access API + blob fallback
- [x] Export CSV contacts
- [x] Google Drive: kết nối OAuth `drive.file`, upload, list, restore, delete
- [x] Auto backup scheduler + prune old versions
- [x] Settings UI — `src/pages/SettingsPage.tsx`

---

## Phase 9: PWA Polish ✅

- [x] App icons: pwa-192, pwa-512, maskable-192
- [x] Install prompt UI — `src/components/layout/PWABanners.tsx` (`InstallPrompt`)
- [x] Offline indicator banner — `src/components/layout/PWABanners.tsx` (`OfflineBanner`)
- [x] Dark mode theo system/light/dark (DarkModeSync trong App.tsx)
- [x] PWA update notification — `src/components/layout/PWABanners.tsx` (`UpdateBanner`, workbox-window)

---

## Phase 10: UI Polish & QA

- [x] Loading skeleton screens — Dashboard (stats grid) + ContactsPage (5 card skeletons)
- [x] Empty states với onboarding hints — đã có trên Dashboard, ContactsPage, EventsPage, RemindersPage
- [x] Error boundaries — `src/components/ErrorBoundary.tsx`, wrap toàn bộ app
- [x] Sonner toast notifications — tích hợp vào CompaniesPage (thêm/xóa công ty)
- [x] Swipe actions trên mobile — `SwipeToDelete` trên ContactsPage + RemindersPage
- [x] Bottom navigation bar với active state (BottomNav.tsx)
- [ ] Kiểm thử mobile thực tế (375px viewport) — *pending: cần test trên thiết bị thật*
- [x] Kiểm thử Docker deployment — HTTP 200 ✅

---

## Phase 11: Testing ✅

- [x] Unit tests: 165/165 passing (vitest + happy-dom + fake-indexeddb)
  - src/lib/__tests__: crypto, db, backup, notifications, utils
  - src/stores/__tests__: authStore, settingsStore
  - src/hooks/__tests__: useCustomFields
  - src/components/__tests__: BottomNav
- [x] E2E tests: 17/17 passing (playwright + Chromium headless, mobile-chrome Pixel 7)
  - auth.spec.ts (4), backup-restore.spec.ts (3), contact-lifecycle.spec.ts (4)
  - pin-security.spec.ts (3), reminders.spec.ts (3)
- [ ] Kiểm thử mobile thực tế (375px viewport, PWA install, swipe actions)

---

## Phase 12: Deploy ✅

- [x] Vercel deploy: https://minet-crm.vercel.app/
- [x] Google OAuth Client ID configured (login + Drive backup hoạt động)
- [x] Docker: HTTP 200, nginx serve SPA

---

## ✅ Build & Deploy Status

- `npm run build` — **PASS** (TypeScript clean)
- `npm run test:run` — **PASS** (165/165 unit tests)
- `npm run test:e2e` — **PASS** (17/17 E2E tests, Chromium headless)
- `docker compose up` — **PASS** (HTTP 200, SPA served)
- Vercel: https://minet-crm.vercel.app/ ✅
- PWA precache: 12 entries, service worker + workbox generated
- Bundle: 766 kB JS (233 kB gzip), 39 kB CSS
