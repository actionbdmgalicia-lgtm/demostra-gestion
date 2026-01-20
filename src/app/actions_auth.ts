'use server';

import { cookies } from 'next/headers';

// Hardcoded users for demo simplicity
const USERS = [
    { email: 'actionbdmgalicia@gmail.com', password: 'admin', role: 'ADMIN', name: 'Administrador' },
    { email: 'costes@demostra.com', password: 'costes', role: 'COSTES', name: 'Control de Costes' }
];

export async function login(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const user = USERS.find(u => u.email === email && u.password === password);

    if (user) {
        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('demostra_user', JSON.stringify({ name: user.name, role: user.role, email: user.email }), {
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
        return { success: true, role: user.role };
    }

    return { success: false, error: 'Credenciales incorrectas' };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('demostra_user');
}
