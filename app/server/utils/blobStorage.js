import { put, del, list } from '@vercel/blob';

/**
 * Helper to upload buffer, stream, or base64 to Vercel Blob Storage.
 * Returns public CDN URL or null if BLOB_READ_WRITE_TOKEN is missing or fails.
 */
export async function uploadFileToBlob(filename, dataBuffer, contentType = 'image/jpeg', options = {}) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  try {
    const blob = await put(filename, dataBuffer, {
      access: 'public',
      contentType,
      token,
      ...options
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

/**
 * Helper to delete all frame files under frames/ prefix from Vercel Blob Storage.
 */
export async function deleteAllFrameBlobs() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;

  try {
    let hasMore = true;
    let cursor = undefined;
    while (hasMore) {
      const response = await list({ prefix: 'frames/', token, cursor, limit: 1000 });
      if (response && response.blobs && response.blobs.length > 0) {
        const urls = response.blobs.map(b => b.url);
        await del(urls, { token });
        console.log(`[Vercel Blob] Deleted ${urls.length} frame blobs under frames/`);
      }
      hasMore = response?.hasMore;
      cursor = response?.cursor;
    }
  } catch (error) {
    console.error('[Vercel Blob] Error deleting frame blobs:', error.message);
  }
}
