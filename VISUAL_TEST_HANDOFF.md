# MiNet CRM — Visual Test Handoff

## App Info
- **Live URL**: https://minet-crm.vercel.app/
- **Local**: `npm run preview` (sau `npm run build`) → http://localhost:4173
- **Tech**: React 18 + TypeScript + Tailwind CSS v4 + shadcn/ui, PWA, mobile-first
- **Ngôn ngữ UI**: Tiếng Việt

## Cách truy cập app (không cần backend)
App dùng IndexedDB (offline-first), không có backend. Để vào app:
1. Mở URL → tự redirect `/login`
2. Nhập tên bất kỳ vào ô "Họ tên" → click "Bắt đầu"
3. App sẽ redirect về Dashboard (`/`)

## Trạng thái test hiện tại
- **80/168 test cases đã PASS** (unit + E2E tự động)
- **88 test cases còn lại cần visual testing** (đánh dấu 🖥️ trong test plan)
- **0 bugs chưa fix** (2 bugs đã fix xong)
- Test plan chi tiết: xem file `TEST_PLAN.md` hoặc bên dưới

## Routes chính
| Route | Mô tả |
|-------|-------|
| `/login` | Trang đăng nhập (nhập tên hoặc Google OAuth) |
| `/` | Dashboard — stats cards, follow-up contacts, upcoming events/reminders |
| `/contacts` | Danh sách contacts, search, filter theo Tier/Type |
| `/contacts/new` | Form tạo contact mới |
| `/contacts/:id` | Chi tiết contact (tabs: Info, History, Reminders) |
| `/contacts/:id/edit` | Sửa contact |
| `/companies` | Danh sách companies |
| `/events` | Events — chia "Sắp tới" vs "Đã qua" |
| `/events/new` | Tạo event mới |
| `/reminders` | Danh sách reminders chưa complete |
| `/reminders/new?contactId=xxx` | Tạo reminder mới |
| `/settings` | Settings — PIN, Backup, Notifications, Dark mode |
| `/profile` | Profile page — avatar, tên |
| `/lock` | PIN lock screen (khi PIN enabled) |

## Viewport
- Mobile-first: test trên **375px width** (iPhone SE / Pixel 7)
- Bottom navigation bar ở dưới cùng

---

## 88 TEST CASES CẦN VISUAL TESTING

### Authentication (4 cases)
- [ ] **AUTH-03**: Nhập tên rỗng → button "Bắt đầu" disabled hoặc hiển thị lỗi
- [ ] **AUTH-04**: Nhập tên chỉ có khoảng trắng → bị reject
- [ ] **AUTH-05**: Tên chứa `<script>alert(1)</script>` → escape đúng, không XSS
- [ ] **AUTH-06**: Tên rất dài (>200 chars) → xử lý graceful (không vỡ layout)

### Authentication — Visual (2 cases)
- [ ] **AUTH-08**: Google OAuth button hiển thị đúng trên login page
- [ ] **AUTH-09**: Đăng nhập manual → profile không có googleId/email

### PIN Lock (3 cases)
- [ ] **PIN-07**: Sau 30 giây lockout → có thể nhập lại
- [ ] **PIN-09**: Auto-lock sau X phút idle (theo setting)
- [ ] **PIN-10**: Lockout counter reset sau unlock thành công

### Dashboard (6 cases)
- [ ] **DASH-01**: 4 stats cards hiển thị đúng số: Liên hệ, Công ty, Nhắc nhở, Sự kiện
- [ ] **DASH-02**: Reminders card có red badge khi có reminder quá hạn
- [ ] **DASH-03**: Stats hiển thị 0 khi không có data
- [ ] **DASH-08**: Click contact card trong "Cần liên hệ" → navigate `/contacts/:id`
- [ ] **DASH-10**: Reminders trong 3 ngày tới hiển thị đúng (tối đa 3)
- [ ] **DASH-11**: Events trong 3 ngày tới hiển thị đúng (tối đa 3)
- [ ] **DASH-13**: Hiển thị 5 interactions mới nhất

### Contacts — List (3 cases)
- [ ] **CON-04**: Search theo email hoạt động
- [ ] **CON-05**: Search theo phone hoạt động
- [ ] **CON-13**: Swipe left trên mobile → nút Delete xuất hiện

### Contacts — Create Form (6 cases)
- [ ] **CON-17**: Submit thiếu Tier → validation error
- [ ] **CON-18**: Submit thiếu Relationship Type → validation error
- [ ] **CON-22**: Xóa tag (click X trên badge) → tag biến mất
- [ ] **CON-23**: Chọn company từ dropdown existing companies
- [ ] **CON-24**: Toggle "Tạo mới" company → nhập tên công ty mới
- [ ] **CON-25**: Custom fields xuất hiện theo field definitions (nếu có)
- [ ] **CON-26**: Required custom field không điền → validation error
- [ ] **CON-27**: Click back arrow → không lưu, quay về trang trước

### Contacts — Detail Page (10 cases)
- [ ] **CON-29**: Hiển thị đầy đủ: name, title, company, tier badge, tags
- [ ] **CON-30**: Tab "Info" → thông tin chi tiết + custom fields
- [ ] **CON-31**: Tab "History" → timeline sorted mới nhất trên
- [ ] **CON-32**: Tab "Reminders" → danh sách reminders chưa complete
- [ ] **CON-33**: Phone icon → `tel:` link hoạt động (mobile)
- [ ] **CON-34**: Email icon → `mailto:` link
- [ ] **CON-35**: LinkedIn → mở URL mới
- [ ] **CON-36**: Click "+" → interaction form
- [ ] **CON-37**: Click company name → company detail page
- [ ] **CON-38**: Last contact indicator: xanh ≤7 ngày, vàng 8-30, đỏ >30 ngày
- [ ] **CON-41**: Truy cập `/contacts/non-existent-id` → không crash

### Contacts — Edit (2 cases)
- [ ] **CON-44**: Thêm/xóa tag → save → thay đổi được lưu
- [ ] **CON-45**: Bỏ company (chọn "Không có") → save → contact không còn company

### Companies (8 cases)
- [ ] **COMP-01**: Empty state "Chưa có công ty nào" khi chưa có data
- [ ] **COMP-02**: Company card hiển thị: tên, ngành, số contacts
- [ ] **COMP-05**: Click "+" → Add Company dialog
- [ ] **COMP-06**: Click company card → company detail page
- [ ] **COMP-07**: Tạo company với tên trống → validation error
- [ ] **COMP-08**: Tạo company đầy đủ thông tin → lưu thành công
- [ ] **COMP-09**: Website field nhập `javascript:alert(1)` → bị blocked
- [ ] **COMP-10**: Size toggle (Nhỏ/Vừa/Lớn) chọn đúng 1 option
- [ ] **COMP-11**: Edit company → form pre-fill đúng data
- [ ] **COMP-12**: Company detail hiển thị contacts liên kết
- [ ] **COMP-14**: Click contact trong company → navigate contact detail

### Events (8 cases)
- [ ] **EVT-01**: Events page chia đúng "Sắp tới" vs "Đã qua"
- [ ] **EVT-03**: Past events hiển thị với opacity giảm
- [ ] **EVT-04**: Badge "Có kết quả" / "Có bước tiếp theo" hiển thị đúng
- [ ] **EVT-05**: Empty state khi không có event
- [ ] **EVT-06**: Tạo event thiếu tên → validation error
- [ ] **EVT-07**: Tạo event thiếu ngày → validation error
- [ ] **EVT-08**: End date trước Start date → lỗi hoặc cảnh báo
- [ ] **EVT-09**: Thêm participant từ danh sách contacts
- [ ] **EVT-10**: Xóa participant (click X)
- [ ] **EVT-14**: Event detail hiển thị đầy đủ: title, date, location, participants
- [ ] **EVT-15**: Past event chưa có outcome → nút "Add outcome & next steps"
- [ ] **EVT-16**: Click participant → contact detail

### Reminders (3 cases)
- [ ] **REM-04**: Reminder quá hạn → visual khác biệt (text đỏ hoặc badge)
- [ ] **REM-05**: Click tên contact → navigate contact detail
- [ ] **REM-06**: Swipe left mobile → Delete button xuất hiện

### Interactions (5 cases)
- [ ] **INT-01**: Tạo interaction thiếu Type → validation error
- [ ] **INT-02**: Tạo interaction thiếu Date/Time → validation error
- [ ] **INT-03**: Tạo interaction → xuất hiện trong History tab của contact
- [ ] **INT-05**: Default date/time là thời điểm hiện tại
- [ ] **INT-06**: Tất cả 6 loại type hiển thị trong dropdown
- [ ] **INT-07**: History tab: interactions + events, sorted mới nhất trên

### Settings (7 cases)
- [ ] **SET-01**: Enable PIN → dialog setup với numpad
- [ ] **SET-02**: Setup PIN → confirm PIN (nhập lại)
- [ ] **SET-03**: Confirm PIN sai → hiển thị lỗi
- [ ] **SET-04**: Toggle off PIN → PIN bị xóa
- [ ] **SET-07**: Download backup → file JSON hợp lệ
- [ ] **SET-08**: Import backup file hợp lệ → data được restore
- [ ] **SET-10**: Import file bị corrupt → lỗi graceful
- [ ] **SET-21**: System dark mode → follow OS preference

### Custom Fields (6 cases)
- [ ] **CF-01**: Thêm custom field (name + type + category)
- [ ] **CF-02**: Field xuất hiện trong Contact Form với đúng input type
- [ ] **CF-03**: Required field không điền → validation error
- [ ] **CF-04**: Xóa custom field → option xóa data trong contacts
- [ ] **CF-05**: Custom field type "URL" → validates URL format
- [ ] **CF-06**: Custom field type "Number" → chỉ nhận số

### Profile (6 cases)
- [ ] **PRO-01**: Hiển thị đúng thông tin profile
- [ ] **PRO-02**: Upload avatar → resize 200x200, lưu base64
- [ ] **PRO-03**: Upload file không phải ảnh → bị reject
- [ ] **PRO-04**: Upload ảnh >10MB → xử lý graceful
- [ ] **PRO-05**: Sửa display name trống → validation error
- [ ] **PRO-06**: Email read-only khi từ Google OAuth

### UI/Visual (10 cases)
- [ ] **UI-01**: Bottom nav hiển thị đúng trên mobile (<768px)
- [ ] **UI-03**: Layout không overflow horizontal trên 375px
- [ ] **UI-04**: Touch target ≥ 44px trên mobile
- [ ] **UI-05**: Text dài truncate đúng (ellipsis, không overflow)
- [ ] **UI-06**: Tất cả text đọc được trong dark mode
- [ ] **UI-07**: Không có hardcoded màu trắng/đen bị lộ trong dark mode
- [ ] **UI-08**: Forms input/select readable trong dark mode
- [ ] **UI-09**: Offline banner xuất hiện khi mất mạng
- [ ] **UI-10**: App hoạt động đầy đủ khi offline (IndexedDB)
- [ ] **UI-11**: PWA install prompt hiển thị đúng (mobile)

### Security — Visual (4 cases)
- [ ] **SEC-05**: XSS trong notes/bio → không thực thi
- [ ] **SEC-06**: `javascript:` protocol trong website field → blocked
- [ ] **SEC-07**: HTML trong tag name → escape đúng
- [ ] **SEC-19**: Browser back button trên SPA hoạt động đúng
- [ ] **SEC-20**: Deep link trực tiếp `/contacts/:id` (không qua list)
- [ ] **SEC-21**: Rapid click submit → không double-submit
- [ ] **SEC-22**: Mở 2 tab → thay đổi tab 1, tab 2 phản ánh không?

---

## Ghi chú cho tester
- App là PWA mobile-first → test trên viewport 375px
- Bottom nav có 5 items: Dashboard, Contacts, Events, Reminders, Settings
- Dark mode: toggle trong Settings → Giao diện
- Dữ liệu lưu trong IndexedDB (browser), không có server
- Mỗi test case nên bắt đầu từ state sạch hoặc tạo data cần thiết trước
