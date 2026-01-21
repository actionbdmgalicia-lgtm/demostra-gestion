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
            const data = await kv.get(KV_KEY);
            if (data) {
                return data;
            } else {
                console.log('Database not found in KV. Seeding...');
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
