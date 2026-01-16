import React, { useEffect, useState, useMemo, useImperativeHandle, forwardRef, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Conversation } from '../types';
import { conversationsAPI, API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import NewConversationModal from './NewConversationModal';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

const Sidebar = forwardRef<any, SidebarProps>(({ selectedConversation, onSelectConversation }, ref) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const requestIdRef = useRef(0);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const lastLoadRef = useRef(0);
  const MIN_INTERVAL_MS = 500;
  const didInitRef = useRef(false);
  const selectionInFlightRef = useRef<Promise<void> | null>(null);

  // Sort conversations by last_message_at (most recent first)
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [conversations]);

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return sortedConversations;
    const query = searchQuery.toLowerCase();
    return sortedConversations.filter(c =>
      (c.display_name || c.name || '').toLowerCase().includes(query) ||
      (c.last_message?.content || c.lastMessage?.content || '').toLowerCase().includes(query)
    );
  }, [sortedConversations, searchQuery]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    loadConversations(true);
  }, []);

  const loadConversations = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastLoadRef.current < MIN_INTERVAL_MS) {
      return inFlightRef.current || Promise.resolve();
    }
    if (inFlightRef.current) return inFlightRef.current;

    const requestId = ++requestIdRef.current;
    const promise = (async () => {
      try {
        const data = await conversationsAPI.getAll();
        if (requestId !== requestIdRef.current) return; // ignore stale responses
        setConversations(data);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          lastLoadRef.current = Date.now();
        }
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = promise;
    return promise;
  };

  // Expose loadConversations method to parent
  useImperativeHandle(ref, () => ({
    loadConversations,
  }));

  useEffect(() => {
    if (!selectedConversation) return;
    const refreshed = conversations.find(c => c.id === selectedConversation.id);
    if (refreshed && refreshed !== selectedConversation) {
      onSelectConversation(refreshed);
    }
  }, [conversations, selectedConversation, onSelectConversation]);

  const handleConversationCreated = (conversation: Conversation) => {
    setConversations(prev => [conversation, ...prev]);
    onSelectConversation(conversation);
  };

  const formatTime = (date: Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getAvatarUrl = (avatar?: string | null): string | undefined => {
    if (!avatar) return undefined;
    if (avatar.startsWith('http')) return avatar;
    return `${API_URL}${avatar}`;
  };

  const getOtherUser = (conversation: Conversation) => {
    if (conversation.type !== 'direct' && conversation.type !== 'private') return null;
    return conversation.otherUser ||
      conversation.members?.find(m => (m.user_id ?? m.id) !== user?.id) ||
      conversation.participants?.find(p => p.id !== user?.id);
  };

  const getConversationName = (conversation: Conversation) => {
    // Use display_name from API if available (calculated on server)
    if (conversation.display_name) {
      return conversation.display_name;
    }
    // Fallback: For direct chat, show the other user's name
    if (conversation.type === 'direct' || conversation.type === 'private') {
      const otherUser = getOtherUser(conversation);
      if (otherUser?.username) {
        return otherUser.username;
      }
    }
    // For group chat, use the conversation name
    return conversation.name || 'Unnamed Chat';
  };

  const getConversationAvatar = (conversation: Conversation): string | undefined => {
    // Use display_avatar from API if available (calculated on server)
    if (conversation.display_avatar) {
      return getAvatarUrl(conversation.display_avatar);
    }
    // Fallback: For direct chat, get the other user's avatar
    if (conversation.type === 'direct' || conversation.type === 'private') {
      const otherUser = getOtherUser(conversation);
      return otherUser?.avatar ? getAvatarUrl(otherUser.avatar) : undefined;
    }
    // For group chat, no avatar image (use initial letter)
    return undefined;
  };

  const getAvatarInitial = (conversation: Conversation) => {
    const name = getConversationName(conversation);
    return name.charAt(0).toUpperCase();
  };


  const selectConversation = async (conversation: Conversation) => {
    if (selectionInFlightRef.current) return selectionInFlightRef.current;
    const promise = (async () => {
      try {
        const detailed = await conversationsAPI.getOne(conversation.id);
        onSelectConversation(detailed);
      } catch (err) {
        console.error('Failed to fetch conversation detail, using cached item', err);
        onSelectConversation(conversation);
      } finally {
        selectionInFlightRef.current = null;
      }
    })();
    selectionInFlightRef.current = promise;
    return promise;
  };


  return (
    <aside className="w-[320px] max-w-[92vw] bg-tg-panel border-r border-tg-border flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-tg-border">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/profile')}
          >
            <div className="tg-avatar tg-avatar-md bg-gradient-to-br from-tg-accent to-tg-bubbleOut text-white group-hover:shadow-tg-glow transition-shadow duration-200 overflow-hidden">
              {user?.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.username?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-tg-text truncate group-hover:text-tg-accent transition-colors">
                {user?.username || 'User'}
              </h2>
              <p className="text-xs text-tg-success flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-tg-success rounded-full animate-pulse" />
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => navigate('/profile')}
              className="tg-icon-btn"
              title="Profile Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={logout}
              className="tg-icon-btn hover:text-tg-danger"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search and New Conversation */}
      <div className="flex-shrink-0 p-3 border-b border-tg-border">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="tg-input py-2.5 pl-10 pr-4 text-sm"
            />
            <svg
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-tg-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tg-muted hover:text-tg-text transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="tg-btn-primary p-2.5 rounded-xl"
            title="New Conversation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="tg-spinner w-8 h-8" />
            <p className="text-tg-muted text-sm">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="w-16 h-16 bg-tg-panel2 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-tg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-tg-muted text-center text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 text-tg-accent hover:text-tg-accentHover text-sm font-medium transition-colors"
              >
                Start a new chat
              </button>
            )}
          </div>
        ) : (
          <div className="py-1">
            {filteredConversations.map((conversation, index) => {
              const isSelected = selectedConversation?.id === conversation.id;
              const unreadCount = conversation.unread_count || conversation.unreadCount || 0;

              return (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation)}
                  className={`
                    flex items-center gap-3 px-3 py-3 mx-2 rounded-xl cursor-pointer
                    transition-all duration-150 group
                    ${isSelected 
                      ? 'bg-tg-accent/15 border border-tg-accent/25' 
                      : 'border border-transparent hover:bg-tg-panel2'
                    }
                    ${index === 0 ? 'mt-1' : ''}
                  `}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Avatar */}
                  <div className={`
                    tg-avatar tg-avatar-lg flex-shrink-0 overflow-hidden
                    ${isSelected ? 'ring-2 ring-tg-accent/50' : ''}
                  `}>
                    {getConversationAvatar(conversation) ? (
                      <img
                        src={getConversationAvatar(conversation)}
                        alt={getConversationName(conversation)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getAvatarInitial(conversation)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h3 className={`font-semibold truncate text-sm ${isSelected ? 'text-tg-accent' : 'text-tg-text'}`}>
                        {getConversationName(conversation)}
                      </h3>
                      <span className="text-xs text-tg-muted flex-shrink-0">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-tg-muted truncate">
                        {conversation.last_message?.content || conversation.lastMessage?.content || 'No messages yet'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="tg-badge tg-badge-primary flex-shrink-0 animate-scale-in">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConversationCreated={handleConversationCreated}
      />
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
