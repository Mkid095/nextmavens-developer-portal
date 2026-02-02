/**
 * File Operations
 *
 * Re-exports all file operations from Telegram and Cloudinary modules.
 * This provides a unified interface for file operations across both storage backends.
 */

// Re-export Telegram operations
export {
  uploadToTelegram,
  downloadFromTelegram,
  deleteFromTelegram,
  getTelegramFileInfo,
  MAX_FILE_SIZE_TELEGRAM,
  type TelegramFileResponse,
} from './telegram'

// Re-export Cloudinary operations
export {
  uploadToCloudinary,
  getCloudinaryUrl,
  deleteFromCloudinary,
  MAX_FILE_SIZE_CLOUDINARY,
  type CloudinaryUploadResponse,
} from './cloudinary'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Maximum file sizes (in bytes) - unified export
 */
export const MAX_FILE_SIZE = {
  telegram: 1.5 * 1024 * 1024 * 1024, // 1.5GB
  cloudinary: 10 * 1024 * 1024, // 10MB (Cloudinary free tier)
  multipart: 100 * 1024 * 1024, // 100MB for multipart uploads
}
