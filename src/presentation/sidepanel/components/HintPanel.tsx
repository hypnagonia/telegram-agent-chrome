import { useState } from 'preact/hooks'
import type { Hint } from '@domain/entities/Hint'
import { getStyles, type Theme } from '../styles'
import { formatCost, type TokenInfo } from '@infrastructure/utils/tokenEstimator'

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
)

interface HintPanelProps {
  hints: Hint[]
  loading: boolean
  error: string | null
  contextUsed: number
  tokenInfo: TokenInfo | null
  onGenerate: (message: string) => void
  onSelectHint: (hint: Hint) => void
  theme: Theme
}

export function HintPanel({
  hints,
  loading,
  error,
  contextUsed,
  tokenInfo,
  onGenerate,
  onSelectHint,
  theme,
}: HintPanelProps) {
  const [message, setMessage] = useState('')
  const styles = getStyles(theme)

  const handleGenerate = () => {
    onGenerate(message)
  }

  return (
    <div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Message context (optional)</label>
        <input
          type="text"
          style={styles.input}
          placeholder="What you're about to say..."
          value={message}
          onInput={(e) => setMessage((e.target as HTMLInputElement).value)}
        />
      </div>

      <button
        style={`${styles.button} ${styles.primaryButton}; width: 100%`}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Hints'}
      </button>

      {error && (
        <div style={`${styles.status} ${styles.statusError}; margin-top: 16px`}>
          {error}
        </div>
      )}

      {(contextUsed > 0 || tokenInfo) && (
        <div style={`display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px`}>
          {contextUsed > 0 && (
            <div style={`${styles.badge} ${styles.badgePrimary}`}>
              {contextUsed} context chunks
            </div>
          )}
          {tokenInfo && (
            <>
              <div style={`${styles.badge} ${styles.badgeSuccess}`}>
                {tokenInfo.totalTokens} tokens
              </div>
              <div style={`${styles.badge}; background: ${styles.colors.warningLight}; color: ${styles.colors.warning}`}>
                {formatCost(tokenInfo.cost)}
              </div>
            </>
          )}
        </div>
      )}

      {hints.length > 0 && (
        <div style={`${styles.section}; margin-top: 24px`}>
          <div style={styles.sectionTitle}>Suggestions</div>
          {hints.map((hint) => (
            <div
              key={hint.id}
              style={styles.hintCard}
              onClick={() => onSelectHint(hint)}
              title="Click to copy"
            >
              <div style={`${styles.hintText}; display: flex; align-items: center; gap: 8px`}>
                <span style="flex: 1">{hint.text}</span>
                <CopyIcon />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && hints.length === 0 && !error && (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>✨</div>
          <p style="font-size: 14px; line-height: 1.6">
            Generate AI-powered reply suggestions<br />based on your conversation context
          </p>
        </div>
      )}
    </div>
  )
}
