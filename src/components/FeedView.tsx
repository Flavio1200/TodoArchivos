/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  fetchFiles, likeFile, deleteFile 
} from '../db';
import { 
  SharedFile, FileCategory, UserProfile 
} from '../types';
import { triggerNotification } from '../notificationsHelper';
import { 
  ThumbsUp, MessageSquare, Download, Filter, Search, Globe, Flame, ShieldAlert, FileText, Image as ImageIcon, Video, Mic, MapPin, Layout, Chrome, Instagram, Github, X, Code, Box, ExternalLink, Users, Trash2
} from 'lucide-react';

interface FeedViewProps {
  currentUser: UserProfile;
  onOpenChat: (file: SharedFile) => void;
  supabaseConnected: boolean;
  onOpenGroups?: () => void;
}

const FEED_ICONS: Record<FileCategory, React.ComponentType<any>> = {
  document: FileText,
  photo: ImageIcon,
  video: Video,
  audio: Mic,
  location: MapPin,
  website: Layout,
  chrome: Chrome,
  instagram: Instagram,
  github: Github,
  twitter: X,
  code: Code,
  box: Box
};

export default function FeedView({ currentUser, onOpenChat, supabaseConnected, onOpenGroups }: FeedViewProps) {
  const [feedFiles, setFeedFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<FileCategory | 'all'>('all');

  // Custom dialogue state to allow iframe-safe confirmations and actions
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isNotification?: boolean;
    statusType?: 'success' | 'error' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    isNotification = false, 
    statusType: 'success' | 'error' | 'warning' = 'warning'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      isNotification,
      statusType
    });
  };

  const loadFeed = async () => {
    setLoading(true);
    const databaseFiles = await fetchFiles();
    // Feed only lists public shares that don't belong to a group
    const publicShared = databaseFiles.filter(f => f.isPublic && !(f as any).groupId);
    setFeedFiles(publicShared);
    setLoading(false);
  };

  useEffect(() => {
    loadFeed();
  }, [supabaseConnected]);

  const handleLike = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    const currentLikes = await likeFile(fileId);
    setFeedFiles((prev) => 
      prev.map((f) => f.id === fileId ? { ...f, likes: currentLikes } : f)
    );
  };

  const handleDownload = (e: React.MouseEvent, file: SharedFile) => {
    e.stopPropagation();
    
    // Trigger "Descarga Iniciada" push notification
    triggerNotification(
      'Descarga Iniciada',
      `Preparando descarga para "${file.fileName || file.name}"...`,
      'download'
    );
    
    try {
      const link = document.createElement('a');
      link.href = file.fileUrl || '#';
      link.download = file.fileName || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Delay success notification to simulate download transfer completed
      setTimeout(() => {
        triggerNotification(
          'Descarga Completada',
          `"${file.fileName || file.name}" se descargó exitosamente (${file.fileSize || 'N/A'}).`,
          'download'
        );
      }, 1200);
    } catch (err) {
      console.warn('Descarga en sandbox bloqueada o fallida:', err);
    }
  };

  const getFilteredFeed = () => {
    let result = [...feedFiles];
    
    if (selectedTypeFilter !== 'all') {
      result = result.filter(f => f.category === selectedTypeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.name.toLowerCase().includes(query) || 
        f.description.toLowerCase().includes(query) || 
        f.authorAlias.toLowerCase().includes(query)
      );
    }

    return result;
  };

  const filteredFeed = getFilteredFeed();

  // Highlighted file (most liked)
  const hotFile = feedFiles.length > 0 
    ? [...feedFiles].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0]
    : null;

  return (
    <div className="flex-1 h-full relative overflow-hidden select-none">
      <div className="w-full h-full p-5 pb-24 overflow-y-auto text-left flex flex-col">
      
      {/* Feed Heading */}
      <div className="text-left mb-4 mt-1">
        <p className="text-[10px] uppercase font-bold tracking-wider text-white/80 leading-none">Comunidad abierta</p>
        <h2 className="text-2xl font-black text-white mt-1 leading-none">Publicaciones</h2>
      </div>

      {/* Modern Search Row */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por alias, título..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/95 pl-10 pr-4 py-2.5 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] font-semibold transition-all shadow-md"
          />
        </div>
        
        {/* Simple Type Filter select dropdown */}
        <div className="relative">
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value as FileCategory | 'all')}
            className="bg-white/95 text-slate-700 font-bold text-xs py-2.5 px-3.5 rounded-2xl shadow-md focus:outline-none border-none pr-8 appearance-none cursor-pointer"
            id="feed-type-select"
          >
            <option value="all">Filtro: Todo</option>
            <option value="document">Documentos</option>
            <option value="photo">Fotos</option>
            <option value="video">Videos</option>
            <option value="audio">Audios</option>
            <option value="location">Ubicaciones</option>
            <option value="code">Código</option>
          </select>
          <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
            <Filter className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Featured trending post banner */}
      {hotFile && !searchQuery && selectedTypeFilter === 'all' && (
        <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white rounded-[20px] p-4 text-left shadow-lg mb-4.5 flex gap-3 relative overflow-hidden animate-pulse">
          <div className="absolute right-0 top-0 translate-x-3 translate-y-[-10px] opacity-15">
            <Flame className="w-24 h-24" />
          </div>
          
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
            <Flame className="w-6 h-6 text-yellow-300" />
          </div>
          
          <div className="min-w-0 flex-1">
            <span className="text-[9px] uppercase tracking-wider font-extrabold bg-amber-600/95 px-1.5 py-0.5 rounded-full">Destacado de la Semana</span>
            <h4 className="font-extrabold text-sm truncate mt-1">{hotFile.name}</h4>
            <p className="text-[10px] text-amber-50 truncate">Por @{hotFile.authorAlias} • {hotFile.likes || 0} Me gusta</p>
          </div>
        </div>
      )}

      {/* Feed List Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-white/95 rounded-[24px] p-12 text-center shadow">
            <span className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin"></span>
            <p className="text-xs text-slate-400 font-semibold mt-2">Sincronizando el feed...</p>
          </div>
        ) : filteredFeed.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-white/95 rounded-[24px] p-10 text-center shadow-md text-slate-400">
            <Globe className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
            <p className="text-xs font-bold text-slate-500">Sin resultados</p>
            <p className="text-[10px] text-slate-400 font-medium">Revisa los filtros de búsqueda o categoría en la cabecera.</p>
          </div>
        ) : (
          filteredFeed.map((file) => {
            const ActiveIco = FEED_ICONS[file.category] || FileText;
            return (
              <div
                key={file.id}
                className="bg-white/95 rounded-[24px] overflow-hidden border border-slate-200/40 shadow-md text-left transition-all hover:shadow-lg flex flex-col bg-white"
                id={`feed-row-${file.id}`}
              >
                {/* Visual rendering block */}
                <div className="bg-slate-50/80 aspect-video relative flex items-center justify-center border-b border-slate-100 overflow-hidden">
                  {file.category === 'photo' ? (
                    <img
                      src={file.fileUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : file.category === 'audio' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-purple-50 text-purple-600 gap-1 px-4">
                      <Mic className="w-6 h-6 mb-1 text-purple-650" />
                      <div className="flex items-center gap-0.8 w-44">
                        {[15, 30, 45, 20, 10, 40, 60, 45, 10, 35, 25, 40].map((h, i) => (
                          <span key={i} className="flex-1 rounded-full bg-purple-400/90" style={{ height: `${h}px` }} />
                        ))}
                      </div>
                      <span className="text-[9px] font-mono mt-1 opacity-70">Graba de Audio • {file.fileName}</span>
                    </div>
                  ) : file.category === 'video' ? (
                    <div className="w-full h-full bg-slate-900 text-white flex flex-col items-center justify-center p-3">
                      <Video className="w-7 h-7 text-white" />
                      <span className="text-[10px] text-white/85 font-mono uppercase tracking-wide mt-1">Pista de Video</span>
                      <p className="text-[8.5px] text-white/50">{file.fileName}</p>
                    </div>
                  ) : ['chrome', 'instagram', 'twitter'].includes(file.category) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-500 p-4 rounded-xl text-center select-all">
                      <ActiveIco className="w-8 h-8 mb-2" />
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Publicación / Cuenta Enlazada</span>
                      <span className="text-[11px] text-[#10b981] font-bold mt-1 max-w-[240px] truncate underline hover:opacity-85">
                        {file.fileUrl}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-350 p-4">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-150 flex items-center justify-center shadow-sm">
                        <ActiveIco className="w-6 h-6 text-slate-500" />
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold mt-1.5 uppercase tracking-wide">{file.category === 'twitter' ? 'X' : file.category}</span>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">{file.fileName}</span>
                    </div>
                  )}

                  {/* Floating author tag */}
                  <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 bg-black/60 rounded-full py-1 pr-3 pl-1 text-white backdrop-blur-xs select-none">
                    {file.authorAvatar ? (
                      <img src={file.authorAvatar} alt="author" className="w-5.5 h-5.5 rounded-full border border-white/20 object-cover" />
                    ) : (
                      <div className="w-5.5 h-5.5 rounded-full bg-[#10b981] flex items-center justify-center text-white font-bold text-[9px]">U</div>
                    )}
                    <span className="text-[9.5px] font-extrabold max-w-[90px] truncate">@{file.authorAlias}</span>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-extrabold text-sm text-slate-800 tracking-tight leading-tight uppercase truncate max-w-[200px]">
                      {file.name}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    {file.description || 'Sin comentarios o descripción provista.'}
                  </p>

                  {/* Security Alert dynamic tip */}
                  {['code', 'box'].includes(file.category) && (
                    <div className="flex items-start gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-2 rounded-xl text-[10px] font-bold select-none leading-snug animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>⚠️ ADERVERTENCIA DE SEGURIDAD: Por tu seguridad virtual, audita este script o paquete antes de ejecutarlo.</span>
                    </div>
                  )}

                  {/* Interactions row */}
                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                    <div className="flex gap-2.5 items-center">
                      {/* Like button */}
                      <button
                        onClick={(e) => handleLike(e, file.id)}
                        className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                        title="Me gusta"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{file.likes || 0}</span>
                      </button>

                      {/* Comment Chat button */}
                      <button
                        onClick={() => onOpenChat(file)}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                        title="Abrir chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                        <span>Charlar ({file.commentsCount || 0})</span>
                      </button>

                      {/* Explicit Secure File Deletion option */}
                      {file.userId === currentUser.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerConfirm(
                              'Eliminar Publicación',
                              `⚠️ ¿Estás completamente seguro de que deseas eliminar permanentemente de TodoArchivos tu publicación "${file.name}"? Esta acción se aplicará tanto en este dispositivo como en Supabase/servidor.`,
                              async () => {
                                const res = await deleteFile(file.id, currentUser.id);
                                if (res.success) {
                                  triggerConfirm('Publicación Eliminada', `La publicación "${file.name}" se eliminó correctamente.`, () => {
                                    loadFeed(); // Reload feed list
                                  }, true, 'success');
                                } else {
                                  triggerConfirm('Error', `Error de eliminación de archivo: ${res.error || 'error desconocido'}`, () => {}, true, 'error');
                                }
                              },
                              false,
                              'warning'
                            );
                          }}
                          className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Eliminar mi archivo compartido"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Borrar</span>
                        </button>
                      )}
                    </div>

                    {['chrome', 'instagram', 'twitter'].includes(file.category) ? (
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-extrabold text-xs cursor-pointer active:scale-95"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Visitar Enlace</span>
                      </a>
                    ) : (
                      <button
                        onClick={(e) => handleDownload(e, file)}
                        className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-extrabold text-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{file.fileSize || 'Descargar'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      </div>
      
      {/* Botón flotante para ver grupos */}
      {onOpenGroups && (
        <button
          onClick={onOpenGroups}
          className="absolute bottom-6 right-6 z-40 w-14 h-14 bg-[#10b981] hover:bg-[#059669] text-white rounded-full shadow-2xl flex items-center justify-center border border-white/20 cursor-pointer text-center"
          id="btn-floating-groups"
          title="Ver Grupos de Comunidad"
        >
          <Users className="w-6 h-6 stroke-[2.2]" />
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 w-3 h-3 rounded-full border border-white flex items-center justify-center" />
        </button>
      )}

      {/* Modal De Confirmación / Notificación Personalizado (100% libre de bloqueos de iFrame) */}
      {confirmModal.isOpen && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-5.5 w-full max-w-xs shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 text-center select-none">
            <div className="flex flex-col items-center space-y-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border shrink-0 ${
                confirmModal.statusType === 'success' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : confirmModal.statusType === 'error'
                  ? 'bg-rose-50 text-rose-600 border-rose-100'
                  : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {confirmModal.statusType === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 stroke-[2]"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                ) : (
                  <ShieldAlert className="w-6 h-6 stroke-[2]" />
                )}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">{confirmModal.title}</h4>
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
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
