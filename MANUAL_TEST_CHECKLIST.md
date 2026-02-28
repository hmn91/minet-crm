# MiNet CRM — Manual Test Checklist

> URL test: **https://minet-crm.vercel.app/**
> Cập nhật: 2026-02-27 | 52 test cases cần test thủ công

**Cách điền kết quả:**
- Đổi `⬜` thành `✅` (PASS) hoặc `❌` (FAIL)
- Với FAIL: viết mô tả ngắn vào ô **Observed** — đây là thông tin quan trọng nhất để fix bug
- Với mobile tests: cần dùng thiết bị thật hoặc DevTools mobile emulation (375px)

**Format report khi gửi lại:**
```
ID: XXX-00
Result: FAIL
Observed: [mô tả điều bạn thấy khác với Expected]
```

---

## Cách test nhanh

1. Mở https://minet-crm.vercel.app/ trên Chrome/Safari
2. Đăng nhập bằng Google hoặc nhập tên thủ công
3. Tạo một vài contact mẫu trước khi test các module con

---

## MODULE 1: PIN LOCK

> **Setup:** Vào Settings → bật PIN → đặt mã 6 số

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| PIN-09 | 1. Vào Settings → Auto-lock = 1 phút<br>2. Dùng app bình thường<br>3. Để màn hình idle >1 phút<br>4. Thao tác bất kỳ | App chuyển sang màn hình PIN lock | ⬜ | |
| PIN-10 | 1. Khi đang ở màn hình PIN lock (sau lockout hoặc idle)<br>2. Nhập sai PIN<br>3. Nhập đúng PIN<br>4. Vào app bình thường<br>5. Thử nhập sai PIN lại | Counter "X lần sai" phải reset về 5 sau khi đã unlock thành công | ⬜ | |

---

## MODULE 2: DASHBOARD

> **Setup:** Đảm bảo có ít nhất 1 contact, 1 event, 1 reminder trong data

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| DASH-03 | 1. Xóa hết tất cả data (hoặc dùng tài khoản mới)<br>2. Vào Dashboard | 4 stats cards đều hiển thị số **0** (không crash, không hiển thị undefined/NaN) | ⬜ | |
| DASH-11 | 1. Tạo event có date trong vòng 3 ngày tới<br>2. Vào Dashboard | Event đó hiển thị trong section "Sắp tới" (tối đa 3 events) | ⬜ | |

---

## MODULE 3: CONTACTS

### 3A. Danh sách Contacts

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| CON-13 | **[MOBILE]** 1. Mở /contacts trên thiết bị mobile (375px)<br>2. Swipe LEFT trên một contact card | Nút **Delete** màu đỏ xuất hiện bên phải | ⬜ | |

### 3B. Tạo Contact mới (/contacts/new)

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| CON-17 | 1. Mở form tạo contact mới<br>2. Điền First Name, Last Name<br>3. Không chọn Tier<br>4. Click Lưu | Validation error xuất hiện tại field Tier | ⬜ | |
| CON-18 | 1. Mở form tạo contact mới<br>2. Điền First Name, Last Name, chọn Tier<br>3. Không chọn Relationship Type<br>4. Click Lưu | Validation error xuất hiện tại field Relationship Type | ⬜ | |
| CON-22 | 1. Mở form tạo contact mới<br>2. Thêm 1 tag (gõ tên + Enter)<br>3. Click nút X trên badge tag đó | Tag biến mất khỏi danh sách tags | ⬜ | |
| CON-24 | 1. Mở form tạo contact mới<br>2. Tìm toggle/checkbox "Tạo công ty mới"<br>3. Bật toggle đó | Xuất hiện input field để nhập tên công ty mới | ⬜ | |
| CON-25 | 1. Vào Custom Fields (/settings/custom-fields), tạo 1 custom field mới<br>2. Mở form tạo contact mới (/contacts/new)<br>3. Cuộn xuống dưới | Custom field vừa tạo xuất hiện trong form | ⬜ | |
| CON-26 | 1. Tạo custom field với Required = true<br>2. Mở form tạo contact mới<br>3. Không điền custom field đó<br>4. Click Lưu | Validation error xuất hiện tại custom field đó | ⬜ | |
| CON-27 | 1. Mở form tạo contact mới<br>2. Điền một số thông tin (chưa lưu)<br>3. Click nút Back (←) | Quay về trang trước, KHÔNG lưu contact | ⬜ | |

### 3C. Chi tiết Contact (/contacts/:id)

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| CON-29 | 1. Mở trang detail của một contact có đầy đủ thông tin<br>2. Kiểm tra màn hình | Hiển thị đầy đủ: name, title, company, tier badge, tags | ⬜ | |
| CON-30 | 1. Mở contact detail<br>2. Click tab **"Thông tin"** | Hiển thị: email, phone, LinkedIn, notes, custom fields (nếu có) | ⬜ | |
| CON-31 | 1. Tạo vài interactions cho một contact<br>2. Mở contact detail → tab **"Lịch sử"** | Danh sách interactions + events, sort mới nhất lên trên | ⬜ | |
| CON-32 | 1. Tạo reminder gắn với một contact<br>2. Mở contact detail → tab **"Nhắc nhở"** | Reminder chưa complete hiển thị trong tab | ⬜ | |
| CON-33 | **[MOBILE]** 1. Mở contact detail có số điện thoại<br>2. Click icon phone | Mở app gọi điện hoặc hỏi confirm gọi (tel: link hoạt động) | ⬜ | |
| CON-35 | 1. Mở contact detail có LinkedIn URL<br>2. Click icon LinkedIn | Mở tab mới tới LinkedIn profile | ⬜ | |
| CON-36 | 1. Mở contact detail<br>2. Click nút "+" (thêm tương tác) | Chuyển sang trang tạo interaction, contactId được tự động gán | ⬜ | |
| CON-37 | 1. Mở contact detail của contact có company<br>2. Click tên company | Chuyển sang trang detail của company đó | ⬜ | |
| CON-38 | 1. Tạo 3 contacts:<br>   - A: lastContacted = hôm nay<br>   - B: lastContacted = 20 ngày trước<br>   - C: chưa có interaction<br>2. Xem từng contact detail, nhìn vào phần "Lần cuối liên hệ" | A: màu xanh; B: màu vàng hoặc đỏ; C: text khác | ⬜ | |
| CON-41 | 1. Truy cập thẳng URL: `/contacts/abc-invalid-id-xyz` | Không crash. Hiển thị thông báo "Không tìm thấy" hoặc redirect | ⬜ | |

### 3D. Sửa Contact

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| CON-44 | 1. Mở form edit contact có sẵn tags<br>2. Thêm 1 tag mới và xóa 1 tag cũ<br>3. Click Lưu<br>4. Xem lại contact detail | Tags đã được cập nhật đúng (tag mới có, tag xóa không còn) | ⬜ | |

---

## MODULE 4: COMPANIES

### 4A. Thêm/Sửa Company

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| COMP-07 | 1. Vào /companies → click "+"<br>2. Không điền tên company<br>3. Click Lưu | Validation error "Tên không được để trống" (hoặc tương tự) | ⬜ | |
| COMP-08 | 1. Click "+" thêm company mới<br>2. Điền đầy đủ: tên, ngành, website, mô tả, size<br>3. Click Lưu | Lưu thành công, company xuất hiện trong danh sách | ⬜ | |
| COMP-09 | 1. Khi tạo/sửa company, nhập website: `javascript:alert(1)`<br>2. Click Lưu<br>3. Vào detail company, click website link | Link bị blocked / không thực thi JS / bị sanitize | ⬜ | |
| COMP-10 | 1. Mở form thêm company<br>2. Click vào các option Size (Nhỏ, Vừa, Lớn, ...)<br>3. Click nhiều option | Chỉ 1 option được chọn tại một thời điểm (exclusive select) | ⬜ | |
| COMP-11 | 1. Click sửa (edit) một company có sẵn<br>2. Kiểm tra form | Tất cả fields pre-filled đúng với data hiện tại | ⬜ | |

---

## MODULE 5: INTERACTIONS

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| INT-01 | 1. Mở form tạo interaction (từ contact detail → click "+")<br>2. Không chọn Type (Cuộc gọi, Email, v.v.)<br>3. Click Lưu | Validation error tại field Type | ⬜ | |
| INT-02 | 1. Mở form tạo interaction<br>2. Xóa Date/Time (để trống)<br>3. Click Lưu | Validation error tại field Date/Time | ⬜ | |

---

## MODULE 6: REMINDERS (Mobile)

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| REM-06 | **[MOBILE]** 1. Mở /reminders trên thiết bị mobile<br>2. Swipe LEFT trên một reminder | Nút **Delete** màu đỏ xuất hiện bên phải | ⬜ | |

---

## MODULE 7: SETTINGS

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| SET-14 | 1. Đăng nhập bằng Google<br>2. Vào Settings → Backup<br>3. Click "Backup to Google Drive" | File backup được upload lên Google Drive. Hiển thị toast thành công | ⬜ | |

---

## MODULE 8: CUSTOM FIELDS (/settings/custom-fields)

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| CF-01 | 1. Vào /settings/custom-fields<br>2. Thêm field mới: name = "Sở thích", type = Text, category = Personal<br>3. Click Lưu | Field xuất hiện trong danh sách custom fields | ⬜ | |
| CF-02 | 1. Đã có custom field "Sở thích" (từ CF-01)<br>2. Mở form tạo contact mới (/contacts/new) | Field "Sở thích" xuất hiện trong form với input type text | ⬜ | |
| CF-03 | 1. Tạo custom field với Required = true<br>2. Vào form tạo contact → để trống field đó → click Lưu | Validation error rõ ràng tại field đó | ⬜ | |
| CF-04 | 1. Tạo contact có dữ liệu trong custom field<br>2. Vào custom fields settings → xóa field đó | Có confirm dialog hỏi có muốn xóa data không (hoặc tự động xóa với cảnh báo) | ⬜ | |
| CF-05 | 1. Tạo custom field type = URL<br>2. Vào form tạo contact<br>3. Điền giá trị "not-a-url" vào field đó<br>4. Click Lưu | Validation error: định dạng URL không hợp lệ | ⬜ | |
| CF-06 | 1. Tạo custom field type = Number<br>2. Vào form tạo contact<br>3. Thử gõ chữ cái vào field đó | Field chỉ nhận ký tự số (input bị block hoặc validation error) | ⬜ | |

---

## MODULE 9: PROFILE PAGE (/profile)

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| PRO-01 | 1. Vào /profile<br>2. Xem trang | Hiển thị đúng: tên, bio, title, org, avatar (hoặc placeholder) | ⬜ | |
| PRO-02 | 1. Vào /profile<br>2. Click upload avatar<br>3. Chọn ảnh bất kỳ từ máy | Avatar được resize và hiển thị (không vượt quá 200x200px khi lưu) | ⬜ | |
| PRO-03 | 1. Vào /profile → click upload avatar<br>2. Chọn file không phải ảnh (vd: .pdf, .txt) | File bị reject (error message hoặc không có gì xảy ra) | ⬜ | |
| PRO-04 | 1. Vào /profile → click upload avatar<br>2. Chọn ảnh rất lớn (>10MB) | App không bị crash, xử lý graceful (resize hoặc báo lỗi) | ⬜ | |
| PRO-05 | 1. Vào /profile<br>2. Xóa hết Display Name (để trống)<br>3. Click Lưu | Validation error "Tên không được để trống" (hoặc tương tự) | ⬜ | |
| PRO-06 | 1. Đăng nhập bằng Google OAuth<br>2. Vào /profile | Field Email hiển thị nhưng **không thể edit** (read-only hoặc disabled) | ⬜ | |

---

## MODULE 10: GIAO DIỆN & DARK MODE

### 10A. Dark Mode

> **Setup:** Vào Settings → Giao diện → chọn **Dark**

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| UI-06 | 1. Bật Dark mode<br>2. Đi qua tất cả trang: Dashboard, Contacts, Companies, Events, Reminders, Settings | Tất cả text đọc được, không có vùng trắng lộ ra (contrast đủ) | ⬜ | |
| UI-07 | 1. Bật Dark mode<br>2. Kiểm tra đặc biệt: cards, badges, modals, dialogs, dropdowns | Không có chỗ nào còn màu trắng/đen cứng (hardcoded #fff, #000) bị lộ | ⬜ | |
| UI-08 | 1. Bật Dark mode<br>2. Mở form tạo contact (hoặc bất kỳ form nào)<br>3. Nhìn vào các input, select, textarea | Text trong input đọc được, background không bị trắng (phải dark) | ⬜ | |

### 10B. Mobile Layout

> **Setup:** DevTools → mobile 375px (iPhone SE) hoặc dùng thiết bị thật

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| UI-01 | 1. Mở app trên mobile 375px<br>2. Scroll xuống bottom | Bottom navigation bar (5 icon) hiển thị cố định ở dưới | ⬜ | |
| UI-04 | 1. Mở app trên mobile 375px<br>2. Kiểm tra tất cả buttons, links | Mọi touch target đều ≥ 44px height/width (dễ bấm ngón tay) | ⬜ | |

### 10C. PWA

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| UI-11 | **[MOBILE]** 1. Mở https://minet-crm.vercel.app/ trên Safari iOS hoặc Chrome Android<br>2. Chờ vài giây | Xuất hiện banner/prompt "Thêm vào màn hình chính" (Add to Home Screen) | ⬜ | |

---

## MODULE 11: SECURITY EDGE CASES

| ID | Steps | Expected | Result | Observed |
|----|-------|----------|--------|----------|
| SEC-22 | 1. Mở app ở **2 tab** trình duyệt cùng lúc<br>2. Ở tab 1: tạo một contact mới<br>3. Chuyển sang tab 2 và refresh | Tab 2 thấy contact mới (data đồng bộ qua IndexedDB) | ⬜ | |

---

## TỔNG KẾT

| Module | Cần test | PASS | FAIL |
|--------|----------|------|------|
| PIN | 2 | | |
| Dashboard | 2 | | |
| Contacts | 19 | | |
| Companies | 5 | | |
| Interactions | 2 | | |
| Reminders (mobile) | 1 | | |
| Settings | 1 | | |
| Custom Fields | 6 | | |
| Profile | 6 | | |
| Dark Mode | 3 | | |
| Mobile UI | 2 | | |
| PWA | 1 | | |
| Security | 1 | | |
| **TỔNG** | **51** | | |

---

## Template Report Bug

Khi phát hiện lỗi, copy template này và gửi lại:

```
=== BUG REPORT ===
ID: [vd: CON-17]
Module: [vd: Contacts - Tạo mới]
Priority: [CRITICAL / HIGH / MEDIUM / LOW]

Steps to reproduce:
1. ...
2. ...

Expected: [điều bạn mong đợi xảy ra]
Observed: [điều thực tế xảy ra]

Screenshot/Note: [mô tả thêm nếu cần]
==================
```
