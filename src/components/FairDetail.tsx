'use client';

import { useState } from 'react';
import MatrixEditor from '@/components/MatrixEditor';

interface FairDetailProps {
    feria: any;
}

export default function FairDetail({ feria }: FairDetailProps) {
    // Compute total of real expenses (fallback to 0)
    const totalReal = (feria.realExpenses || []).reduce(
        (sum: number, exp: any) => sum + (exp.totalAmount ?? 0),
        0,
    );

    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-4">{feria.name}</h1>
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="btn-primary px-4 py-2 text-sm uppercase tracking-widest"
                >
                    {showDetails ? 'Ocultar detalle' : 'Ver detalle'}
                </button>
                <div className="text-lg font-semibold">
                    TOTAL REAL:{' '}
                    <span className="text-brand-black">
                        {totalReal.toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                        })}
                    </span>
                </div>
            </div>
            {showDetails && <MatrixEditor initialFair={feria} />}
        </div>
    );
}
