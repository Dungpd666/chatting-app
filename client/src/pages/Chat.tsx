import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { Conversation } from '../types';
import { socketService } from '../services/socket';

const Chat: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const sidebarRef = useRef<any>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMessageSent = useCallback((conversationId: number) => {
    // Reload conversations to update order
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      if (sidebarRef.current?.loadConversations) {
        sidebarRef.current.loadConversations();
      }
    }, 150);
  }, []);

  // Set up global message listener to update sidebar for all messages
  useEffect(() => {
    const handleGlobalMessage = (message: any) => {
      // Delay sidebar update to allow markAsRead to complete first
      setTimeout(() => {
        handleMessageSent(message.conversation_id);
      }, 250);
    };

    socketService.onNewMessage(handleGlobalMessage);

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      socketService.offNewMessage(handleGlobalMessage);
    };
  }, [handleMessageSent]);

  return (
    <div className="tg-app flex h-screen min-h-0">
      <Sidebar
        ref={sidebarRef}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
      />
      <div className="flex-1 min-h-0 flex bg-tg-bg">
        {selectedConversation ? (
          <ChatArea
            conversation={selectedConversation}
            onMessageSent={handleMessageSent}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center animate-fade-in-up">
              {/* Animated icon */}
              <div className="relative w-28 h-28 mx-auto mb-6">
                <div className="absolute inset-0 bg-tg-accent/20 rounded-3xl animate-pulse" />
                <div className="relative w-full h-full bg-tg-panel2 border border-tg-border rounded-3xl flex items-center justify-center shadow-tg">
                  <svg className="w-14 h-14 text-tg-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-tg-text mb-3">Welcome to Chat</h2>
              <p className="text-tg-muted mb-6 max-w-sm mx-auto">
                Select a conversation from the sidebar or create a new one to start messaging
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-tg-muted/60">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Press <kbd className="px-1.5 py-0.5 bg-tg-panel2 border border-tg-border rounded text-xs font-mono">+</kbd> to create a new chat</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
