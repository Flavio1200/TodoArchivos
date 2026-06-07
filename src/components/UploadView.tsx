/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, Image as ImageIcon, Video, Mic, MapPin, Layout, 
  Chrome, Instagram, Github, X, Code, Box, 
  Upload, Share2, ArrowLeft, Send, CheckCircle2, FileUp 
} from 'lucide-react';
import { SharedFile, FileCategory, UserProfile } from '../types';
import { uploadFile } from '../db';
import { triggerNotification } from '../notificationsHelper';


interface UploadViewProps {
  currentUser: UserProfile;
  onUploadSuccess: () => void;
}

interface FileTypeItem {
  key: FileCategory;
  ico: React.ComponentType<any>;
  col: string;
  lbl: string;
  accept: string;
}

const FILE_TYPES: FileTypeItem[] = [
  { key: 'document', ico: FileText, col: 'text-neutral-800', lbl: 'Documento', accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt' },
  { key: 'photo', ico: ImageIcon, col: 'text-sky-500', lbl: 'Foto', accept: '.jpg,.jpeg,.png,.gif,.webp' },
  { key: 'video', ico: Video, col: 'text-emerald-500', lbl: 'Video', accept: '.mp4,.mov,.avi,.mkv,.webm' },
  { key: 'audio', ico: Mic, col: 'text-purple-600', lbl: 'Audio', accept: '.mp3,.wav,.ogg,.m4a,.flac' },
  { key: 'location', ico: MapPin, col: 'text-red-500', lbl: 'Ubicación', accept: '.json,.gpx,.kml' },
  { key: 'website', ico: Layout, col: 'text-orange-500', lbl: 'Sitio Web', accept: '.html,.htm,.url' },
  { key: 'instagram', ico: Instagram, col: 'text-orange-500', lbl: 'Instagram', accept: '*' },
  { key: 'github', ico: Github, col: 'text-zinc-800', lbl: 'GitHub', accept: '.ts,.tsx,.js,.jsx,.py,.cpp,.java,.go,.json,.md' },
  { key: 'twitter', ico: X, col: 'text-neutral-900', lbl: 'X', accept: '*' },
  { key: 'code', ico: Code, col: 'text-rose-500', lbl: 'Código', accept: '.ts,.tsx,.js,.jsx,.html,.css,.py,.json,.go,.cpp,.java,.php,.rb,.sh' },
  { key: 'box', ico: Box, col: 'text-yellow-500', lbl: 'Paquete/Zip', accept: '.zip,.rar,.tar,.gz,.7z' }
];

export default function UploadView({ currentUser, onUploadSuccess }: UploadViewProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<FileTypeItem>(FILE_TYPES[0]);
  
  // Form fields
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  
  // UI states
  const [uploading, setUploading] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const isLinkType = ['instagram', 'twitter'].includes(selectedType.key);

  // Choose file category in step 1
  const handleSelectType = (item: FileTypeItem) => {
    setSelectedType(item);
    setStep(2);
  };

  // Convert uploaded user file to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined) => {
    if (!file) return;

    // Verificar formato/extensión según el tipo seleccionado (solo si no es tipo enlace)
    if (!isLinkType && selectedType.accept !== '*') {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = selectedType.accept.split(',').map(ext => ext.trim());

      if (!allowedExtensions.includes(fileExtension)) {
        alert(`Formato de archivo no permitido. Para la categoría "${selectedType.lbl}" solo se permiten los siguientes formatos: ${selectedType.accept}`);
        return;
      }
    }
    
    setFileName(file.name);
    // Format human-readable size
    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize = sizeInMB > 1 
      ? sizeInMB.toFixed(1) + ' MB' 
      : (file.size / 1024).toFixed(0) + ' KB';
    setFileSize(formattedSize);

    const reader = new FileReader();
    reader.onloadend = () => {
      const resultStr = reader.result as string;
      if (selectedType.key === 'photo' && file.type.startsWith('image/')) {
        // Realizar compresión y escalado de imagen en el lado del cliente con Canvas
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Definir límites máximos razonables para no comprometer bases de datos
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir a JPEG comprimido de calidad media-alta (0.7)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setFileUrl(compressedBase64);
            
            // Recalcular tamaño exacto final estimado
            const sizeInBytes = Math.round((compressedBase64.length * 3) / 4);
            const sizeInKB = sizeInBytes / 1024;
            setFileSize(sizeInKB > 1024 ? (sizeInKB / 1024).toFixed(1) + ' MB' : Math.round(sizeInKB) + ' KB');
          } else {
            setFileUrl(resultStr);
          }
        };
        img.onerror = () => {
          setFileUrl(resultStr);
        };
        img.src = resultStr;
      } else {
        setFileUrl(resultStr);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Submit file to DB
  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert(isLinkType ? 'Por favor ingresa el título para este enlace' : 'Ingresa el nombre del archivo');
      return;
    }

    if (isLinkType && !fileUrl.trim()) {
      alert('Por favor ingresa el link o enlace de la publicación o cuenta');
      return;
    }
    
    setUploading(true);
    
    // Fallback if no file uploaded, provide dummy placeholders based on selected type
    let finalUrl = fileUrl;
    let finalFileName = fileName;
    let finalFileSize = fileSize;

    if (isLinkType) {
      finalFileName = `Enlace ${selectedType.lbl}`;
      finalFileSize = 'Enlace';
    } else if (!finalUrl) {
      if (selectedType.key === 'photo') finalUrl = 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=600';
      else if (selectedType.key === 'audio') finalUrl = 'audio_playback_link';
      else if (selectedType.key === 'video') finalUrl = 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-1181-large.mp4';
      else finalUrl = 'data:text/plain;base64,U2ltdWxhdGVkIGZpbGUgZGF0YQ==';
    }

    const { success, error } = await uploadFile({
      userId: currentUser.id,
      authorName: currentUser.name,
      authorAlias: currentUser.alias,
      authorAvatar: currentUser.avatar_url,
      name: trimmedName,
      description,
      category: selectedType.key,
      fileUrl: finalUrl,
      fileName: finalFileName || `${trimmedName.toLowerCase().replace(/\s+/g, '_')}.${selectedType.key === 'photo' ? 'jpg' : 'txt'}`,
      fileSize: finalFileSize || '24 KB',
      isPublic: isPublic
    });

    setUploading(false);

    if (success) {
      try {
        // Trigger a custom push notification about successful file upload
        triggerNotification(
          'Archivo Subido',
          `"${trimmedName}" (${finalFileSize || 'Enlace'}) se ha subido correctamente.`,
          'upload',
          undefined,
          currentUser.alias
        );

        // If file is shared publicly, notify about its successful publication
        if (isPublic) {
          setTimeout(() => {
            triggerNotification(
              'Archivo Publicado',
              `¡Tu archivo "${trimmedName}" ahora es público en el Feed de la comunidad!`,
              'publish',
              undefined,
              currentUser.alias
            );
          }, 800);
        }
      } catch (notifErr) {
        console.error('Error triggering upload notifications:', notifErr);
      }

      setIsDone(true);
      setTimeout(() => {
        // Reset and notify parent standard callback
        onUploadSuccess();
        setName('');
        setDescription('');
        setFileUrl('');
        setFileName('');
        setFileSize('');
        setStep(1);
        setIsDone(false);
      }, 1500);
    } else {
      alert(error || 'Error al subir el archivo');
    }
  };

  const ActiveIcon = selectedType.ico;

  return (
    <div className="flex-1 flex flex-col justify-between p-5 pb-24 h-full overflow-y-auto select-none">
      
      {/* STEP 1: CHOOSE CATEGORY */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center animate-in fade-in duration-300">
          <div className="text-center mb-6">
            <h2 className="text-white font-extrabold text-2xl tracking-tight leading-none drop-shadow-sm">
              ¿Qué vas a Subir?
            </h2>
            <p className="text-white/80 text-xs mt-1.5 font-medium">
              Selecciona una categoría de archivo para configurar los datos
            </p>
          </div>

          {/* Grid de 12 opciones */}
          <div className="grid grid-cols-3 gap-3">
            {FILE_TYPES.map((item) => {
              const Icon = item.ico;
              return (
                <button
                  key={item.key}
                  onClick={() => handleSelectType(item)}
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-4.5 flex flex-col items-center justify-center border border-white/20 shadow-md hover:bg-white hover:scale-[1.03] transition-all cursor-pointer active:scale-95"
                  id={`upload-type-${item.key}`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-1.5 ${item.col}`}>
                    <Icon className="w-5 h-5 line-height-none" />
                  </div>
                  <span className="text-[10px] text-slate-700 font-bold tracking-tight text-center truncate w-full">
                    {item.lbl}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: METADATA & UPLOAD */}
      {step === 2 && (
        <div className="flex-1 flex flex-col justify-center gap-4 animate-in slide-in-from-right-4 duration-300">
          
          {/* Header Back Button */}
          <button 
            onClick={() => setStep(1)}
            className="self-start flex items-center gap-1.5 text-white/90 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 py-1.5 px-3 rounded-full border border-white/15"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al menú de tipos</span>
          </button>

          <div className="text-center">
            <h2 className="text-white font-extrabold text-2xl tracking-tight drop-shadow-sm leading-none">
              Agrega los Datos
            </h2>
            <p className="text-white/80 text-xs mt-1 font-medium select-none uppercase tracking-wide">
              Subiendo: <b className="text-white underline">{selectedType.lbl}</b>
            </p>
          </div>

          {/* Upload card box structure mirroring user screenshot screen #3 */}
          <div className="bg-white/95 rounded-[28px] p-5 shadow-2xl border border-white/20 space-y-4">
            
            <div className="flex gap-3.5">
              {/* Type Graphic icon Card (Left Side) */}
              <div className="w-[84px] h-[84px] border border-slate-200 bg-slate-50/80 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shrink-0 group shadow-sm">
                <div className={`p-2.5 rounded-xl bg-white border border-slate-100 ${selectedType.col}`}>
                  <ActiveIcon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="absolute bottom-0 w-full bg-slate-100/90 py-0.5 text-center border-t border-slate-150">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">
                    {selectedType.key}
                  </span>
                </div>
              </div>

              {/* Upload field & Name Input (Right Side) */}
              <div className="flex-1 flex flex-col justify-between gap-1.5 min-w-0">
                {isLinkType ? (
                  <>
                    {/* Link URL input */}
                    <input
                      type="url"
                      placeholder={
                        selectedType.key === 'instagram' ? "Enlace de publicación o cuenta en Instagram" :
                        "Enlace de publicación o cuenta en X"
                      }
                      value={fileUrl}
                      onChange={(e) => {
                        setFileUrl(e.target.value);
                        setFileName(`Enlace ${selectedType.lbl}`);
                        setFileSize('Enlace');
                      }}
                      className="w-full bg-slate-55 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-all font-semibold"
                      id="link-url-input"
                    />

                    {/* Title field for links */}
                    <input
                      type="text"
                      placeholder={`Título para la publicación o cuenta de ${selectedType.lbl}`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-55 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-405 focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-all font-semibold"
                      id="link-title-input"
                    />
                  </>
                ) : (
                  <>
                    {/* File picker selector */}
                    <div 
                      className={`border border-dashed rounded-xl py-1.5 px-3 flex items-center gap-2 transition-all cursor-pointer relative ${
                        dragActive ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70'
                      }`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                    >
                      <label className="flex items-center gap-2 w-full cursor-pointer">
                        <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                          <FileUp className="w-3.5 h-3.5 text-[#10b981]" />
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold truncate max-w-[120px]">
                          {fileName ? fileName : 'Selecciona un archivo'}
                        </span>
                        <input 
                          type="file" 
                          onChange={handleFileChange}
                          accept={selectedType.accept}
                          className="hidden" 
                        />
                      </label>
                    </div>

                    {/* Name of item field */}
                    <input
                      type="text"
                      placeholder="Nombre de la publicación"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl py-2 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-all font-semibold"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Description textarea */}
            <textarea
              placeholder="Escribe una breve descripción aquí..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-2xl py-2.5 px-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] transition-all resize-none font-medium leading-relaxed"
            />

            {/* Make Public switch slide toggle */}
            <div className="flex justify-between items-center bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <span className="text-xs font-bold text-slate-700">Hacer Público</span>
              
              <button
                onClick={() => setIsPublic(!isPublic)}
                type="button"
                className={`w-12 h-6.5 rounded-full p-1.5 transition-all outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 ${
                  isPublic ? 'bg-[#10b981]' : 'bg-slate-300'
                }`}
              >
                <div 
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-all shadow-md transform ${
                    isPublic ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Simulated Share Component */}
            <button 
              onClick={() => alert(`Este archivo se marcará como ${isPublic ? 'Compartido de forma pública en el feed' : 'Privado en tu carpeta'}`)}
              className="w-full bg-slate-100 text-slate-600 hover:bg-slate-150 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 transition-all border border-slate-200/50"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>Compartir en Redes</span>
            </button>

            {/* Big Green Enviar Button */}
            <button
              onClick={handleSubmit}
              disabled={uploading || isDone}
              className={`w-full py-4.5 rounded-3xl text-sm font-extrabold text-white shadow-xl transition-all flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] active:scale-[0.97] cursor-pointer ${
                uploading ? 'opacity-75 cursor-wait' : ''
              }`}
              id="upload-submit-btn"
            >
              {isDone ? (
                <>
                  <CheckCircle2 className="w-5 h-5 animate-bounce" />
                  <span>¡Enviado con Éxito!</span>
                </>
              ) : uploading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Enviando archivo...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Publicación</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-center text-white/50 text-[10px] mt-2 font-semibold uppercase select-none">
        Paso {step} de 2 • {selectedType.lbl}
      </p>
    </div>
  );
}
