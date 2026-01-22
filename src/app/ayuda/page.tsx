
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ChevronDown, CheckCircle2, TrendingUp, Wallet, FileText, Download, UserPlus, Calendar } from 'lucide-react';

const HelpSection = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 bg-white mb-4 shadow-sm overflow-hidden group hover:border-brand-black transition-colors duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 bg-gray-50/30 hover:bg-gray-50 transition-colors text-left"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-none bg-brand-black text-white shrink-0 shadow-sm`}>
                        <Icon size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-brand-black">{title}</h3>
                        <p className={`text-[10px] uppercase tracking-wider mt-1 ${isOpen ? 'text-brand-black' : 'text-gray-400'}`}>
                            {isOpen ? 'Ocultar detalles' : 'Ver guía completa'}
                        </p>
                    </div>
                </div>
                <ChevronDown size={20} className={`text-brand-black transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out bg-white ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-6 pt-0 border-t border-gray-100 text-sm leading-relaxed text-gray-600">
                    <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:uppercase prose-headings:text-brand-black prose-p:text-gray-600 prose-li:text-gray-600 prose-strong:text-brand-black">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-brand-light font-sans text-brand-black flex flex-col">

            {/* HEADER */}
            <div className="bg-white px-8 py-6 border-b border-gray-200 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-brand-grey hover:text-brand-black transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-2xl font-black tracking-tight text-brand-black uppercase flex items-center gap-3">
                        <span className="bg-brand-black text-white p-1 rounded-sm"><BookOpen size={20} /></span>
                        Centro de Ayuda
                    </h1>
                </div>
            </div>

            <div className="flex-grow p-8 max-w-4xl mx-auto w-full">

                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Manual de Usuario</h2>
                    <p className="text-brand-grey uppercase tracking-widest text-xs max-w-lg mx-auto leading-relaxed">
                        Referencia completa para la gestión de ferias, clientes, presupuestos y control de costes en Demostra.
                    </p>
                </div>

                {/* 1. CREAR FERIA */}
                <HelpSection title="1. Crear Feria" icon={Calendar} defaultOpen={true}>
                    <p className="mt-4">
                        El primer paso para gestionar un evento es crearlo en el sistema.
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 mt-4">
                        <li>Desde la pantalla principal (Panel de Control), localice el bloque <strong>"NUEVA FERIA"</strong>.</li>
                        <li>Introduzca el <strong>Nombre del Evento</strong> (ej. <em>HIP 2026</em>).</li>
                        <li>
                            Opcionalmente, puede seleccionar una feria existente en <strong>"Copiar datos de..."</strong>.
                            Esto duplicará la estructura de clientes de la feria seleccionada, pero pondrá los presupuestos a cero.
                        </li>
                        <li>Pulse el botón <strong>CREAR FERIA</strong>.</li>
                        <li>La nueva feria aparecerá inmediatamente en el listado inferior.</li>
                    </ol>
                </HelpSection>

                {/* 2. CREAR CLIENTE */}
                <HelpSection title="2. Gestión de Clientes" icon={UserPlus}>
                    <p className="mt-4">
                        Dentro de cada feria, debe dar de alta los clientes que participan.
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 mt-4">
                        <li>Haga clic en el nombre de la feria en el listado principal para acceder al <strong>Detalle de la Feria</strong>.</li>
                        <li>En el panel lateral izquierdo "CLIENTES", pulse el botón <strong>+ NUEVO CLIENTE</strong>.</li>
                        <li>Introduzca el nombre del cliente y pulse <strong>Guardar</strong>.</li>
                        <li>El cliente se seleccionará automáticamente y podrá empezar a editar su presupuesto.</li>
                    </ol>
                    <div className="mt-4 bg-blue-50 p-4 border-l-4 border-blue-500 text-xs">
                        <strong>Nota:</strong> Puede archivar clientes antiguos usando el botón de "Archivar" en la esquina superior derecha de la ficha del cliente.
                    </div>
                </HelpSection>

                {/* 3. PRESUPUESTO */}
                <HelpSection title="3. Definir Presupuesto" icon={FileText}>
                    <p className="mt-4">
                        El presupuesto define la previsión de ingresos y gastos par cada cliente.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-4">
                        <li>Seleccione un cliente dentro de una feria.</li>
                        <li>Verá dos secciones: <strong>INGRESOS (Ventas)</strong> y <strong>GASTOS PREVISTOS</strong>.</li>
                        <li>Para añadir una partida, pulse <strong>AÑADIR PARTIDA</strong> al final de la lista correspondiente.</li>
                        <li>
                            Introduzca:
                            <ul className="list-circle pl-5 mt-1 text-gray-500">
                                <li><strong>Concepto/Descripción:</strong> Qué se está presupuestando.</li>
                                <li><strong>Categoría:</strong> (Solo en gastos) Ej. <em>Carpintería, Electricidad...</em></li>
                                <li><strong>Importe:</strong> Valor económico (sin sigo negativo).</li>
                            </ul>
                        </li>
                        <li>
                            Para editar cualquier dato, simplemente haga clic sobre el texto o número que desea modificar.
                            Los cambios se guardan automáticamente al salir del campo.
                        </li>
                    </ul>
                </HelpSection>

                {/* 4. IMPUTACIONES */}
                <HelpSection title="4. Imputación de Costes Reales" icon={Wallet}>
                    <p className="mt-4">
                        A medida que avanza el proyecto, debe registrar los gastos reales (facturas, tickets) para controlar la desviación.
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 mt-4">
                        <li>
                            Puede acceder desde el botón <strong>IMPUTAR</strong> en la cabecera principal, o desde la pestaña
                            <strong>"Control de Costes"</strong> dentro de una feria.
                        </li>
                        <li>Pulse <strong>NUEVO MOVIMIENTO</strong>.</li>
                        <li>
                            Complete el formulario:
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-500">
                                <li><strong>Tipo:</strong> Gasto (Coste) o Ingreso (Venta Real).</li>
                                <li><strong>Categoría:</strong> Partida a la que pertenece el gasto.</li>
                                <li><strong>Proveedor:</strong> Nombre de la empresa o persona.</li>
                                <li><strong>Concepto:</strong> Detalle de la factura.</li>
                                <li><strong>Fecha:</strong> Fecha de la factura/gasto.</li>
                                <li><strong>Importe Total:</strong> Cuantía total de la factura.</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Distribución:</strong> Si un gasto afecta a varios clientes (ej. Transporte compartido),
                            puede repartir el importe entre ellos manual o porcentualmente en la sección inferior del formulario.
                        </li>
                        <li>Pulse <strong>GUARDAR IMPUTACIÓN</strong>.</li>
                    </ol>
                </HelpSection>

                {/* 5. COMPARATIVOS */}
                <HelpSection title="5. Análisis y Comparativos" icon={TrendingUp}>
                    <p className="mt-4">
                        Puede ver el estado de salud económica del proyecto en tiempo real.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-4">
                        <li>
                            <strong>Vista Comparativa (Control):</strong> Accesible desde el botón <strong>CONTROL</strong> en la home.
                            Muestra una tabla cruzada de Presupuesto vs Realidad para cada partida y cliente.
                            <ul className="pl-5 mt-1 text-gray-500 text-xs">
                                <li>Los valores en <span className="text-red-500 font-bold">ROJO</span> indican que el gasto real supera lo presupuestado (Desviación Negativa).</li>
                                <li>Los valores en <span className="text-green-500 font-bold">VERDE</span> indican ahorro (Gasto real menor al presupuesto).</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Márgenes y Beneficio:</strong> Al final de las tablas de control, verá filas de resumen con el
                            <strong>Beneficio Real</strong> y el <strong>% de Margen</strong> actualizado.
                        </li>
                    </ul>
                </HelpSection>

                {/* 6. EXPORTACIONES */}
                <HelpSection title="6. Exportar Datos" icon={Download}>
                    <p className="mt-4">
                        Puede extraer la información del sistema a Excel en cualquier momento.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-4">
                        <li>
                            <strong>Exportación Completa:</strong> En la Home, el botón de "Exportar Todo" genera un archivo con todas las ferias y datos del sistema (Copia de Seguridad).
                        </li>
                        <li>
                            <strong>Informes Personalizados:</strong> Desde la sección <strong>INFORMES</strong>, puede filtrar por Feria o Cliente y generar
                            un Excel específico con el desglose de partidas y totales, ideal para presentar a cliente o dirección.
                        </li>
                    </ul>
                </HelpSection>

            </div>
        </div>
    );
}
