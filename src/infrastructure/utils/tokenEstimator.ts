export interface TokenInfo {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  provider: string
  model: string
  isActual: boolean
}

const PRICING: Record<string, { input: number; output: number; model: string }> = {
  openai: { input: 0.00015, output: 0.0006, model: 'gpt-4o-mini' },
  claude: { input: 0.00025, output: 0.00125, model: 'claude-3-haiku' },
  deepseek: { input: 0.00014, output: 0.00028, model: 'deepseek-chat' },
}

export function calculateCostFromTokens(
  inputTokens: number,
  outputTokens: number,
  provider: 'openai' | 'claude' | 'deepseek'
): TokenInfo {
  const totalTokens = inputTokens + outputTokens
  const pricing = PRICING[provider]
  const cost = (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    cost,
    provider,
    model: pricing.model,
    isActual: true,
  }
}

export function formatCost(cost: number): string {
  if (cost < 0.0001) {
    return '< $0.0001'
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`
  }
  return `$${cost.toFixed(3)}`
}
