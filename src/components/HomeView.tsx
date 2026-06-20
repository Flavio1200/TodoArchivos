/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, FileText, Image as ImageIcon, Video, Mic, MapPin, Layout,
  Chrome, Instagram, Github, X, Code, Box,
  Download, ArrowLeft, MessageSquare, ThumbsUp, FolderOpen, Search, User, Globe, ExternalLink, Trash2, ShieldAlert
} from 'lucide-react';
import { SharedFile, FileCategory, UserProfile } from '../types';
import { fetchFiles, likeFile, deleteFile } from '../db';
import { triggerNotification } from '../notificationsHelper';

interface HomeViewProps {
  currentUser: UserProfile;
  onOpenChat: (file: SharedFile) => void;
  onViewDetails?: (file: SharedFile) => void;
  supabaseConnected: boolean;
}

const CATEGORY_MAP: Record<FileCategory, { lbl: string; col: string; ico: React.ComponentType<any> }> = {
  document: { lbl: 'Documento', col: 'text-neutral-800 bg-neutral-100', ico: FileText },
  photo: { lbl: 'Foto', col: 'text-sky-500 bg-sky-50', ico: ImageIcon },
  video: { lbl: 'Video', col: 'text-emerald-500 bg-emerald-50', ico: Video },
  audio: { lbl: 'Audio', col: 'text-purple-600 bg-purple-50', ico: Mic },
  location: { lbl: 'Ubicación', col: 'text-red-500 bg-red-50', ico: MapPin },
  website: { lbl: 'Sitio Web', col: 'text-orange-500 bg-orange-50', ico: Layout },
  chrome: { lbl: 'Chrome Link', col: 'text-green-500 bg-green-50', ico: Chrome },
  instagram: { lbl: 'Instagram', col: 'text-indigo-600 bg-indigo-50', ico: Instagram },
  github: { lbl: 'GitHub', col: 'text-zinc-800 bg-zinc-150', ico: Github },
  twitter: { lbl: 'X', col: 'text-slate-900 bg-slate-100 border border-slate-200', ico: X },
  code: { lbl: 'Código', col: 'text-rose-500 bg-rose-50', ico: Code },
  box: { lbl: 'Paquete/Zip', col: 'text-yellow-600 bg-yellow-50', ico: Box }
};

export default function HomeView({ currentUser, onOpenChat, supabaseConnected }: HomeViewProps) {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Custom dialog state for iframe-proof reliability
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

  const [activeSubFolder, setActiveSubFolder] = useState<'root' | 'my_files' | 'shared_files' | 'category'>('root');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    const databaseFiles = await fetchFiles();
    setFiles(databaseFiles);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [supabaseConnected]);

  const handleLike = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    const finalLikes = await likeFile(fileId);
    setFiles((prev) => 
      prev.map((f) => f.id === fileId ? { ...f, likes: finalLikes } : f)
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
    
    // Simulate real chemical download triggers 
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

  // Filter systems
  const getFilteredFiles = () => {
    let result = [...files];
    
    if (activeSubFolder === 'my_files') {
      result = result.filter(f => f.userId === currentUser.id);
    } else if (activeSubFolder === 'shared_files') {
      result = result.filter(f => f.isPublic);
    } else if (activeSubFolder === 'category' && selectedCategory) {
      result = result.filter(f => f.category === selectedCategory);
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

  const filteredFiles = getFilteredFiles();

  return (
    <div className="flex-1 flex flex-col p-5 pb-24 h-full overflow-y-auto select-none">
      
      {/* ROOT MAIN NAVIGATION PAGE OF THE HOME SCREEN */}
      {activeSubFolder === 'root' ? (
        <div className="space-y-6 animate-in fade-in duration-300 text-left">
          
          {/* Quick Stats Header bar */}
          <div className="flex items-center justify-between text-white/95 mt-1">
            <div>
              <p className="text-[10px] uppercase font-extrabold tracking-wider opacity-80 leading-none">Mi Dispositivo</p>
              <h2 className="text-xl font-black mt-1">Hola, {currentUser.name.split(' ')[0]}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-white/20 border border-white/20 rounded-full px-2.5 py-0.8 font-bold">
                {files.filter(f => f.userId === currentUser.id).length} Archivos
              </span>
            </div>
          </div>

          {/* Directory Folder Blocks (Matches screen #4 left side) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Folder 1: Mis Archivos */}
            <button
              onClick={() => setActiveSubFolder('my_files')}
              className="w-full bg-white/95 hover:bg-white text-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md transition-all active:scale-[0.98] cursor-pointer group"
              id="folder-btn-myfiles"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/10">
                  <FolderOpen className="w-5.5 h-5.5 stroke-[2]" />
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-sm block text-slate-900 leading-none">Mis Archivos</span>
                  <span className="text-[10.5px] text-slate-400 font-bold block mt-1">Tus subidas privadas y públicas</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1.5 transition-all" />
            </button>

            {/* Folder 2: Archivos Compartidos */}
            <button
              onClick={() => setActiveSubFolder('shared_files')}
              className="w-full bg-white/95 hover:bg-white text-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md transition-all active:scale-[0.98] cursor-pointer group"
              id="folder-btn-sharedfiles"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 border border-sky-500/10">
                  <Globe className="w-5.5 h-5.5 stroke-[2]" />
                </div>
                <div className="text-left">
                  <span className="font-extrabold text-sm block text-slate-900 leading-none">Archivos Compartidos</span>
                  <span className="text-[10.5px] text-slate-400 font-bold block mt-1">Carpetas públicas sincronizadas</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1.5 transition-all" />
            </button>
          </div>

          {/* Quick Filter Categories chips */}
          <div className="space-y-2">
            <h3 className="text-white font-extrabold text-xs uppercase tracking-wide opacity-95 block">
              Explorar por Categoría
            </h3>
            
            {/* Quick Slider List of filters */}
            <div className="flex gap-2 md:flex-wrap pb-1 overflow-x-auto scrollbar-none">
              {(Object.keys(CATEGORY_MAP) as FileCategory[]).map((catKey) => {
                const config = CATEGORY_MAP[catKey];
                const CatIcon = config.ico;
                return (
                  <button
                    key={catKey}
                    onClick={() => {
                      setSelectedCategory(catKey);
                      setActiveSubFolder('category');
                    }}
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white font-bold transition-all shrink-0 cursor-pointer active:scale-95 text-center"
                  >
                    <CatIcon className="w-3.5 h-3.5" />
                    <span>{config.lbl}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* De la Comunidad (Matches image #4 screen left side bottom) */}
          <div className="space-y-3.5">
            <div className="flex justify-between items-end">
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wide opacity-95">De la Comunidad</h3>
              <span className="text-[10px] text-white/70 font-semibold uppercase">Feed Reciente</span>
            </div>

            {loading ? (
              <div className="bg-white/95 rounded-2xl p-8 shadow-md flex flex-col items-center justify-center gap-2">
                <span className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs text-slate-400 font-semibold">Cargando publicaciones...</span>
              </div>
            ) : files.filter(f => f.isPublic).length === 0 ? (
              <div className="bg-white/95 rounded-2xl p-8 text-center text-slate-400 shadow-md">
                <Globe className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                <p className="text-xs font-bold text-slate-500">No hay archivos públicos</p>
                <p className="text-[10px] text-slate-400 font-medium">Sé el primero en compartir un archivo públicamente.</p>
              </div>
            ) : (
              // Filter to first 2 Public Files for community previews on Root
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {files.filter(f => f.isPublic).slice(0, 3).map((file) => {
                  const catConfig = CATEGORY_MAP[file.category];
                  const Icon = catConfig.ico;
                  
                  return (
                    <div 
                      key={file.id} 
                      className="bg-white rounded-[24px] overflow-hidden border border-slate-200/50 shadow-md text-left transition-all hover:translate-y-[-2px] hover:shadow-lg flex flex-col bg-white/95"
                    >
                    {/* Media representation box depending on format */}
                    <div className="bg-slate-100 border-b border-slate-100 relative h-36 flex items-center justify-center overflow-hidden">
                      {file.category === 'photo' ? (
                        <img 
                          src={file.fileUrl} 
                          alt={file.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : file.category === 'audio' ? (
                        // WAVEFORM SIMULATOR
                        <div className="w-full h-full px-5 flex flex-col justify-center items-center gap-2 bg-gradient-to-r from-violet-50 to-indigo-50">
                          <Mic className="w-6 h-6 text-purple-600 mb-0.5" />
                          <div className="flex items-center gap-0.8 w-44">
                            {[15, 30, 45, 20, 10, 40, 60, 45, 10, 35, 25, 40, 15, 10, 25, 12, 35, 15].map((h, i) => (
                              <span key={i} className="flex-1 rounded-full bg-purple-400/90" style={{ height: `${h}px` }} />
                            ))}
                          </div>
                          <span className="text-[10px] font-mono text-purple-500 tracking-wider">0:42 • PistaGrabada.mp3</span>
                        </div>
                      ) : file.category === 'video' ? (
                        // VIDEO PLAYER PREVIEW IMITATION
                        <div className="w-full h-full flex flex-col justify-center items-center bg-zinc-900 border border-zinc-950 relative group">
                          <Video className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] text-white/70 font-bold mt-2 uppercase tracking-wide">Reproducción de Video</span>
                          <span className="absolute bottom-2.5 right-3 px-1.5 py-0.5 bg-black/60 rounded text-[9px] font-mono text-white">01:15</span>
                        </div>
                      ) : ['chrome', 'instagram', 'twitter'].includes(file.category) ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border border-slate-100 p-4 rounded-xl text-center select-all">
                          <Icon className={`w-8 h-8 mb-2 ${catConfig.col}`} />
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Publicación / Cuenta Enlazada</span>
                          <span className="text-[11px] text-[#10b981] font-bold mt-1 max-w-[200px] truncate underline hover:opacity-85">
                            {file.fileUrl}
                          </span>
                        </div>
                      ) : (
                        // DEFAULT GRID CHECKBOARD OR FILE ICON
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-4 border border-dashed border-slate-200 m-2 rounded-xl">
                          <Icon className={`w-8 h-8 ${catConfig.col}`} />
                          <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">Archivo {catConfig.lbl}</span>
                          <p className="text-[9px] text-slate-400 mt-0.5 font-mono">{file.fileName}</p>
                        </div>
                      )}

                      {/* Floating tag */}
                      <span className="absolute top-2.5 right-2.5 bg-slate-900/80 text-white rounded-full px-2.5 py-1 text-[9.5px] font-bold select-none tracking-tight">
                        {catConfig.lbl}
                      </span>
                    </div>

                    {/* Meta section matching: titulo, autor, categoria, Descripcion, Descargar */}
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="text-left">
                          <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                            {file.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5 select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            por @{file.authorAlias} • {new Date(file.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg select-none">
                          {file.fileSize || '24 KB'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {file.description || 'Sin descripción facilitada por el autor.'}
                      </p>

                      {/* Security Alert dynamic tip */}
                      {['code', 'box'].includes(file.category) && (
                        <div className="flex items-start gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-2 rounded-xl text-[10px] font-bold select-none leading-snug animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>⚠️ ALERTA DE SEGURIDAD: Revisa y audita este archivo de código antes de abrirlo en tu dispositivo.</span>
                        </div>
                      )}

                      {/* Action trigger: likes, chat discussion button, download simulator */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleLike(e, file.id)}
                            className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 text-xs font-bold bg-slate-50 hover:bg-slate-100 py-1 px-2 rounded-lg border border-slate-200/50 transition-all cursor-pointer animate-in"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{file.likes || 0}</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenChat(file);
                            }}
                            className="flex items-center gap-1.5 text-slate-500 hover:text-sky-600 text-xs font-bold bg-slate-50 hover:bg-slate-100 py-1 px-2 rounded-lg border border-slate-200/50 transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                            <span>Comentar ({file.commentsCount || 0})</span>
                          </button>

                          {file.userId === currentUser.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerConfirm(
                                  'Confirmar Eliminación',
                                  `¿Estás seguro de que deseas eliminar permanentemente de la comunidad tu publicación "${file.name}"?`,
                                  async () => {
                                    const res = await deleteFile(file.id, currentUser.id);
                                    if (res.success) {
                                      triggerConfirm(
                                        'Publicación Eliminada', 
                                        `La publicación "${file.name}" se eliminó con éxito.`, 
                                        () => { loadData(); }, 
                                        true, 
                                        'success'
                                      );
                                    } else {
                                      triggerConfirm(
                                        'Error', 
                                        `No se pudo eliminar la publicación: ${res.error || 'Inténtalo de nuevo.'}`, 
                                        () => {}, 
                                        true, 
                                        'error'
                                      );
                                    }
                                  },
                                  false,
                                  'warning'
                                );
                              }}
                              className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/50 hover:border-rose-200 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Borrar mi publicación"
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
                            className="flex items-center gap-1.5 text-sky-600 hover:text-sky-700 text-xs font-extrabold cursor-pointer active:scale-95"
                          >
                            <span>Visitar Enlace</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        ) : (
                          <button 
                            onClick={(e) => handleDownload(e, file)}
                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-xs font-extrabold cursor-pointer active:scale-95"
                            id={`download-btn-${file.id}`}
                          >
                            <span>Descargar ({file.fileSize || 'N/A'})</span>
                            <Download className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* DETAIL SCREEN: (My files list OR Specific Folder List matching Screen 4 right-side detail list) */
        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 text-left">
          
          {/* List Title bar */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setActiveSubFolder('root');
                setSelectedCategory(null);
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              id="detail-back-btn"
            >
              <ArrowLeft className="w-4 h-4 ml-[-1px]" />
            </button>
            <div className="text-white">
              <span className="text-[10px] uppercase font-extrabold tracking-wider opacity-85 block leading-none">Mi Carpeta</span>
              <h2 className="text-xl font-black block mt-1 leading-none">
                {activeSubFolder === 'my_files' && 'Mis Archivos'}
                {activeSubFolder === 'shared_files' && 'Archivos Compartidos'}
                {activeSubFolder === 'category' && selectedCategory && (CATEGORY_MAP[selectedCategory]?.lbl || 'Categoría')}
              </h2>
            </div>
          </div>

          {/* Search bar helper */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar en esta carpeta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/90 pl-10 pr-4 py-2 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] font-semibold transition-all shadow-sm"
            />
          </div>

          {/* List of files matching user screenshot Screen 4 Right-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loading ? (
              <div className="bg-white/95 rounded-2xl p-10 flex flex-col items-center justify-center gap-2 shadow">
                <span className="w-6 h-6 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs text-slate-400">Actualizando lista...</span>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="bg-white/95 rounded-2xl p-8 text-center text-slate-400 shadow-md">
                <FolderOpen className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                <p className="text-xs font-bold text-slate-500">Carpeta vacía</p>
                <p className="text-[10px] text-slate-400 font-medium">Sube un archivo de este tipo para verlo listado aquí.</p>
              </div>
            ) : (
              filteredFiles.map((file) => {
                const configItem = CATEGORY_MAP[file.category];
                const ItemIcon = configItem.ico;
                return (
                  <div
                    key={file.id}
                    onClick={() => onOpenChat(file)}
                    className="bg-white/95 hover:bg-white rounded-[18px] p-3.5 shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:translate-x-1 hover:shadow-md cursor-pointer text-left"
                    id={`file-row-${file.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Left icon wrapper */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${configItem.col}`}>
                        <ItemIcon className="w-5 h-5" />
                      </div>
                      
                      {/* Metadata row layout matching user screenshot Screen 4 */}
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-800 truncate block">
                            {file.name}
                          </span>
                          {!file.isPublic && (
                            <span className="text-[8px] font-bold text-amber-500 bg-amber-50 px-1 py-0.2 rounded shrink-0 select-none uppercase">Privado</span>
                          )}
                        </div>
                        <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">
                          subido: {new Date(file.createdAt).toLocaleDateString()} por @{file.authorAlias} ({file.fileSize || 'N/A'})
                        </span>
                      </div>
                    </div>

                    {/* Chat dialogue / Share icon details matching Screen 4 */}
                    <div className="flex items-center gap-1">
                      {file.userId === currentUser.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerConfirm(
                              'Eliminar Archivo',
                              `¿Estás seguro de que deseas eliminar de forma permanente el archivo "${file.name}"? Esta acción es irreversible.`,
                              async () => {
                                const res = await deleteFile(file.id, currentUser.id);
                                if (res.success) {
                                  triggerConfirm(
                                    'Archivo Eliminado', 
                                    `El archivo "${file.name}" ha sido eliminado de la aplicación.`, 
                                    () => { loadData(); }, 
                                    true, 
                                    'success'
                                  );
                                } else {
                                  triggerConfirm(
                                    'Error', 
                                    `Error al eliminar el archivo: ${res.error || 'Inténtalo de nuevo.'}`, 
                                    () => {}, 
                                    true, 
                                    'error'
                                  );
                                }
                              },
                              false,
                              'warning'
                            );
                          }}
                          className="w-8 h-8 rounded-full hover:bg-rose-50 flex items-center justify-center text-rose-500 hover:text-rose-600 transition-all cursor-pointer"
                          title="Eliminar de forma permanente"
                          id={`delete-file-btn-${file.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {['chrome', 'instagram', 'twitter'].includes(file.category) ? (
                        <a 
                          href={file.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-sky-500 transition-colors"
                          title="Visitar enlace"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <button 
                          onClick={(e) => handleDownload(e, file)}
                          className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-[#10b981] transition-colors"
                          title="Descargar archivo"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChat(file);
                        }}
                        className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-sky-500 transition-colors"
                        title="Discutir esta publicación"
                      >
                        <MessageSquare className="w-4 h-4 text-[#10b981]" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
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
                  <CheckCircleIcon className="w-6 h-6 stroke-[2]" />
                ) : confirmModal.statusType === 'error' ? (
                  <ShieldAlert className="w-6 h-6 stroke-[2]" />
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

// Small inline elements to cover lucide-react mapping or fallback
function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}
