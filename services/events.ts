import { supabase } from '@/lib/supabase/client'
import type { EventInsert, EventUpdate, EventParticipantInsert } from '@/lib/supabase/types'

// Event service functions
export const createEvent = async (eventData: EventInsert) => {
  return await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single()
}

export const updateEvent = async (id: string, updates: EventUpdate) => {
  return await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
}

export const deleteEvent = async (id: string) => {
  return await supabase
    .from('events')
    .delete()
    .eq('id', id)
}

export const getEventById = async (id: string) => {
  return await supabase
    .from('events')
    .select(`
      *,
      host:public_user_profiles!events_host_user_id_fkey(*)
    `)
    .eq('id', id)
    .single()
}

export const getHostEvents = async (hostId: string) => {
  return await supabase
    .from('events')
    .select('*')
    .eq('host_user_id', hostId)
    .order('event_date', { ascending: true })
}

export const getParticipantEvents = async (userId: string) => {
  return await supabase
    .from('event_participants')
    .select(`
      *,
      event:events(
        *,
        host:public_user_profiles!events_host_user_id_fkey(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export const getEventParticipants = async (eventId: string) => {
  return await supabase
    .from('event_participants')
    .select(`
      *,
      user:public_user_profiles(*)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
}

export const addParticipantToEvent = async (participantData: EventParticipantInsert) => {
  return await supabase
    .from('event_participants')
    .insert(participantData)
    .select()
    .single()
}

export const updateParticipantRSVP = async (eventId: string, userId: string, status: string) => {
  return await supabase
    .from('event_participants')
    .update({ rsvp_status: status })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single()
}

export const removeParticipantFromEvent = async (eventId: string, userId: string) => {
  return await supabase
    .from('event_participants')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)
} 