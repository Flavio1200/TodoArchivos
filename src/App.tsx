/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Home, FilePlus, Globe, User, Settings, FolderClosed, Bell, Trash2, X, FileUp, Sparkles, Download, Users, LogOut, Heart, Shield } from 'lucide-react';
import { localDB, checkSupabaseConnection } from './db';
import { UserProfile, SharedFile, AppNotification } from './types';
import { triggerNotification, requestBrowserPermission } from './notificationsHelper';

import Auth from './components/Auth';
import Header from './components/Header';
import HomeView from './components/HomeView';
import UploadView from './components/UploadView';
import FeedView from './components/FeedView';
import ChatView from './components/ChatView';
import AccountView from './components/AccountView';
import SettingsView from './components/SettingsView';
import DonationView from './components/DonationView';
import GroupsView from './components/GroupsView';
import PoliciesView from './components/PoliciesView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [checkingConnection, setCheckingConnection] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'principal' | 'subir' | 'publicaciones' | 'cuenta' | 'ajustes' | 'donaciones' | 'grupos' | 'politicas'>('principal');
  const [activeChatFile, setActiveChatFile] = useState<SharedFile | null>(null);

  // Estados visuales de Tema y Escala de Fuentes
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('todoarchivos-theme') === 'dark';
  });
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>(() => {
    return (localStorage.getItem('todoarchivos-font-size') as any) || 'base';
  });

  // Push Notifications States
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('todoarchivos-notifications-list_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return [
      {
        id: 'welcome_m_1',
        title: '¡Bienvenido a TodoArchivos!',
        message: 'Tu sistema de almacenamiento compartido y comunidad se ha configurado de forma exitosa.',
        type: 'system',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
        read: false
      },
      {
        id: 'welcome_m_2',
        title: 'Actualización Disponible v1.1.5',
        message: 'Nueva versión con sincronización instantánea con Supabase y políticas RLS reparadas.',
        type: 'update',
        createdAt: new Date(Date.now() - 1050 * 60 * 60 * 2).toISOString(), // ~2 hours ago
        read: true
      }
    ];
  });

  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'upload_download' | 'update' | 'system'>('all');
  const [browserPermission, setBrowserPermission] = useState<'default' | 'granted' | 'denied'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission as any;
    }
    return 'default';
  });

  const handleVisualChange = () => {
    setDarkMode(localStorage.getItem('todoarchivos-theme') === 'dark');
    setFontSize((localStorage.getItem('todoarchivos-font-size') as any) || 'base');
  };

  // Synchronize browser native permission status when opening Notification Center
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission as any);
    }
  }, [isNotificationsOpen]);

  // General App listener for custom push events
  useEffect(() => {
    const handlePushEvent = (e: Event) => {
      const customEvent = e as CustomEvent<AppNotification>;
      if (customEvent.detail) {
        const newNotif = customEvent.detail;
        setNotifications((prev) => {
          const updated = [newNotif, ...prev];
          localStorage.setItem('todoarchivos-notifications-list_v1', JSON.stringify(updated));
          return updated;
        });
        
        // Push floating in-app toast alert banner on current screen
        setActiveToast(newNotif);
      }
    };
    
    window.addEventListener('todoarchivos-push-event', handlePushEvent);
    return () => {
      window.removeEventListener('todoarchivos-push-event', handlePushEvent);
    };
  }, []);

  // Toast auto-dismiss effect
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Notification action handlers
  const handleMarkAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('todoarchivos-notifications-list_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('todoarchivos-notifications-list_v1', JSON.stringify([]));
  };

  const handleMarkSingleRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('todoarchivos-notifications-list_v1', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRequestNativePermission = async () => {
    const perm = await requestBrowserPermission();
    setBrowserPermission(perm as any);
    if (perm === 'granted') {
      triggerNotification(
        '¡Notificaciones Activas!',
        'Las notificaciones nativas de TodoArchivos están activadas correctamente.',
        'system'
      );
    }
  };

  const simulateAppUpdate = () => {
    triggerNotification(
      'Actualización del Sistema',
      'Nueva versión v1.1.8: velocidades de subida incrementadas, reproductor de audio optimizado y parches de RLS.',
      'update'
    );
  };

  const getFilteredNotifications = () => {
    switch (notificationFilter) {
      case 'upload_download':
        return notifications.filter(n => ['upload', 'download', 'publish'].includes(n.type));
      case 'update':
        return notifications.filter(n => n.type === 'update');
      case 'system':
        return notifications.filter(n => n.type === 'system');
      default:
        return notifications;
    }
  };

  const formatTimeAgo = (isoDate: string) => {
    try {
      const now = new Date();
      const past = new Date(isoDate);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return 'Ahora';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      return past.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return 'Reciente';
    }
  };

  const verifyConnection = async () => {
    setCheckingConnection(true);
    const ok = await checkSupabaseConnection();
    setConnectionError(!ok);
    setSupabaseConnected(ok);
    setCheckingConnection(false);
  };

  // Sync state and connection on boot
  useEffect(() => {
    const user = localDB.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    const config = localDB.getSupabaseConfig();
    setSupabaseConnected(config.connected);
    verifyConnection();
  }, []);

  const handleLogout = () => {
    localDB.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentTab('principal');
    setActiveChatFile(null);
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentTab('principal');
  };

  // Callback whenever supabase URL or credentials change
  const handleConfigChanged = () => {
    const config = localDB.getSupabaseConfig();
    setSupabaseConnected(config.connected);
  };

  // Get human friendly title based on tab
  const getHeaderTitle = () => {
    switch (currentTab) {
      case 'principal':
        return 'Inicio';
      case 'subir':
        return 'Subir Archivo';
      case 'publicaciones':
        return 'Publicaciones';
      case 'cuenta':
        return 'Mi Cuenta';
      case 'ajustes':
        return 'Ajustes';
      case 'donaciones':
        return 'Donaciones';
      case 'grupos':
        return 'Grupos de Comunidad';
      case 'politicas':
        return 'Políticas';
      default:
        return 'TodoArchivos';
    }
  };

  return (
    <div className={`w-full min-h-screen flex flex-col relative ${darkMode ? 'dark bg-[linear-gradient(0deg,#111B1F,#075427)] text-slate-100' : 'bg-gradient-to-tr from-[#10b981] via-[#06b6d4] to-[#0ea5e9] text-slate-900'} transition-all duration-300`}>
      <div className={`flex-1 flex flex-col md:flex-row w-full max-w-[1440px] mx-auto p-0 md:p-4 lg:p-6 gap-6 relative ${darkMode ? 'dark-theme' : ''} font-scale-${fontSize}`}>
        {checkingConnection ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[450px]">
            <div className="w-14 h-14 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-5" />
            <h3 className="text-base font-black text-white">Verificando conexión segura...</h3>
            <p className="text-slate-200 text-[11px] mt-2 max-w-sm font-semibold">
              Conectándose de forma directa con la base de datos central de Supabase.
            </p>
          </div>
        ) : connectionError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[450px] bg-slate-900/60 backdrop-blur-md rounded-[28px] border border-white/10 max-w-2xl mx-auto my-auto shadow-2xl">
            <div className="w-16 h-16 bg-red-400/10 text-red-400 rounded-2xl flex items-center justify-center border border-red-500/20 mb-5 shadow-lg shadow-red-500/5 animate-pulse">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-white tracking-tight">⚠️ Conexión no disponible</h3>
            <p className="text-slate-300 text-xs mt-3 max-w-md font-medium leading-relaxed">
              No es posible acceder a la aplicación. Verifica tu conexión a internet o intenta más tarde, ya que la base de datos de Supabase podría encontrarse fuera de servicio o bajo mantenimiento en este momento.
            </p>
            <button
              onClick={verifyConnection}
              className="mt-6 px-6 py-3 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/15 cursor-pointer transition-colors"
            >
              Reintentar Conexión
            </button>
          </div>
        ) : !currentUser ? (
          <Auth onAuthSuccess={handleAuthSuccess} />
        ) : (
          <>
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex flex-col w-72 shrink-0 bg-white/95 dark:bg-[#121e1a]/90 backdrop-blur-md rounded-[28px] border border-slate-100 dark:border-white/10 p-5 shadow-xl justify-between overflow-y-auto z-45">
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 px-2">
                  <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 border border-[#10b981]/20 flex items-center justify-center">
                    <img src="/app_logo.jpg" alt="Logo" className="w-6.5 h-6.5 object-contain" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-white leading-none">TodoArchivos</h2>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentTab('cuenta')}
                  className="w-full text-left p-3.5 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-200/55 shrink-0 bg-slate-200">
                    <img src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt={currentUser.name} className="w-full h-full object-cover text-xs" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate">{currentUser.name}</h4>
                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">@{currentUser.alias}</span>
                  </div>
                </button>

                <nav className="space-y-1">
                  {[
                    { id: 'principal', lbl: 'Inicio', ico: Home },
                    { id: 'subir', lbl: 'Subir Archivo', ico: FilePlus },
                    { id: 'publicaciones', lbl: 'Comunidad Feed', ico: Globe },
                    { id: 'grupos', lbl: 'Grupos Temáticos', ico: Users },
                    { id: 'cuenta', lbl: 'Mi Cuenta', ico: User },
                    { id: 'ajustes', lbl: 'Ajustes', ico: Settings },
                    { id: 'donaciones', lbl: 'Hacer Donación', ico: Heart },
                    { id: 'politicas', lbl: 'Políticas RLS', ico: Shield },
                  ].map((item) => {
                    const Icon = item.ico;
                    const isActive = currentTab === item.id || (item.id === 'publicaciones' && currentTab === 'groups') || (item.id === 'publicaciones' && currentTab === 'grupos');
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentTab(item.id as any)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#10b981] text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.lbl}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Visual adjustment controls & Logout */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-500 hover:text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black transition-colors cursor-pointer border border-rose-100/10"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </aside>

            {/* MAIN COMPONENT VIEW CONTAINER */}
            <div className="flex-1 flex flex-col h-full min-w-0 w-full md:w-full bg-white/30 dark:bg-[#111827]/30 backdrop-blur-md rounded-none md:rounded-[28px] border-0 md:border border-slate-100 dark:border-white/10 overflow-hidden relative shadow-lg">

              {/* Header Curved White Bar */}
              <Header
                title={getHeaderTitle()}
                currentUser={currentUser}
                onNavigate={(view) => setCurrentTab(view)}
                onLogout={handleLogout}
                supabaseConnected={supabaseConnected}
                unreadNotificationsCount={notifications.filter(n => !n.read).length}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
              />

              {/* Core View Router Container */}
              <div className="flex-1 overflow-hidden relative">
                {currentTab === 'principal' && (
                  <HomeView
                    currentUser={currentUser}
                    onOpenChat={(f) => setActiveChatFile(f)}
                    supabaseConnected={supabaseConnected}
                  />
                )}

                {currentTab === 'subir' && (
                  <UploadView
                    currentUser={currentUser}
                    onUploadSuccess={() => setCurrentTab('principal')}
                  />
                )}

                {currentTab === 'publicaciones' && (
                  <FeedView
                    currentUser={currentUser}
                    onOpenChat={(f) => setActiveChatFile(f)}
                    supabaseConnected={supabaseConnected}
                    onOpenGroups={() => setCurrentTab('grupos')}
                  />
                )}

                {currentTab === 'grupos' && (
                  <GroupsView
                    currentUser={currentUser}
                    onOpenChat={(f) => setActiveChatFile(f)}
                    onBack={() => setCurrentTab('publicaciones')}
                  />
                )}

                {currentTab === 'cuenta' && (
                  <AccountView
                    currentUser={currentUser}
                    onUpdateSuccess={(updated) => setCurrentUser(updated)}
                    onBack={() => setCurrentTab('principal')}
                  />
                )}

                {currentTab === 'ajustes' && (
                  <SettingsView
                    onBack={() => setCurrentTab('principal')}
                    onConfigChange={handleConfigChanged}
                    onVisualChange={handleVisualChange}
                  />
                )}

                {currentTab === 'donaciones' && (
                  <DonationView
                    onBack={() => setCurrentTab('principal')}
                  />
                )}

                {currentTab === 'politicas' && (
                  <PoliciesView
                    onBack={() => setCurrentTab('principal')}
                  />
                )}
              </div>

          {/* Android Sticky Bottom Tab Bar (First 3 view options as requested) */}
          {['principal', 'subir', 'publicaciones', 'grupos'].includes(currentTab) && (
            <div className="md:hidden absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md px-6 py-2.5 shadow-xl border-t border-slate-100 flex justify-around items-center z-45 rounded-t-[20px] mx-0.5">
              {/* Home/Inicio button tab */}
              <button
                onClick={() => setCurrentTab('principal')}
                className={`flex flex-col items-center justify-center py-1 flex-1 transition-all focus:outline-none cursor-pointer ${
                  currentTab === 'principal' ? 'text-[#10b981] scale-105' : 'text-slate-400 hover:text-slate-650'
                }`}
                title="Inicio"
                id="navbar-btn-principal"
              >
                <Home className="w-5.5 h-5.5 stroke-[2.2]" />
                <span className="text-[9.5px] font-extrabold mt-0.5">Inicio</span>
              </button>

              {/* Upload Item button tab */}
              <button
                onClick={() => setCurrentTab('subir')}
                className={`flex flex-col items-center justify-center py-1 flex-1 transition-all focus:outline-none cursor-pointer ${
                  currentTab === 'subir' ? 'text-[#10b981] scale-105' : 'text-slate-400 hover:text-slate-650'
                }`}
                title="Subir Archivo"
                id="navbar-btn-subir"
              >
                <FilePlus className="w-5.5 h-5.5 stroke-[2.2]" />
                <span className="text-[9.5px] font-extrabold mt-0.5">Subir</span>
              </button>

              {/* Public Feed / Community shares tab */}
              <button
                onClick={() => setCurrentTab('publicaciones')}
                className={`flex flex-col items-center justify-center py-1 flex-1 transition-all focus:outline-none cursor-pointer ${
                  currentTab === 'publicaciones' || currentTab === 'grupos' ? 'text-[#10b981] scale-105' : 'text-slate-400 hover:text-slate-650'
                }`}
                title="Publicaciones"
                id="navbar-btn-publicaciones"
              >
                <Globe className="w-5.5 h-5.5 stroke-[2.2]" />
                <span className="text-[9.5px] font-extrabold mt-0.5">Comunidad</span>
              </button>
            </div>
          )}

          {/* Dynamic Active comment Drawer Overlay */}
          {activeChatFile && (
            <ChatView
              file={activeChatFile}
              currentUser={currentUser}
              onClose={() => setActiveChatFile(null)}
              supabaseConnected={supabaseConnected}
            />
          )}

          {/* Custom Floating In-App Push Notification Toast Banner */}
          {activeToast && (
            <div 
              onClick={() => {
                setActiveToast(null);
                setIsNotificationsOpen(true);
              }}
              className="absolute top-22 inset-x-4 bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-start gap-3 z-55 cursor-pointer animate-in slide-in-from-top duration-300 backdrop-blur-md"
            >
              <div className={`p-2 rounded-xl text-white ${
                activeToast.type === 'upload' ? 'bg-emerald-500' :
                activeToast.type === 'download' ? 'bg-cyan-500' :
                activeToast.type === 'publish' ? 'bg-indigo-500' :
                activeToast.type === 'update' ? 'bg-amber-500' : 'bg-slate-600'
              }`}>
                {activeToast.type === 'upload' && <FileUp className="w-4 h-4 text-white" />}
                {activeToast.type === 'download' && <Download className="w-4 h-4 text-white" />}
                {activeToast.type === 'publish' && <Globe className="w-4 h-4 text-white" />}
                {activeToast.type === 'update' && <Sparkles className="w-4 h-4 text-white" />}
                {activeToast.type === 'system' && <Bell className="w-4 h-4 text-white" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-400">
                    Notificación Push
                  </span>
                  <span className="text-[8px] text-white/50 font-bold">Ahora</span>
                </div>
                <h5 className="text-[12px] font-black leading-tight mt-0.5 truncate text-white">
                  {activeToast.title}
                </h5>
                <p className="text-[10px] text-white/80 font-medium leading-tight mt-1 line-clamp-2">
                  {activeToast.message}
                </p>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveToast(null);
                }}
                className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Notification Center Drawer component */}
          {isNotificationsOpen && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex z-55 animate-in fade-in duration-200">
              <div 
                className="flex-1" 
                onClick={() => setIsNotificationsOpen(false)}
              />
              
              <div 
                className="w-full max-w-xs bg-white rounded-l-[28px] h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
                id="notification-center-drawer"
              >
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-[#10b981]" />
                      <span>Notificaciones</span>
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full select-none">
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </h3>
                    <button 
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-100 rounded-lg hover:shadow-xs transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-1.5 mt-3">
                    <button
                      onClick={handleMarkAllRead}
                      className="flex-1 py-1 px-2 text-[9.5px] font-extrabold text-slate-500 bg-white hover:bg-slate-50 border border-slate-250 rounded-lg transition-colors cursor-pointer text-center"
                    >
                      Marcar Leídas
                    </button>
                    <button
                      onClick={handleClearAllNotifications}
                      className="flex-1 py-1 px-2 text-[9.5px] font-extrabold text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-100 rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Borrar Todo</span>
                    </button>
                  </div>
                </div>

                {/* Notifications list filter */}
                <div className="flex bg-slate-50 border-b border-slate-100 px-3 py-1.5 gap-1.5 overflow-x-auto text-nowrap select-none">
                  {(['all', 'upload_download', 'update', 'system'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setNotificationFilter(filter)}
                      className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                        notificationFilter === filter 
                          ? 'bg-[#10b981] text-white' 
                          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-55'
                      }`}
                    >
                      {filter === 'all' && 'Todos'}
                      {filter === 'upload_download' && 'Archivos ⬇️⬆️'}
                      {filter === 'update' && 'Actualizaciones 🚀'}
                      {filter === 'system' && 'Avisos ⚙️'}
                    </button>
                  ))}
                </div>

                {/* Notification Items Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 select-none">
                  {getFilteredNotifications().length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10">
                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                        <Bell className="w-5 h-5 opacity-40 animate-pulse" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">No hay notificaciones</p>
                      <p className="text-[10px] text-slate-400 font-medium px-4 mt-0.5 leading-tight">
                        Las alertas sobre descargas, cargas y actualizaciones aparecerán aquí.
                      </p>
                    </div>
                  ) : (
                    getFilteredNotifications().map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => handleMarkSingleRead(notif.id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          notif.read 
                            ? 'bg-slate-50/75 border-slate-100 opacity-75' 
                            : 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50/50 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`p-1.5 rounded-xl shrink-0 ${
                            notif.type === 'upload' ? 'bg-emerald-100 text-emerald-600' :
                            notif.type === 'download' ? 'bg-cyan-100 text-cyan-700' :
                            notif.type === 'publish' ? 'bg-indigo-100 text-indigo-600' :
                            notif.type === 'update' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {notif.type === 'upload' && <FileUp className="w-3.5 h-3.5" />}
                            {notif.type === 'download' && <Download className="w-3.5 h-3.5" />}
                            {notif.type === 'publish' && <Globe className="w-3.5 h-3.5" />}
                            {notif.type === 'update' && <Sparkles className="w-3.5 h-3.5" />}
                            {notif.type === 'system' && <Bell className="w-3.5 h-3.5" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-450">
                                {notif.type === 'upload' ? 'Carga' :
                                 notif.type === 'download' ? 'Descarga' :
                                 notif.type === 'publish' ? 'Publicación' :
                                 notif.type === 'update' ? 'Actualización' : 'Sistema'}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400">
                                {formatTimeAgo(notif.createdAt)}
                              </span>
                            </div>
                            <h4 className="text-[11px] font-extrabold text-slate-800 leading-tight mt-0.5">
                              {notif.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-bold leading-normal mt-1">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Simulated Playground Tools & Settings Drawer Footer */}
                <div className="bg-slate-50 border-t border-slate-150 p-3.5 space-y-3 shrink-0">
                  {/* Preferences Header */}
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400">
                      Configuración Push
                    </span>
                    <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span>En Línea</span>
                    </span>
                  </div>

                  {/* Browser Native Permission trigger control */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10.5px] font-extrabold text-slate-800">Notificaciones del Navegador</p>
                      <p className="text-[8.5px] text-slate-400 font-bold leading-none mt-1">
                        Soporte HTML5 integrado
                      </p>
                    </div>
                    <button
                      onClick={handleRequestNativePermission}
                      className={`text-[9.5px] font-black px-2 py-1 rounded-lg transition-colors cursor-pointer border ${
                        browserPermission === 'granted'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : browserPermission === 'denied'
                          ? 'bg-rose-50 text-rose-600 border-rose-200 cursor-not-allowed'
                          : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                      }`}
                      disabled={browserPermission === 'denied'}
                    >
                      {browserPermission === 'granted' ? 'Activado ✓' : browserPermission === 'denied' ? 'Bloqueado ✖' : 'Configurar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </>
    )}
      </div>
    </div>
  );
}
