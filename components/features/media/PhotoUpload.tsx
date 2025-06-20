'use client';

import { useState, useCallback, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { uploadEventMedia } from '@/services/storage';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

interface PhotoUploadProps {
  eventId: string;
  userId: string;
  onUploadComplete?: (mediaId: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  maxFiles?: number;
  disabled?: boolean;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  preview?: string;
}

export default function PhotoUpload({
  eventId,
  userId,
  onUploadComplete,
  onUploadError,
  className,
  maxFiles = 5,
  disabled = false,
}: PhotoUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image before upload
  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920px width)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8, // 80% quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Create preview URL for file
  const createPreview = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList) => {
      if (disabled) return;

      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((file) => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit

        if (!isImage && !isVideo) {
          onUploadError?.('Please select only image or video files');
          return false;
        }
        if (!isValidSize) {
          onUploadError?.('File size must be less than 50MB');
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      // Check max files limit
      const currentUploads = uploads.filter(
        (upload) => upload.status !== 'complete',
      ).length;
      const filesToProcess = validFiles.slice(0, maxFiles - currentUploads);

      if (filesToProcess.length < validFiles.length) {
        onUploadError?.(`Only uploading first ${filesToProcess.length} files (limit: ${maxFiles})`);
      }

      // Initialize upload progress for each file
      const newUploads: UploadProgress[] = filesToProcess.map((file) => ({
        file,
        progress: 0,
        status: 'pending',
        preview: createPreview(file),
      }));

      setUploads((prev) => [...prev, ...newUploads]);

      // Process uploads
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const uploadIndex = uploads.length + i;

        try {
          // Update status to uploading
          setUploads((prev) =>
            prev.map((upload, idx) =>
              idx === uploadIndex
                ? { ...upload, status: 'uploading', progress: 10 }
                : upload,
            ),
          );

          // Compress if image
          let processedFile = file;
          if (file.type.startsWith('image/')) {
            processedFile = await compressImage(file);
            setUploads((prev) =>
              prev.map((upload, idx) =>
                idx === uploadIndex
                  ? { ...upload, progress: 30 }
                  : upload,
              ),
            );
          }

          // Upload to Supabase
          const result = await uploadEventMedia(eventId, processedFile, userId);

          if (result.error) {
            throw new Error(result.error.message);
          }

          // Update progress to complete
          setUploads((prev) =>
            prev.map((upload, idx) =>
              idx === uploadIndex
                ? { ...upload, status: 'complete', progress: 100 }
                : upload,
            ),
          );

          onUploadComplete?.(result.data?.id || '');
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Upload failed';

          setUploads((prev) =>
            prev.map((upload, idx) =>
              idx === uploadIndex
                ? { ...upload, status: 'error', error: errorMessage }
                : upload,
            ),
          );

          onUploadError?.(errorMessage);
        }
      }
    },
    [
      disabled,
      uploads,
      maxFiles,
      eventId,
      userId,
      compressImage,
      createPreview,
      onUploadComplete,
      onUploadError,
    ],
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      
      if (e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Handle file input change
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles],
  );

  // Remove upload
  const removeUpload = useCallback((index: number) => {
    setUploads((prev) => {
      const newUploads = [...prev];
      // Clean up preview URL
      if (newUploads[index].preview) {
        URL.revokeObjectURL(newUploads[index].preview!);
      }
      newUploads.splice(index, 1);
      return newUploads;
    });
  }, []);

  // Retry upload
  const retryUpload = useCallback(
    (index: number) => {
      const upload = uploads[index];
      if (upload && upload.status === 'error') {
        handleFiles(new FileList());
      }
    },
    [uploads, handleFiles],
  );

  const isUploading = uploads.some((upload) => upload.status === 'uploading');
  const hasActiveUploads = uploads.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-all',
          isDragOver
            ? 'border-purple-400 bg-purple-50'
            : 'border-stone-300 hover:border-stone-400',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:bg-stone-50 cursor-pointer',
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin mr-3" />
            <span className="text-stone-600">Uploading photos...</span>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-stone-500" />
            </div>
            <p className="text-stone-700 font-medium mb-1">
              Drop photos here or click to upload
            </p>
            <p className="text-stone-500 text-sm">
              Images and videos up to 50MB each
            </p>
          </>
        )}
      </div>

      {/* Camera Button for Mobile */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'environment';
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files) {
              handleFiles(target.files);
            }
          };
          input.click();
        }}
        disabled={disabled}
        className="w-full"
      >
        <Camera className="w-4 h-4 mr-2" />
        Take Photo
      </Button>

      {/* Upload Progress */}
      {hasActiveUploads && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-stone-700">
            Uploading {uploads.length} {uploads.length === 1 ? 'file' : 'files'}
          </h4>
          
          {uploads.map((upload, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-stone-50 rounded-lg"
            >
              {/* Preview */}
                              <div className="w-10 h-10 bg-stone-200 rounded flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                  {upload.preview ? (
                    <Image
                      src={upload.preview}
                      alt="Preview"
                      fill
                      className="object-cover rounded"
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-stone-400" />
                  )}
                </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-700 truncate">
                  {upload.file.name}
                </p>
                <div className="flex items-center space-x-2">
                  {upload.status === 'uploading' && (
                    <>
                      <div className="flex-1 bg-stone-200 rounded-full h-1.5">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-stone-500">
                        {upload.progress}%
                      </span>
                    </>
                  )}
                  {upload.status === 'complete' && (
                    <span className="text-xs text-green-600 font-medium">
                      Complete
                    </span>
                  )}
                  {upload.status === 'error' && (
                    <span className="text-xs text-red-600 font-medium">
                      {upload.error}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1">
                {upload.status === 'error' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => retryUpload(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUpload(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 