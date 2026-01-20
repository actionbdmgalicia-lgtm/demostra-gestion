import fs from 'fs/promises';
import path from 'path';
import { put, head } from '@vercel/blob';

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
            // Check if db.json exists in Blob
            // Since we use addRandomSuffix: false, the URL should be predictable if we knew the base URL,
            // but `head` or `list` is safer to check existence/url. 
            // However, `head` might throw if not found? Documentation says 404 throws.
            // Let's try to list or just fetch from the known URL if we stored it? 
            // Actually, we don't know the full URL domain easily without listing or configuring it.
            // Let's rely on a list search for the file 'db.json'

            // Simpler: Just try to read it. If it fails, maybe upload local one as seed.
            // But 'put' returns the URL. To 'get', we need the URL.
            // WORKAROUND: For this quick setup, we will query the blob list every time or CACHE the URL.
            // BETTER: Use `list` to find `db.json`. 

            const { list } = await import('@vercel/blob');
            const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });

            const blob = blobs.find(b => b.pathname === BLOB_PATH);

            if (blob) {
                return await fetchJSON(blob.url);
            } else {
                // Not found on Blob, upload local DB as seed
                console.log('Database not found on Blob, seeding from local...');
                const localData = await fs.readFile(DB_PATH, 'utf-8');
                // Upload it
                await put(BLOB_PATH, localData, { access: 'public', addRandomSuffix: false });
                return JSON.parse(localData);
            }
        } catch (error) {
            console.error("Error accessing Vercel Blob:", error);
            // Fallback to local if Blob fails (or return empty default)
            // But in production this might be critical.
        }
    }

    // Fallback: Local Filesystem (Dev mode)
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

export async function saveDB(data: any) {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        // Save to Blob
        await put(BLOB_PATH, JSON.stringify(data, null, 2), { access: 'public', addRandomSuffix: false });
        return;
    }

    // Save Local
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export async function getFairs() {
    const db = await getDB();
    return db.fairs;
}
