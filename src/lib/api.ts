import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import initialData from '@/data/db.json'; // Direct import to ensure bundling

const DB_PATH = path.join(process.cwd(), 'src/data/db.json');
const BLOB_PATH = 'database_v1.json'; // Changed to force fresh start

// Simple function to fetch data from a URL
async function fetchJSON(url: string) {
    const res = await fetch(url, {
        cache: 'no-store',
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });
    if (!res.ok) throw new Error('Failed to fetch DB from Blob');
    return res.json();
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getDB() {
    // Check if we are in production or have the token to use Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        let retries = 3;
        while (retries > 0) {
            try {
                const { list } = await import('@vercel/blob');
                const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });
                const blob = blobs.find(b => b.pathname === BLOB_PATH);

                if (blob) {
                    const urlWithCacheBust = `${blob.url}?t=${Date.now()}`;
                    const data = await fetchJSON(urlWithCacheBust);
                    if (data && data.fairs) return data;
                } else {
                    console.warn(`Blob ${BLOB_PATH} not found in list. Retries left: ${retries}`);
                }
            } catch (error) {
                console.error(`Error attempting to get DB (Retry ${retries}):`, error);
            }

            retries--;
            if (retries > 0) await delay(500);
        }

        // If we failed after retries, try ONE seed attempt if list returned empty, 
        // OR throw error to be safe.
        // Given user issues, let's THROW to force visibility of the error instead of silent data loss.
        throw new Error("CRITICAL: Unable to load Database from Storage. Please refresh.");
    }

    // Fallback: Local Filesystem (Dev mode)
    // In dev, we might still want to read from fs to allow manual edits to db.json to be reflected without restart if we used nodemon/etc,
    // but importing JSON caches it in some bundlers. Next.js server actions re-read usually.
    // Let's stick to FS in dev to preserve current workflow.
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return initialData;
    }
}

export async function saveDB(data: any) {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
            // Save to Blob with NO CACHE to ensure immediate consistency
            await put(BLOB_PATH, JSON.stringify(data, null, 2), {
                access: 'public',
                addRandomSuffix: false,
                cacheControlMaxAge: 0 // Vital: Disable CDN caching
            });
        } catch (error) {
            console.error("Error saving to Vercel Blob:", error);
            throw new Error("Failed to save database to Blob");
        }
        return;
    }

    // Save Local
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error saving local DB:", error);
    }
}

export async function getFairs() {
    const db = await getDB();
    return db.fairs;
}
