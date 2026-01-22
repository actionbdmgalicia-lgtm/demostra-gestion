import fs from 'fs/promises';
import path from 'path';
import { kv } from '@vercel/kv';
import initialData from '@/data/db.json';

const DB_PATH = path.join(process.cwd(), 'src/data/db.json');
const KV_KEY = 'demostra_db_v1';

export async function getDB() {
    // Directly read the local JSON file (ignore Vercel KV for now)
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading local DB, falling back to initialData', err);
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
