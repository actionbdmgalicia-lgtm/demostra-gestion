import fs from 'fs/promises';
import path from 'path';
import { kv } from '@vercel/kv';
import initialData from '@/data/db.json';

const DB_PATH = path.join(process.cwd(), 'src/data/db.json');
const KV_KEY = 'demostra_db_v1';

export async function getDB() {
    // Check if we are running in production (KV present)
    // We check for KV_REST_API_URL which Vercel injects automatically
    if (process.env.KV_REST_API_URL) {
        try {
            const data: any = await kv.get(KV_KEY);
            // AUTO-MIGRATION CHECK
            // We verify if the data in KV is "stale" compared to our local initialData by checking item count or a specific flag.
            // Since we just did a major migration, let's look for "ACUTELAN" or check if initialData has more fairs?
            // Safer: Force update if the KV data is missing new fields or is just drastically different.
            // For now, let's use a simple heuristic: If KV fair count is remarkably low (e.g. < 5) and initialData has many (17), re-seed.

            const initialFairsCount = (initialData as any).fairs?.length || 0;
            const kvFairsCount = data?.fairs?.length || 0;

            if (data && kvFairsCount >= 5) {
                // Assume data is good if we have fairs.
                // Update: The previous seed might have been empty.
                return data;
            } else {
                console.log(`Database stale or missing (KV: ${kvFairsCount}, Init: ${initialFairsCount}). Re-seeding...`);
                await kv.set(KV_KEY, initialData);
                return initialData;
            }
        } catch (error) {
            console.error("Error accessing Vercel KV:", error);
            throw new Error("CRITICAL: Database Connection Failed (KV). Please refresh.");
        }
    }

    // Fallback: Local Filesystem (Dev mode)
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return initialData;
    }
}

export async function saveDB(data: any) {
    if (process.env.KV_REST_API_URL) {
        try {
            await kv.set(KV_KEY, data);
        } catch (error) {
            console.error("Error saving to Vercel KV:", error);
            throw new Error("Failed to save database to KV");
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
    // Casting any because getDB returns either the full JSON object or initialData
    const db: any = await getDB();
    return db.fairs || [];
}
