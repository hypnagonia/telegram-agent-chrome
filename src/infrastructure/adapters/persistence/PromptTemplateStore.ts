import { db } from './db'
import type { PromptTemplate } from '@domain/entities/PromptTemplate'
import { PRESET_TEMPLATES } from '@domain/entities/PromptTemplate'

export class PromptTemplateStore {
  async getAll(): Promise<PromptTemplate[]> {
    const custom = await db.promptTemplates.toArray()
    return [...PRESET_TEMPLATES, ...custom]
  }

  async getById(id: string): Promise<PromptTemplate | undefined> {
    const preset = PRESET_TEMPLATES.find(t => t.id === id)
    if (preset) return preset
    return db.promptTemplates.get(id)
  }

  async save(template: PromptTemplate): Promise<void> {
    const isPreset = PRESET_TEMPLATES.some(t => t.id === template.id)
    if (isPreset) {
      throw new Error('Cannot modify preset templates')
    }
    await db.promptTemplates.put(template)
  }

  async delete(id: string): Promise<void> {
    const isPreset = PRESET_TEMPLATES.some(t => t.id === id)
    if (isPreset) {
      throw new Error('Cannot delete preset templates')
    }
    await db.promptTemplates.delete(id)
  }
}
