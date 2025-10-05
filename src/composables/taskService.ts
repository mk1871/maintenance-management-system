// src/services/taskService.ts
import { supabase } from '@/services/supabase'

export interface Task {
  id: string
  accommodation_id: string
  accommodation_code: string
  area: string
  element: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  detection_date: string
  due_date: string
  start_date?: string
  completed_date?: string
  repairer_id?: string
  repairer_name?: string
  solution?: string
  time_spent_days?: number
  notes?: string
  estimated_cost?: number
  archived: boolean
  created_by: string
  updated_at: string
}

export interface CreateTaskData {
  accommodation_id: string
  area: string
  element: string
  description: string
  priority: 'high' | 'medium' | 'low'
  due_date: string
  notes?: string
  estimated_cost?: number
}

export interface UpdateTaskData {
  id: string
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  repairer_name?: string
  start_date?: string
  completed_date?: string
  solution?: string
  notes?: string
}

export const taskService = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        accommodation:accommodations(code, name)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(error.message)
    return data as Task[]
  },

  async getById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        accommodation:accommodations(code, name),
        costs(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw new Error(error.message)
    }
    
    return data as Task
  },

  async create(taskData: CreateTaskData): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          ...taskData,
          detection_date: new Date().toISOString()
        }
      ])
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data as Task
  },

  async update(taskData: UpdateTaskData): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...taskData,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskData.id)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data as Task
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    
    if (error) throw new Error(error.message)
  }
}