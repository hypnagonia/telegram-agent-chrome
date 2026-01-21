import type { Hint, HintRequest } from '../entities/Hint'
import type { Persona } from '../entities/Persona'

export interface HintGenerator {
  generate(request: HintRequest, persona: Persona): Promise<Hint[]>
}
