/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Phone, Mail, Tag, Save, CheckCircle, ArrowLeft, Camera, Trash2, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';
import { updateProfile, deleteUserAccount } from '../db';

interface AccountViewProps {
  currentUser: UserProfile;
  onUpdateSuccess: (updated: UserProfile | null) => void;
  onBack: () => void;
}

const AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
];

export default function AccountView({ currentUser, onUpdateSuccess, onBack }: AccountViewProps) {
  const [name, setName] = useState<string>(currentUser.name);
  const [alias, setAlias] = useState<string>(currentUser.alias);
  const [phone, setPhone] = useState<string>(currentUser.phone);
  const [avatarUrl, setAvatarUrl] = useState<string>(currentUser.avatar_url || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    statusType: 'success' | 'error' | 'warning';
    isNotification?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    statusType: 'warning',
    onConfirm: () => {},
  });

  // Handle custom upload image 
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !alias.trim() || !phone.trim()) {
      alert('Por favor completa todos los campos.');
      return;
    }

    setSaving(true);
    setSuccess(false);

    const res = await updateProfile(currentUser.id, {
      name,
      alias,
      phone,
      avatar_url: avatarUrl || undefined
    });

    setSaving(false);
    if (res.success && res.data) {
      setSuccess(true);
      onUpdateSuccess(res.data);
      setTimeout(() => setSuccess(false), 2000);
    } else {
      alert(res.error || 'Error al actualizar perfil');
    }
  };

  const handleDeleteAccount = () => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar tu Cuenta?',
      message: 'Esta acción es irreversible y borrará de forma permanente tu perfil de usuario, todos tus archivos subidos y tus comentarios tanto de Supabase como localmente.',
      statusType: 'error',
      isNotification: false,
      onConfirm: async () => {
        setSaving(true);
        try {
          const res = await deleteUserAccount(currentUser.id);
          if (res.success) {
            setConfirmModal({
              isOpen: true,
              title: 'Cuenta Eliminada',
              message: 'Tu cuenta ha sido eliminada con éxito. ¡Esperamos volver a verte pronto!',
              statusType: 'success',
              isNotification: true,
              onConfirm: () => {
                onUpdateSuccess(null); // Desconecta la sesión en App.tsx
              }
            });
          } else {
            setConfirmModal({
              isOpen: true,
              title: 'Error al Eliminar',
              message: res.error || 'Ocurrió un error al intentar eliminar tu cuenta desde Supabase.',
              statusType: 'error',
              isNotification: true,
              onConfirm: () => {}
            });
          }
        } catch (err: any) {
          setConfirmModal({
            isOpen: true,
            title: 'Error de Red / Excepción',
            message: err.message || 'Error inesperado.',
            statusType: 'error',
            isNotification: true,
            onConfirm: () => {}
          });
        } finally {
          setSaving(false);
        }
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col p-5 pb-24 h-full overflow-y-auto text-left select-none animate-in slide-in-from-right-4 duration-300">
      
      {/* Title block with back nav button */}
      <div className="flex items-center gap-2.5 mb-5 mt-1">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer"
          id="account-back-btn"
        >
          <ArrowLeft className="w-4 h-4 ml-[-1px]" />
        </button>
        <div className="text-white">
          <p className="text-[10px] uppercase font-extrabold tracking-wider opacity-85 leading-none">Mi Perfil</p>
          <h2 className="text-xl font-black block mt-1 leading-none">Ajustes de Cuenta</h2>
        </div>
      </div>

      <div className="bg-white/95 rounded-[28px] p-5 shadow-2xl border border-white/20 space-y-4">
        
        {/* Profile Avatar Editor section */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-20 h-20 rounded-full border-2 border-[#10b981] shadow bg-slate-100 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Active profile picture" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-400 font-bold text-2xl uppercase select-none">{name.charAt(0) || 'U'}</div>
            )}
            
            <label className="absolute inset-0 bg-black/40 hover:bg-black/55 text-white cursor-pointer opacity-0 hover:opacity-100 flex items-center justify-center flex-col transition-all text-center">
              <Camera className="w-5 h-5 text-white" />
              <span className="text-[8px] font-bold mt-0.5 uppercase tracking-wide">Editar</span>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          
          <span className="text-xs text-slate-800 font-bold mt-2">@{currentUser.alias}</span>
          <span className="text-[10px] text-slate-400 font-bold">Inscrito: {new Date(currentUser.created_at).toLocaleDateString()}</span>
          
          {/* Avatar selector presets */}
          <div className="flex gap-2.5 mt-3 justify-center">
            {AVATARS.map((av, index) => (
              <button
                key={index}
                onClick={() => setAvatarUrl(av)}
                className={`w-8.5 h-8.5 rounded-full overflow-hidden border-2 transition-all ${
                  avatarUrl === av ? 'border-[#10b981] scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={av} alt="Preset select" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>

        {/* Input Forms */}
        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Nombre Personas */}
          <div className="space-y-1">
            <label className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-450 block ml-1 select-none">Nombre de la persona</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-all font-semibold"
                required
              />
            </div>
          </div>

          {/* Alias */}
          <div className="space-y-1">
            <label className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-450 block ml-1 select-none font-sans">Alias único / Tag</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Tag className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold focus:outline-none cursor-not-allowed"
                disabled
                title="El alias único de registro móvil no puede modificarse."
              />
            </div>
            <p className="text-[9px] text-slate-400 font-medium ml-1">El alias móvil es fijo para identificar las firmas de chats.</p>
          </div>

          {/* Teléfono */}
          <div className="space-y-1">
            <label className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-450 block ml-1 select-none">Número de Teléfono</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-all font-semibold"
                required
              />
            </div>
          </div>

          {/* Email block (Locked for identification) */}
          <div className="space-y-1">
            <label className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-450 block ml-1 select-none">Correo electrónico</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-455 cursor-not-allowed font-medium"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] active:scale-[0.98] cursor-pointer"
            id="account-save-btn"
          >
            {success ? (
              <>
                <CheckCircle className="w-4 h-4 animate-bounce" />
                <span>Perfil Guardado</span>
              </>
            ) : saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </form>

        {/* SECCIÓN DE PELIGRO: ELIMINAR CUENTA */}
        <div className="pt-4 border-t border-slate-150 dark:border-slate-850 mt-5 space-y-3">
          <div className="text-left">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-red-500 block ml-1 select-none">Zona de Peligro</span>
            <span className="text-[9.5px] text-slate-400 font-bold block ml-1 leading-snug">
              Eliminar esta cuenta borrará de forma permanente tus datos personales, archivos publicados y comentarios tanto locales como de Supabase.
            </span>
          </div>

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={saving}
            className="w-full py-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-650 dark:text-red-450 hover:text-red-750 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            id="account-delete-btn"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-500" />
            <span className="text-red-600 dark:text-red-500 font-bold">Eliminar Cuenta Permanentemente</span>
          </button>
        </div>
      </div>

      {/* Custom UI Confirm Modal to perfectly avoid browser iframe sandbox dialog blocks */}
      {confirmModal.isOpen && (
        <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-250">
          <div className="bg-white rounded-[24px] p-5 w-full max-w-xs shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border shrink-0 ${
                confirmModal.statusType === 'success' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : confirmModal.statusType === 'error'
                  ? 'bg-rose-50 text-rose-600 border-rose-100'
                  : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {confirmModal.statusType === 'success' ? (
                  <CheckCircle className="w-6 h-6 stroke-[2]" />
                ) : (
                  <ShieldAlert className="w-6 h-6 stroke-[2]" />
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{confirmModal.title}</h4>
                <p className="text-[11px] text-slate-500 font-bold mt-2 leading-relaxed text-center">{confirmModal.message}</p>
              </div>
            </div>
            
            <div className="flex gap-2.5 mt-5">
              {!confirmModal.isNotification && (
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2 rounded-xl text-xs font-extrabold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={() => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  confirmModal.onConfirm();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold text-white transition-colors shadow-sm cursor-pointer ${
                  confirmModal.statusType === 'error' 
                    ? 'bg-rose-500 hover:bg-rose-600' 
                    : 'bg-[#10b981] hover:bg-emerald-600'
                }`}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
