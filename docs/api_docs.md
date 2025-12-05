# API DOCUMENTATION

**Project:** Web Chat Application  
**Backend:** NestJS  
**Protocol:** RESTful API  
**Last Updated:** 2024

## 1. General Information (Thông tin chung)

- **Base URL:** `http://localhost:3000/api/v1`
- **Authentication:** Sử dụng Bearer Token (JWT) trong Header.

### Authorization Header
```
Authorization: Bearer <your_access_token>
```

### Response Format Standard (Cấu trúc phản hồi)
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... } // Hoặc null
}
```

---

## 2. Auth Module (Xác thực)

### 2.1. Đăng ký tài khoản

**Endpoint:** `POST /auth/register`

**Description:** Tạo tài khoản mới cho người dùng.

| Body Params | Type   | Required | Description                    |
|-------------|--------|----------|--------------------------------|
| username    | string | Yes      | Unique, tối thiểu 3 ký tự.     |
| email       | string | Yes      | Đúng định dạng email.          |
| password    | string | Yes      | Tối thiểu 6 ký tự.             |

**Success Response (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid-v4",
    "username": "nguyenvana",
    "email": "a@example.com"
  }
}
```

### 2.2. Đăng nhập

**Endpoint:** `POST /auth/login`

**Description:** Xác thực user và trả về Access Token.

| Body Params | Type   | Required | Description           |
|-------------|--------|----------|-----------------------|
| username    | string | Yes      | Username hoặc Email.  |
| password    | string | Yes      | Mật khẩu.             |

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-v4",
      "username": "nguyenvana",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

---

## 3. User Module (Người dùng)

### 3.1. Lấy thông tin cá nhân (My Profile)

**Endpoint:** `GET /users/me`

**Headers:** `Authorization: Bearer <token>`

**Description:** Lấy thông tin chi tiết của user đang đăng nhập (dựa trên Token).

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid-v4",
    "username": "nguyenvana",
    "email": "a@example.com",
    "avatar": "url",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3.2. Tìm kiếm người dùng

**Endpoint:** `GET /users/search`

**Query Params:**
- `q`: Từ khóa tìm kiếm (username hoặc email).

**Description:** Tìm kiếm bạn bè để thêm vào nhóm chat.

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "user_id_1",
      "username": "hoangnm",
      "avatar": "https://..."
    },
    {
      "id": "user_id_2",
      "username": "lanpt",
      "avatar": "https://..."
    }
  ]
}
```

---

## 4. Conversation Module (Hội thoại)

### 4.1. Tạo cuộc hội thoại (Start Chat)

**Endpoint:** `POST /conversations`

**Description:** Khởi tạo chat 1-1 hoặc chat nhóm. Nếu là chat 1-1 (DIRECT) và đã tồn tại cuộc trò chuyện giữa 2 người, trả về id của cuộc trò chuyện cũ.

| Body Params | Type         | Required | Description                                              |
|-------------|--------------|----------|----------------------------------------------------------|
| memberIds   | array[uuid]  | Yes      | Danh sách ID người muốn chat cùng (Không bao gồm bản thân). |
| type        | enum         | No       | DIRECT (Mặc định) hoặc GROUP.                           |
| name        | string       | No       | Tên nhóm (Chỉ bắt buộc nếu type = GROUP).               |

**Success Response (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "id": "conv_id_123",
    "type": "DIRECT",
    "name": null,
    "members": [
        { "id": "my_id", "username": "me" },
        { "id": "friend_id", "username": "friend" }
    ]
  }
}
```

### 4.2. Lấy danh sách hội thoại (Sidebar List)

**Endpoint:** `GET /conversations`

**Query Params:**
- `limit`: Số lượng (Default 20).
- `offset`: Vị trí bắt đầu (Default 0).

**Description:** Lấy danh sách chat cho Sidebar, sắp xếp theo tin nhắn mới nhất (last_message_at DESC).

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "conv_id_A",
      "name": "Team Dev",
      "type": "GROUP",
      "lastMessage": {
        "content": "Hello everyone",
        "createdAt": "2024-01-01T10:00:00Z",
        "senderId": "user_id"
      },
      "unreadCount": 5, 
      "avatar": "group_avatar_url" 
    },
    {
      "id": "conv_id_B",
      "name": null,
      "type": "DIRECT",
      "lastMessage": { ... },
      "unreadCount": 0,
      "avatar": "friend_avatar_url"
    }
  ]
}
```

### 4.3. Lấy lịch sử tin nhắn (Get Messages)

**Endpoint:** `GET /conversations/:id/messages`

**Query Params:**
- `limit`: Số lượng tin muốn lấy (Default 20).
- `cursor`: (Optional) ID của tin nhắn mốc để tải tin cũ hơn.

**Logic phân trang (Infinite Scroll):**
- Lần đầu (Mở box chat): Gọi API không có cursor → Server trả 20 tin mới nhất.
- Load more (Cuộn lên trên): Client lấy ID của tin nhắn cũ nhất trong list hiện tại, gửi lên server qua param cursor. Server sẽ trả về 20 tin cũ hơn tin đó.

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "msg_id_100",
      "content": "Tin nhắn mới nhất",
      "type": "TEXT",
      "fileUrl": null,
      "createdAt": "2024-01-01T12:05:00Z",
      "sender": {
        "id": "user_id_A",
        "username": "User A",
        "avatar": "..."
      }
    },
    {
      "id": "msg_id_99",
      "content": "Tin nhắn cũ hơn...",
      "...": "..."
    }
  ],
  "nextCursor": "msg_id_80"
}
```

> **Note:** Client dùng `nextCursor` ID này cho request tiếp theo. Null nếu hết tin.

---

## 5. Upload Module (Media)

### 5.1. Upload File/Ảnh

**Endpoint:** `POST /upload`

**Headers:** `Content-Type: multipart/form-data`

**Body:**
- `file`: File binary (Giới hạn ví dụ: Max 5MB).

**Description:** Upload file lên Server (hoặc S3/Cloudinary) để lấy URL. Sau khi có URL, Client sẽ dùng Socket gửi tin nhắn chứa URL này.

**Success Response (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "url": "https://bucket-name.s3.amazonaws.com/uploads/image-123.jpg",
    "mimetype": "image/jpeg",
    "size": 102400
  }
}
```
