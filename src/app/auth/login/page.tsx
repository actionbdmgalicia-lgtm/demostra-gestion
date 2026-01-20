'use client';

import { useActionState } from 'react';
import { login } from '@/app/actions_auth';
import { BriefcaseBusiness, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setError('');

        try {
            const res = await login(formData);
            if (res.success) {
                if (res.role === 'COSTES') router.push('/gastos');
                else router.push('/');
            } else {
                setError(res.error || 'Error desconocido');
                setIsLoading(false);
            }
        } catch (e) {
            setError('Error de conexión');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-light font-sans text-brand-black p-4">
            <div className="w-full max-w-md bg-white p-10 border border-gray-200 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-black"></div>

                <div className="mb-10 text-center">
                    <div className="inline-block p-4 bg-brand-black text-white mb-4 rounded-sm">
                        <BriefcaseBusiness size={32} />
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Demostra Gestión</h1>
                    <p className="text-xs uppercase tracking-widest text-brand-grey">Acceso Restringido</p>
                </div>

                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-2">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="usuario@demostra.com"
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-grey mb-2">Contraseña</label>
                        <div className="relative">
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="input-field pr-10"
                            />
                            <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs font-bold text-center border border-red-100 uppercase tracking-wide">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Verificando...
                            </>
                        ) : (
                            <>
                                Entrar <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-gray-300">© 2026 Demostra. Todos los derechos reservados.</p>
                </div>
            </div>
        </div>
    );
}
