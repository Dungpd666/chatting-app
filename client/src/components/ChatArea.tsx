import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Conversation, Message } from '../types';
import { messagesAPI } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import MessageInput from './MessageInput';

interface ChatAreaProps {
  conversation: Conversation;
}

const ChatArea: React.FC<ChatAreaProps> = ({ conversation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Get members list for display
  const membersList = React.useMemo(() => {
    const members = conversation.members || conversation.participants || [];

    if (members.length > 0) {
      // Ensure each member has a proper ID
      return members.map((member: any, idx: number) => ({
        ...member,
        id: member.id || member.user_id || `member-${idx}`,
      }));
    }

    // Fallback for direct messages
    const fallbackMembers = [];
    if (conversation.otherUser) {
      fallbackMembers.push({
        id: `other-${conversation.otherUser.id || 'unknown'}`,
        actualId: conversation.otherUser.id,
        username: conversation.otherUser.username,
        email: conversation.otherUser.email,
        isCurrentUser: false,
        colorClass: 'from-green-400 to-green-600'
      });
    }
    if (user) {
      fallbackMembers.push({
        id: `current-${user.id || 'me'}`,
        actualId: user.id,
        username: user.username,
        email: user.email,
        isCurrentUser: true,
        colorClass: 'from-blue-400 to-blue-600'
      });
    }
    return fallbackMembers;
  }, [conversation, user]);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data: any = await messagesAPI.getByConversation(conversation.id);
      // Backend returns { messages: [], has_more: boolean, next_cursor: number }
      const messagesList = Array.isArray(data) ? data : (data.messages || []);
      setMessages(messagesList);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversation.id]);

  const joinConversation = useCallback(() => {
    socketService.joinConversation(conversation.id);
  }, [conversation.id]);

  const handleNewMessage = useCallback((message: any) => {
    if (message.conversation_id === conversation.id) {
      setMessages((prev) => [...prev, message]);

      // Mark as read
      socketService.markAsRead(conversation.id);
    }
  }, [conversation.id]);

  const handleUserTyping = useCallback((data: { userId: number; conversationId: number; isTyping: boolean }) => {
    if (data.conversationId === conversation.id && data.userId !== user?.id) {
      setTypingUsers((prev) => {
        if (data.isTyping) {
          return prev.includes(data.userId) ? prev : [...prev, data.userId];
        } else {
          return prev.filter((id) => id !== data.userId);
        }
      });
    }
  }, [conversation.id, user?.id]);

  useEffect(() => {
    loadMessages();
    joinConversation();

    // Listen for new messages
    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);

    return () => {
      socketService.offNewMessage();
      socketService.offUserTyping();
    };
  }, [conversation.id, loadMessages, joinConversation, handleNewMessage, handleUserTyping]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage: Message | null) => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.created_at).toDateString();
    const previousDate = new Date(previousMessage.created_at).toDateString();

    return currentDate !== previousDate;
  };

  return (
    <div className="flex-1 flex flex-row bg-gray-50 h-screen">
      <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {conversation.name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">{conversation.name || 'Conversation'}</h2>
            <p className="text-xs text-gray-500">
              {typingUsers.length > 0 ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 text-gray-500 hover:text-gray-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 text-center">
              No messages yet.<br />
              <span className="text-sm">Start the conversation!</span>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
              // Check sender_id, user_id, or user.id for compatibility
              const messageSenderId = message.sender_id || message.user_id || message.user?.id;
              const isOwnMessage = messageSenderId === user?.id;
              const sender = message.sender || message.user;

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.created_at)}
                      </div>
                    </div>
                  )}

                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end space-x-2 max-w-lg ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!isOwnMessage && (
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {sender?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                          }`}
                        >
                          {!isOwnMessage && (
                            <p className="text-xs font-semibold mb-1 text-gray-600">
                              {sender?.username || 'Unknown'}
                            </p>
                          )}
                          <p className="break-words">{message.content}</p>                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </>
        )}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm">
              <div className="flex space-x-1">
                {[0, 150, 300].map((delay) => (
                  <div key={delay} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }}></div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput conversationId={conversation.id} />
      </div>

      {/* Info Panel */}
      <div
        className={`h-full bg-white border-l border-gray-200 shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${
          showInfo ? 'w-80' : 'w-0'
        }`}
      >
        <div className="h-full w-80 overflow-y-auto">
          {/* Panel Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <h3 className="font-semibold text-gray-800">Conversation Info</h3>
            <button
              onClick={() => setShowInfo(false)}
              className="p-1 text-gray-500 hover:text-gray-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Conversation Details */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-3xl mb-3">
                {conversation.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <h2 className="font-semibold text-gray-800 text-lg mb-1">
                {conversation.name || 'Conversation'}
              </h2>
              <p className="text-sm text-gray-600">
                {conversation.type === 'group' ? 'Group Chat' : 'Direct Message'}
              </p>
            </div>
          </div>

          {/* Members Section */}
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Members {(() => {
                const allMembers = conversation.members || conversation.participants || [];
                const totalMembers = allMembers.length > 0 ? allMembers.length : (conversation.otherUser ? 2 : 1);
                return `(${totalMembers})`;
              })()}
            </h4>
            <div className="space-y-3">
              {membersList.map((member: any, index: number) => {
                const memberId = member.actualId || member.id;
                const isCurrentUser = member.isCurrentUser ?? (memberId === user?.id);
                const colors = [
                  'from-blue-400 to-blue-600',
                  'from-green-400 to-green-600',
                  'from-purple-400 to-purple-600',
                  'from-pink-400 to-pink-600',
                  'from-yellow-400 to-yellow-600',
                  'from-red-400 to-red-600',
                ];
                const colorClass = member.colorClass || (isCurrentUser ? 'from-blue-400 to-blue-600' : colors[index % colors.length]);

                return (
                  <div key={`${conversation.id}-${member.id}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition">
                    <div className={`w-10 h-10 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center text-white font-semibold`}>
                      {member.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {member.username || 'Unknown'} {isCurrentUser && <span className="text-xs text-gray-500">(You)</span>}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {member.email || ''}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Info */}
          <div className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Details</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(conversation.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              {conversation.last_message_at && (
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Last Activity</p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(conversation.last_message_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
