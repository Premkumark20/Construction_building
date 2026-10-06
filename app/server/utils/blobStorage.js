import { put, del } from '@vercel/blob';

/**
 * Helper to upload buffer, stream, or base64 to Vercel Blob Storage.
 * Returns public CDN URL or null if BLOB_READ_WRITE_TOKEN is missing or fails.
 */
export async function uploadFileToBlob(filename, dataBuffer, contentType = 'image/jpeg') {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  try {
    const blob = await put(filename, dataBuffer, {
      access: 'public',
      contentType,
      token
    });
    console.log(`[Vercel Blob Upload Success] ${filename} -> ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error(`[Vercel Blob Upload Error] ${filename}:`, error.message);
    return null;
  }
}

/**
 * Helper to delete a file (or array of files) from Vercel Blob by public URL.
 */
export async function deleteFileFromBlob(urls) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || !urls) return;

  const urlList = Array.isArray(urls) ? urls : [urls];
  for (const url of urlList) {
    if (!url || typeof url !== 'string') continue;
    if (!url.includes('vercel-storage.com') && !url.includes('blob.vercel-storage.com')) continue;

    try {
      await del(url, { token });
      console.log(`[Vercel Blob Delete Success] ${url}`);
    } catch (error) {
      console.error(`[Vercel Blob Delete Error] ${url}:`, error.message);
    }
  }
}
