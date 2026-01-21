import type { Dialogue } from '@domain/entities/Dialogue'
import { getStyles, type Theme } from '../styles'

interface IndexStatusProps {
  dialogue: Dialogue | null
  peerName: string | null
  loading: boolean
  onIndex: () => void
  onClearIndex: () => void
  theme: Theme
}

export function IndexStatus({ dialogue, peerName, loading, onIndex, onClearIndex, theme }: IndexStatusProps) {
  const styles = getStyles(theme)

  if (!peerName) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyStateIcon}>💬</div>
        <p style="font-size: 14px; line-height: 1.6">
          Open a chat in Telegram Web<br />to get started
        </p>
      </div>
    )
  }

  const isIndexed = dialogue?.isIndexed ?? false
  const messageCount = dialogue?.messageCount ?? 0
  const lastIndexed = dialogue?.lastIndexedAt
    ? new Date(dialogue.lastIndexedAt).toLocaleString()
    : null

  return (
    <div style={styles.dialogueInfo}>
      <div style="display: flex; align-items: center; justify-content: space-between">
        <div>
          <div style={styles.dialogueName}>{peerName}</div>
          {isIndexed ? (
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px">
              <span style={`${styles.badge} ${styles.badgeSuccess}`}>
                Indexed
              </span>
              <span style={styles.dialogueStats}>
                {messageCount} messages
              </span>
            </div>
          ) : (
            <div style={`${styles.badge}; background: ${styles.colors.warningLight}; color: ${styles.colors.warning}; margin-top: 6px`}>
              Not indexed
            </div>
          )}
        </div>
        <div style="display: flex; gap: 8px">
          <button
            style={`
              padding: 10px 18px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
              transition: all 0.2s ease;
              ${isIndexed
                ? `background: ${styles.colors.surfaceHover}; color: ${styles.colors.textSecondary};`
                : `background: linear-gradient(135deg, ${styles.colors.primary} 0%, ${styles.colors.accent} 100%); color: white; box-shadow: 0 2px 8px ${theme === 'dark' ? 'rgba(129, 140, 248, 0.3)' : 'rgba(99, 102, 241, 0.3)'};`
              }
            `}
            onClick={onIndex}
            disabled={loading}
          >
            {loading ? 'Indexing...' : isIndexed ? 'Re-index' : 'Index'}
          </button>
          {isIndexed && (
            <button
              style={`
                padding: 10px 14px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.2s ease;
                background: ${styles.colors.errorLight};
                color: ${styles.colors.error};
              `}
              onClick={onClearIndex}
              disabled={loading}
              title="Delete index"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {lastIndexed && (
        <div style={`font-size: 11px; color: ${styles.colors.textMuted}; margin-top: 10px`}>
          Last indexed: {lastIndexed}
        </div>
      )}
    </div>
  )
}
