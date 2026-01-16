import React, { useEffect, useMemo, useRef, useState } from 'react';
import { socketService } from '../services/socket';
import { messagesAPI, API_URL } from '../services/api';

interface MessageInputProps {
  conversationId: number;
  onTyping?: (isTyping: boolean) => void;
  onMessageSent?: (conversationId: number) => void;
}

type PendingAttachment = {
  url: string;
  name: string;
  type: string;
  size: number;
  message_type?: 'image' | 'file';
};

const MAX_ROWS = 5;
const LINE_HEIGHT_PX = 22;

const MessageInput: React.FC<MessageInputProps> = ({ conversationId, onTyping, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSendDisabled = useMemo(() => uploading || (!message.trim() && !pendingAttachment), [uploading, message, pendingAttachment]);

  const stopTyping = () => {
    if (!isTyping) return;
    setIsTyping(false);
    socketService.sendTyping(conversationId, false);
    onTyping?.(false);
  };

  const bumpTyping = (nextValue: string) => {
    const hasText = nextValue.trim().length > 0;

    if (!isTyping && hasText) {
      setIsTyping(true);
      socketService.sendTyping(conversationId, true);
      onTyping?.(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (hasText) {
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2500);
    } else {
      stopTyping();
    }
  };

  const autosize = () => {
    const el = textareaRef.current;
    if (!el) return;

    // Reset height to natural size before measuring to avoid jitter
    el.style.height = 'auto';

    const maxHeight = MAX_ROWS * LINE_HEIGHT_PX;
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${Math.max(nextHeight, LINE_HEIGHT_PX)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  const normalizeUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setMessage(next);
    bumpTyping(next);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);

    try {
      const uploaded = await messagesAPI.upload(file);
      setPendingAttachment({
        url: uploaded.url,
        name: uploaded.name,
        type: uploaded.type,
        size: uploaded.size,
        message_type: uploaded.message_type,
      });
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || 'Upload failed');
      setPendingAttachment(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearAttachment = () => setPendingAttachment(null);

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();

    if (!message.trim() && !pendingAttachment) return;

    socketService.sendMessage(conversationId, message.trim() || undefined, pendingAttachment || undefined);

    setMessage('');
    setPendingAttachment(null);
    setUploadError(null);
    stopTyping();
    onMessageSent?.(conversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Ensure textarea returns to a stable 1-line height after sending
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.overflowY = 'hidden';
        textareaRef.current.value = '';
        autosize();
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSendDisabled) handleSubmit(e);
    }
  };

  useEffect(() => {
    autosize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const attachmentChip = useMemo(() => {
    if (!pendingAttachment) return null;

    const absUrl = normalizeUrl(pendingAttachment.url);
    const isImage = (pendingAttachment.message_type || '').toLowerCase() === 'image' || pendingAttachment.type?.startsWith('image/');

    return (
      <div className="mb-3 animate-fade-in-up">
        <div className="inline-flex items-center gap-3 max-w-full rounded-xl border border-tg-accent/20 bg-tg-accent/10 backdrop-blur px-3 py-2.5 shadow-sm">
          {isImage ? (
            <img
              src={absUrl}
              alt={pendingAttachment.name}
              className="w-10 h-10 rounded-lg object-cover border border-tg-border bg-tg-panel"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg border border-tg-border bg-tg-panel2 flex items-center justify-center text-tg-accent">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-tg-text truncate max-w-[200px] sm:max-w-[300px]">
              {pendingAttachment.name}
            </div>
            <div className="text-xs text-tg-muted">
              {(pendingAttachment.size / 1024).toFixed(1)} KB
            </div>
          </div>

          <button
            type="button"
            className="p-1.5 rounded-lg text-tg-muted hover:text-tg-danger hover:bg-tg-danger/10 transition-all duration-150"
            onClick={clearAttachment}
            title="Remove attachment"
            disabled={uploading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }, [pendingAttachment, uploading]);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative"
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,application/pdf,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />

      {attachmentChip}

      {uploadError && (
        <div className="mb-3 text-sm text-tg-danger bg-tg-danger/10 border border-tg-danger/20 rounded-xl px-4 py-3 flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{uploadError}</span>
        </div>
      )}

      {/* Main input container */}
      <div className="tg-glass rounded-2xl p-1">
        <div className="flex items-end gap-2">
          {/* Attach button */}
          <button
            type="button"
            className="tg-icon-btn flex-shrink-0 mb-0.5"
            title="Attach file"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Text input */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="w-full bg-transparent resize-none outline-none text-tg-text placeholder:text-tg-muted text-sm leading-[22px] px-2 py-2.5"
              rows={1}
              style={{ overflowY: 'hidden', minHeight: `${LINE_HEIGHT_PX}px` }}
              disabled={uploading}
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={isSendDisabled}
            className={`
              p-2.5 rounded-xl flex-shrink-0 mb-0.5
              transition-all duration-200 ease-out
              ${isSendDisabled 
                ? 'bg-tg-panel2 text-tg-muted cursor-not-allowed' 
                : 'bg-tg-accent text-white hover:bg-tg-accentHover hover:shadow-tg-glow active:scale-95'
              }
            `}
            title="Send message"
          >
            {uploading ? (
              <span className="tg-spinner w-5 h-5" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {/* Helper text */}
        <div className="px-3 pb-2 pt-0.5 text-[11px] text-tg-muted/70 flex items-center gap-1.5">
          <span>Enter to send</span>
          <span>•</span>
          <span>Shift+Enter for new line</span>
          {uploading && (
            <span className="ml-auto text-tg-accent animate-pulse">Uploading…</span>
          )}
        </div>
      </div>
    </form>
  );
};

export default MessageInput;
