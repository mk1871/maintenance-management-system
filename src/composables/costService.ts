// src/composables/costService.ts
import { supabase } from '@/services/supabase'

export interface Cost {
  id: string
  task_id: string
  accommodation_id: string
  amount: number
  category: 'materials' | 'labor' | 'tools' | 'transport' | 'other'
  description?: string
  invoice_number?: string
  provider?: string
  expense_date: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateCostData {
  task_id: string
  accommodation_id: string
  amount: number
  category: 'materials' | 'labor' | 'tools' | 'transport' | 'other'
  description?: string
  invoice_number?: string
  provider?: string
  expense_date?: string
}

export interface UpdateCostData {
  id: string
  amount?: number
  category?: 'materials' | 'labor' | 'tools' | 'transport' | 'other'
  description?: string
  invoice_number?: string
  provider?: string
  expense_date?: string
}

export const costService = {
  async getAll(): Promise<Cost[]> {
    const { data, error } = await supabase
      .from('costs')
      .select(`
        *,
        task:tasks(description),
        accommodation:accommodations(code, name)
      `)
      .order('expense_date', { ascending: false })
    
    if (error) throw new Error(error.message)
    return data as Cost[]
  },

  async getByTaskId(taskId: string): Promise<Cost[]> {
    const { data, error } = await supabase
      .from('costs')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(error.message)
    return data as Cost[]
  },

  async getById(id: string): Promise<Cost | null> {
    const { data, error } = await supabase
      .from('costs')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw new Error(error.message)
    }
    
    return data as Cost
  },

  async create(costData: CreateCostData): Promise<Cost> {
    const { data, error } = await supabase
      .from('costs')
      .insert([{
        ...costData,
        expense_date: costData.expense_date || new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data as Cost
  },

  async update(costData: UpdateCostData): Promise<Cost> {
    const { data, error } = await supabase
      .from('costs')
      .update({
        ...costData,
        updated_at: new Date().toISOString()
      })
      .eq('id', costData.id)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data as Cost
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('costs')
      .delete()
      .eq('id', id)
    
    if (error) throw new Error(error.message)
  }
}