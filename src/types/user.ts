// src/types/user.ts
export interface UserProfile {
  id: string
  role: 'supervisor' | 'chief'
  full_name: string
  profile_picture_url?: string
  phone?: string
  preferences?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AuthUser extends UserProfile {
  email: string
}