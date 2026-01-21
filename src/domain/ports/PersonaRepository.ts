import type { Persona } from '../entities/Persona'

export interface PersonaRepository {
  save(persona: Persona): Promise<void>
  findById(id: string): Promise<Persona | undefined>
  findAll(): Promise<Persona[]>
  findDefault(): Promise<Persona | undefined>
  delete(id: string): Promise<void>
  setDefault(id: string): Promise<void>
}
