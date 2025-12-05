# Development TODO List

**Project:** Web Chat Application  
**Tech Stack:** NestJS, ReactJS, PostgreSQL, Socket.io

---

## 📅 PHASE 1: INFRASTRUCTURE & SETUP (Khởi tạo dự án)

### Repository Setup
- [ ] Khởi tạo Repository: Tạo Git repo (Monorepo hoặc tách riêng BE/FE).

### Database Setup (PostgreSQL)
- [ ] Cài đặt PostgreSQL (qua Docker Compose hoặc Local).
- [ ] Cài đặt PgAdmin hoặc DBeaver để quản lý DB.

### Backend Setup (NestJS)
- [ ] Chạy `nest new backend`.
- [ ] Cài đặt TypeORM hoặc Prisma.
- [ ] Kết nối NestJS với PostgreSQL.
- [ ] Cấu hình biến môi trường (`.env`): DB_HOST, DB_PORT, JWT_SECRET, CLIENT_URL.

### Frontend Setup (ReactJS)
- [ ] Chạy `npm create vite@latest frontend -- --template react-ts`.
- [ ] Cài đặt UI Library (TailwindCSS, MUI hoặc AntD).
- [ ] Cài đặt React Router DOM.

---

## ⚙️ PHASE 2: BACKEND CORE (REST API & DB)

Triển khai cấu trúc Database và các API cơ bản (Auth, User, Conversation). Tham khảo file `API_DOCS.md`.

### Database Migration
- [ ] Định nghĩa Schema: User, Conversation, Member, Message.
- [ ] Chạy Migration để tạo bảng trong DB.

### Auth Module (Quan trọng)
- [ ] Implement Register API (Hash password với bcrypt).
- [ ] Implement Login API (Generate JWT Token).
- [ ] Tạo JwtAuthGuard để bảo vệ các API private.

### User Module
- [ ] API `GET /users/me` (Lấy profile từ token).
- [ ] API `GET /users/search` (Tìm kiếm user theo tên/email).

### Conversation Module
- [ ] API Create Conversation (Check logic: nếu chat 1-1 đã tồn tại thì trả về cũ).
- [ ] API Get Conversations (Sort theo last_message_at).
- [ ] Tính toán `unread_count` trong câu query.

### Message Module (Phần lưu trữ)
- [ ] API Get Messages (Phân trang bằng cursor).
- [ ] API Create Message (Lưu vào DB trước khi làm Socket).

---

## 🔌 PHASE 3: REAL-TIME SERVER (Socket.io)

Cấu hình Gateway để xử lý kết nối thời gian thực. Tham khảo file `WORKFLOW.md`.

### Socket Gateway Setup
- [ ] Tạo ChatGateway (`@WebSocketGateway`).
- [ ] Cấu hình CORS cho Socket (cho phép Frontend kết nối).

### Socket Middleware/Guard
- [ ] Xác thực Token khi Client handshake (bắt buộc).
- [ ] Map user_id sang socket_id (lưu biến global hoặc Redis).

### Socket Events Implementation
- [ ] Handle `on('join_conversation')`: Join socket vào room tương ứng.
- [ ] Handle `on('send_message')`:
  - Validate dữ liệu.
  - Lưu message vào DB (Service của Module Message).
  - Emit `new_message` tới room.
- [ ] Handle `on('mark_read')`: Update last_seen_at.

---

## 🎨 PHASE 4: FRONTEND IMPLEMENTATION (UI & Logic)

Xây dựng giao diện và tích hợp API.

### Cấu trúc dự án
- [ ] Setup Axios instance (Tự động đính kèm Token vào Header).
- [ ] Setup State Management (Zustand/Redux Toolkit/Context API).

### Authentication Pages
- [ ] Màn hình Login.
- [ ] Màn hình Register.
- [ ] Lưu Token vào LocalStorage/Cookie.

### Chat Layout (Main UI)
- [ ] Sidebar trái: List hội thoại, thanh tìm kiếm user.
- [ ] Main chat: Header (Tên user/group), Message List, Input bar.

### API Integration
- [ ] Fetch danh sách hội thoại khi load trang.
- [ ] Tìm kiếm user và tạo cuộc hội thoại mới.
- [ ] Fetch lịch sử tin nhắn khi click vào hội thoại.

### Infinite Scroll
- [ ] Xử lý sự kiện cuộn lên đầu → Gọi API load thêm tin nhắn cũ → Merge vào list hiện tại.

---

## 🔄 PHASE 5: REAL-TIME INTEGRATION

Kết nối ReactJS với Socket Server.

### Socket Client Setup
- [ ] Cài đặt `socket.io-client`.
- [ ] Tạo Custom Hook `useSocket` để quản lý kết nối (Connect khi login, Disconnect khi logout).

### Xử lý sự kiện Real-time
- [ ] Lắng nghe `new_message`:
  - Nếu đang mở đúng hội thoại đó: Append tin nhắn vào list, cuộn xuống đáy.
  - Nếu đang ở hội thoại khác: Tăng số badge notification.
  - Cập nhật dòng "last message" ở Sidebar.
- [ ] Emit `send_message`: Gửi tin nhắn đi.
- [ ] Emit `mark_read`: Khi user click vào hội thoại hoặc có tin mới đến mà đang focus.

## Progress Summary

| Phase | Name | Status |
|-------|------|--------|
| 1 | Infrastructure & Setup | ⬜ |
| 2 | Backend Core (REST API & DB) | ⬜ |
| 3 | Real-time Server (Socket.io) | ⬜ |
| 4 | Frontend Implementation | ⬜ |
| 5 | Real-time Integration | ⬜ |
| 6 | Polish & Deploy | ⬜ |

> **Status:** ⬜ Not Started | 🟨 In Progress | ✅ Completed
