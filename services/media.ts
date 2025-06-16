import { supabase } from '@/lib/supabase/client'
import type { 
  MediaInsert, 
  MediaType, 
  MediaWithUploader,
  ServiceResponse,
  ServiceResponseArray
} from '@/lib/supabase/types'

// File upload constraints
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov', 'video/avi']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.mov', '.avi']

// Error handling for database constraints
const handleDatabaseError = (error: unknown, context: string) => {
  console.error(`Database error in ${context}:`, error)
  
  const dbError = error as { code?: string; message?: string }
  
  if (dbError.code === '23505') {
    throw new Error('A media file with this path already exists')
  }
  
  if (dbError.code === '23503') {
    if (dbError.message?.includes('event_id')) {
      throw new Error('Invalid event ID')
    }
    if (dbError.message?.includes('uploader_user_id')) {
      throw new Error('Invalid user ID')
    }
    throw new Error('Invalid reference in database')
  }
  
  if (dbError.code === '23514') {
    throw new Error('Invalid media type - must be image or video')
  }
  
  throw new Error(dbError.message || 'Database operation failed')
}

// File validation functions
export const validateFileSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE
}

export const validateFileType = (file: File): { isValid: boolean; mediaType: MediaType | null } => {
  const fileName = file.name.toLowerCase()
  const fileType = file.type.toLowerCase()
  
  // Check by MIME type first
  if (ALLOWED_IMAGE_TYPES.includes(fileType)) {
    return { isValid: true, mediaType: 'image' }
  }
  
  if (ALLOWED_VIDEO_TYPES.includes(fileType)) {
    return { isValid: true, mediaType: 'video' }
  }
  
  // Fallback to extension check
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
  if (hasValidExtension) {
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].some(ext => fileName.endsWith(ext))
    return { isValid: true, mediaType: isImage ? 'image' : 'video' }
  }
  
  return { isValid: false, mediaType: null }
}

export const validateMediaFile = (file: File): { isValid: boolean; error?: string; mediaType?: MediaType } => {
  // Check file size
  if (!validateFileSize(file)) {
    return { 
      isValid: false, 
      error: `File size must be less than ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB. Your file is ${Math.round(file.size / 1024 / 1024)}MB.` 
    }
  }
  
  // Check file type
  const typeValidation = validateFileType(file)
  if (!typeValidation.isValid) {
    return { 
      isValid: false, 
      error: 'Invalid file type. Please upload an image (JPG, PNG, WebP, GIF) or video (MP4, WebM, MOV, AVI).' 
    }
  }
  
  return { isValid: true, mediaType: typeValidation.mediaType! }
}

// Media service functions
export const getEventMedia = async (eventId: string): Promise<ServiceResponseArray<MediaWithUploader>> => {
  try {
    const result = await supabase
      .from('media')
      .select(`
        *,
        uploader:public_user_profiles!media_uploader_user_id_fkey(*)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
    
    return {
      data: result.data || [],
      error: result.error ? new Error(result.error.message) : null
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to get event media')
    }
  }
}

export const uploadMedia = async (mediaData: {
  event_id: string
  storage_path: string
  media_type: MediaType
  uploader_user_id: string
  caption?: string
}): Promise<ServiceResponse<MediaWithUploader>> => {
  try {
    const insertData: MediaInsert = {
      event_id: mediaData.event_id,
      storage_path: mediaData.storage_path,
      media_type: mediaData.media_type,
      uploader_user_id: mediaData.uploader_user_id,
      caption: mediaData.caption || null
    }
    
    const result = await supabase
      .from('media')
      .insert(insertData)
      .select(`
        *,
        uploader:public_user_profiles!media_uploader_user_id_fkey(*)
      `)
      .single()
    
    return {
      data: result.data,
      error: result.error ? new Error(result.error.message) : null
    }
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to upload media')
    }
  }
}

export const updateMediaCaption = async (id: string, caption: string) => {
  try {
    return await supabase
      .from('media')
      .update({ caption })
      .eq('id', id)
      .select(`
        *,
        uploader:public_user_profiles!media_uploader_user_id_fkey(*)
      `)
      .single()
  } catch (error) {
    handleDatabaseError(error, 'updateMediaCaption')
  }
}

export const deleteMedia = async (id: string) => {
  try {
    return await supabase
      .from('media')
      .delete()
      .eq('id', id)
  } catch (error) {
    handleDatabaseError(error, 'deleteMedia')
  }
}

export const getMediaById = async (id: string) => {
  try {
    return await supabase
      .from('media')
      .select(`
        *,
        uploader:public_user_profiles!media_uploader_user_id_fkey(*)
      `)
      .eq('id', id)
      .single()
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
      throw new Error('Media not found')
    }
    handleDatabaseError(error, 'getMediaById')
  }
}

export const getMediaStats = async (eventId: string) => {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('media_type')
      .eq('event_id', eventId)
    
    if (error) throw error
    
    const stats = {
      total: data.length,
      images: data.filter(m => m.media_type === 'image').length,
      videos: data.filter(m => m.media_type === 'video').length
    }
    
    return { data: stats, error: null }
  } catch (error) {
    handleDatabaseError(error, 'getMediaStats')
  }
}

export const getMediaByType = async (eventId: string, mediaType: MediaType) => {
  try {
    return await supabase
      .from('media')
      .select(`
        *,
        uploader:public_user_profiles!media_uploader_user_id_fkey(*)
      `)
      .eq('event_id', eventId)
      .eq('media_type', mediaType)
      .order('created_at', { ascending: false })
  } catch (error) {
    handleDatabaseError(error, 'getMediaByType')
  }
}

export const getMediaByUploader = async (eventId: string, uploaderId: string) => {
  try {
    return await supabase
      .from('media')
      .select(`
        *,
        uploader:public_user_profiles!media_uploader_user_id_fkey(*)
      `)
      .eq('event_id', eventId)
      .eq('uploader_user_id', uploaderId)
      .order('created_at', { ascending: false })
  } catch (error) {
    handleDatabaseError(error, 'getMediaByUploader')
  }
}

// Export file validation constants for use in components
export const MEDIA_CONSTRAINTS = {
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_MB: Math.round(MAX_FILE_SIZE / 1024 / 1024)
} 