// ============================================================
// Core Domain Types for MiNet CRM
// ============================================================

export type Tier = 'A' | 'B' | 'C' | 'D'
export type RelationshipType = 'customer' | 'partner' | 'investor' | 'vendor' | 'other'
export type InteractionType = 'meeting' | 'call' | 'email' | 'message' | 'event' | 'other'
export type CustomFieldType = 'text' | 'url' | 'number' | 'date' | 'textarea' | 'phone'
export type CustomFieldCategory = 'social' | 'personal' | 'work' | 'other'
export type DarkMode = 'system' | 'light' | 'dark'
export type BackupFrequency = 'daily' | 'weekly' | 'monthly'
export type BackupDestination = 'local' | 'drive' | 'both'

// ============================================================
// Contact
// ============================================================
export interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  companyId?: string
  title?: string
  tier: Tier
  relationshipType: RelationshipType
  tags: string[]
  notes?: string
  birthday?: string          // ISO date string YYYY-MM-DD
  linkedIn?: string
  lastContactedAt?: string   // ISO datetime
  nextFollowUpAt?: string    // ISO datetime
  customFields: Record<string, string>  // { fieldDefId: value }
  createdAt: string
  updatedAt: string
}

// ============================================================
// Company
// ============================================================
export interface Company {
  id: string
  name: string
  industry?: string
  website?: string
  phone?: string
  address?: string
  notes?: string
  size?: string              // e.g. "1-10", "11-50", "51-200", "201-500", "500+"
  createdAt: string
  updatedAt: string
}

// ============================================================
// Interaction (Activity log)
// ============================================================
export interface Interaction {
  id: string
  contactId: string
  type: InteractionType
  date: string               // ISO datetime
  notes?: string
  outcome?: string
  createdAt: string
}

// ============================================================
// Event
// ============================================================
export interface Event {
  id: string
  title: string
  date: string               // ISO date
  endDate?: string
  location?: string
  description?: string
  contactIds: string[]
  outcome?: string           // Kết quả sự kiện
  nextSteps?: string         // Bước tiếp theo
  followUpDate?: string      // Ngày follow up
  createdAt: string
  updatedAt: string
}

// ============================================================
// Reminder
// ============================================================
export interface Reminder {
  id: string
  contactId: string
  title: string
  dueDate: string            // ISO datetime
  notes?: string
  isCompleted: boolean
  completedAt?: string
  createdAt: string
}

// ============================================================
// Tag
// ============================================================
export interface Tag {
  id: string
  name: string
  color: string              // hex color e.g. #2563eb
  createdAt: string
}

// ============================================================
// Custom Field Definition
// ============================================================
export interface CustomFieldDef {
  id: string
  name: string
  type: CustomFieldType
  category: CustomFieldCategory
  order: number
  isRequired: boolean
  placeholder?: string
  icon?: string              // Lucide icon name
}

// ============================================================
// User Profile
// ============================================================
export interface UserProfile {
  id: 'current-user'
  googleId?: string
  displayName: string
  email?: string
  avatarUrl?: string         // Google avatar URL
  customAvatarBase64?: string // Local upload (base64)
  bio?: string
  jobTitle?: string
  organization?: string
  updatedAt: string
}

// ============================================================
// App Settings
// ============================================================
export interface AppSettings {
  // Security
  pinEnabled: boolean
  pinHash?: string
  biometricEnabled: boolean
  biometricCredentialId?: string
  lockAfterMinutes: number   // -1=never, 0=immediate, 0.5=30s, 1=1min, 5=5min

  // Backup
  autoBackupEnabled: boolean
  autoBackupFrequency: BackupFrequency
  autoBackupDestination: BackupDestination
  maxBackupVersions: number  // 3, 5, 10, 0=unlimited
  lastBackupAt?: string
  driveConnected: boolean
  driveRefreshToken?: string // NOT STORED - only access token in memory

  // UI
  darkMode: DarkMode
  language: 'vi' | 'en'

  // Notifications
  notificationsEnabled: boolean
  reminderLeadDays: number   // Nhắc trước bao nhiêu ngày

  // Auth state
  pendingLogin: boolean  // true = user logged out, data preserved, waiting for re-login
}

// ============================================================
// Backup Format
// ============================================================
export interface BackupData {
  version: string
  appName: string
  exportedAt: string
  data: {
    contacts: Contact[]
    companies: Company[]
    interactions: Interaction[]
    events: Event[]
    reminders: Reminder[]
    tags: Tag[]
    customFieldDefs: CustomFieldDef[]
  }
}

// ============================================================
// Google Drive Backup File metadata
// ============================================================
export interface DriveBackupFile {
  id: string
  name: string
  createdTime: string
  size?: string
}

// ============================================================
// Auth State
// ============================================================
export interface AuthState {
  isAuthenticated: boolean
  isPinLocked: boolean
  userProfile: UserProfile | null
  googleAccessToken: string | null  // In-memory only, not persisted
}

// ============================================================
// Default values
// ============================================================
export const DEFAULT_SETTINGS: AppSettings = {
  pinEnabled: false,
  biometricEnabled: false,
  lockAfterMinutes: 5,
  autoBackupEnabled: false,
  autoBackupFrequency: 'weekly',
  autoBackupDestination: 'local',
  maxBackupVersions: 5,
  driveConnected: false,
  darkMode: 'system',
  language: 'vi',
  notificationsEnabled: false,
  reminderLeadDays: 3,
  pendingLogin: false,
}

export const TIER_COLORS: Record<Tier, string> = {
  A: 'bg-red-100 text-red-700 border-red-200',
  B: 'bg-orange-100 text-orange-700 border-orange-200',
  C: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  D: 'bg-gray-100 text-gray-600 border-gray-200',
}

export const TIER_LABELS: Record<Tier, string> = {
  A: 'Ưu tiên cao',
  B: 'Quan trọng',
  C: 'Bình thường',
  D: 'Ít ưu tiên',
}

export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  customer: 'Khách hàng',
  partner: 'Đối tác',
  investor: 'Nhà đầu tư',
  vendor: 'Nhà cung cấp',
  other: 'Khác',
}

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  meeting: 'Gặp mặt',
  call: 'Cuộc gọi',
  email: 'Email',
  message: 'Tin nhắn',
  event: 'Sự kiện',
  other: 'Khác',
}

export const INTERACTION_TYPE_ICONS: Record<InteractionType, string> = {
  meeting: 'Users',
  call: 'Phone',
  email: 'Mail',
  message: 'MessageCircle',
  event: 'Calendar',
  other: 'MoreHorizontal',
}

// Preset custom fields
export const PRESET_CUSTOM_FIELDS: Omit<CustomFieldDef, 'id' | 'order'>[] = [
  { name: 'Facebook', type: 'url', category: 'social', isRequired: false, placeholder: 'https://facebook.com/...', icon: 'Facebook' },
  { name: 'Instagram', type: 'url', category: 'social', isRequired: false, placeholder: 'https://instagram.com/...', icon: 'Instagram' },
  { name: 'Twitter/X', type: 'url', category: 'social', isRequired: false, placeholder: 'https://x.com/...', icon: 'Twitter' },
  { name: 'Zalo', type: 'phone', category: 'social', isRequired: false, placeholder: '0901234567', icon: 'Phone' },
  { name: 'Địa chỉ nhà', type: 'textarea', category: 'personal', isRequired: false, placeholder: 'Số nhà, đường, quận...', icon: 'Home' },
  { name: 'Sở thích', type: 'textarea', category: 'personal', isRequired: false, placeholder: 'Golf, đọc sách...', icon: 'Heart' },
  { name: 'Fanpage', type: 'url', category: 'social', isRequired: false, placeholder: 'https://facebook.com/...', icon: 'Globe' },
]
