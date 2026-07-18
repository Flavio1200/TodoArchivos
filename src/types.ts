/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FileCategory =
  | 'document'
  | 'photo'
  | 'video'
  | 'audio'
  | 'location'
  | 'website'
  | 'chrome'
  | 'instagram'
  | 'github'
  | 'twitter'
  | 'code'
  | 'box';

export interface UserProfile {
  id: string;
  name: string;
  alias: string;
  email: string;
  phone: string;
  avatar_url?: string;
  created_at: string;
}

export interface SharedFile {
  id: string;
  userId: string;
  authorName: string;
  authorAlias: string;
  authorAvatar?: string;
  name: string;
  description: string;
  category: FileCategory;
  fileUrl: string; // Base64 or URL
  fileName?: string;
  fileSize?: string;
  isPublic: boolean;
  createdAt: string;
  likes?: number;
  commentsCount?: number;
  groupId?: string; // Optional reference for group files
}

export interface Group {
  id: string;
  name: string;
  description: string;
  image: string; // Base64 or URL
  creatorId: string; // User ID of creator
  members: string[]; // List of user IDs in group (Max 150)
  createdAt: string;
  isPrivate?: boolean; // True if the group is private
  invitations?: string[]; // Array of invited user IDs
}

export interface ChatMessage {
  id: string;
  fileId: string;
  userId: string;
  authorAlias: string;
  authorAvatar?: string;
  message: string;
  createdAt: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'update' | 'upload' | 'download' | 'publish' | 'system';
  createdAt: string;
  read: boolean;
  fileId?: string;
  senderName?: string;
}

