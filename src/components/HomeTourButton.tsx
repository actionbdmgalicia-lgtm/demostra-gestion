
'use client';

import React, { useState } from 'react';
import InteractiveTour, { TourStep } from '@/components/InteractiveTour';
import { HelpCircle } from 'lucide-react';

const HOME_TOUR_STEPS: TourStep[] = [
    { target: 'body', position: 'center', title: 'Bienvenido', description: 'Bienvenido a Demostra Gestión. Este asistente le mostrará cómo funciona la aplicación.' },
    { target: 'form', position: 'bottom', title: 'Crear Feria', description: 'Comience aquí creando un nuevo evento. Puede copiar la estructura de ferias anteriores.' },
    { target: '.fair-list-container', position: 'top', title: 'Listado de Ferias', description: 'Aquí aparecerán todos sus proyectos activos. Haga clic en una feria para gestionar clientes y presupuestos.' },
    { target: 'a[href="/gastos"]', position: 'bottom', title: 'Imputar Gastos', description: 'Acceso rápido para registrar facturas y tickets.' },
    { target: 'a[href="/comparativo"]', position: 'bottom', title: 'Control Global', description: 'Vista general del estado económico de todos los proyectos.' },
];

export default function HomeTourButton() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 bg-brand-black text-white p-3 rounded-full shadow-2xl hover:bg-gray-800 transition-colors z-50 group flex items-center gap-0 hover:gap-2 hover:pl-4 hover:pr-4 overflow-hidden"
                style={{ width: 'auto' }}
            >
                <HelpCircle size={24} />
                <span className="w-0 group-hover:w-auto opacity-0 group-hover:opacity-100 transition-all font-bold text-xs uppercase tracking-widest whitespace-nowrap overflow-hidden">
                    Tutorial
                </span>
            </button>
            <InteractiveTour steps={HOME_TOUR_STEPS} isOpen={open} onClose={() => setOpen(false)} />
        </>
    )
}
