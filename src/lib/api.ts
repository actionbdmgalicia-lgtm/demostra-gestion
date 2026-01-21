import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import initialData from '@/data/db.json'; // Direct import to ensure bundling

const DB_PATH = path.join(process.cwd(), 'src/data/db.json');
const BLOB_PATH = 'db.json';

// Simple function to fetch data from a URL
async function fetchJSON(url: string) {
    const res = await fetch(url, { cache: 'no-store' }); // Ensure fresh data
    if (!res.ok) throw new Error('Failed to fetch DB from Blob');
    return res.json();
}

export async function getDB() {
    // Check if we are in production or have the token to use Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
            const { list } = await import('@vercel/blob');
            // Force refresh of the list
            const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });

            const blob = blobs.find(b => b.pathname === BLOB_PATH);

            if (blob) {
                // Add timestamp to query to force bypass of any edge caching
                const urlWithCacheBust = `${blob.url}?t=${Date.now()}`;
                return await fetchJSON(urlWithCacheBust);
            } else {
                // Not found on Blob.
                // Critical Safety Check: Only seed if we are SURE it's missing.
                // We return initialData to allow the app to render, but we DO NOT auto-save it here.
                // This prevents overwriting a hidden/missed DB with the seed.
                // The DB will only be created when the user explicitly saves something (create fair/save client).
                console.log('Database not found on Blob (List returned empty). returning volatile initialData.');
                return initialData;
            }
        } catch (error) {
            console.error("Error accessing Vercel Blob:", error);
            // Fallback to initialData if Blob fails entirely, but again, DO NOT SAVE.
            return initialData;
        }
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
            // Save to Blob
            await put(BLOB_PATH, JSON.stringify(data, null, 2), { access: 'public', addRandomSuffix: false });
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
