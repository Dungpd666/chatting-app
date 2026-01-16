import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Conversation, Message } from '../types';
import { messagesAPI, conversationsAPI, usersAPI, API_URL } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import MessageInput from './MessageInput';

interface ChatAreaProps {
  conversation: Conversation;
  onMessageSent?: (conversationId: number) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ conversation, onMessageSent }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [addUserIds, setAddUserIds] = useState<number[]>([]);
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [members, setMembers] = useState<any[]>(conversation.members || conversation.participants || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; name?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const conversationIdRef = useRef<number>(conversation.id);
  const { user } = useAuth();

  const isGroup = conversation.type === 'group';
  const currentUserIsAdmin = isGroup && members.some((m: any) => (m.user_id ?? m.id) === user?.id && m.is_admin);

  // Update ref when conversation changes
  useEffect(() => {
    conversationIdRef.current = conversation.id;
  }, [conversation.id]);


  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data: any = await messagesAPI.getByConversation(conversation.id);
      // Backend returns { messages: [], has_more: boolean, next_cursor: number }
      const messagesList = Array.isArray(data) ? data : (data.messages || []);
      setMessages(messagesList);

      // Mark as read when loading messages
      socketService.markAsRead(conversation.id);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversation.id, onMessageSent]);

  const joinConversation = useCallback(() => {
    socketService.joinConversation(conversation.id);
  }, [conversation.id]);

  const handleNewMessage = useCallback((message: any) => {
    if (message.conversation_id === conversationIdRef.current) {
      // If viewing this conversation, add to messages and mark as read
      setMessages((prev) => {
        // Check if message already exists to prevent duplicates
        const exists = prev.some(m => m.id === message.id);
        if (exists) {
          return prev;
        }
        return [...prev, message];
      });

      // Mark as read
      socketService.markAsRead(conversationIdRef.current);
    }
    // Note: Sidebar update is handled by global listener in Chat.tsx
  }, [onMessageSent]);

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

    // Rejoin conversation if socket reconnects
    socketService.onReconnect(() => {
      joinConversation();
    });

    // Reload sidebar after opening conversation to clear unread badge
    setTimeout(() => {
      onMessageSent?.(conversation.id);
    }, 300);
  }, [conversation.id, loadMessages, joinConversation, onMessageSent]);

  // Set up WebSocket listeners separately to avoid re-registering
  useEffect(() => {
    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);

    return () => {
      socketService.offNewMessage(handleNewMessage);
      socketService.offUserTyping();
    };
  }, [handleNewMessage, handleUserTyping]);

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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query || query.trim() === '') {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await messagesAPI.searchMessages(conversation.id, query);
      console.log('Search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearchQuery('');
      setSearchResults([]);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const scrollToMessage = (messageId: number) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add highlight effect with CSS class
      messageElement.classList.add('tg-message-highlight');
      setTimeout(() => {
        messageElement.classList.remove('tg-message-highlight');
      }, 2000);
    }
  };

  useEffect(() => {
    if ((showInfo || showAddModal) && isGroup && currentUserIsAdmin) {
      usersAPI.getAll().then(setAvailableUsers).catch(() => setAvailableUsers([]));
    }
  }, [showInfo, showAddModal, isGroup, currentUserIsAdmin]);

  useEffect(() => {
    setMembers(conversation.members || conversation.participants || []);
  }, [conversation.id, conversation.members, conversation.participants]);

  // Helper to get full avatar URL
  const getAvatarUrl = (avatar?: string | null): string | undefined => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    return `${API_URL}${avatar}`;
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!isGroup) return;
    if (!window.confirm('Remove this member from the group?')) return;
    setRemovingMemberId(memberId);
    try {
      await conversationsAPI.removeMember(conversation.id, memberId);
      setMembers(prev => prev.filter(m => (m.user_id ?? m.id) !== memberId));
    } catch (err) {
      console.error('Failed to remove member', err);
      alert('Cannot remove member: ' + ((err as any)?.response?.data?.message || 'Error'));
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user?.id || !isGroup) return;
    if (!window.confirm('Leave this group?')) return;
    setRemovingMemberId(user.id);
    try {
      await conversationsAPI.removeMember(conversation.id, user.id);
      setMembers(prev => prev.filter(m => (m.user_id ?? m.id) !== user.id));
      setShowInfo(false);
    } catch (err) {
      console.error('Failed to leave group', err);
      alert('Cannot leave group: ' + ((err as any)?.response?.data?.message || 'Error'));
    } finally {
      setRemovingMemberId(null);
    }
  };

  const renderMessageContent = (msg: Message, isOwn: boolean) => {
    const toAbsolute = (url?: string | null) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `${API_URL}${url}`;
    };
    const textClass = isOwn ? 'text-tg-bubbleOutText' : 'text-tg-text';

    if (msg.message_type === 'image' && msg.attachment_url) {
      const absUrl = toAbsolute(msg.attachment_url);
      return (
        <div>
          {msg.content && <p className={`${textClass} whitespace-pre-line break-words text-sm mb-2`}>{msg.content}</p>}
          <button
            type="button"
            onClick={() => setImagePreview({ url: absUrl, name: msg.attachment_name || 'image' })}
            className="focus:outline-none block"
          >
            <img
              src={absUrl}
              alt={msg.attachment_name || 'image'}
              className="max-w-[280px] w-auto h-auto rounded-xl border border-tg-border/50"
            />
          </button>
        </div>
      );
    }

    if (msg.message_type === 'file' && msg.attachment_url) {
      const absUrl = toAbsolute(msg.attachment_url);
      const sizeKb = msg.attachment_size ? `${Math.round(msg.attachment_size / 1024)} KB` : '';
      // Extract filename from URL for download endpoint
      const filename = msg.attachment_url.split('/').pop() || '';
      const downloadUrl = `${API_URL}/messages/download/${filename}?name=${encodeURIComponent(msg.attachment_name || filename)}`;

      return (
        <div>
          {msg.content && <p className={`${textClass} whitespace-pre-line break-words text-sm mb-2`}>{msg.content}</p>}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isOwn ? 'bg-black/10' : 'bg-tg-panel2'}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isOwn ? 'bg-black/10' : 'bg-tg-accent/15'}`}>
              <svg className={`w-5 h-5 ${isOwn ? 'text-tg-bubbleOutText' : 'text-tg-accent'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium truncate max-w-[160px] ${textClass}`}>{msg.attachment_name || 'File'}</p>
              <p className={`text-xs ${isOwn ? 'opacity-60' : 'text-tg-muted'}`}>{sizeKb}</p>
            </div>
            <a
              href={downloadUrl}
              download={msg.attachment_name || filename}
              onClick={(e) => e.stopPropagation()}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                isOwn 
                  ? 'hover:bg-black/20 text-tg-bubbleOutText' 
                  : 'hover:bg-tg-accent/20 text-tg-accent'
              }`}
              title="Download file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          </div>
        </div>
      );
    }

    return <p className={`${textClass} whitespace-pre-line break-words text-sm`}>{msg.content}</p>;
  };

  return (
    <>
      <section className="flex-1 flex min-h-0 h-full">
        <div className="flex w-full h-full">
          <div className="flex-1 flex flex-col min-h-0 h-full">
            {/* Chat Header */}
            <div className="flex-shrink-0 bg-tg-panel border-b border-tg-border">
              <div className="px-4 py-3 flex items-center justify-between w-full">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="tg-avatar tg-avatar-md overflow-hidden">
                    {conversation.display_avatar ? (
                      <img
                        src={conversation.display_avatar.startsWith('http') ? conversation.display_avatar : `${API_URL}${conversation.display_avatar}`}
                        alt={conversation.display_name || conversation.name || 'Chat'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (conversation.display_name || conversation.name || 'C').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-tg-text truncate">{conversation.display_name || conversation.name || 'Conversation'}</h2>
                    <p className="text-xs text-tg-muted truncate flex items-center gap-1">
                      {typingUsers.length > 0 ? (
                        <span className="text-tg-accent flex items-center gap-1">
                          <span className="flex gap-0.5">
                            {[0, 150, 300].map((delay) => (
                              <span
                                key={delay}
                                className="w-1 h-1 bg-tg-accent rounded-full animate-bounce"
                                style={{ animationDelay: `${delay}ms` }}
                              />
                            ))}
                          </span>
                          Typing…
                        </span>
                      ) : isGroup ? (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {members.length} member{members.length !== 1 ? 's' : ''}
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 bg-tg-success rounded-full" />
                          Online
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={handleSearchToggle}
                    className={`tg-icon-btn ${showSearch ? 'text-tg-accent bg-tg-accent/10' : ''}`}
                    title="Search"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  {/* Only show info button for group chats */}
                  {isGroup && (
                    <button
                      onClick={() => setShowInfo(!showInfo)}
                      className={`tg-icon-btn ${showInfo ? 'text-tg-accent bg-tg-accent/10' : ''}`}
                      title="Conversation info"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Search Bar */}
              {showSearch && (
                <div className="px-4 pb-3 animate-fade-in-down">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search messages…"
                      className="tg-input py-2.5 pl-10 pr-10 text-sm"
                    />
                    <svg className="w-4 h-4 text-tg-muted absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => handleSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-tg-muted hover:text-tg-text transition-colors"
                        title="Clear"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-tg-muted flex items-center gap-2">
                    {searchLoading ? (
                      <>
                        <span className="tg-spinner w-3 h-3" />
                        <span>Searching…</span>
                      </>
                    ) : searchQuery ? (
                      <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</span>
                    ) : (
                      <span>Type to search in this chat</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 flex flex-col bg-tg-bg overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
                <div className="w-full space-y-2">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                      <div className="tg-spinner w-8 h-8" />
                      <p className="text-tg-muted text-sm">Loading messages…</p>
                    </div>
                  ) : showSearch && searchQuery ? (
                    searchResults.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 bg-tg-panel2 rounded-2xl flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-tg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <p className="text-tg-muted text-center text-sm">
                          No messages found for "{searchQuery}"
                        </p>
                      </div>
                    ) : (
                      <>
                        {searchResults.map((message) => {
                          const sender = message.sender || message.user;
                          const senderAvatarUrl = getAvatarUrl(sender?.avatar);

                          return (
                            <div
                              key={message.id}
                              onClick={() => {
                                setShowSearch(false);
                                setSearchQuery('');
                                setTimeout(() => scrollToMessage(message.id), 100);
                              }}
                              className="cursor-pointer hover:bg-tg-panel2 p-3 rounded-2xl transition border border-transparent hover:border-tg-border"
                            >
                              <div className="flex items-start gap-3">
                                <div className="tg-avatar tg-avatar-sm flex-shrink-0 overflow-hidden">
                                  {senderAvatarUrl ? (
                                    <img src={senderAvatarUrl} alt={sender?.username || 'User'} className="w-full h-full object-cover" />
                                  ) : (
                                    sender?.username?.charAt(0).toUpperCase() || 'U'
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2">
                                    <p className="font-medium text-tg-text text-sm truncate">
                                      {sender?.username || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-tg-muted flex-shrink-0">
                                      {formatTime(message.created_at)}
                                    </p>
                                  </div>
                                  <p className="text-sm text-tg-muted mt-1 break-words">
                                    {message.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-20 h-20 bg-tg-panel2 rounded-2xl flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-tg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-tg-muted text-center text-sm mb-1">No messages yet</p>
                      <p className="text-tg-muted/60 text-center text-xs">Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => {
                        const previousMessage = index > 0 ? messages[index - 1] : null;
                        const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
                        const messageSenderId = message.sender_id || message.user_id || message.user?.id;
                        const isOwnMessage = messageSenderId === user?.id;
                        const sender = message.sender || message.user;

                        return (
                          <React.Fragment key={message.id}>
                            {showDateSeparator && (
                              <div className="flex items-center justify-center my-4">
                                <div className="tg-chip text-xs text-tg-muted">
                                  {formatDate(message.created_at)}
                                </div>
                              </div>
                            )}

                            <div
                              id={`message-${message.id}`}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-fade-in`}
                            >
                              <div className={`flex items-end gap-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                                {!isOwnMessage && (
                                  <div className="tg-avatar tg-avatar-sm flex-shrink-0 self-end overflow-hidden">
                                    {sender?.avatar ? (
                                      <img
                                        src={getAvatarUrl(sender.avatar)}
                                        alt={sender.username || 'User'}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      sender?.username?.charAt(0).toUpperCase() || 'U'
                                    )}
                                  </div>
                                )}
                                <div>
                                  <div
                                    className={`tg-bubble ${
                                      isOwnMessage
                                        ? 'tg-bubble-out'
                                        : 'tg-bubble-in'
                                    }`}
                                  >
                                    {!isOwnMessage && (
                                      <p className="text-xs font-semibold mb-0.5 text-tg-accent">
                                        {sender?.username || 'Unknown'}
                                      </p>
                                    )}

                                    <div>
                                      {renderMessageContent(message, isOwnMessage)}
                                      <div className={`flex justify-end text-[10px] mt-1 ${isOwnMessage ? 'text-tg-bubbleOutText opacity-60' : 'text-tg-muted'}`}>
                                        {formatTime(message.created_at)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </>
                  )}

                  {typingUsers.length > 0 && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="flex items-end gap-2">
                        {typingUsers.slice(0, 3).map((id) => {
                          const member = (conversation.members || []).find(m => (m as any).user_id === id || (m as any).id === id);
                          const initial = member?.username?.charAt(0).toUpperCase() || '?';
                          const avatarUrl = getAvatarUrl(member?.avatar);
                          return (
                            <div key={id} className="tg-avatar tg-avatar-sm overflow-hidden">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={member?.username || 'User'} className="w-full h-full object-cover" />
                              ) : (
                                initial
                              )}
                            </div>
                          );
                        })}
                        <div className="tg-bubble tg-bubble-in flex items-center gap-1 px-4">
                          {[0, 150, 300].map((delay) => (
                            <div key={delay} className="w-2 h-2 bg-tg-accent rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input at bottom */}
              <div className="flex-shrink-0 px-4 pb-3 pt-2">
                <MessageInput conversationId={conversation.id} onMessageSent={onMessageSent} />
              </div>
            </div>
          </div>

          {/* Info Panel - Only for group chats */}
          {isGroup && (
            <aside
               className={`h-full bg-tg-panel border-l border-tg-border shadow-tg-lg transition-all duration-300 ease-out overflow-hidden flex-shrink-0 ${
                 showInfo ? 'w-80' : 'w-0'
               }`}
            >
              <div className="h-full w-80 overflow-y-auto animate-slide-in-right">
                {/* Panel Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-tg-border">
                  <h3 className="font-semibold text-tg-text">Group Info</h3>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="tg-icon-btn"
                    title="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Panel Content - Group Members */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="tg-section-title">Members</div>
                    <span className="tg-badge tg-badge-muted">{members.length}</span>
                  </div>

                  <div className="space-y-1">
                    {members.map((member: any, index: number) => {
                      const isAdmin = member.is_admin;
                      const memberId = member.user_id ?? member.id;
                      const isSelf = memberId === user?.id;
                      const memberAvatarUrl = getAvatarUrl(member.avatar);
                      return (
                        <div
                          key={member.id || memberId}
                          className={`tg-list-item ${isSelf ? 'tg-list-item-active' : ''}`}
                          style={{ animationDelay: `${index * 30}ms` }}
                          onClick={() => {
                            if (isSelf) {
                              console.log('Open own profile');
                            } else {
                              console.log('Open profile of', member.username);
                            }
                          }}
                        >
                          <div className="tg-avatar tg-avatar-md overflow-hidden">
                            {memberAvatarUrl ? (
                              <img src={memberAvatarUrl} alt={member.username} className="w-full h-full object-cover" />
                            ) : (
                              member.username?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-tg-text truncate">{member.username}</p>
                            <p className="text-xs text-tg-muted truncate">{member.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAdmin && (
                              <span className="tg-chip tg-chip-accent text-[10px] py-0.5 px-2">
                                Admin
                              </span>
                            )}
                            {currentUserIsAdmin && !isSelf && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMember(memberId);
                                }}
                                className="tg-btn-danger tg-btn-sm py-1 px-2 text-xs"
                                disabled={removingMemberId === memberId}
                                title="Remove member"
                              >
                                {removingMemberId === memberId ? 'Removing…' : 'Remove'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  {currentUserIsAdmin && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="tg-btn-primary w-full"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Add Members
                      </button>
                    </div>
                  )}
                  {!currentUserIsAdmin && (
                    <div className="mt-6">
                      <button
                        onClick={handleLeaveGroup}
                        className="tg-btn-danger w-full"
                        disabled={removingMemberId === user?.id}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {removingMemberId === user?.id ? 'Leaving…' : 'Leave group'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* Add Members Modal */}
      {showAddModal && (
        <div className="tg-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="tg-modal max-w-md animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tg-modal-header">
              <h3 className="font-semibold text-tg-text">Add Members</h3>
              <button onClick={() => setShowAddModal(false)} className="tg-icon-btn">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="tg-modal-body">
              <div className="max-h-64 overflow-y-auto rounded-xl border border-tg-border bg-tg-panel2/30">
                {availableUsers
                  .filter(u => !members.some((m: any) => (m.user_id ?? m.id) === u.id))
                  .map((u, index) => {
                    const isSelected = addUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        className={`tg-list-item mx-1 my-0.5 ${isSelected ? 'tg-list-item-active' : ''}`}
                        style={{ animationDelay: `${index * 30}ms` }}
                        onClick={() => {
                          setAddUserIds((prev) =>
                            prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                          );
                        }}
                      >
                        <div className={`tg-avatar tg-avatar-md ${isSelected ? 'ring-2 ring-tg-accent/50' : ''}`}>
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-tg-accent' : 'text-tg-text'}`}>{u.username}</p>
                          <p className="text-xs text-tg-muted truncate">{u.email}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <div className="w-6 h-6 bg-tg-accent rounded-full flex items-center justify-center animate-scale-in">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-tg-border rounded-full" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                {availableUsers.filter(u => !members.some((m: any) => (m.user_id ?? m.id) === u.id)).length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-sm text-tg-muted">No users available to add.</p>
                  </div>
                )}
              </div>
              {addUserIds.length > 0 && (
                <div className="mt-3 animate-fade-in">
                  <span className="tg-chip tg-chip-accent">
                    {addUserIds.length} user{addUserIds.length > 1 ? 's' : ''} selected
                  </span>
                </div>
              )}
            </div>
            <div className="tg-modal-footer">
              <button
                onClick={() => {
                  setAddUserIds([]);
                  setShowAddModal(false);
                }}
                className="tg-btn-secondary tg-btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (addUserIds.length === 0) return;
                  setMemberActionLoading(true);
                  try {
                    await conversationsAPI.addMembers(conversation.id, addUserIds);
                    const newMembers = addUserIds
                      .filter(id => !members.some((m: any) => (m.user_id ?? m.id) === id))
                      .map(id => {
                        const userInfo = availableUsers.find(u => u.id === id);
                        return {
                          user_id: id,
                          id,
                          username: userInfo?.username,
                          email: userInfo?.email,
                          avatar: userInfo?.avatar,
                        };
                      });
                    setMembers((prev) => [...prev, ...newMembers]);
                    setAddUserIds([]);
                    setShowAddModal(false);
                  } catch (err) {
                    console.error('Failed to add members', err);
                    alert('Cannot add members: ' + ((err as any)?.response?.data?.message || 'Error'));
                  } finally {
                    setMemberActionLoading(false);
                  }
                }}
                className="tg-btn-primary tg-btn-sm min-w-[100px]"
                disabled={memberActionLoading || addUserIds.length === 0}
              >
                {memberActionLoading ? (
                  <>
                    <span className="tg-spinner w-4 h-4" />
                    <span>Adding...</span>
                  </>
                ) : (
                  'Add Selected'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div
          className="tg-modal-overlay"
          onClick={() => setImagePreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute -top-3 -right-3 w-10 h-10 bg-tg-panel border border-tg-border rounded-full flex items-center justify-center text-tg-text hover:bg-tg-panel2 shadow-tg transition-colors z-10"
              onClick={() => setImagePreview(null)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={imagePreview.url}
              alt={imagePreview.name}
              className="max-h-[85vh] max-w-full rounded-2xl shadow-tg-lg"
            />
            {imagePreview.name && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-2xl">
                <p className="text-center text-white text-sm truncate">{imagePreview.name}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatArea;
