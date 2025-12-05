# 📂 DATABASE SCHEMA DOCUMENTATION
**Project:** Web Chat Application  
**Database:** PostgreSQL  
**Last Updated:** 2024

---

## 1. Tổng quan (Overview)

Hệ thống cơ sở dữ liệu được thiết kế tối ưu cho ứng dụng **Web Chat** (không bao gồm các tính năng đặc thù của mobile như Push Notification background).

### Các thực thể chính:
* **Users:** Quản lý thông tin tài khoản.
* **Conversations:** Quản lý metadata của hội thoại (1-1 hoặc Group).
* **Conversation Members:** Quản lý thành viên và trạng thái đọc tin nhắn trong từng hội thoại.
* **Messages:** Lưu trữ lịch sử tin nhắn.

---

## 2. Chi tiết cấu trúc bảng (Table Dictionary)

### A. Bảng `users`
Lưu trữ thông tin định danh người dùng.

| Column | Type | Attributes | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, Default Gen | Định danh duy nhất (Primary Key). |
| `username` | `VARCHAR(50)` | **Unique**, Not Null | Tên đăng nhập hệ thống. |
| `email` | `VARCHAR(255)`| **Unique**, Not Null | Email xác thực. |
| `password` | `VARCHAR` | Not Null | Mật khẩu đã mã hóa (Bcrypt/Argon2). |
| `avatar` | `VARCHAR` | Nullable | URL ảnh đại diện. |
| `created_at` | `TIMESTAMP` | Default `NOW()` | Thời gian tạo tài khoản. |

### B. Bảng `conversations`
Lưu trữ thông tin chung về cuộc hội thoại (Session chat).

| Column | Type | Attributes | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, Default Gen | Định danh cuộc hội thoại. |
| `type` | `ENUM` | 'DIRECT', 'GROUP' | Loại hội thoại: Chat riêng hoặc Chat nhóm. |
| `name` | `VARCHAR` | Nullable | Tên nhóm chat (NULL nếu là type 'DIRECT'). |
| `last_message_at`| `TIMESTAMP` | Default `NOW()` | Thời gian tin nhắn cuối cùng (Dùng để sắp xếp danh sách chat). |
| `created_at` | `TIMESTAMP` | Default `NOW()` | Thời gian tạo cuộc hội thoại. |

### C. Bảng `conversation_members`
Bảng trung gian liên kết User và Conversation.

| Column | Type | Attributes | Mô tả |
| :--- | :--- | :--- | :--- |
| `conversation_id`| `UUID` | **FK, PK** | Tham chiếu đến bảng `conversations`. |
| `user_id` | `UUID` | **FK, PK** | Tham chiếu đến bảng `users`. |
| `joined_at` | `TIMESTAMP` | Default `NOW()` | Thời gian tham gia nhóm. |
| `last_seen_at` | `TIMESTAMP` | Default `NOW()` | Thời điểm cuối cùng user xem tin nhắn trong hội thoại này (Dùng tính unread count). |
| `is_admin` | `BOOLEAN` | Default `false` | Quyền quản trị (Kick/Add member) trong Group chat. |

### D. Bảng `messages`
Lưu trữ nội dung tin nhắn.

| Column | Type | Attributes | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, Default Gen | Định danh tin nhắn. |
| `conversation_id`| `UUID` | **FK** | Tin nhắn thuộc hội thoại nào. |
| `sender_id` | `UUID` | **FK** | Người gửi tin nhắn. |
| `content` | `TEXT` | Nullable | Nội dung văn bản (Nullable nếu gửi file/ảnh). |
| `message_type` | `ENUM` | 'TEXT', 'IMAGE', 'FILE'| Loại tin nhắn. |
| `file_url` | `VARCHAR` | Nullable | Đường dẫn file/ảnh (nếu có). |
| `created_at` | `TIMESTAMP` | Default `NOW()` | Thời gian gửi tin. |

---

## 3. Database Enum Types

```sql
CREATE TYPE conversation_type AS ENUM ('DIRECT', 'GROUP');
CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'FILE');
