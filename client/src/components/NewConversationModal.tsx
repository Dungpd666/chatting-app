import React, { useState, useEffect } from 'react';
import { usersAPI, conversationsAPI } from '../services/api';
import { User, Conversation } from '../types';
import { useAuth } from '../context/AuthContext';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [conversationName, setConversationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user: currentUser } = useAuth();

  const loadUsers = async () => {
    try {
      const data = await usersAPI.getAll();
      // Filter out current user
      const filteredUsers = data.filter(u => u.id !== currentUser?.id);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleUserToggle = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    setLoading(true);

    try {
      const type = selectedUsers.length === 1 ? 'private' : 'group';

      // Generate conversation name
      let name = conversationName;
      if (!name && type === 'private') {
        const selectedUser = users.find(u => u.id === selectedUsers[0]);
        name = selectedUser?.username || 'Chat';
      } else if (!name && type === 'group') {
        name = 'Group Chat';
      }

      const conversation = await conversationsAPI.create({
        type,
        name,
        user_ids: selectedUsers,
      });

      onConversationCreated(conversation);
      handleClose();
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      alert(error.response?.data?.message || 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setConversationName('');
    setSearchQuery('');
    onClose();
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
      <div className="tg-modal-overlay" onClick={handleClose}>
      <div
        className="tg-modal max-w-lg animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="tg-modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-tg-accent/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-tg-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-tg-text">New Conversation</h2>
              <p className="text-xs text-tg-muted">Select users to start chatting</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="tg-icon-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="tg-modal-body space-y-4">
            {/* Conversation Name (Optional for groups) */}
            {selectedUsers.length > 1 && (
              <div className="tg-form-group animate-fade-in">
                <label className="tg-label">
                  Group Name (Optional)
                </label>
                <input
                  type="text"
                  value={conversationName}
                  onChange={(e) => setConversationName(e.target.value)}
                  className="tg-input"
                  placeholder="Enter group name..."
                />
              </div>
            )}

            {/* Search Users */}
            <div className="tg-form-group">
              <label className="tg-label">
                Search Users
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tg-input pl-10"
                  placeholder="Search by name or email..."
                />
                <svg
                  className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-tg-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Selected Users Count */}
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="tg-chip tg-chip-accent">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </span>
                {selectedUsers.length > 1 && (
                  <span className="text-xs text-tg-muted">• Group chat</span>
                )}
              </div>
            )}

            {/* Users List */}
            <div className="max-h-64 overflow-y-auto rounded-xl border border-tg-border bg-tg-panel2/30">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-tg-panel2 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-tg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-tg-muted text-sm">No users found</p>
                </div>
              ) : (
                <div className="p-1">
                  {filteredUsers.map((user, index) => {
                    const isSelected = selectedUsers.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleUserToggle(user.id)}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl cursor-pointer
                          transition-all duration-150 mx-1 my-0.5
                          ${isSelected 
                            ? 'bg-tg-accent/15 border border-tg-accent/25' 
                            : 'border border-transparent hover:bg-tg-panel2'
                          }
                        `}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className={`
                          tg-avatar tg-avatar-md bg-gradient-to-br from-tg-accent to-tg-bubbleOut text-white
                          ${isSelected ? 'ring-2 ring-tg-accent/50' : ''}
                        `}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium text-sm truncate ${isSelected ? 'text-tg-accent' : 'text-tg-text'}`}>
                            {user.username}
                          </h3>
                          <p className="text-xs text-tg-muted truncate">{user.email}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <div className="w-6 h-6 bg-tg-accent rounded-full flex items-center justify-center animate-scale-in">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-tg-border rounded-full transition-colors group-hover:border-tg-muted" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="tg-modal-footer">
            <button
              type="button"
              onClick={handleClose}
              className="tg-btn-secondary tg-btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedUsers.length === 0}
              className="tg-btn-primary tg-btn-sm min-w-[100px]"
            >
              {loading ? (
                <>
                  <span className="tg-spinner w-4 h-4" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConversationModal;
