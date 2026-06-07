/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Trash2, Edit3, Image as ImageIcon, LogOut, 
  ArrowLeft, Send, Check, MessageSquare, ThumbsUp, FilePlus, 
  UserX, UserCheck, Shield, ShieldAlert, ChevronLeft, Globe, FileText, Video, Mic, MapPin, Layout, Instagram, Github, X, Code, Box, Link 
} from 'lucide-react';
import { Group, SharedFile, FileCategory, UserProfile } from '../types';
import { 
  fetchGroups, 
  createGroup, 
  updateGroupSettings, 
  updateGroupMembers, 
  deleteCommunityGroup, 
  fetchFiles, 
  uploadFile, 
  likeFile,
  deleteFile 
} from '../db';

interface GroupsViewProps {
  currentUser: UserProfile;
  onOpenChat: (file: SharedFile) => void;
  onBack: () => void;
}

// Simulado de usuarios para miembros de grupos populares
const SIMULATED_MEMBERS = [
  { id: '11111111-1111-4111-a111-111111111111', alias: 'AndresM', name: 'Andrés Mendoza', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
  { id: '22222222-2222-4222-b222-222222222222', alias: 'Sofi_J', name: 'Sofía Jiménez', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { id: '33333333-3333-3333-3333-333333333333', alias: 'Carlos_Dev', name: 'Carlos Solís', avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150' },
  { id: '44444444-4444-4444-4444-444444444444', alias: 'Maria_G', name: 'María Gómez', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' },
  { id: '55555555-5555-5555-5555-555555555555', alias: 'Lucas_99', name: 'Lucas Rojas', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { id: '66666666-6666-6666-6666-666666666666', alias: 'Ana_K', name: 'Ana Krauss', avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' }
];

// Presets de imágenes bonitas Unsplash para grupos
const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400', // Programación/Trabajo
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400', // Fotografía
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400', // Libros/Estudio
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', // Videojuegos
  'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400', // Fiestas/Eventos
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400'  // Naturaleza
];

const CATEGORY_DETAILS: Record<FileCategory, { ico: React.ComponentType<any>; col: string; lbl: string }> = {
  document: { ico: FileText, col: 'text-neutral-800', lbl: 'Documento' },
  photo: { ico: ImageIcon, col: 'text-sky-500', lbl: 'Foto' },
  video: { ico: Video, col: 'text-emerald-500', lbl: 'Video' },
  audio: { ico: Mic, col: 'text-purple-600', lbl: 'Audio' },
  location: { ico: MapPin, col: 'text-red-500', lbl: 'Ubicación' },
  website: { ico: Layout, col: 'text-orange-500', lbl: 'Sitio Web' },
  chrome: { ico: Link, col: 'text-green-500', lbl: 'Enlace Chrome' },
  instagram: { ico: Instagram, col: 'text-orange-500', lbl: 'Instagram' },
  github: { ico: Github, col: 'text-zinc-800', lbl: 'GitHub' },
  twitter: { ico: X, col: 'text-neutral-900', lbl: 'X' },
  code: { ico: Code, col: 'text-rose-500', lbl: 'Código' },
  box: { ico: Box, col: 'text-yellow-500', lbl: 'Paquete/Zip' }
};

export default function GroupsView({ currentUser, onOpenChat, onBack }: GroupsViewProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [activeGroupFiles, setActiveGroupFiles] = useState<SharedFile[]>([]);
  
  // Custom dialog state to allow iframe-safe confirmations and actions
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

  // Navigation states
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Group Form state
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');
  const [newGroupImg, setNewGroupImg] = useState<string>(PRESET_IMAGES[0]);

  // Edit Group Form state
  const [editGroupName, setEditGroupName] = useState<string>('');
  const [editGroupDesc, setEditGroupDesc] = useState<string>('');
  const [editGroupImg, setEditGroupImg] = useState<string>('');

  // Group Publish Form state
  const [pubName, setPubName] = useState<string>('');
  const [pubDesc, setPubDesc] = useState<string>('');
  const [pubCategory, setPubCategory] = useState<FileCategory>('document');
  const [pubUrl, setPubUrl] = useState<string>('');
  const [pubFileName, setPubFileName] = useState<string>('');
  const [pubFileSize, setPubFileSize] = useState<string>('');

  // Load Groups
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      const loadedGroups = await fetchGroups();
      if (active) {
        setGroups(loadedGroups);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, []);

  // Load Files for the Active Group
  useEffect(() => {
    let active = true;
    if (activeGroup) {
      const loadFiles = async () => {
        const dbFiles = await fetchFiles();
        if (active) {
          const filtered = dbFiles.filter(f => f.groupId === activeGroup.id);
          setActiveGroupFiles(filtered);
        }
      };
      loadFiles();
    }
    return () => {
      active = false;
    };
  }, [activeGroup]);

  // Create Group Handler
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      alert('Ingresa el nombre del grupo.');
      return;
    }

    const groupToCreate = {
      name: trimmedName,
      description: newGroupDesc.trim() || 'Sin descripción provista.',
      image: newGroupImg,
      creatorId: currentUser.id,
      members: [currentUser.id]
    };

    const res = await createGroup(groupToCreate);
    if (res.success && res.data) {
      // Reload groups list
      const updatedGroups = await fetchGroups();
      setGroups(updatedGroups);
      
      // Reset fields & navigation
      setNewGroupName('');
      setNewGroupDesc('');
      setIsCreating(false);
      setActiveGroup(res.data);
      alert(`🎉 ¡El grupo "${trimmedName}" ha sido creado con éxito!`);
    } else {
      alert(`⚠️ Error al crear grupo: ${res.error}`);
    }
  };

  // Join Group Handler (Max 150)
  const handleJoinGroup = async (group: Group) => {
    if (group.members.length >= 150) {
      alert('⚠️ Este grupo ha alcanzado el límite máximo de 150 miembros.');
      return;
    }

    if (group.members.includes(currentUser.id)) return;

    const newMembersList = [...group.members, currentUser.id];
    const res = await updateGroupMembers(group.id, newMembersList);
    
    if (res.success && res.data) {
      const updatedGroups = await fetchGroups();
      setGroups(updatedGroups);
      if (activeGroup && activeGroup.id === group.id) {
        setActiveGroup(res.data);
      }
      alert(`✅ Te has unido al grupo "${group.name}".`);
    } else {
      alert(`⚠️ Error al unirse al grupo: ${res.error}`);
    }
  };

  // Leave Group Handler
  const handleLeaveGroup = async (group: Group) => {
    if (group.creatorId === currentUser.id) {
      triggerConfirm('Operación no permitida', 'Como creador del grupo, no puedes salirte directamente. Puedes eliminar el grupo en su lugar.', () => {}, true, 'error');
      return;
    }

    triggerConfirm(
      'Salir del Grupo',
      `¿Estás seguro de que deseas salir del grupo "${group.name}"?`,
      async () => {
        const newMembersList = group.members.filter(m => m !== currentUser.id);
        const res = await updateGroupMembers(group.id, newMembersList);

        if (res.success && res.data) {
          const updatedGroups = await fetchGroups();
          setGroups(updatedGroups);
          if (activeGroup && activeGroup.id === group.id) {
            setActiveGroup(null); // Close active view
          }
          triggerConfirm('Salió del Grupo', `Has salido correctamente del grupo "${group.name}".`, () => {}, true, 'success');
        } else {
          triggerConfirm('Error', `Error al salir del grupo: ${res.error || 'error desconocido'}`, () => {}, true, 'error');
        }
      },
      false,
      'warning'
    );
  };

  // Edit Group Handler
  const handleUpdateGroupSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;

    const trimmedName = editGroupName.trim();
    if (!trimmedName) {
      alert('El nombre del grupo no puede estar vacío.');
      return;
    }

    const updates = {
      name: trimmedName,
      description: editGroupDesc.trim(),
      image: editGroupImg
    };

    const res = await updateGroupSettings(activeGroup.id, updates);
    if (res.success && res.data) {
      const updatedGroups = await fetchGroups();
      setGroups(updatedGroups);
      setActiveGroup(res.data);
      setIsEditing(false);
      alert('🔧 Detalles del grupo actualizados correctamente.');
    } else {
      alert(`⚠️ Error al actualizar detalles del grupo: ${res.error}`);
    }
  };

  // Kick out member (Expulsar miembro)
  const handleKickMember = async (memberId: string, memberAlias: string) => {
    if (!activeGroup) return;
    if (memberId === currentUser.id) {
      triggerConfirm('Error', 'No puedes expulsarte a ti mismo.', () => {}, true, 'error');
      return;
    }

    triggerConfirm(
      'Expulsar Miembro',
      `¿Estás seguro de expulsar a @${memberAlias} del grupo?`,
      async () => {
        const updatedMembers = activeGroup.members.filter(m => m !== memberId);
        const res = await updateGroupMembers(activeGroup.id, updatedMembers);

        if (res.success && res.data) {
          const updatedGroups = await fetchGroups();
          setGroups(updatedGroups);
          setActiveGroup(res.data);
          triggerConfirm('Miembro Expulsado', `Has expulsado a @${memberAlias} del grupo.`, () => {}, true, 'success');
        } else {
          triggerConfirm('Error', `Error al expulsar miembro: ${res.error || 'error desconocido'}`, () => {}, true, 'error');
        }
      },
      false,
      'warning'
    );
  };

  // Delete Group Handler
  const handleDeleteGroup = async () => {
    if (!activeGroup) return;
    
    triggerConfirm(
      'Eliminar Grupo',
      `⚠️ ¿Estás completamente seguro de eliminar el grupo "${activeGroup.name}"? Esta acción es irreversible y borrará todos los archivos y comentarios compartidos en él tanto del servidor como de la base de datos de Supabase.`,
      async () => {
        const res = await deleteCommunityGroup(activeGroup.id);
        if (res.success) {
          const updatedGroups = await fetchGroups();
          setGroups(updatedGroups);
          triggerConfirm('Grupo Eliminado', `El grupo "${activeGroup.name}" ha sido eliminado permanentemente de Supabase.`, () => {
            setActiveGroup(null);
            setIsEditing(false);
          }, true, 'success');
        } else {
          triggerConfirm('Error', `Error al eliminar el grupo: ${res.error || 'error desconocido'}`, () => {}, true, 'error');
        }
      },
      false,
      'warning'
    );
  };

  // Publish File inside Group
  const handlePublishToGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;

    const trimmedName = pubName.trim();
    if (!trimmedName) {
      alert('Ingresa un título para la publicación.');
      return;
    }

    // Default template fallback depending on category
    let finalUrl = pubUrl.trim();
    if (!finalUrl) {
      if (pubCategory === 'photo') finalUrl = 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600';
      else if (pubCategory === 'audio') finalUrl = 'audio_playback_link';
      else if (pubCategory === 'video') finalUrl = 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-1181-large.mp4';
      else finalUrl = 'data:text/plain;base64,R3J1cG8gVGV4dG8=';
    }

    const payload = {
      userId: currentUser.id,
      authorName: currentUser.name,
      authorAlias: currentUser.alias,
      authorAvatar: currentUser.avatar_url,
      name: trimmedName,
      description: pubDesc.trim() || 'Sin detalles.',
      category: pubCategory,
      fileUrl: finalUrl,
      fileName: pubFileName.trim() || `archivo_${pubCategory}_${Date.now().toString().slice(-4)}.${pubCategory === 'photo' ? 'jpg' : 'txt'}`,
      fileSize: pubFileSize.trim() || '32 KB',
      isPublic: false, // Group files are only shown within the group sandbox
      groupId: activeGroup.id
    };

    const res = await uploadFile(payload);
    if (res.success && res.data) {
      // Update active list
      setActiveGroupFiles([res.data, ...activeGroupFiles]);

      // Reset publish state
      setPubName('');
      setPubDesc('');
      setPubUrl('');
      setPubFileName('');
      setPubFileSize('');
      setIsPublishing(false);
      alert('📤 ¡Archivo compartido con éxito en el grupo!');
    } else {
      alert(`⚠️ Error al compartir archivo: ${res.error}`);
    }
  };

  const handleLikePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    
    const updatedLikes = await likeFile(postId);

    // Update state lists
    setActiveGroupFiles(prev => 
      prev.map(f => f.id === postId ? { ...f, likes: updatedLikes } : f)
    );
  };

  // Categories helper
  const isJoined = (group: Group) => group.members.includes(currentUser.id);
  
  const myJoinedGroups = groups.filter(g => isJoined(g));
  const popularGroupsToJoin = groups.filter(g => !isJoined(g));

  const startEditGroup = () => {
    if (!activeGroup) return;
    setEditGroupName(activeGroup.name);
    setEditGroupDesc(activeGroup.description);
    setEditGroupImg(activeGroup.image);
    setIsEditing(true);
  };

  const getMemberAliasList = (memberIds: string[]) => {
    return memberIds.map(id => {
      const sim = SIMULATED_MEMBERS.find(sm => sm.id === id);
      if (sim) return sim;
      if (id === currentUser.id) return { id: currentUser.id, alias: currentUser.alias, name: currentUser.name, avatar_url: currentUser.avatar_url };
      return { id, alias: 'Usuario', name: 'Miembro Oculto', avatar_url: undefined };
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-900/10 p-5 pb-24 text-slate-800 select-none">
      
      {/* 1. LIST VIEW OF GROUPS (Home Groups) */}
      {!activeGroup && !isCreating && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header row with Back */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={onBack}
                className="p-1 px-2.5 rounded-full bg-white/90 text-slate-700 shadow-md flex items-center justify-center hover:bg-slate-100 transition-colors"
                id="back-to-community-btn"
              >
                <ChevronLeft className="w-4 h-4 mr-0.5" />
                <span className="text-[11px] font-bold">Atrás</span>
              </button>
              <h2 className="text-xl font-extrabold text-white leading-none">Explorar Grupos</h2>
            </div>
            
            <button
              onClick={() => setIsCreating(true)}
              className="bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs py-2 px-3.5 rounded-full shadow-md flex items-center gap-1 cursor-pointer transition-transform duration-200 active:scale-95"
              id="open-create-group-btn"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Crear Grupo</span>
            </button>
          </div>

          {/* GROUPS USER BELONGS TO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-150 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                <UserCheck className="w-4 h-4 text-emerald-450" />
                <span>Grupos a los que perteneces ({myJoinedGroups.length})</span>
              </h3>
            </div>

            {myJoinedGroups.length === 0 ? (
              <div className="bg-white/95 rounded-2xl p-5 text-center shadow border border-white/20">
                <Users className="w-7 h-7 mx-auto text-slate-300 mb-1.5" />
                <p className="text-xs font-bold text-slate-500">¿No perteneces a ningún grupo?</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Echa un vistazo a la sección de recomendaciones abajo y únete.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {myJoinedGroups.map(group => (
                  <div
                    key={group.id}
                    onClick={() => setActiveGroup(group)}
                    className="bg-white/95 rounded-[22px] p-3.5 flex gap-3.5 items-center justify-between border border-white/25 hover:border-[#10b981] shadow hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer w-full"
                    id={`my-group-row-${group.id}`}
                  >
                    <div className="flex gap-3.5 items-center min-w-0">
                      <div className="w-13 h-13 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                        <img 
                          src={group.image || PRESET_IMAGES[0]} 
                          alt={group.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 text-left">
                        <h4 className="font-extrabold text-sm text-slate-800 leading-tight truncate">
                          {group.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                          {group.description}
                        </p>
                        <span className="inline-flex items-center text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.8 py-0.5 rounded-md mt-1.5">
                          {group.members.length} / 150 miembros
                        </span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex items-center justify-center w-7 h-7 bg-emerald-50 rounded-full border border-emerald-100">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* POPULAR GROUPS TO JOIN */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-150 uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <Globe className="w-4 h-4 text-sky-450" />
              <span>Grupos Populares para Unirse ({popularGroupsToJoin.length})</span>
            </h3>

            {popularGroupsToJoin.length === 0 ? (
              <div className="bg-white/95 rounded-2xl p-5 text-center shadow border border-white/20">
                <Users className="w-7 h-7 mx-auto text-slate-300 mb-1.5" />
                <p className="text-xs font-bold text-slate-500">No hay grupos adicionales disponibles</p>
                <p className="text-[10px] text-slate-400">¡Eres parte de todos los grupos actualmente!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {popularGroupsToJoin.map(group => (
                  <div
                    key={group.id}
                    className="bg-white/95 rounded-[22px] p-3.5 border border-white/25 shadow flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full"
                    id={`pop-group-row-${group.id}`}
                  >
                    <div 
                      onClick={() => setActiveGroup(group)}
                      className="flex gap-3.5 items-center min-w-0 cursor-pointer flex-1 text-left"
                    >
                      <div className="w-13 h-13 rounded-2xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                        <img 
                          src={group.image || PRESET_IMAGES[0]} 
                          alt={group.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-slate-800 leading-tight hover:text-[#10b981] transition-colors truncate">
                          {group.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                          {group.description}
                        </p>
                        <span className="inline-flex items-center text-[9px] font-bold text-slate-500 bg-slate-100 px-1.8 py-0.5 rounded-md mt-1.5">
                          {group.members.length} / 150 miembros
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleJoinGroup(group)}
                      className="bg-slate-100 hover:bg-[#10b981] hover:text-white text-[#10b981] border border-slate-200/50 hover:border-transparent font-extrabold text-[10px] py-1.5 px-3 rounded-full shrink-0 flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-all active:scale-95"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>Unirme</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CREATE A NEW GROUP VIEW */}
      {isCreating && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setIsCreating(false)}
              className="p-1 px-2.5 rounded-full bg-white/95 text-slate-700 shadow-md flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-0.5" />
              <span className="text-[11px] font-bold">Cancelar</span>
            </button>
            <h2 className="text-xl font-extrabold text-white">Nuevo Grupo</h2>
          </div>

          <div className="bg-white/95 rounded-[26px] p-5 shadow-2xl border border-white/20 text-left space-y-4">
            <h3 className="font-black text-slate-800 text-base leading-none">Crea una Comunidad</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">El límite de miembros por chat es de 150. Eres automáticamente asignado como el Administrador.</p>
            
            <form onSubmit={handleCreateGroup} className="space-y-4 pt-1">
              {/* Group Name input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nombre del Grupo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ☕ Club de Ciencias Computacionales"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl py-2 px-3.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              {/* Group Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Breve Descripción</label>
                <textarea
                  required
                  placeholder="Describe de qué trata el grupo, qué archivos se comparten y las reglas básicas de convivencia."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl py-2.5 px-3.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#10b981] resize-none"
                />
              </div>

              {/* Custom Preset Image selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Elegir Imagen de Portada</label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewGroupImg(img)}
                      className={`aspect-square rounded-lg overflow-hidden border transition-all ${
                        newGroupImg === img ? 'ring-2 ring-[#10b981] border-transparent scale-103 shadow' : 'border-slate-200 hover:opacity-85'
                      }`}
                    >
                      <img src={img} alt="preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
                
                {/* Manual Image URL selection fallback */}
                <input
                  type="url"
                  placeholder="O pega tu link de imagen Unsplash/Web aquí..."
                  value={newGroupImg}
                  onChange={(e) => setNewGroupImg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl py-1.5 px-3.5 text-[10px] text-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-[#10b981] mt-2"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-transform duration-200 active:scale-[0.98] cursor-pointer mt-4"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Crear y Unirme</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. CORE GROUP VIEW GRID (Detail inside single active group) */}
      {activeGroup && !isCreating && !isEditing && !isPublishing && (
        <div className="space-y-4.5 text-left animate-in feed-in fade-in duration-300">
          
          {/* Header Row to go back */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setActiveGroup(null)}
              className="flex items-center gap-1.5 text-white/90 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 py-1.5 px-3 rounded-full border border-white/15 cursor-pointer"
              id="close-group-details-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a grupos</span>
            </button>

            {isJoined(activeGroup) ? (
              <button
                onClick={() => setIsPublishing(true)}
                className="bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs py-1.5 px-3.5 rounded-full shadow-md flex items-center gap-1 cursor-pointer transition-transform duration-200 active:scale-95"
                id="open-publish-post-btn"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Compartir Archivos</span>
              </button>
            ) : null}
          </div>

          {/* GROUP PORTRAIT CARD BANNER */}
          <div className="bg-white/95 rounded-[28px] overflow-hidden shadow-xl border border-white/25">
            <div className="h-28 relative">
              <img 
                src={activeGroup.image || PRESET_IMAGES[0]} 
                alt={activeGroup.name} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 text-[8px] font-extrabold bg-[#10b981] text-white px-1.8 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    <Users className="w-2.5 h-2.5" />
                    <span>Límite 150 miembros</span>
                  </span>
                  <h3 className="text-base font-black text-white leading-tight truncate mt-1">
                    {activeGroup.name}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3 pb-4">
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                {activeGroup.description}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 text-slate-500 pt-1">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 rounded-md p-1 px-2 border border-slate-100">
                  Creado: {new Date(activeGroup.createdAt).toLocaleDateString()}
                </span>
                
                {activeGroup.creatorId === currentUser.id ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 rounded-md p-1 px-2 border border-amber-100">
                    <Shield className="w-3 h-3 text-amber-500 stroke-[2]" />
                    <span>Eres el Creador</span>
                  </span>
                ) : (
                  <span className="text-[9.5px] font-bold text-slate-400">
                    Miembros: <b>{activeGroup.members.length}/150</b>
                  </span>
                )}
              </div>

              {/* ACTION BUILER ROW (Options or Join/Leave buttons) */}
              <div className="flex gap-2 pt-2.5 border-t border-slate-100">
                {isJoined(activeGroup) ? (
                  <>
                    {activeGroup.creatorId === currentUser.id ? (
                      <>
                        <button
                          onClick={startEditGroup}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-550" />
                          <span>Configuración</span>
                        </button>
                        
                        <button
                          onClick={handleDeleteGroup}
                          className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 border border-rose-100 shadow-sm transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Eliminar Grupo</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleLeaveGroup(activeGroup)}
                        className="w-full bg-slate-100 hover:bg-red-50 hover:text-red-650 hover:border-red-100 text-slate-650 font-extrabold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-transparent"
                      >
                        <LogOut className="w-3.5 h-3.5 text-slate-450 hover:text-red-500" />
                        <span>Salir del Grupo</span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleJoinGroup(activeGroup)}
                    className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Unirme a este grupo • {activeGroup.members.length}/150</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MEMBER AND EXPULSION ZONE */}
          {isJoined(activeGroup) && (
            <div className="bg-white/95 rounded-[22px] p-4 shadow-md border border-slate-200/30">
              <h4 className="text-xs font-bold text-slate-705 uppercase tracking-wide mb-2.5">Miembros actuales ({activeGroup.members.length})</h4>
              <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto">
                {getMemberAliasList(activeGroup.members).map((mb, idx) => (
                  <div key={idx} className="flex items-center justify-between p-1.5 hover:bg-slate-50/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                      {mb.avatar_url ? (
                        <img src={mb.avatar_url} alt="avatar" className="w-[26px] h-[26px] rounded-full border border-slate-200 object-cover" />
                      ) : (
                        <div className="w-[26px] h-[26px] rounded-full bg-[#10b981] flex items-center justify-center text-white font-bold text-[9px] uppercase">
                          {mb.alias.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-extrabold text-slate-800">@{mb.alias}</span>
                        {mb.id === activeGroup.creatorId && (
                          <span className="text-[7.5px] font-extrabold bg-amber-50 text-amber-600 px-1 py-0.2 rounded ml-1 border border-amber-100 uppercase tracking-widest text-[7px]">Creador</span>
                        )}
                      </div>
                    </div>

                    {/* EXPULSAR MIEMBRO: option for creator */}
                    {activeGroup.creatorId === currentUser.id && mb.id !== currentUser.id && (
                      <button
                        onClick={() => handleKickMember(mb.id, mb.alias)}
                        className="p-1 px-1.8 bg-red-50 text-red-650 hover:bg-red-100 hover:text-red-700 transition-colors border border-red-50 rounded-md text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Expulsar del grupo"
                      >
                        <UserX className="w-3 h-3 text-red-500" />
                        <span>Expulsar</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMMUNICATIONS / SHARED ARCHIVES ZONE (Feed lists within group) */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-150 uppercase tracking-widest pl-1 leading-none">
              Archivos compartidos ({activeGroupFiles.length})
            </h4>

            {!isJoined(activeGroup) ? (
              <div className="bg-white/95 rounded-[22px] p-8 text-center border border-white/25 shadow-md">
                <Users className="w-10 h-10 mx-auto text-slate-350 stroke-[1.5] mb-2" />
                <p className="text-xs font-black text-slate-800">Sección exclusiva para miembros</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1">Unete a este grupo para compartir archivos, vídeos, imágenes y chatear libremente en los comentarios de cada publicación.</p>
              </div>
            ) : activeGroupFiles.length === 0 ? (
              <div className="bg-white/95 rounded-[22px] p-8 text-center border border-white/25 shadow-md text-slate-500">
                <FilePlus className="w-9 h-9 mx-auto text-slate-300 stroke-[1.5] mb-1.5 animate-bounce" />
                <p className="text-xs font-bold text-slate-650">No hay publicaciones en el grupo aún.</p>
                <p className="text-[10px] text-slate-400 font-medium">¡Sé el primero en compartir un archivo útil con el grupo!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeGroupFiles.map((file) => {
                  const catData = CATEGORY_DETAILS[file.category] || { ico: FileText, col: 'text-neutral-800', lbl: 'Archivo' };
                  const Icon = catData.ico;
                  return (
                    <div
                      key={file.id}
                      className="bg-white/95 rounded-[22px] overflow-hidden border border-slate-205 shadow-sm text-left flex flex-col bg-white"
                      id={`group-feed-file-${file.id}`}
                    >
                      {/* Visual rendering block */}
                      <div className="bg-slate-50/85 aspect-video relative flex items-center justify-center border-b border-slate-100 overflow-hidden">
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
                            <span className="text-[8.5px] font-mono mt-1 opacity-70">Graba de Audio • {file.fileName}</span>
                          </div>
                        ) : file.category === 'video' ? (
                          <div className="w-full h-full bg-slate-900 text-white flex flex-col items-center justify-center p-3 animate-pulse">
                            <Video className="w-7 h-7 text-white" />
                            <span className="text-[10px] text-white/85 font-mono uppercase tracking-wide mt-1">Pista de Video</span>
                            <p className="text-[8.5px] text-white/50">{file.fileName}</p>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-350 p-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-150 flex items-center justify-center shadow-sm">
                              <Icon className={`w-5 h-5 ${catData.col}`} />
                            </div>
                            <span className="text-[9.5px] text-slate-500 font-bold mt-1.5 uppercase tracking-wide">{catData.lbl}</span>
                            <span className="text-[8px] text-slate-400 font-mono mt-0.5">{file.fileName}</span>
                          </div>
                        )}

                        {/* Floating author tag */}
                        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 bg-black/60 rounded-full py-0.8 pr-2.5 pl-0.8 text-white backdrop-blur-xs select-none">
                          {file.authorAvatar ? (
                            <img src={file.authorAvatar} alt="author" className="w-[18px] h-[18px] rounded-full border border-white/20 object-cover" />
                          ) : (
                            <div className="w-[18px] h-[18px] rounded-full bg-[#10b981] flex items-center justify-center text-white font-bold text-[8px]">U</div>
                          )}
                          <span className="text-[9.5px] font-medium max-w-[80px] truncate">@{file.authorAlias}</span>
                        </div>
                      </div>

                      {/* Metadata details */}
                      <div className="p-3.5 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-xs text-slate-800 tracking-tight leading-tight uppercase truncate max-w-[180px]">
                            {file.name}
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-650 font-semibold leading-relaxed">
                          {file.description || 'Sin comentarios o descripción provista.'}
                        </p>

                        {/* Security Alert dynamic tip */}
                        {['code', 'box'].includes(file.category) && (
                          <div className="flex items-start gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-700 p-1.5 rounded-xl text-[9.5px] font-bold select-none leading-tight">
                            <Shield className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                            <span>⚠️ ALERTA DE SEGURIDAD COSTA RICA: Revisa el código del archivo antes de abrirlo.</span>
                          </div>
                        )}

                        {/* Interactions row */}
                        <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                          <div className="flex gap-2 items-center">
                            {/* Like button */}
                            <button
                              onClick={(e) => handleLikePost(e, file.id)}
                              className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold px-2 py-0.8 rounded-md text-[10px] transition-colors cursor-pointer border border-slate-150"
                            >
                              <ThumbsUp className="w-3 h-3 text-emerald-500" />
                              <span>{file.likes || 0}</span>
                            </button>

                            {/* Comment Chat button */}
                            <button
                              onClick={() => onOpenChat(file)}
                              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold px-2 py-0.8 rounded-md text-[10px] transition-colors cursor-pointer border border-slate-150"
                              title="Ver comentarios"
                            >
                              <MessageSquare className="w-3 h-3 text-sky-500" />
                              <span>Comentar ({file.commentsCount || 0})</span>
                            </button>

                            {/* Option to delete shared group files if the user is the file publisher */}
                            {file.userId === currentUser.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerConfirm(
                                    'Eliminar Archivo del Grupo',
                                    `⚠️ ¿Estás seguro de que deseas eliminar de forma permanente de este grupo tu archivo "${file.name}"? Esta acción se aplicará tanto en este dispositivo como en Supabase.`,
                                    async () => {
                                      const res = await deleteFile(file.id, currentUser.id);
                                      if (res.success) {
                                        triggerConfirm('Archivo Eliminado', `Tu archivo "${file.name}" ha sido eliminado del grupo y de Supabase.`, () => {
                                          setActiveGroupFiles(prev => prev.filter(f => f.id !== file.id));
                                        }, true, 'success');
                                      } else {
                                        triggerConfirm('Error', `Error al eliminar archivo: ${res.error || 'error desconocido'}`, () => {}, true, 'error');
                                      }
                                    },
                                    false,
                                    'warning'
                                  );
                                }}
                                className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold px-2 py-0.8 rounded-md text-[10px] transition-colors cursor-pointer"
                                title="Eliminar mi archivo"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Borrar</span>
                              </button>
                            )}
                          </div>
                          
                          <span className="text-[9.5px] font-bold text-slate-400">
                            {file.fileSize || '32 KB'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. EDIT GROUP SETTINGS VIEW */}
      {isEditing && activeGroup && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 px-2.5 rounded-full bg-white/95 text-slate-700 shadow-md flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-0.5" />
              <span className="text-[11px] font-bold">Atrás</span>
            </button>
            <h2 className="text-xl font-extrabold text-white">Editar Grupo</h2>
          </div>

          <div className="bg-white/95 rounded-[26px] p-5 shadow-2xl border border-white/20 text-left space-y-4">
            <h3 className="font-black text-slate-800 text-base leading-none">Opciones de Administrador</h3>
            <p className="text-[11px] text-slate-500 font-medium">Modifica la información básica del grupo. Solo tú tienes permiso de hacer esto.</p>

            <form onSubmit={handleUpdateGroupSettings} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nombre del Grupo</label>
                <input
                  type="text"
                  required
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl py-2 px-3.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Descripción</label>
                <textarea
                  required
                  value={editGroupDesc}
                  onChange={(e) => setEditGroupDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl py-2.5 px-3.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#10b981] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Cambiar Portada</label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditGroupImg(img)}
                      className={`aspect-square rounded-lg overflow-hidden border transition-all ${
                        editGroupImg === img ? 'ring-2 ring-[#10b981] border-transparent scale-103' : 'border-slate-200'
                      }`}
                    >
                      <img src={img} alt="preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
                
                <input
                  type="url"
                  placeholder="Link de imagen personalizado..."
                  value={editGroupImg}
                  onChange={(e) => setEditGroupImg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl py-1.5 px-3.5 text-[10px] text-slate-650 font-mono focus:outline-none focus:ring-2 focus:ring-[#10b981] mt-2"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-slate-105 text-slate-655 hover:bg-slate-150 font-extrabold text-xs py-2.5 rounded-xl border border-slate-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. PUBLISH FILE TO GROUP VIEW */}
      {isPublishing && activeGroup && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setIsPublishing(false)}
              className="p-1 px-2.5 rounded-full bg-white/95 text-slate-700 shadow-md flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-0.5" />
              <span className="text-[11px] font-bold">Atrás</span>
            </button>
            <h2 className="text-xl font-extrabold text-white">Compartir Archivo</h2>
          </div>

          <div className="bg-white/95 rounded-[26px] p-5 shadow-2xl border border-white/20 text-left space-y-4">
            <div>
              <h3 className="font-black text-slate-800 text-base leading-none">Publicar en {activeGroup.name}</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mt-1.5">Tu alias: <b className="text-slate-800 underline">@{currentUser.alias}</b></p>
            </div>

            <form onSubmit={handlePublishToGroupSubmit} className="space-y-4">
              
              {/* Category selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Categoría de Archivo</label>
                <select
                  value={pubCategory}
                  onChange={(e) => setPubCategory(e.target.value as FileCategory)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl py-2 px-3 text-xs text-slate-800 font-bold cursor-pointer"
                >
                  <option value="document">📄 Documento (PDF, DOC, TXT)</option>
                  <option value="photo">🖼️ Foto (JPG, PNG, WEBP)</option>
                  <option value="video">🎥 Video (MP4, MOV)</option>
                  <option value="audio">🎙️ Audio / Nota de voz</option>
                  <option value="location">📍 Ubicación (KML, GPX)</option>
                  <option value="code">💻 Código fuente (TS, JS, PY)</option>
                  <option value="box">📦 Paquete / Zip (ZIP, RAR)</option>
                </select>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nombre de la Publicación</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Diapositivas clase 4, Foto de mi mascota..."
                  value={pubName}
                  onChange={(e) => setPubName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl py-2 px-3.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>

              {/* Description textarea */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Detalles o Mensaje</label>
                <textarea
                  placeholder="Escribe algunas notas descriptivas sobre este aporte..."
                  value={pubDesc}
                  onChange={(e) => setPubDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl py-2 px-3.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#10b981] resize-none"
                />
              </div>

              {/* Advanced Simulated file values (so users don't have to upload massive raw files) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Nombre Físico del Archivo</label>
                  <input
                    type="text"
                    placeholder="ej: guia_final.pdf"
                    value={pubFileName}
                    onChange={(e) => setPubFileName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-[10px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Peso o Tamaño</label>
                  <input
                    type="text"
                    placeholder="ej: 1.4 MB o Enlace"
                    value={pubFileSize}
                    onChange={(e) => setPubFileSize(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-[10px] text-slate-650 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">URL del Archivo o Imagen (Opcional)</label>
                <input
                  type="url"
                  placeholder="Enlace o dejar en blanco para usar simulador offline..."
                  value={pubUrl}
                  onChange={(e) => setPubUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-[10px] text-slate-600 font-mono focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-transform duration-200 active:scale-97 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar al Grupo</span>
              </button>
            </form>
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
                  <Check className="w-6 h-6 stroke-[2]" />
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
