# MiNet CRM

Ứng dụng CRM cá nhân chạy hoàn toàn trên trình duyệt, không cần backend server. Dữ liệu được lưu trữ cục bộ trong IndexedDB ngay trên thiết bị của người dùng, đảm bảo riêng tư tuyệt đối.

**Demo:** [https://minet-crm.vercel.app/](https://minet-crm.vercel.app/)

---

## Mục đích

MiNet CRM giúp cá nhân quản lý mạng lưới quan hệ (networking) một cách có hệ thống:

- Phân loại liên hệ theo mức độ ưu tiên (Tier A/B/C/D)
- Theo dõi lịch sử tương tác với từng người
- Nhận nhắc nhở follow-up đúng lúc
- Quản lý sự kiện và kết quả sau sự kiện
- Backup và khôi phục dữ liệu qua file JSON

Mọi dữ liệu chỉ tồn tại trên thiết bị của bạn — không server, không cloud bắt buộc.

---

## Tính năng chính

### Quản lý liên hệ
- Thêm, sửa, xóa liên hệ với đầy đủ thông tin: tên, email, điện thoại, công ty, chức danh, sinh nhật, LinkedIn
- Phân tier ưu tiên: **A** (ưu tiên cao), **B** (quan trọng), **C** (bình thường), **D** (ít ưu tiên)
- Phân loại quan hệ: khách hàng, đối tác, nhà đầu tư, nhà cung cấp
- Tìm kiếm và lọc theo tier hoặc loại quan hệ; gắn tag tự do cho từng liên hệ
- Custom fields động: thêm trường tùy chỉnh (Facebook, Zalo, sở thích, địa chỉ, v.v.)
- Timeline tương tác đầy đủ cho từng liên hệ

### Quản lý công ty
- Lưu thông tin công ty: ngành nghề, website, quy mô nhân sự, địa chỉ
- Liên kết liên hệ với công ty
- Xem danh sách nhân sự theo từng công ty

### Lịch sử tương tác
- Ghi nhận mọi điểm chạm: gặp mặt, cuộc gọi, email, tin nhắn, sự kiện
- Ghi chú kết quả và bước tiếp theo
- Hiển thị timeline theo từng liên hệ

### Sự kiện
- Quản lý sự kiện sắp diễn ra và đã qua
- Liên kết nhiều liên hệ tham dự cùng một sự kiện
- Ghi nhận kết quả, next steps, ngày follow-up sau sự kiện

### Nhắc nhở & Thông báo
- Tạo nhắc nhở gắn với liên hệ cụ thể
- Web Notifications API — thông báo ngay trên trình duyệt
- Dashboard hiển thị liên hệ cần follow-up (tính số ngày chưa liên hệ)

### Bảo mật & Đăng nhập
- Đăng nhập bằng Google OAuth2, hoặc tiếp tục không cần tài khoản Google (nhập tên thủ công)
- Khóa PIN 6 số với SubtleCrypto SHA-256
- Biometric (WebAuthn — Face ID / vân tay) trên thiết bị hỗ trợ
- Auto-lock sau 1 phút hoặc 5 phút không hoạt động (hoặc tắt hoàn toàn)
- Giới hạn 5 lần nhập sai PIN, lockout 30 giây

### Backup & Restore
- Export/Import JSON toàn bộ dữ liệu (File System Access API hoặc blob download)

### PWA (Progressive Web App)
- Cài đặt lên màn hình chính điện thoại / desktop
- Hoạt động offline — dữ liệu IndexedDB không cần mạng
- Banner thông báo khi có bản cập nhật mới
- Offline indicator khi mất kết nối

### Giao diện
- Thiết kế mobile-first, tối ưu cho màn hình 375px+
- Bottom navigation bar cho di động
- Dark mode: theo hệ thống / sáng / tối
- Swipe-to-delete trên mobile
- Skeleton loading, empty states, toast notifications

---

## Tech Stack

| Phần | Công nghệ |
|------|-----------|
| Framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS v4 |
| UI components | Radix UI (shadcn/ui pattern) |
| Database (local) | Dexie.js (IndexedDB wrapper) |
| State management | Zustand |
| Routing | React Router v7 |
| Form & validation | React Hook Form + Zod |
| PWA | vite-plugin-pwa + Workbox |
| Icons | Lucide React |
| Unit tests | Vitest + happy-dom + Testing Library |
| E2E tests | Playwright (mobile-chrome Pixel 7) |
| Deploy | Vercel / Docker + Nginx |

---

## Chạy local (Development)

**Yêu cầu:** Node.js 20+

```bash
# Clone repo
git clone <repo-url>
cd minet-crm

# Cài dependencies
npm install

# Chạy dev server
npm run dev
# → http://localhost:5173
```

### Build production

```bash
npm run build
# Output: dist/

npm run preview
# → http://localhost:4173
```

---

## Chạy bằng Docker

```bash
# Build & chạy
docker compose up --build

# → http://localhost:3000
```

Hoặc build image thủ công:

```bash
docker build -t minet-crm .
docker run -p 3000:80 minet-crm
```

Image sử dụng multi-stage build (Node 20 Alpine để build, Nginx Alpine để serve).

---

## Deploy lên Vercel

1. Fork repo lên GitHub
2. Import vào [vercel.com](https://vercel.com) — Vercel tự detect Vite project
3. Thêm biến môi trường (xem `.env.example`):
   ```
   VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
   ```
4. Deploy — Vercel tự chạy `npm run build` và serve `dist/`

> File `vercel.json` đã cấu hình rewrite `/*` → `/index.html` để SPA routing hoạt động đúng.

### Cấu hình Google OAuth (tùy chọn)

Để dùng tính năng đăng nhập bằng tài khoản Google:

1. Vào [Google Cloud Console](https://console.cloud.google.com/) → tạo OAuth 2.0 Client ID (Web application)
2. Thêm Authorized JavaScript origins: `https://your-domain.vercel.app`
3. Copy Client ID → đặt vào biến môi trường `VITE_GOOGLE_CLIENT_ID`

Nếu không cấu hình Google OAuth, ứng dụng vẫn hoạt động đầy đủ — người dùng chỉ cần nhập tên để bắt đầu, không bắt buộc có tài khoản Google.

---

## Chạy Tests

```bash
# Unit & integration tests (203 tests)
npm run test:run

# E2E tests — Playwright
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Cài system libs cho Playwright (Ubuntu/WSL)

```bash
sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 \
  libgbm1 libasound2
npx playwright install chromium
```

---

## Cấu trúc thư mục

```
src/
├── types/          # TypeScript interfaces (Contact, Company, Event...)
├── lib/            # Core logic: db.ts, crypto.ts, auth.ts, backup.ts, notifications.ts
├── stores/         # Zustand stores: authStore, settingsStore
├── hooks/          # Data hooks: useContacts, useCompanies, useEvents...
├── components/
│   ├── ui/         # Radix UI components (Button, Input, Dialog...)
│   └── layout/     # AppShell, BottomNav, PWABanners
├── pages/          # Route pages (14 trang)
├── App.tsx         # Router + guards (AuthGuard, PinGuard)
└── main.tsx

e2e/
├── tests/          # Playwright spec files (11 files, 135 tests)
└── fixtures/       # auth.fixture.ts

public/
└── icons/          # PWA icons (192, 512, maskable)
```

---

## Kiến trúc dữ liệu

Toàn bộ dữ liệu lưu trong **IndexedDB** qua Dexie.js với 9 bảng:

| Bảng | Mô tả |
|------|-------|
| `contacts` | Danh sách liên hệ |
| `companies` | Danh sách công ty |
| `interactions` | Lịch sử tương tác |
| `events` | Sự kiện |
| `reminders` | Nhắc nhở |
| `tags` | Nhãn phân loại |
| `customFieldDefs` | Định nghĩa trường tùy chỉnh |
| `userProfile` | Hồ sơ người dùng |
| `appSettings` | Cài đặt ứng dụng |

Dữ liệu **không bao giờ rời thiết bị** trừ khi người dùng chủ động export ra file JSON.

---

## Trạng thái dự án

- **203/203** unit tests passing
- **133/135** E2E tests passing (2 skipped)
- Deploy: [https://minet-crm.vercel.app/](https://minet-crm.vercel.app/)
- Bundle: ~808 kB JS (gzip), 39 kB CSS

---

## License

MIT
