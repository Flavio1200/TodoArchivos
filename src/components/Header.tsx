/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MoreVertical, User, Settings, LogOut, Database, Heart, Shield, Bell } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  title: string;
  currentUser: UserProfile | null;
  onNavigate: (view: 'principal' | 'subir' | 'publicaciones' | 'cuenta' | 'ajustes' | 'donaciones' | 'politicas') => void;
  onLogout: () => void;
  supabaseConnected: boolean;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
}

export default function Header({ 
  title, 
  currentUser, 
  onNavigate, 
  onLogout, 
  supabaseConnected,
  unreadNotificationsCount,
  onOpenNotifications
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);


  const handleItemClick = (view: 'principal' | 'subir' | 'publicaciones' | 'cuenta' | 'ajustes' | 'donaciones' | 'politicas') => {
    onNavigate(view);
    setDropdownOpen(false);
  };

  return (
    <div className="relative z-50">
      {/* Curved white header exactly matching user's image */}
      <div className="bg-white/95 backdrop-blur-sm mx-0.5 mt-0.5 md:mx-0 md:mt-0 rounded-b-[24px] md:rounded-b-none px-6 py-4 shadow-md flex justify-between items-center transition-all border-b border-white/40">
        <div className="flex items-center gap-2">
          {currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt="Mini profile"
              className="w-8 h-8 rounded-full border-2 border-emerald-500 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center text-white text-xs font-bold font-sans">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
          )}
          <span className="text-[#10b981] font-bold text-xl tracking-tight pr-1.5 border-r border-slate-100 font-sans">
            {title}
          </span>
          <span className="text-slate-400 font-bold text-xs select-none">
            @{currentUser?.alias || 'anon'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={onOpenNotifications}
            className="w-9 h-9 flex items-center justify-center text-[#10b981] hover:bg-slate-100/70 rounded-full transition-all relative focus:outline-none cursor-pointer"
            id="header-bell-btn"
            title="Centro de Notificaciones"
          >
            <Bell className="w-5.5 h-5.5 stroke-[2.2]" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white font-extrabold text-[8px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center border border-white ring-1 ring-red-400 animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <div className="relative md:hidden">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 flex items-center justify-center text-[#10b981] hover:bg-slate-100/70 rounded-full transition-all focus:outline-none cursor-pointer"
              id="header-options-btn"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)}
              />
              
              <div 
                className="absolute right-0 mt-2.5 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
                id="header-options-dropdown"
              >
                <div className="px-4 py-1.5 border-b border-slate-100 mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Menú Móvil</p>
                  <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.name}</p>
                </div>
                
                <button
                  onClick={() => handleItemClick('cuenta')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-slate-700 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <User className="w-4 h-4 text-emerald-500" />
                  <span>Mi Cuenta</span>
                </button>

                <button
                  onClick={() => handleItemClick('donaciones')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-slate-700 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                  <span>Realizar Donación</span>
                </button>

                <button
                  onClick={() => handleItemClick('ajustes')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-slate-700 flex items-center gap-2.5 transition-colors font-medium justify-between"
                >
                  <span className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-sky-500" />
                    <span>Ajustes</span>
                  </span>
                  <span className={`w-2 h-2 rounded-full ${supabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </button>

                <button
                  onClick={() => handleItemClick('politicas')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs text-slate-700 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>Políticas</span>
                </button>

                <hr className="my-1.5 border-slate-100" />

                <button
                  onClick={() => {
                    onLogout();
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-xs text-red-600 flex items-center gap-2.5 transition-colors font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </>
          )}
          </div>
        </div> 
      </div>
    </div>
  );
}
