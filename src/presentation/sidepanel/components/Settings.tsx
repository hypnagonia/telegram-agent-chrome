import { getStyles, type Theme } from '../styles'

type ApiProvider = 'openai' | 'claude' | 'deepseek'

interface SettingsProps {
  apiKey: string
  apiProvider: ApiProvider
  theme: Theme
  loading: boolean
  error: string | null
  saved: boolean
  onUpdate: (updates: { apiKey?: string; apiProvider?: ApiProvider; theme?: Theme }) => void
  onSave: () => void
}

function getApiKeyPlaceholder(provider: ApiProvider): string {
  switch (provider) {
    case 'openai':
      return 'sk-...'
    case 'claude':
      return 'sk-ant-...'
    case 'deepseek':
      return 'sk-...'
  }
}

function getApiKeyHelp(provider: ApiProvider): string {
  switch (provider) {
    case 'openai':
      return 'Get your API key from platform.openai.com'
    case 'claude':
      return 'Get your API key from console.anthropic.com'
    case 'deepseek':
      return 'Get your API key from platform.deepseek.com'
  }
}

export function Settings({
  apiKey,
  apiProvider,
  theme,
  loading,
  error,
  saved,
  onUpdate,
  onSave,
}: SettingsProps) {
  const styles = getStyles(theme)

  return (
    <div>
      {error && (
        <div style={`${styles.status} ${styles.statusError}; margin-bottom: 16px`}>
          {error}
        </div>
      )}

      {saved && (
        <div style={`${styles.status} ${styles.statusSuccess}; margin-bottom: 16px`}>
          Settings saved successfully
        </div>
      )}

      <div style={styles.formGroup}>
        <label style={styles.label}>Theme</label>
        <select
          style={styles.select}
          value={theme}
          onChange={(e) =>
            onUpdate({ theme: (e.target as HTMLSelectElement).value as Theme })
          }
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>AI Provider</label>
        <select
          style={styles.select}
          value={apiProvider}
          onChange={(e) =>
            onUpdate({ apiProvider: (e.target as HTMLSelectElement).value as ApiProvider })
          }
        >
          <option value="openai">OpenAI</option>
          <option value="claude">Claude (Anthropic)</option>
          <option value="deepseek">DeepSeek</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>API Key</label>
        <input
          type="password"
          style={styles.input}
          placeholder={getApiKeyPlaceholder(apiProvider)}
          value={apiKey}
          onInput={(e) => onUpdate({ apiKey: (e.target as HTMLInputElement).value })}
        />
        <div style={`font-size: 11px; color: ${styles.colors.textMuted}; margin-top: 8px; font-weight: 500`}>
          {getApiKeyHelp(apiProvider)}
        </div>
      </div>

      <button
        style={`${styles.button} ${styles.primaryButton}; width: 100%`}
        onClick={onSave}
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Settings'}
      </button>

      <div style={styles.divider}></div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>About</div>
        <div style={styles.card}>
          <p style={`font-size: 13px; color: ${styles.colors.textSecondary}; line-height: 1.7`}>
            Telegram Web Assistant indexes your conversations locally using BM25 search
            and generates contextual reply suggestions using AI.
          </p>
          <p style={`font-size: 13px; color: ${styles.colors.textSecondary}; line-height: 1.7; margin-top: 12px`}>
            Your messages are stored locally in your browser and never sent to external
            servers except for the AI provider when generating hints.
          </p>
        </div>
      </div>
    </div>
  )
}
