import type { Hint, HintRequest } from '../entities/Hint'

export interface LLMUsageInfo {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface HintGeneratorResult {
  hints: Hint[]
  usage?: LLMUsageInfo
}

export interface HintGenerator {
  generate(request: HintRequest): Promise<HintGeneratorResult>
}
