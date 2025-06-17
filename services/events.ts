import { supabase } from '@/lib/supabase/client'
import type { 
  EventInsert, 
  EventUpdate, 
  EventParticipantInsert
} from '@/lib/supabase/types'
import { logDatabaseError } from '@/lib/logger'

// Error handling for database constraints
const handleDatabaseError = (error: unknown, context: string) => {
  logDatabaseError(`Database error in ${context}`, error, context)
  
  const dbError = error as { code?: string; message?: string }
  
  if (dbError.code === '23505') {
    throw new Error('A record with this information already exists')
  }
  
  if (dbError.code === '23503') {
    if (dbError.message?.includes('host_user_id')) {
      throw new Error('Invalid host user ID')
    }
    if (dbError.message?.includes('event_id')) {
      throw new Error('Invalid event ID')
    }
    if (dbError.message?.includes('user_id')) {
      throw new Error('Invalid user ID')
    }
    throw new Error('Invalid reference in database')
  }
  
  if (dbError.code === '23514') {
    throw new Error('Data validation failed - please check your input')
  }
  
  throw new Error(dbError.message || 'Database operation failed')
}

// Event service functions
export const createEvent = async (eventData: EventInsert) => {
  try {
    return await supabase
      .from('events')
      .insert(eventData)
      .select(`
        *,
        host:public_user_profiles!events_host_user_id_fkey(*)
      `)
      .single()
  } catch (error) {
    handleDatabaseError(error, 'createEvent')
  }
}

export const updateEvent = async (id: string, updates: EventUpdate) => {
  try {
    return await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        host:public_user_profiles!events_host_user_id_fkey(*)
      `)
      .single()
  } catch (error) {
    handleDatabaseError(error, 'updateEvent')
  }
}

export const deleteEvent = async (id: string) => {
  try {
    return await supabase
      .from('events')
      .delete()
      .eq('id', id)
  } catch (error) {
    handleDatabaseError(error, 'deleteEvent')
  }
}

export const getEventById = async (id: string) => {
  try {
    return await supabase
      .from('events')
      .select(`
        *,
        host:public_user_profiles!events_host_user_id_fkey(*)
      `)
      .eq('id', id)
      .single()
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
      throw new Error('Event not found')
    }
    handleDatabaseError(error, 'getEventById')
  }
}

export const getHostEvents = async (hostId: string) => {
  try {
    return await supabase
      .from('events')
      .select(`
        *,
        host:public_user_profiles!events_host_user_id_fkey(*)
      `)
      .eq('host_user_id', hostId)
      .order('event_date', { ascending: true })
  } catch (error) {
    handleDatabaseError(error, 'getHostEvents')
  }
}

export const getParticipantEvents = async (userId: string) => {
  try {
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
  } catch (error) {
    handleDatabaseError(error, 'getParticipantEvents')
  }
}

export const getEventParticipants = async (eventId: string) => {
  try {
    return await supabase
      .from('event_participants')
      .select(`
        *,
        user:public_user_profiles(*)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
  } catch (error) {
    handleDatabaseError(error, 'getEventParticipants')
  }
}

export const addParticipantToEvent = async (participantData: EventParticipantInsert) => {
  try {
    return await supabase
      .from('event_participants')
      .insert(participantData)
      .select(`
        *,
        user:public_user_profiles(*)
      `)
      .single()
  } catch (error) {
    handleDatabaseError(error, 'addParticipantToEvent')
  }
}

export const updateParticipantRSVP = async (
  eventId: string, 
  userId: string, 
  status: 'attending' | 'declined' | 'maybe' | 'pending'
) => {
  try {
    return await supabase
      .from('event_participants')
      .update({ rsvp_status: status })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .select(`
        *,
        user:public_user_profiles(*)
      `)
      .single()
  } catch (error) {
    handleDatabaseError(error, 'updateParticipantRSVP')
  }
}

export const removeParticipantFromEvent = async (eventId: string, userId: string) => {
  try {
    return await supabase
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
  } catch (error) {
    handleDatabaseError(error, 'removeParticipantFromEvent')
  }
}

export const updateParticipantRole = async (
  eventId: string, 
  userId: string, 
  role: 'host' | 'guest'
) => {
  try {
    return await supabase
      .from('event_participants')
      .update({ role })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .select(`
        *,
        user:public_user_profiles(*)
      `)
      .single()
  } catch (error) {
    handleDatabaseError(error, 'updateParticipantRole')
  }
}

export const getEventStats = async (eventId: string) => {
  try {
    const [participantsResult, mediaResult, messagesResult] = await Promise.all([
      supabase
        .from('event_participants')
        .select('rsvp_status')
        .eq('event_id', eventId),
      supabase
        .from('media')
        .select('id')
        .eq('event_id', eventId),
      supabase
        .from('messages')
        .select('id')
        .eq('event_id', eventId)
    ])

    const participants = participantsResult.data || []
    const rsvpCounts = {
      attending: participants.filter(p => p.rsvp_status === 'attending').length,
      declined: participants.filter(p => p.rsvp_status === 'declined').length,
      maybe: participants.filter(p => p.rsvp_status === 'maybe').length,
      pending: participants.filter(p => p.rsvp_status === 'pending').length,
      total: participants.length
    }

    return {
      data: {
        participants: rsvpCounts,
        media_count: mediaResult.data?.length || 0,
        message_count: messagesResult.data?.length || 0
      },
      error: null
    }
  } catch (error) {
    handleDatabaseError(error, 'getEventStats')
  }
}

// Legacy function name for backward compatibility (deprecated)
export const getGuestEvents = getParticipantEvents 

// Additional utility functions for backward compatibility
export const getEventsByUser = async (userId: string) => {
  try {
    // Get both hosted events and participated events
    const [hostedResult, participatedResult] = await Promise.all([
      getHostEvents(userId),
      getParticipantEvents(userId)
    ])

    const hostedEvents = hostedResult?.data || []
    const participatedEvents = (participatedResult?.data || []).map(p => p.event).filter(Boolean)

    // Combine and deduplicate events
    const allEvents = [...hostedEvents, ...participatedEvents]
    const uniqueEvents = allEvents.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id)
    )

    return {
      data: uniqueEvents,
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error: error
    }
  }
}

export const getUserEventRole = async (eventId: string, userId: string) => {
  try {
    // Check if user is the host
    const { data: event } = await supabase
      .from('events')
      .select('host_user_id')
      .eq('id', eventId)
      .single()

    if (event?.host_user_id === userId) {
      return { data: 'host', error: null }
    }

    // Check if user is a participant
    const { data: participant } = await supabase
      .from('event_participants')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (participant) {
      return { data: participant.role, error: null }
    }

    return { data: null, error: null }
  } catch (error) {
    return { data: null, error: error }
  }
}

export const isEventHost = async (eventId: string, userId: string) => {
  try {
    const { data: event } = await supabase
      .from('events')
      .select('host_user_id')
      .eq('id', eventId)
      .single()

    return {
      data: event?.host_user_id === userId,
      error: null
    }
  } catch (error) {
    return {
      data: false,
      error: error
    }
  }
}

export const isEventGuest = async (eventId: string, userId: string) => {
  try {
    const { data: participant } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('role', 'guest')
      .single()

    return {
      data: !!participant,
      error: null
    }
  } catch (error) {
    return {
      data: false,
      error: error
    }
  }
} 