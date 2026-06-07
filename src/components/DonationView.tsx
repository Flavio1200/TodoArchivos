/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Heart, Copy, Check, ArrowLeft, Landmark, Phone, 
  CreditCard, ExternalLink, Calendar, DollarSign, Send, CheckCircle2 
} from 'lucide-react';

interface DonationViewProps {
  onBack: () => void;
}

export default function DonationView({ onBack }: DonationViewProps) {
  // Clipboard states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form states
  const [method, setMethod] = useState<'paypal' | 'transferencia'>('transferencia');
  const [amount, setAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Bank Info constants
  const BANK_INFO = {
    bank: 'Banco Mercantil',
    phone: '0424-4034320',
    idCard: '29867716',
    owner: 'Soporte TodoArchivos'
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Por favor, ingresa un monto válido.');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setAmount('');
      setReference('');
      setNotes('');
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col p-5 pb-24 h-full overflow-y-auto text-left select-none animate-in slide-in-from-right-4 duration-300">
      
      {/* Title block with back nav button */}
      <div className="flex items-center gap-2.5 mb-5 mt-1">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer"
          id="donation-back-btn"
        >
          <ArrowLeft className="w-4 h-4 ml-[-1px]" />
        </button>
        <div className="text-white">
          <p className="text-[10px] uppercase font-extrabold tracking-wider opacity-85 leading-none">Apoyar Comunidad</p>
          <h2 className="text-xl font-black block mt-1 leading-none">Donaciones</h2>
        </div>
      </div>

      <div className="space-y-4">
        {/* Intro banner */}
        <div className="bg-gradient-to-tr from-emerald-500 to-teal-600 p-4 rounded-3xl text-white shadow-lg space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-300 fill-red-300 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider">¡Gracias por tu apoyo!</span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-95">
            Tu contribución ayuda a mantener encendidos los servidores de <strong>TodoArchivos</strong> para seguir compartiendo archivos sin límites de forma segura.
          </p>
        </div>

        {/* Bank Transfer Card */}
        <div className="bg-white/95 rounded-[28px] p-5 shadow-xl border border-white/20 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Landmark className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block leading-none">Opción Nacional</span>
              <h3 className="font-extrabold text-sm text-slate-800">Transferencia Bancaria (Pago Móvil)</h3>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
            {/* Bank Name */}
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Banco</span>
                <span className="font-bold text-slate-700">{BANK_INFO.bank}</span>
              </div>
              <button
                onClick={() => handleCopy(BANK_INFO.bank, 'bank')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-450 hover:text-emerald-500 transition-all cursor-pointer active:scale-95"
                title="Copiar Banco"
              >
                {copiedField === 'bank' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Phone Number */}
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Teléfono</span>
                <span className="font-semibold text-slate-800 font-mono">{BANK_INFO.phone}</span>
              </div>
              <button
                onClick={() => handleCopy(BANK_INFO.phone, 'phone')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-450 hover:text-emerald-500 transition-all cursor-pointer active:scale-95"
                title="Copiar Teléfono"
              >
                {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* ID Card (Cédula de Identidad) */}
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Cédula de Identidad (CI)</span>
                <span className="font-semibold text-slate-800 font-mono">V-{BANK_INFO.idCard}</span>
              </div>
              <button
                onClick={() => handleCopy(BANK_INFO.idCard, 'idCard')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-450 hover:text-emerald-500 transition-all cursor-pointer active:scale-95"
                title="Copiar Cédula"
              >
                {copiedField === 'idCard' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* PayPal Option Card */}
        <div className="bg-white/95 rounded-[28px] p-5 shadow-xl border border-white/20 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block leading-none">Opción Internacional</span>
              <h3 className="font-extrabold text-sm text-slate-800">Donar vía PayPal</h3>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50/50 to-sky-50 rounded-2xl p-4 border border-indigo-100 flex flex-col items-center text-center space-y-2.5">
            <p className="text-[10.5px] text-slate-500 leading-normal font-medium">
              Puedes cooperar instantáneamente utilizando tu cuenta PayPal o tarjeta de crédito internacional.
            </p>
            
            <a 
              href="https://paypal.me/tafileshare" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#0079c1] hover:bg-[#00457c] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <span>Ir a donar con PayPal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">paypal.me/tafileshare</span>
          </div>
        </div>

        {/* Report Donation simulated feedback form */}
        <div className="bg-white/95 rounded-[28px] p-5 shadow-xl border border-white/20 space-y-4">
          <div className="text-left">
            <h3 className="font-black text-sm text-slate-800">Reportar una Contribución</h3>
            <p className="text-[10.5px] text-slate-400 font-bold select-none mt-0.5">Ayúdanos a registrar tu aporte para darte créditos de súper usuario</p>
          </div>

          {submitSuccess ? (
            <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl text-center space-y-2.5 flex flex-col items-center py-5">
              <CheckCircle2 className="w-9 h-9 text-emerald-500 animate-bounce" />
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">¡Reporte Enviado Exitosamente!</h4>
              <p className="text-[10px] text-emerald-600 font-medium leading-relaxed max-w-xs">
                Hemos enviado tu reporte a soporte. Una vez verificado el pago en el backend, tu cuenta será destacada de forma especial en la comunidad.
              </p>
              <button 
                onClick={() => setSubmitSuccess(false)}
                className="mt-1 text-[10px] text-emerald-700 bg-emerald-100 hover:bg-emerald-150 border border-emerald-200 p-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer"
              >
                Reportar otra donación
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReport} className="space-y-3.5">
              
              {/* Method select tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMethod('transferencia')}
                  className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all ${
                    method === 'transferencia' ? 'bg-white shadow-sm text-[#10b981]' : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  Pago Móvil / Transf.
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('paypal')}
                  className={`flex-1 py-1.5 text-[10px] font-extrabold rounded-lg transition-all ${
                    method === 'paypal' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-500 hover:text-slate-850'
                  }`}
                >
                  PayPal
                </button>
              </div>

              {/* Amount Inputs */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-450 block ml-1">Monto de la donación</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <DollarSign className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder={method === 'paypal' ? 'Monto en USD (p.ej. 5.00)' : 'Monto en Bs. / USD'}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-450 block ml-1">Número de Referencia (últimos 4 u 8 dígitos)</label>
                <input
                  type="text"
                  placeholder="Ej: 8329482 o correo PayPal"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-all font-semibold font-mono"
                  required
                />
              </div>

              {/* Comment note */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-450 block ml-1">Comentario o notas (opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Escribe tu alias de TodoArchivos o algún mensaje..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-all font-semibold resize-none"
                />
              </div>

              {/* Submit Report Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Reportar Donación</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
