import React, { useState, useRef, useEffect } from 'react';
import { socketService } from '../services/socket';

interface MessageInputProps {
  conversationId: number;
  onTyping?: (isTyping: boolean) => void;
  onMessageSent?: (conversationId: number) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ conversationId, onTyping, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Handle typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      socketService.sendTyping(conversationId, true);
      onTyping?.(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    if (e.target.value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketService.sendTyping(conversationId, false);
        onTyping?.(false);
      }, 1000);
    } else {
      setIsTyping(false);
      socketService.sendTyping(conversationId, false);
      onTyping?.(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim()) {
      socketService.sendMessage(conversationId, message.trim());
      setMessage('');
      setIsTyping(false);
      socketService.sendTyping(conversationId, false);
      onTyping?.(false);
      onMessageSent?.(conversationId);

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
      <div className="flex items-end space-x-3">
        <button
          type="button"
          className="p-2 text-gray-500 hover:text-gray-700 transition flex-shrink-0"
          title="Attach file"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
          <textarea
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full bg-transparent resize-none outline-none max-h-32"
            rows={1}
            style={{
              minHeight: '24px',
              height: 'auto',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!message.trim()}
          className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Send message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
