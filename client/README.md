# Chat App Frontend

A modern, real-time chat application built with React, TypeScript, and Socket.io.

## Features

- ✅ User authentication (login/register)
- ✅ Real-time messaging with WebSocket
- ✅ Conversation list with last message preview
- ✅ Typing indicators
- ✅ Online status
- ✅ Message timestamps and date separators
- ✅ Modern UI with TailwindCSS
- ✅ Responsive design

## Tech Stack

- **React** - UI library
- **TypeScript** - Type safety
- **React Router** - Routing
- **Socket.io Client** - Real-time WebSocket communication
- **Axios** - HTTP client
- **TailwindCSS** - Styling

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend server running on `http://localhost:3000`

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
The `.env` file is already set up with:
```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_SOCKET_URL=http://localhost:3000
```

## Running the App

1. Start the development server:
```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3001`

## Project Structure

```
src/
├── components/          # React components
│   ├── ChatArea.tsx    # Main chat display
│   ├── Sidebar.tsx     # Conversation list
│   ├── MessageInput.tsx # Message input component
│   └── PrivateRoute.tsx # Protected route wrapper
├── pages/              # Page components
│   ├── Login.tsx       # Login page
│   ├── Register.tsx    # Register page
│   └── Chat.tsx        # Main chat page
├── context/            # React context
│   └── AuthContext.tsx # Authentication context
├── services/           # API and WebSocket services
│   ├── api.ts         # REST API service
│   └── socket.ts      # WebSocket service
├── types/             # TypeScript types
│   └── index.ts       # Type definitions
└── App.tsx            # Main app component
```

## Available Scripts

- `npm start` - Run development server (opens on port 3001)
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## WebSocket Events

The app uses the following WebSocket events:

### Client → Server
- `join_conversation` - Join a conversation room
- `send_message` - Send a message
- `mark_read` - Mark messages as read
- `typing` - Send typing indicator

### Server → Client
- `new_message` - Receive new message
- `user_typing` - Receive typing indicator
- `user_read` - Receive read receipt
- `joined_conversation` - Confirmation of joining conversation

## API Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /conversations` - Get all user conversations
- `GET /conversations/:id` - Get conversation details
- `POST /conversations` - Create new conversation
- `GET /messages/conversation/:id` - Get messages for conversation
- `POST /messages` - Create new message
- `GET /users` - Get all users
- `GET /users/search?q=query` - Search users

## Getting Started

1. Make sure the backend is running on `http://localhost:3000`
2. Start this frontend: `npm start`
3. Navigate to `http://localhost:3001`
4. Register a new account or login
5. Start chatting!

## Troubleshooting

### WebSocket connection fails
- Check if backend is running on port 3000
- Verify CORS settings in backend
- Check `.env` file has correct `REACT_APP_SOCKET_URL`

### Authentication issues
- Clear localStorage and try again
- Check JWT token in localStorage
- Verify backend auth endpoints are working

### Messages not appearing
- Check WebSocket connection in browser console
- Verify you've joined the conversation
- Check backend logs for errors

---

Built with ❤️ using React, TypeScript, and Socket.io
