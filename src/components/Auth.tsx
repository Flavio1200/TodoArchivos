/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Key, Mail, Phone, Tag, Camera, LogIn, UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { registerUser, loginUser } from '../db';
import { UserProfile } from '../types';

interface AuthProps {
  onAuthSuccess: (user: UserProfile) => void;
}

// Preset avatars for easy quick select
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
];

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [alias, setAlias] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Custom file upload avatar state
  const [customAvatarName, setCustomAvatarName] = useState<string>('');

  const handleCustomAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomAvatarName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (isLogin) {
      if (!email || !password) {
        setErrorMsg('Por favor completa todos los campos.');
        setLoading(false);
        return;
      }
      
      const res = await loginUser(email, password);
      if (res.success && res.data) {
        onAuthSuccess(res.data);
      } else {
        setErrorMsg(res.error || 'Credenciales incorrectas');
      }
    } else {
      if (!name || !alias || !email || !phone || !password) {
        setErrorMsg('Por favor completa los campos requeridos.');
        setLoading(false);
        return;
      }

      const res = await registerUser({
        name,
        alias,
        email,
        phone,
        avatar_url: avatarUrl || undefined
      }, password);

      if (res.success && res.data) {
        onAuthSuccess(res.data);
      } else {
        setErrorMsg(res.error || 'Error al registrar usuario');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl md:flex-row min-h-screen md:bg-[linear-gradient(0deg,#111B1F,#075427)] overflow-hidden">
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden bg-gradient-to-b from-[#10b981]/25 via-[#06b6d4]/10 to-transparent border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />
        
        <div className="z-10">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/35 shadow-xl p-2 relative overflow-hidden hover:rotate-3 transition-transform duration-300">
              <img 
                src="/app_logo.jpg" 
                alt="TodoArchivos Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight font-sans text-white leading-none">
                TodoArchivos
              </h1>
            </div>
          </div>

          <div className="mt-12 space-y-6">
            <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
              Sube y comparte tus archivos en tiempo real.
            </h2>
            <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-md">
              La plataforma definitiva para quienes busquen almacenar sus archivos, unirse a canales grupales y chatear sobre documentos clave de forma segura todo en un solo lugar.
            </p>
          </div>
        </div>

        <div className="z-10 my-8 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/25 text-emerald-400 flex items-center justify-center font-bold text-sm mb-2.5">📂</span>
            <h4 className="font-bold text-xs text-white">Gestor de Archivos</h4>
            <p className="text-[10.5px] text-slate-400 font-semibold mt-1">Sube documentos, fotos, videos, audios y enlaces web al instante.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="w-8 h-8 rounded-lg bg-cyan-500/25 text-cyan-400 flex items-center justify-center font-bold text-sm mb-2.5">💬</span>
            <h4 className="font-bold text-xs text-white">Foros de Discusión</h4>
            <p className="text-[10.5px] text-slate-400 font-semibold mt-1">Cada archivo tiene su propio chat interactivo en la comunidad.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <span className="w-8 h-8 rounded-lg bg-indigo-500/25 text-indigo-400 flex items-center justify-center font-bold text-sm mb-2.5">👥</span>
            <h4 className="font-bold text-xs text-white">Grupos de Interés</h4>
            <p className="text-[10.5px] text-slate-400 font-semibold mt-1">Encuentra o crea salas para compartir materiales con tu equipo.</p>
          </div>
        </div>

        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider z-10 select-none">
          © 2026 TodoArchivos
        </div>
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-between px-6 py-8 md:py-12 overflow-y-auto md:bg-[linear-gradient(0deg,#111B1F,#075427)]">
        <div className="flex md:hidden flex-col items-center justify-center my-4">
          <div className="w-20 h-20 rounded-[28px] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl mb-3 relative overflow-hidden p-2.5">
            <img 
              src="/app_logo.jpg" 
              alt="TodoArchivos Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-white font-extrabold text-2xl tracking-tight leading-none drop-shadow-md font-sans">
            TodoArchivos
          </h1>
          <p className="text-white/80 text-[10.5px] mt-1 text-center max-w-xs px-2 font-semibold">
            {isLogin ? 'Ingresa para compartir y chatear sobre tus archivos' : 'Crea tu perfil móvil único para comenzar'}
          </p>
        </div>

        <div className="w-full max-w-sm mx-auto my-auto">
          <div className="w-full bg-white dark:bg-[#111827] rounded-[28px] p-6 lg:p-7 shadow-2xl border border-slate-100 dark:border-white/5">
            <h2 className="text-[#10b981] font-black text-xl mb-4 text-center tracking-tight">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>

            {errorMsg && (
              <div className="mb-4 bg-red-50 dark:bg-rose-950/20 text-red-600 dark:text-rose-400 text-xs p-3 rounded-xl border border-red-200 dark:border-rose-900/45 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-bold leading-normal">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAction} className="space-y-3.5">
              {!isLogin && (
                <>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Nombre de la persona"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] dark:focus:bg-slate-900 focus:bg-white transition-all font-semibold"
                      required
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Tag className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Alias único (ej. AndresM)"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] dark:focus:bg-slate-900 focus:bg-white transition-all font-semibold"
                      required
                    />
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] dark:focus:bg-slate-900 focus:bg-white transition-all font-semibold"
                      required
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder={isLogin ? "Correo o Alias" : "Correo electrónico"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] dark:focus:bg-slate-900 focus:bg-white transition-all font-semibold"
                  required
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] dark:focus:bg-slate-900 focus:bg-white transition-all font-semibold"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {!isLogin && (
                <div className="space-y-2 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 block">
                    Foto de Perfil (Opcional)
                  </label>
                  
                  {/* Presets Grid */}
                  <div className="flex gap-2.5 mb-1.5 justify-center">
                    {AVATAR_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(p)}
                        className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                          avatarUrl === p ? 'border-[#10b981] scale-110 shadow' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={p} alt="Preset avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-1 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg py-1.5 px-3 text-[10.5px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all font-bold">
                      <Camera className="w-3.5 h-3.5 text-slate-450" />
                      <span>{customAvatarName ? 'Nueva foto!' : 'Subir foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCustomAvatar}
                        className="hidden"
                      />
                    </label>
                    {avatarUrl && !AVATAR_PRESETS.includes(avatarUrl) && (
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
                        <img src={avatarUrl} alt="Custom profile preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] active:scale-[0.98] cursor-pointer ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : isLogin ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Ingresar</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Registrarse gratis</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrorMsg('');
                }}
                className="text-[11px] font-extrabold text-sky-500 hover:text-sky-700 transition-colors cursor-pointer"
              >
                {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes una cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 md:hidden text-center text-white/50 text-[9px] font-bold uppercase tracking-wider">
          © 2026 TodoArchivos
        </div>
      </div>
    </div>
  );
}
