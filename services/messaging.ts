import { supabase } from '@/lib/supabase/client'
import type { 
  MessageInsert, 
  MessageUpdate, 
  MessageType, 
  MessageWithSender
} from '@/lib/supabase/types'
import { logDatabaseError } from '@/lib/logger'

// Message constraints
const MAX_MESSAGE_LENGTH = 2000
const MIN_MESSAGE_LENGTH = 1

// Error handling for database constraints
const handleDatabaseError = (error: unknown, context: string) => {
  logDatabaseError(`Database error in ${context}`, error, context)
  
  const dbError = error as { code?: string; message?: string }
  
  if (dbError.code === '23505') {
    throw new Error('Duplicate message detected')
  }
  
  if (dbError.code === '23503') {
    if (dbError.message?.includes('event_id')) {
      throw new Error('Invalid event ID')
    }
    if (dbError.message?.includes('sender_user_id')) {
      throw new Error('Invalid sender user ID')
    }
    throw new Error('Invalid reference in database')
  }
  
  if (dbError.code === '23514') {
    throw new Error('Invalid message type - must be direct or announcement')
  }
  
  throw new Error(dbError.message || 'Database operation failed')
}

// Message validation
export const validateMessage = (content: string): { isValid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' }
  }
  
  if (content.length < MIN_MESSAGE_LENGTH) {
    return { isValid: false, error: `Message must be at least ${MIN_MESSAGE_LENGTH} character long` }
  }
  
  if (content.length > MAX_MESSAGE_LENGTH) {
    return { 
      isValid: false, 
      error: `Message must be less than ${MAX_MESSAGE_LENGTH} characters. Current length: ${content.length}` 
    }
  }
  
  return { isValid: true }
}

// Messaging service functions
export const getEventMessages = async (eventId: string) => {
  try {
    return await supabase
      .from('messages')
      .select(`
        *,
        sender:public_user_profiles!messages_sender_user_id_fkey(*)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
  } catch (error) {
    handleDatabaseError(error, 'getEventMessages')
  }
}

export const sendMessage = async (messageData: MessageInsert) => {
  try {
    // Validate message content
    if (messageData.content) {
      const validation = validateMessage(messageData.content)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }
    
    return await supabase
      .from('messages')
      .insert(messageData)
      .select(`
        *,
        sender:public_user_profiles!messages_sender_user_id_fkey(*)
      `)
      .single()
  } catch (error) {
    handleDatabaseError(error, 'sendMessage')
  }
}

export const deleteMessage = async (id: string) => {
  try {
    return await supabase
      .from('messages')
      .delete()
      .eq('id', id)
  } catch (error) {
    handleDatabaseError(error, 'deleteMessage')
  }
}

export const getMessagesByType = async (eventId: string, messageType: MessageType) => {
  try {
    return await supabase
      .from('messages')
      .select(`
        *,
        sender:public_user_profiles!messages_sender_user_id_fkey(*)
      `)
      .eq('event_id', eventId)
      .eq('message_type', messageType)
      .order('created_at', { ascending: true })
  } catch (error) {
    handleDatabaseError(error, 'getMessagesByType')
  }
}

export const updateMessage = async (id: string, updates: MessageUpdate) => {
  try {
    // Validate message content if being updated
    if (updates.content) {
      const validation = validateMessage(updates.content)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }
    
    return await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        sender:public_user_profiles!messages_sender_user_id_fkey(*)
      `)
      .single()
  } catch (error) {
    handleDatabaseError(error, 'updateMessage')
  }
}

export const getMessageById = async (id: string) => {
  try {
    return await supabase
      .from('messages')
      .select(`
        *,
        sender:public_user_profiles!messages_sender_user_id_fkey(*)
      `)
      .eq('id', id)
      .single()
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
      throw new Error('Message not found')
    }
    handleDatabaseError(error, 'getMessageById')
  }
}

export const getMessagesBySender = async (eventId: string, senderId: string) => {
  try {
    return await supabase
      .from('messages')
      .select(`
        *,
        sender:public_user_profiles!messages_sender_user_id_fkey(*)
      `)
      .eq('event_id', eventId)
      .eq('sender_user_id', senderId)
      .order('created_at', { ascending: true })
  } catch (error) {
    handleDatabaseError(error, 'getMessagesBySender')
  }
}

export const getRecentMessages = async (eventId: string, limit: number = 50) => {
  try {
    return await supabase
      .from('messages')
      .select(`
        *,
        sender:public_user_profiles!messages_sender_user_id_fkey(*)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(limit)
  } catch (error) {
    handleDatabaseError(error, 'getRecentMessages')
  }
}

export const getMessageStats = async (eventId: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('message_type, sender_user_id')
      .eq('event_id', eventId)
    
    if (error) throw error
    
    const stats = {
      total: data.length,
      direct: data.filter(m => m.message_type === 'direct').length,
      announcements: data.filter(m => m.message_type === 'announcement').length,
      unique_senders: new Set(data.map(m => m.sender_user_id).filter(Boolean)).size
    }
    
    return { data: stats, error: null }
  } catch (error) {
    handleDatabaseError(error, 'getMessageStats')
  }
}

// Real-time messaging subscription helper
export const subscribeToEventMessages = (
  eventId: string,
  callback: (payload: { eventType: string; new?: MessageWithSender; old?: MessageWithSender }) => void
) => {
  return supabase
    .channel(`messages:${eventId}`)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `event_id=eq.${eventId}`
      },
      callback as any
    )
    .subscribe()
}

// Export message constraints for use in components
export const MESSAGE_CONSTRAINTS = {
  MAX_MESSAGE_LENGTH,
  MIN_MESSAGE_LENGTH
}

// Additional legacy functions for backward compatibility
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getMessageThread = async (eventId: string, _threadId?: string) => {
  // Since we don't have threading in the simplified schema, just return all messages
  try {
    return await getEventMessages(eventId)
  } catch (error) {
    handleDatabaseError(error, 'getMessageThread')
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const markMessageAsRead = async (_messageId: string, _userId: string) => {
  // Since we don't have read status in the simplified schema, return success
  try {
    return {
      data: { success: true },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: error
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getUnreadMessageCount = async (_eventId: string, _userId: string) => {
  // Since we don't have read status in the simplified schema, return 0
  try {
    return {
      data: 0,
      error: null
    }
  } catch (error) {
    return {
      data: 0,
      error: error
    }
  }
}

export const sendBulkMessage = async (eventId: string, content: string, senderId: string, messageType: MessageType = 'announcement') => {
  try {
    // For bulk messages, we just send one announcement message
    return await sendMessage({
      event_id: eventId,
      sender_user_id: senderId,
      content: content,
      message_type: messageType
    })
  } catch (error) {
    handleDatabaseError(error, 'sendBulkMessage')
  }
}

 