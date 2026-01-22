import type { Hint, HintRequest } from '../entities/Hint'

export interface HintGenerator {
  generate(request: HintRequest): Promise<Hint[]>
}
