/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, Sliders, Moon, Sun, Type 
} from 'lucide-react';

interface SettingsViewProps {
  onBack: () => void;
  onConfigChange?: () => void;
  onVisualChange?: () => void;
}

export default function SettingsView({ onBack, onVisualChange }: SettingsViewProps) {
  // Estados visuales cargados desde localStorage
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('todoarchivos-theme') === 'dark';
  });
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>(() => {
    return (localStorage.getItem('todoarchivos-font-size') as any) || 'base';
  });

  const toggleDarkMode = () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    localStorage.setItem('todoarchivos-theme', nextVal ? 'dark' : 'light');
    if (onVisualChange) onVisualChange();
  };

  const handleFontSizeChange = (fs: 'sm' | 'base' | 'lg' | 'xl') => {
    setFontSize(fs);
    localStorage.setItem('todoarchivos-font-size', fs);
    if (onVisualChange) onVisualChange();
  };

  return (
    <div className="flex-1 flex flex-col p-5 pb-24 h-full overflow-y-auto text-left select-none animate-in slide-in-from-right-4 duration-300">
      
      {/* Settings Back Heading */}
      <div className="flex items-center gap-2.5 mb-5 mt-1">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer"
          id="settings-back-btn"
        >
          <ArrowLeft className="w-4 h-4 ml-[-1px]" />
        </button>
        <div className="text-white">
          <p className="text-[10px] uppercase font-extrabold tracking-wider opacity-85 block leading-none">AJUSTES</p>
          <h2 className="text-xl font-black block mt-1 leading-none">Preferencias Visuales</h2>
        </div>
      </div>

      <div className="space-y-4">
        {/* PREFERENCIAS DE INTERFAZ (Modo Oscuro, Tamaños de Letra) */}
        <div className="bg-white/95 rounded-[28px] p-5 shadow-2xl border border-white/20 space-y-4">
          <div className="text-left flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-800">Aspecto de Interfaz</h3>
              <p className="text-[10.5px] text-slate-400 font-bold select-none mt-0.5">Personaliza el aspecto visual de TodoArchivos</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Control Modo Oscuro */}
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div className="text-left">
                <span className="text-xs font-black text-slate-700 block">Modo Oscuro</span>
                <span className="text-[10px] text-slate-400 font-semibold">Cambia entre colores claros y oscuros</span>
              </div>
              
              <button
                type="button"
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  darkMode ? 'bg-emerald-500' : 'bg-slate-250'
                }`}
                role="switch"
                aria-checked={darkMode}
                id="toggle-dark-mode"
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Control Tamaño de Fuente */}
            <div className="space-y-2">
              <div className="text-left">
                <span className="text-xs font-black text-slate-700 block">Tamaño de Letra</span>
                <span className="text-[10px] text-slate-400 font-semibold">Modifica el tamaño de los textos en la aplicación</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {(['sm', 'base', 'lg', 'xl'] as const).map((fs) => {
                  const label = fs === 'sm' ? 'Chico' : fs === 'base' ? 'Normal' : fs === 'lg' ? 'Grande' : 'Súper';
                  const active = fontSize === fs;
                  return (
                    <button
                      key={fs}
                      type="button"
                      onClick={() => handleFontSizeChange(fs)}
                      className={`py-2 px-1 text-[10px] font-black rounded-xl border text-center transition-all cursor-pointer ${
                        active 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-650'
                      }`}
                      id={`font-btn-${fs}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Container Card */}
        <div className="bg-white/90 rounded-[28px] p-5 shadow-xl border border-white/20 text-left">
          <div className="flex items-center gap-2 mb-3.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold text-[#10b981] leading-none block">Vista Previa</span>
              <span className="font-extrabold text-xs text-slate-800 leading-none mt-1 block">Demostración de tipografía</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-105 space-y-2 select-text">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                Archivo_Doc_v2.pdf
              </span>
              <span className="text-[8.5px] font-bold text-slate-500">Hace 5 min</span>
            </div>
            
            {/* Dynamic visual preview based on size state */}
            <p className={`font-semibold text-slate-800 leading-snug ${
              fontSize === 'sm' ? 'text-xs' :
              fontSize === 'base' ? 'text-sm' :
              fontSize === 'lg' ? 'text-base' : 'text-lg'
            }`}>
              Este es un texto de ejemplo con el tamaño seleccionado para validar la legibilidad de tus contenidos.
            </p>
            
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase">
                {fontSize.toUpperCase()}
              </span>
              <span className="text-[8px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase">
                {darkMode ? 'MODO OSCURO' : 'MODO CLARO'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
