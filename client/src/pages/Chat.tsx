import React, { useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import { Conversation } from '../types';

const Chat: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const sidebarRef = useRef<any>(null);

  const handleMessageSent = (conversationId: number) => {
    // Reload conversations to update order
    if (sidebarRef.current?.loadConversations) {
      sidebarRef.current.loadConversations();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        ref={sidebarRef}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
      />
      {selectedConversation ? (
        <ChatArea
          conversation={selectedConversation}
          onMessageSent={handleMessageSent}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to Chat</h2>
            <p className="text-gray-600">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
