'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/app/reference/supabase.types';
import { useRealtimeSubscription } from '@/hooks/realtime';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type Message = Database['public']['Tables']['messages']['Row'];
type PublicUserProfile =
  Database['public']['Views']['public_user_profiles']['Row'];

interface MessageWithSender extends Message {
  sender: PublicUserProfile | null;
}

interface GuestMessagingProps {
  eventId: string;
  currentUserId: string | null;
}

function GuestMessaging({ eventId, currentUserId }: GuestMessagingProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimeRef = useRef<number>(0);
  const messageCountRef = useRef<number>(0);

  const fetchMessages = useCallback(async () => {
    try {
      // First, try to fetch messages without the join to avoid RLS issues
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('❌ Error fetching messages:', messagesError);
        setMessages([]);
        setLoading(false);
        return;
      }

      // Then try to fetch sender info for each unique sender
      const uniqueSenderIds = Array.from(
        new Set(
          messagesData
            ?.map((m) => m.sender_user_id)
            .filter((id): id is string => Boolean(id)) || [],
        ),
      );

      const sendersMap = new Map<string, PublicUserProfile>();

      // Fetch sender profiles separately to handle RLS gracefully
      for (const senderId of uniqueSenderIds) {
        try {
          const { data: senderData, error: senderError } = await supabase
            .from('public_user_profiles')
            .select('*')
            .eq('id', senderId)
            .single();

          if (!senderError && senderData) {
            sendersMap.set(senderId, senderData);
          }
        } catch {
          // Silently handle individual sender fetch failures
        }
      }

      // Combine messages with sender info
      const messagesWithSenders: MessageWithSender[] = (messagesData || []).map(
        (message) => ({
          ...message,
          sender: message.sender_user_id
            ? sendersMap.get(message.sender_user_id) || null
            : null,
        }),
      );

      setMessages(messagesWithSenders);
    } catch (err) {
      console.error('❌ Unexpected error fetching messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Handle real-time message updates
  const handleMessageChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Message>) => {
      console.log('📨 Real-time message update:', payload);

      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new;
        
        // Fetch sender info for the new message
        if (newMessage.sender_user_id) {
          supabase
            .from('public_user_profiles')
            .select('*')
            .eq('id', newMessage.sender_user_id)
            .single()
            .then(({ data: senderData }) => {
            const messageWithSender: MessageWithSender = {
              ...newMessage,
              sender: senderData || null,
            };

            setMessages((prev) => {
              // Avoid duplicates
              const exists = prev.some((m) => m.id === newMessage.id);
              if (exists) return prev;
              return [...prev, messageWithSender];
            });

            // Scroll to bottom
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          });
        }
      } else if (payload.eventType === 'UPDATE') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === payload.new.id ? { ...msg, ...payload.new } : msg,
          ),
        );
      } else if (payload.eventType === 'DELETE') {
        setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
      }
    },
    [],
  );

  // Real-time subscription for messages
  const { isConnected } = useRealtimeSubscription({
    subscriptionId: `messages-${eventId}`,
    table: 'messages',
    event: '*',
    filter: `event_id=eq.${eventId}`,
    enabled: !!eventId,
    onDataChange: handleMessageChange,
    onError: (error) => {
      console.error('❌ Message subscription error:', error);
    },
    onStatusChange: (status) => {
      console.log(`📡 Message subscription status: ${status}`);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Message validation
  const validateMessage = useCallback((content: string): { isValid: boolean; error?: string } => {
    const trimmedContent = content.trim();
    
    if (!trimmedContent) {
      return { isValid: false, error: 'Message cannot be empty' };
    }
    
    if (trimmedContent.length > 500) {
      return { isValid: false, error: 'Message too long (max 500 characters)' };
    }
    
    // Check for spam patterns
    const spamPatterns = [
      /(.)\1{10,}/i, // Repeated characters
      /[A-Z]{20,}/, // Too many caps
      /(https?:\/\/[^\s]+)/gi, // URLs (optional restriction)
    ];
    
    for (const pattern of spamPatterns) {
      if (pattern.test(trimmedContent)) {
        return { isValid: false, error: 'Message appears to be spam' };
      }
    }
    
    return { isValid: true };
  }, []);

  // Rate limiting
  const checkRateLimit = useCallback((): { canSend: boolean; error?: string } => {
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTimeRef.current;
    
    // Minimum 2 seconds between messages
    if (timeSinceLastMessage < 2000) {
      return { 
        canSend: false, 
        error: `Please wait ${Math.ceil((2000 - timeSinceLastMessage) / 1000)} seconds before sending another message` 
      };
    }
    
    // Reset counter every minute
    if (timeSinceLastMessage > 60000) {
      messageCountRef.current = 0;
    }
    
    // Max 10 messages per minute
    if (messageCountRef.current >= 10) {
      return { 
        canSend: false, 
        error: 'Too many messages. Please wait a minute before sending more.' 
      };
    }
    
    return { canSend: true };
  }, []);

  // Typing indicator logic
  const handleTyping = useCallback(() => {
    if (!currentUserId || !eventId) return;

    setIsTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  }, [currentUserId, eventId]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !currentUserId || sending) return;

    // Validate message content
    const messageValidation = validateMessage(newMessage);
    if (!messageValidation.isValid) {
      alert(messageValidation.error);
      return;
    }

    // Check rate limiting
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.canSend) {
      alert(rateLimitCheck.error);
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        event_id: eventId,
        sender_user_id: currentUserId,
        content: newMessage.trim(),
        message_type: 'channel',
      });

      if (error) {
        console.error('❌ Error sending message:', error);
        alert('Failed to send message. Please try again.');
        return;
      }

      // Update rate limiting counters
      lastMessageTimeRef.current = Date.now();
      messageCountRef.current += 1;

      setNewMessage('');
      setIsTyping(false);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Real-time subscription will handle adding the message to the list
    } catch (err) {
      console.error('❌ Unexpected error sending message:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }, [newMessage, currentUserId, sending, eventId, validateMessage, checkRateLimit]);

  const formatMessageTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  }, []);

  const getMessageTypeStyle = useCallback(
    (type: string, isOwnMessage: boolean) => {
      if (type === 'announcement') {
        return 'bg-purple-50 border border-purple-200 text-purple-900';
      }

      if (isOwnMessage) {
        return 'bg-stone-800 text-white ml-auto';
      }

      return 'bg-stone-100 text-stone-900';
    },
    [],
  );

  if (loading) {
    return (
      <div className="bg-app rounded-xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-medium text-stone-800 mb-4">Broadcasts</h2>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin mr-3"></div>
          <span className="text-stone-600">Loading broadcasts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-app rounded-xl shadow-sm border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-stone-800">Broadcasts</h2>
        
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-stone-500">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto scroll-smooth">
        {messages.length > 0 ? (
          messages.map((message) => {
            const isOwnMessage = message.sender_user_id === currentUserId;
            const isAnnouncement = message.message_type === 'announcement';

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage && !isAnnouncement ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${getMessageTypeStyle(message.message_type || 'direct', isOwnMessage)}`}
                >
                  {!isOwnMessage && (
                    <div className="flex items-center mb-1">
                      <span className="text-xs font-medium text-stone-600">
                        {message.sender?.full_name || 'Someone'}
                      </span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${isOwnMessage ? 'text-stone-300' : 'text-stone-500'}`}
                  >
                    {message.created_at
                      ? formatMessageTime(message.created_at)
                      : 'Unknown time'}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-stone-600 mb-1">
              No broadcasts yet—but they&apos;ll arrive soon.
            </p>
            <p className="text-stone-500 text-sm">
              Hosts will share updates here.
            </p>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="space-y-2">
        {/* Typing indicator placeholder for future enhancement */}
        {isTyping && (
          <div className="text-xs text-stone-500 px-2">
            Typing...
          </div>
        )}
        
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Share a message with everyone..."
            className="flex-1 px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all text-base" // text-base prevents zoom on iOS
            disabled={sending || !currentUserId}
            maxLength={500}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending || !currentUserId}
            className="px-4 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-sm">Send</span>
            )}
          </button>
        </div>
        
        {/* Character count */}
        {newMessage.length > 400 && (
          <div className="text-xs text-stone-500 text-right px-2">
            {500 - newMessage.length} characters remaining
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(GuestMessaging);
