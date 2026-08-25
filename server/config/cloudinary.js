/**
 * Cloudinary configuration
 *
 * Why Cloudinary?
 * Avatars need a CDN-backed image host. Cloudinary handles upload, resizing,
 * and delivery URLs so we only store a URL (+ public_id) in MongoDB instead of
 * binary files on our server.
 *
 * Env vars required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/**
 * Upload a raw image buffer (from multer memoryStorage) to Cloudinary.
 * folder keeps DevConnect assets organized in the Cloudinary dashboard.
 */
export const uploadAvatarBuffer = (buffer, folder = 'devconnect/avatars') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        // Square-ish profile crop; frontend still shows a circle
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      },
    )
    stream.end(buffer)
  })

/**
 * Delete a previous avatar by public_id so we do not orphan images in Cloudinary.
 */
export const deleteCloudinaryAsset = async (publicId) => {
  if (!publicId) return null
  try {
    return await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    // Non-fatal — profile update should still succeed if cleanup fails
    console.error('Cloudinary delete error:', error.message)
    return null
  }
}

export default cloudinary
