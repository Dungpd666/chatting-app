import React, { useState, useRef, useEffect } from 'react';
import { socketService } from '../services/socket';
import { messagesAPI } from '../services/api';

interface MessageInputProps {
  conversationId: number;
  onTyping?: (isTyping: boolean) => void;
  onMessageSent?: (conversationId: number) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ conversationId, onTyping, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; name: string; type: string; size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
      }, 2500);
    } else {
      setIsTyping(false);
      socketService.sendTyping(conversationId, false);
      onTyping?.(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const uploaded = await messagesAPI.upload(file);
      setPendingAttachment({ url: uploaded.url, name: uploaded.name, type: uploaded.type, size: uploaded.size });
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || 'Upload failed');
      setPendingAttachment(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearAttachment = () => setPendingAttachment(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() && !pendingAttachment) {
      return;
    }

    socketService.sendMessage(conversationId, message.trim() || undefined, pendingAttachment || undefined);

    setMessage('');
    setPendingAttachment(null);
    setIsTyping(false);
    socketService.sendTyping(conversationId, false);
    onTyping?.(false);
    onMessageSent?.(conversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
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
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
      <div className="flex items-end space-x-3">
        <button
          type="button"
          className="p-2 text-gray-500 hover:text-gray-700 transition flex-shrink-0"
          title="Attach file"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
          {pendingAttachment && (
            <div className="flex items-center justify-between text-sm text-gray-700 mb-1">
              <span className="truncate">{pendingAttachment.name}</span>
              <button type="button" className="text-red-500 text-xs" onClick={clearAttachment}>Remove</button>
            </div>
          )}
          {uploadError && (
            <div className="text-xs text-red-500 mb-1">{uploadError}</div>
          )}
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
            disabled={uploading}
          />
        </div>

        <button
          type="submit"
          disabled={(!message.trim() && !pendingAttachment) || uploading}
          className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Send message"
        >
          {uploading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
