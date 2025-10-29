'use server'

import { supabase } from '@/utils/supabase'
import { Memo, MemoFormData } from '@/types/memo'

const mapRowToMemo = (row: any): Memo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  tags: row.tags || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export async function listMemosAction(): Promise<Memo[]> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []).map(mapRowToMemo)
}

export async function createMemoAction(form: MemoFormData): Promise<Memo> {
  const { data, error } = await supabase
    .from('memos')
    .insert([{ title: form.title, content: form.content, category: form.category, tags: form.tags || [] }])
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapRowToMemo(data)
}

export async function updateMemoAction(id: string, form: MemoFormData): Promise<Memo> {
  const { data, error } = await supabase
    .from('memos')
    .update({ title: form.title, content: form.content, category: form.category, tags: form.tags || [] })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapRowToMemo(data)
}

export async function deleteMemoAction(id: string): Promise<void> {
  const { error } = await supabase.from('memos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}


