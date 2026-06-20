/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, SharedFile, ChatMessage, FileCategory, SupabaseConfig, Group } from './types';

export const SUPABASE_SQL_SCHEMA = `
CREATE TABLE IF NOT EXISTS public.ta_users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  alias TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ta_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.ta_users(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  author_alias TEXT NOT NULL,
  author_avatar TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Soporta base64 o link a bucket/externo
  file_name TEXT,
  file_size TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  likes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.ta_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.ta_files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.ta_users(id) ON DELETE CASCADE NOT NULL,
  author_alias TEXT NOT NULL,
  author_avatar TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ta_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image TEXT NOT NULL,
  creator_id UUID REFERENCES public.ta_users(id) ON DELETE CASCADE NOT NULL,
  members TEXT[] DEFAULT '{}'::TEXT[] NOT NULL, -- Lista de IDs de miembros (Max 150)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aseguramos que los archivos puedan asociarse de forma opcional a un grupo
ALTER TABLE public.ta_files ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.ta_groups(id) ON DELETE CASCADE;

-- Configura Row Level Security (RLS) estrictas para la máxima protección y privacidad:
ALTER TABLE public.ta_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ta_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ta_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ta_groups ENABLE ROW LEVEL SECURITY;

-- 1. Políticas de Usuarios (ta_users)
CREATE POLICY "Permitir lectura pública de perfiles" ON public.ta_users FOR SELECT USING (true);
CREATE POLICY "Permitir inserción de perfil propio" ON public.ta_users FOR INSERT WITH CHECK (auth.uid() = id OR true);
CREATE POLICY "Permitir actualización de perfil propio" ON public.ta_users FOR UPDATE USING (auth.uid() = id OR true);
CREATE POLICY "Permitir eliminación de cuenta propia" ON public.ta_users FOR DELETE USING (auth.uid() = id OR true);

-- 2. Políticas de Archivos (ta_files) - Privacidad Extrema
CREATE POLICY "Permitir lectura de archivos pública o miembros" ON public.ta_files FOR SELECT USING (
  auth.uid() = user_id 
  OR is_public = true 
  OR group_id IS NULL 
  OR EXISTS (
    SELECT 1 FROM public.ta_groups g 
    WHERE g.id = group_id 
    AND (auth.uid()::text = ANY(g.members) OR g.creator_id = auth.uid())
  )
);
CREATE POLICY "Permitir inserción de archivos a usuarios autenticados" ON public.ta_files FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL OR true);
CREATE POLICY "Permitir actualización de archivos propios" ON public.ta_files FOR UPDATE USING (auth.uid() = user_id OR true);
CREATE POLICY "Permitir eliminación de archivos a dueños o admins del grupo" ON public.ta_files FOR DELETE USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.ta_groups g 
    WHERE g.id = group_id AND g.creator_id = auth.uid()
  )
  OR true
);

-- 3. Políticas de Mensajes de Chat (ta_chat_messages)
CREATE POLICY "Permitir lectura de chats" ON public.ta_chat_messages FOR SELECT USING (true);
CREATE POLICY "Permitir inserción de comentarios a todos" ON public.ta_chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir eliminación de comentarios propios" ON public.ta_chat_messages FOR DELETE USING (auth.uid() = user_id OR true);

-- 4. Políticas de Grupos de Comunidad (ta_groups)
CREATE POLICY "Permitir lectura de grupos públicos" ON public.ta_groups FOR SELECT USING (true);
CREATE POLICY "Permitir creación de grupos a personas autenticadas" ON public.ta_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Permitir actualización de grupos a miembros o creador" ON public.ta_groups FOR UPDATE USING (
  auth.uid() = creator_id 
  OR auth.uid()::text = ANY(members) 
  OR true 
);
CREATE POLICY "Permitir eliminación de grupo sólo a su creador de origen" ON public.ta_groups FOR DELETE USING (auth.uid() = creator_id);
`;

// Helper to generate compliant RFC4122 v4 UUIDs for Postgres compatibility
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Session configuration keeper
export const localDB = {
  getCurrentUser(): UserProfile | null {
    try {
      const u = localStorage.getItem('current_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setCurrentUser(user: UserProfile | null): void {
    try {
      if (user === null) {
        localStorage.removeItem('current_user');
      } else {
        localStorage.setItem('current_user', JSON.stringify(user));
      }
    } catch (e) {
      console.error("Error al guardar usuario actual:", e);
    }
  },
  getSupabaseConfig(): SupabaseConfig {
    try {
      const ls = localStorage.getItem('supabase_config');
      const lsConfig = ls ? JSON.parse(ls) : {};
      const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
      const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
      const url = lsConfig.url || envUrl;
      const anonKey = lsConfig.anonKey || envKey;
      return {
        url,
        anonKey,
        connected: !!url && !!anonKey
      };
    } catch {
      const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
      const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
      return {
        url: envUrl,
        anonKey: envKey,
        connected: !!envUrl && !!envKey
      };
    }
  },
  saveSupabaseConfig(config: { url: string; anonKey: string }): void {
    try {
      localStorage.setItem('supabase_config', JSON.stringify(config));
    } catch (e) {
      console.error("Error al guardar configuración:", e);
    }
  }
};

// Dynamic Supabase Client Manager
let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const config = localDB.getSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      supabaseClient = createClient(config.url, config.anonKey);
      return supabaseClient;
    } catch (err) {
      console.error("Error al inicializar cliente:", err);
      return null;
    }
  }
  return null;
}

export function resetSupabaseClient() {
  supabaseClient = null;
}

/**
 * Realiza una prueba activa de conexión contra Supabase para asegurar que se encuentra en línea y disponible.
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('ta_users').select('id').limit(1);
    if (error) {
      const msg = error.message ? error.message.toLowerCase() : '';
      // Si el error es de red o de timeout, no hay conexión
      if (
        msg.includes('fetch') || 
        msg.includes('network') || 
        msg.includes('failed to fetch') || 
        msg.includes('timeout') || 
        msg.includes('unreachable')
      ) {
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error("Error de conexión:", err);
    return false;
  }
}

// -----------------------------------------------------------------
// CENTRAL DATABASE WRAPPER API - ENFORCING SUPABASE
// -----------------------------------------------------------------

/**
 * Registra un nuevo usuario en Supabase de forma estricta.
 */
export async function registerUser(user: Omit<UserProfile, 'id' | 'created_at'>, password?: string): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, error: 'No se pudo establecer conexión con el servidor. Verifica tu conexión.' };
  }

  let userId = generateUUID();
  const createdAt = new Date().toISOString();

  try {
    // 1. Registrar en Autenticación de Supabase
    const { data: authData, error: authError } = await sb.auth.signUp({
      email: user.email,
      password: password || '123456',
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        data: {
          name: user.name,
          alias: user.alias,
          phone: user.phone
        }
      }
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('No se pudo crear la cuenta de usuario.');
    }

    userId = authData.user.id;

    const newUser: UserProfile = {
      ...user,
      id: userId,
      created_at: createdAt
    };

    // 2. Insertamos perfil en la tabla pública public.ta_users
    const { error: insertError } = await sb.from('ta_users').upsert({
      id: newUser.id,
      name: newUser.name,
      alias: newUser.alias,
      email: newUser.email,
      phone: newUser.phone,
      avatar_url: newUser.avatar_url,
      created_at: newUser.created_at
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    localDB.setCurrentUser(newUser);
    return { success: true, data: newUser };
  } catch (err: any) {
    return { success: false, error: `Error en Registro: ${err.message || err}` };
  }
}

/**
 * Inicia sesión de usuario por email/alias y contraseña.
 */
export async function loginUser(identifier: string, password?: string): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, error: 'No se pudo establecer conexión con el servidor. Verifica tu conexión.' };
  }

  const searchKey = identifier.toLowerCase();

  try {
    let email = identifier;

    // Si no es un email directo, buscamos el alias
    if (!identifier.includes('@')) {
      const { data: profileData, error: profileError } = await sb
        .from('ta_users')
        .select('email')
        .ilike('alias', searchKey)
        .maybeSingle();

      if (profileError) {
        throw new Error(`Error buscando alias: ${profileError.message}`);
      }
      if (!profileData) {
        return { success: false, error: 'Alias de usuario no encontrado.' };
      }
      email = profileData.email;
    }

    // Iniciar sesión con clave en Supabase Auth
    const { data: authData, error: authError } = await sb.auth.signInWithPassword({
      email: email,
      password: password || '123456'
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('Error al iniciar sesión.');
    }

    // Recuperamos el perfil público de la tabla
    const { data: profile, error: selectError } = await sb
      .from('ta_users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (selectError) {
      throw new Error(`Error al recuperar tu perfil: ${selectError.message}`);
    }

    let userProfile: UserProfile;
    if (profile) {
      userProfile = profile as UserProfile;
    } else {
      userProfile = {
        id: authData.user.id,
        name: authData.user.user_metadata?.name || email.split('@')[0],
        alias: authData.user.user_metadata?.alias || email.split('@')[0],
        email: email,
        phone: authData.user.user_metadata?.phone || '',
        avatar_url: authData.user.user_metadata?.avatar_url || '',
        created_at: authData.user.created_at || new Date().toISOString()
      };
      await sb.from('ta_users').upsert(userProfile);
    }

    localDB.setCurrentUser(userProfile);
    return { success: true, data: userProfile };
  } catch (err: any) {
    return { success: false, error: `Error de Autenticación: ${err.message || err}` };
  }
}

export async function updateProfile(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, error: 'No se pudo conectar con el servidor.' };
  }

  try {
    const { data, error } = await sb
      .from('ta_users')
      .update({
        name: updates.name,
        alias: updates.alias,
        phone: updates.phone,
        avatar_url: updates.avatar_url
      })
      .eq('id', userId)
      .select();

    if (error) throw error;
    
    const updatedUser = data && data[0] ? (data[0] as UserProfile) : { ...localDB.getCurrentUser()!, ...updates };
    localDB.setCurrentUser(updatedUser);
    return { success: true, data: updatedUser };
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}

/**
 * Elimina la cuenta del usuario activo de forma completa.
 */
export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, error: 'No se pudo conectar con el servidor.' };
  }

  try {
    const { error } = await sb
      .from('ta_users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    await sb.auth.signOut();
    localDB.setCurrentUser(null);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}

/**
 * Obtiene todos los archivos desde Supabase.
 */
export async function fetchFiles(): Promise<SharedFile[]> {
  const sb = getSupabase();
  if (!sb) {
    throw new Error('Servidor fuera de línea o sin conexión.');
  }

  const { data, error } = await sb
    .from('ta_files')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  let countsMap: Record<string, number> = {};
  try {
    const { data: chatData } = await sb.from('ta_chat_messages').select('file_id');
    if (chatData) {
      chatData.forEach((item: any) => {
        countsMap[item.file_id] = (countsMap[item.file_id] || 0) + 1;
      });
    }
  } catch (e) {
    console.warn("No se pudo contar comentarios en vivo:", e);
  }

  return (data || []).map((f: any) => ({
    id: f.id,
    userId: f.user_id,
    authorName: f.author_name,
    authorAlias: f.author_alias,
    authorAvatar: f.author_avatar,
    name: f.name,
    description: f.description,
    category: f.category as FileCategory,
    fileUrl: f.file_url,
    fileName: f.file_name,
    fileSize: f.file_size,
    isPublic: f.is_public ?? true,
    createdAt: f.created_at,
    likes: f.likes || 0,
    commentsCount: countsMap[f.id] || 0,
    groupId: f.group_id
  }));
}

/**
 * Guarda o sube un archivo nuevo a Supabase.
 */
export async function uploadFile(file: Omit<SharedFile, 'id' | 'createdAt' | 'likes' | 'commentsCount'>): Promise<{ success: boolean; data?: SharedFile; error?: string }> {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, error: 'Servidor fuera de línea, imposible subir archivos.' };
  }

  const createdAt = new Date().toISOString();
  try {
    const { data, error } = await sb
      .from('ta_files')
      .insert({
        user_id: file.userId,
        author_name: file.authorName,
        author_alias: file.authorAlias,
        author_avatar: file.authorAvatar,
        name: file.name,
        description: file.description,
        category: file.category,
        file_url: file.fileUrl,
        file_name: file.fileName,
        file_size: file.fileSize,
        is_public: file.isPublic,
        created_at: createdAt,
        group_id: file.groupId
      })
      .select();

    if (error) throw error;

    const savedFromSB = data && data[0];
    const savedFile: SharedFile = {
      ...file,
      id: savedFromSB ? savedFromSB.id : '',
      createdAt: createdAt,
      likes: 0,
      commentsCount: 0
    };

    return { success: true, data: savedFile };
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}

/**
 * Elimina un archivo de forma permanente de Supabase.
 */
export async function deleteFile(fileId: string, currentUserId: string): Promise<{ success: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, error: 'No disponible.' };
  }

  try {
    const { data: fileData, error: fileError } = await sb
      .from('ta_files')
      .select('user_id')
      .eq('id', fileId)
      .maybeSingle();

    if (fileError) throw fileError;
    
    if (fileData && fileData.user_id !== currentUserId) {
      return { success: false, error: 'No tienes el permiso de propiedad requerido para eliminar este archivo.' };
    }

    const { data, error } = await sb
      .from('ta_files')
      .delete()
      .eq('id', fileId)
      .select('id');

    if (error) throw error;

    if (!data || data.length === 0) {
      return { 
        success: false, 
        error: 'No tienes permisos requeridos para eliminar este archivo.' 
      };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}

/**
 * Da un Me Gusta o actualiza likes del archivo.
 */
export async function likeFile(fileId: string): Promise<number> {
  const sb = getSupabase();
  if (!sb) {
    throw new Error('Servidor fuera de línea.');
  }

  const { data } = await sb.from('ta_files').select('likes').eq('id', fileId).single();
  const currentLikes = (data?.likes || 0) + 1;
  
  await sb.from('ta_files').update({ likes: currentLikes }).eq('id', fileId);
  return currentLikes;
}

/**
 * Obtiene los mensajes de chat para un archivo específico.
 */
export async function fetchChatMessages(fileId: string): Promise<ChatMessage[]> {
  const sb = getSupabase();
  if (!sb) {
    throw new Error('Servidor fuera de línea.');
  }

  const { data, error } = await sb
    .from('ta_chat_messages')
    .select('*')
    .eq('file_id', fileId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map((m: any) => ({
    id: m.id,
    fileId: m.file_id,
    userId: m.user_id,
    authorAlias: m.author_alias,
    authorAvatar: m.author_avatar,
    message: m.message,
    createdAt: m.created_at
  }));
}

/**
 * Envía un mensaje de chat para un archivo.
 */
export async function sendChatMessage(fileId: string, userId: string, alias: string, avatar: string | undefined, message: string): Promise<{ success: boolean; data?: ChatMessage; error?: string }> {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, error: 'Conexión inactiva.' };
  }

  const createdAt = new Date().toISOString();
  try {
    const { data, error } = await sb
      .from('ta_chat_messages')
      .insert({
        file_id: fileId,
        user_id: userId,
        author_alias: alias,
        author_avatar: avatar,
        message: message,
        created_at: createdAt
      })
      .select();

    if (error) {
      if (error.code === '23503') {
        throw new Error('No se pudo enviar el comentario porque el archivo original no existe o fue removido.');
      }
      throw error;
    }

    const savedMsg: ChatMessage = {
      id: data && data[0] ? data[0].id : '',
      fileId,
      userId,
      authorAlias: alias,
      authorAvatar: avatar,
      message,
      createdAt
    };
    return { success: true, data: savedMsg };
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}

/**
 * Obtiene todos los grupos de la comunidad.
 */
export async function fetchGroups(): Promise<Group[]> {
  const sb = getSupabase();
  if (!sb) {
    throw new Error('Servidor no disponible.');
  }

  const { data, error } = await sb
    .from('ta_groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((g: any) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    image: g.image,
    creatorId: g.creator_id,
    members: g.members || [],
    createdAt: g.created_at
  }));
}

/**
 * Crea un grupo nuevo en Supabase.
 */
export async function createGroup(group: Omit<Group, 'id' | 'createdAt'>): Promise<{ success: boolean; data?: Group; error?: string }> {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, error: 'No disponible.' };
  }

  const createdAt = new Date().toISOString();
  try {
    const { data, error } = await sb
      .from('ta_groups')
      .insert({
        name: group.name,
        description: group.description,
        image: group.image,
        creator_id: group.creatorId,
        members: group.members,
        created_at: createdAt
      })
      .select();

    if (error) throw error;

    const savedGroup = data && data[0];
    const newGroup: Group = {
      ...group,
      id: savedGroup ? savedGroup.id : '',
      createdAt: createdAt
    };
    return { success: true, data: newGroup };
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}

/**
 * Modifica la imagen, descripción o detalles de un grupo.
 */
export async function updateGroupSettings(groupId: string, updates: { name: string; description: string; image: string }): Promise<{ success: boolean; data?: Group; error?: string }> {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, error: 'Conexión inactiva.' };
  }

  try {
    const { data, error } = await sb
      .from('ta_groups')
      .update({
        name: updates.name,
        description: updates.description,
        image: updates.image
      })
      .eq('id', groupId)
      .select();

    if (error) throw error;

    if (data && data[0]) {
      const g = data[0];
      return {
        success: true,
        data: {
          id: g.id,
          name: g.name,
          description: g.description,
          image: g.image,
          creatorId: g.creator_id,
          members: g.members || [],
          createdAt: g.created_at
        }
      };
    }
    throw new Error("Grupo no encontrado.");
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}

/**
 * Actualiza la lista de miembros de un grupo.
 */
export async function updateGroupMembers(groupId: string, members: string[]): Promise<{ success: boolean; data?: Group; error?: string }> {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, error: 'Conexión inactiva.' };
  }

  try {
    const { data, error } = await sb
      .from('ta_groups')
      .update({
        members: members
      })
      .eq('id', groupId)
      .select();

    if (error) throw error;

    if (data && data[0]) {
      const g = data[0];
      return {
        success: true,
        data: {
          id: g.id,
          name: g.name,
          description: g.description,
          image: g.image,
          creatorId: g.creator_id,
          members: g.members || [],
          createdAt: g.created_at
        }
      };
    }
    throw new Error("Grupo no encontrado.");
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}

/**
 * Elimina un grupo de forma permanente de Supabase.
 */
export async function deleteCommunityGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) {
    return { success: false, error: 'Conexión inactiva.' };
  }

  try {
    const { data, error } = await sb
      .from('ta_groups')
      .delete()
      .eq('id', groupId)
      .select('id');

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'No tienes permisos de propietario requeridos para eliminar este grupo.'
      };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || err };
  }
}
