'use client';

import { logout } from '@/app/actions_auth';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/auth/login');
    };

    return (
        <button
            onClick={handleLogout}
            className="text-brand-grey hover:text-red-500 transition-colors p-2"
            title="Cerrar Sesión"
        >
            <LogOut size={16} />
        </button>
    );
}
