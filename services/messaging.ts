import { supabase } from '@/lib/supabase/client'
import type { MessageInsert } from '@/lib/supabase/types'

// Messaging service functions
export const getEventMessages = async (eventId: string) => {
  return await supabase
    .from('messages')
    .select(`
      *,
      sender:public_user_profiles!messages_sender_user_id_fkey(*)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
}

export const sendMessage = async (messageData: MessageInsert) => {
  return await supabase
    .from('messages')
    .insert(messageData)
    .select(`
      *,
      sender:public_user_profiles!messages_sender_user_id_fkey(*)
    `)
    .single()
}

export const deleteMessage = async (id: string) => {
  return await supabase
    .from('messages')
    .delete()
    .eq('id', id)
}

export const getMessagesByType = async (eventId: string, messageType: string) => {
  return await supabase
    .from('messages')
    .select(`
      *,
      sender:public_user_profiles!messages_sender_user_id_fkey(*)
    `)
    .eq('event_id', eventId)
    .eq('message_type', messageType)
    .order('created_at', { ascending: true })
}

export const updateMessage = async (id: string, updates: { content?: string }) => {
  return await supabase
    .from('messages')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      sender:public_user_profiles!messages_sender_user_id_fkey(*)
    `)
    .single()
}

 