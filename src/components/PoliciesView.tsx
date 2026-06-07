/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, Shield, CheckCircle, Info, FileText } from 'lucide-react';

interface PoliciesViewProps {
  onBack: () => void;
}

export default function PoliciesView({ onBack }: PoliciesViewProps) {
  return (
    <div className="flex-1 flex flex-col p-5 pb-24 h-full overflow-y-auto text-left select-none animate-in slide-in-from-right-4 duration-300">
      
      {/* Back Heading */}
      <div className="flex items-center gap-2.5 mb-5 mt-1">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer"
          id="policies-back-btn"
        >
          <ArrowLeft className="w-4 h-4 ml-[-1px]" />
        </button>
        <div className="text-white">
          <p className="text-[10px] uppercase font-extrabold tracking-wider opacity-85 block leading-none">REGLAMENTO Y PRIVACIDAD</p>
          <h2 className="text-xl font-black block mt-1 leading-none">Políticas de TodoArchivos</h2>
        </div>
      </div>

      <div className="space-y-4">
        {/* Intro Highlight Banner */}
        <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-600/5 to-transparent p-5 rounded-[24px] border border-emerald-500/10 text-slate-800 dark:text-slate-300 shadow-sm relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none">
            <Shield className="w-32 h-32 text-emerald-500" />
          </div>
          
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-500/10 shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-snug">Espacio Libre, Seguro y Respetuoso</h3>
              <p className="text-[10.5px] text-slate-500 font-bold select-none leading-normal mt-1">
                Garantizamos la máxima privacidad de tus archivos e identidad mientras compartes tus experiencias.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Body Card */}
        <div className="bg-white/95 rounded-[28px] p-5 shadow-2xl border border-white/20 space-y-4">
          
          {/* Main Statement */}
          <div className="space-y-3.5">
            <p className="text-xs text-slate-600 font-bold leading-relaxed text-justify">
              El objetivo de <span className="text-emerald-600 font-black">TodoArchivos</span> es brindar un espacio en el cual puedas almacenar y compartir cualquier tipo de archivo ya sea a la comunidad o un grupo privado, y de ser posible crear una comunidad de personas que busquen compartir sus conocimientos y experiencias, siempre de forma educada y respetuosa.
            </p>
            
            <p className="text-xs text-slate-600 font-bold leading-relaxed text-justify">
              Por otro lado contarás con la seguridad de que tus datos y tu identidad son completamente privados, estos no serán vendidos a otras empresas o usados para realizar estudios por nosotros ya que, en caso de ser necesario estos se realizarán a través de encuestas y posts de la cuenta oficial de TodoArchivos, solamente se revisará tu cuenta en caso de incumplir algunas de las reglas impuestas las cuales son:
            </p>
          </div>

          {/* Rules List */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-3.5">
            <div className="flex items-center gap-1.5 border-b border-slate-200/60 pb-2 mb-1">
              <Info className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Reglas Normativas</span>
            </div>

            {/* Rule 1 */}
            <div className="flex gap-3.5 text-left">
              <div className="w-5.5 h-5.5 rounded-full bg-emerald-50 text-emerald-650 flex items-center justify-center text-[10.5px] font-black shrink-0 border border-emerald-100">
                1
              </div>
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                No se permite bajo ningún concepto la publicación de archivos o posts con propaganda a favor de organizaciones terroristas, contenido sexual explícito, actividades criminales o incentivos a cometer crímenes.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="flex gap-3.5 text-left">
              <div className="w-5.5 h-5.5 rounded-full bg-emerald-50 text-emerald-650 flex items-center justify-center text-[10.5px] font-black shrink-0 border border-emerald-100">
                2
              </div>
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                Cualquier uso de la aplicación con fines ilícitos queda estrictamente prohibida y en caso de incurrir en esto su cuenta será eliminada permanentemente.
              </p>
            </div>

            {/* Rule 3 */}
            <div className="flex gap-3.5 text-left">
              <div className="w-5.5 h-5.5 rounded-full bg-emerald-50 text-emerald-650 flex items-center justify-center text-[10.5px] font-black shrink-0 border border-emerald-100">
                3
              </div>
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                El compartir contenido político o corporativo puede ser sujeto a revisión y en caso de ameritarlo la suspensión temporal de la cuenta, esto debido a que el objetivo de TodoArchivos no es convertirse en un lugar de discusiones o polémicas.
              </p>
            </div>

            {/* Rule 4 */}
            <div className="flex gap-3.5 text-left">
              <div className="w-5.5 h-5.5 rounded-full bg-emerald-50 text-emerald-650 flex items-center justify-center text-[10.5px] font-black shrink-0 border border-emerald-100">
                4
              </div>
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                El uso de el nombre o logo de la marca para la creación de empresas, servicios o cuentas de redes sociales está prohibido.
              </p>
            </div>
          </div>

          {/* Footer of policies */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <p className="text-xs text-slate-600 font-bold leading-relaxed text-justify">
              Por último, ten en cuenta que TodoArchivos permite una libertad de expresión casi total (excepciones aplican) el romper las pocas normativas que hay ya dependería exclusivamente de ti, pero mientras las sigas podrás disfrutar de la mejor aplicación de publicación de contenido del mundo.
            </p>

            <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100/70 rounded-xl p-3 text-emerald-800">
              <CheckCircle className="w-4 h-4 text-[#10b981] shrink-0" />
              <span className="text-[10px] font-extrabold tracking-wide">
                Al usar la plataforma, declaras estar de acuerdo con estas pautas.
              </span>
            </div>
          </div>

        </div>

        {/* Minimal Stamp Brand */}
        <div className="flex items-center justify-center gap-1.5 py-4 text-[10px] text-slate-400 font-bold select-none uppercase tracking-widest">
          <FileText className="w-3.5 h-3.5" />
          <span>TodoArchivos Legal • 2026</span>
        </div>

      </div>
    </div>
  );
}
