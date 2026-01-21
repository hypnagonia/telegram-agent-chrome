import { useState } from 'preact/hooks'
import type { Hint } from '@domain/entities/Hint'
import { getStyles, type Theme } from '../styles'

interface HintPanelProps {
  hints: Hint[]
  loading: boolean
  error: string | null
  contextUsed: number
  onGenerate: (message: string) => void
  onSelectHint: (hint: Hint) => void
  theme: Theme
}

export function HintPanel({
  hints,
  loading,
  error,
  contextUsed,
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

      {contextUsed > 0 && (
        <div style={`${styles.badge} ${styles.badgePrimary}; margin-top: 12px`}>
          {contextUsed} context chunks used
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
              <div style={styles.hintText}>{hint.text}</div>
              <div style={`font-size: 10px; color: ${styles.colors.textMuted}; margin-top: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em`}>
                Click to copy
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
