import type { Persona } from '@domain/entities/Persona'
import { DEFAULT_PERSONA } from '@domain/entities/Persona'
import type { PersonaRepository } from '@domain/ports/PersonaRepository'
import { db, personaToRecord, recordToPersona } from './db'

export class PersonaStore implements PersonaRepository {
  async save(persona: Persona): Promise<void> {
    await db.personas.put(personaToRecord(persona))
  }

  async findById(id: string): Promise<Persona | undefined> {
    const record = await db.personas.get(id)
    return record ? recordToPersona(record) : undefined
  }

  async findAll(): Promise<Persona[]> {
    const records = await db.personas.toArray()
    return records.map(recordToPersona)
  }

  async findDefault(): Promise<Persona | undefined> {
    const record = await db.personas.where('isDefault').equals(1).first()
    if (record) {
      return recordToPersona(record)
    }
    await this.save(DEFAULT_PERSONA)
    return DEFAULT_PERSONA
  }

  async delete(id: string): Promise<void> {
    await db.personas.delete(id)
  }

  async setDefault(id: string): Promise<void> {
    await db.transaction('rw', db.personas, async () => {
      await db.personas.toCollection().modify({ isDefault: false })
      await db.personas.update(id, { isDefault: true })
    })
  }
}
