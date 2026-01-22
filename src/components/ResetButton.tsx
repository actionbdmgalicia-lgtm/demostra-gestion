'use client';

import React, { useState } from 'react';
import { resetDatabase } from '@/app/actions_data';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!confirm('⚠️ ¿ESTÁS SEGURO?\n\nEsto BORRARÁ TODOS LOS DATOS actuales y restaurará los datos de ejemplo iniciales.\n\nEsta acción NO se puede deshacer.')) return;

        setLoading(true);
        try {
            await resetDatabase();
            window.location.reload(); // Hard refresh to clear any client state
        } catch (error) {
            alert('Error al resetear la base de datos');
            console.error(error);
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded border border-red-200 uppercase tracking-widest transition-colors"
            title="Resetear a Datos Iniciales"
        >
            {loading ? <RotateCcw size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
            {loading ? 'Restaurando...' : 'Reset Datos'}
        </button>
    );
}
