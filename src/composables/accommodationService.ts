// src/composables/accommodationService.ts
import { supabase } from '@/services/supabase'

export interface Accommodation {
  id: string
  code: string
  name: string
  address?: string
  notes?: string
  status: 'active' | 'inactive'
  configured_areas: Record<string, any>
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateAccommodationData {
  code: string
  name: string
  address?: string
  notes?: string
  status?: 'active' | 'inactive'
  configured_areas: Record<string, any>
}

export interface UpdateAccommodationData {
  id: string
  name?: string
  address?: string
  notes?: string
  status?: 'active' | 'inactive'
  configured_areas?: Record<string, any>
}

export const accommodationService = {
  async getAll(): Promise<Accommodation[]> {
    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(error.message)
    return data as Accommodation[]
  },

  async getById(id: string): Promise<Accommodation | null> {
    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw new Error(error.message)
    }
    
    return data as Accommodation
  },

  async getByCode(code: string): Promise<Accommodation | null> {
    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .eq('code', code)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw new Error(error.message)
    }
    
    return data as Accommodation
  },

  async create(accommodationData: CreateAccommodationData): Promise<Accommodation> {
    const { data, error } = await supabase
      .from('accommodations')
      .insert([accommodationData])
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data as Accommodation
  },

  async update(accommodationData: UpdateAccommodationData): Promise<Accommodation> {
    const { data, error } = await supabase
      .from('accommodations')
      .update({
        ...accommodationData,
        updated_at: new Date().toISOString()
      })
      .eq('id', accommodationData.id)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data as Accommodation
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('accommodations')
      .delete()
      .eq('id', id)
    
    if (error) throw new Error(error.message)
  }
}