import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'node:stream';

const configured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
);

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const useCloudinary = configured;

export function uploadBuffer(buffer, { folder, publicId, mime } = {}) {
  if (!configured) return Promise.reject(new Error('Cloudinary is not configured.'));
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder || 'shyfunmi',
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        format: mime?.includes('png') ? 'png' : mime?.includes('webp') ? 'webp' : undefined,
      },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    Readable.from(buffer).pipe(stream);
  });
}

export async function destroyPublicId(publicId) {
  if (!configured || !publicId) return;
  await cloudinary.uploader.destroy(publicId).catch(() => {});
}
