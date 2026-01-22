import { useState, useEffect } from 'preact/hooks'
import { getStyles, type Theme } from '../styles'
import type { PromptTemplate } from '@domain/entities/PromptTemplate'

type ApiProvider = 'openai' | 'claude' | 'deepseek'

interface SettingsProps {
  apiKey: string
  apiProvider: ApiProvider
  apiBaseUrl: string
  apiModel: string
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  promptTemplate: string
  activeTemplateId: string
  templates: PromptTemplate[]
  loading: boolean
  error: string | null
  saved: boolean
  onUpdate: (updates: { apiKey?: string; apiProvider?: ApiProvider; apiBaseUrl?: string; apiModel?: string; theme?: Theme; promptTemplate?: string; activeTemplateId?: string }) => void
  onSave: () => void
  onSaveTemplate: (id: string, name: string, template: string) => void
  onDeleteTemplate: (id: string) => void
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
  apiBaseUrl,
  apiModel,
  theme,
  resolvedTheme,
  promptTemplate,
  activeTemplateId,
  templates,
  loading,
  error,
  saved,
  onUpdate,
  onSave,
  onSaveTemplate,
  onDeleteTemplate,
}: SettingsProps) {
  const styles = getStyles(resolvedTheme)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [showSaveAs, setShowSaveAs] = useState(false)

  const activeTemplate = templates.find(t => t.id === activeTemplateId)
  const isPreset = activeTemplate && ['default', 'formal', 'brief'].includes(activeTemplate.id)

  useEffect(() => {
    if (activeTemplate && activeTemplate.template !== promptTemplate) {
      onUpdate({ promptTemplate: activeTemplate.template })
    }
  }, [activeTemplateId])

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      onUpdate({ activeTemplateId: templateId, promptTemplate: template.template })
    }
  }

  const handleSaveAsNew = () => {
    if (!newTemplateName.trim()) return
    const id = `custom-${Date.now()}`
    onSaveTemplate(id, newTemplateName.trim(), promptTemplate)
    onUpdate({ activeTemplateId: id })
    setNewTemplateName('')
    setShowSaveAs(false)
  }

  const handleUpdateCurrent = () => {
    if (activeTemplate && !isPreset) {
      onSaveTemplate(activeTemplate.id, activeTemplate.name, promptTemplate)
    }
  }

  const handleDelete = () => {
    if (activeTemplate && !isPreset) {
      onDeleteTemplate(activeTemplate.id)
      onUpdate({ activeTemplateId: 'default' })
    }
  }

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
          <option value="system">System (Auto)</option>
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

      <div style={styles.formGroup}>
        <label style={styles.label}>API Base URL (optional)</label>
        <input
          type="text"
          style={styles.input}
          placeholder="https://api.deepseek.com"
          value={apiBaseUrl}
          onInput={(e) => onUpdate({ apiBaseUrl: (e.target as HTMLInputElement).value })}
        />
        <div style={`font-size: 11px; color: ${styles.colors.textMuted}; margin-top: 8px; font-weight: 500`}>
          Leave empty for default. Use custom URL for self-hosted instances.
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Model (optional)</label>
        <input
          type="text"
          style={styles.input}
          placeholder="deepseek-chat"
          value={apiModel}
          onInput={(e) => onUpdate({ apiModel: (e.target as HTMLInputElement).value })}
        />
        <div style={`font-size: 11px; color: ${styles.colors.textMuted}; margin-top: 8px; font-weight: 500`}>
          Leave empty for default. For Ollama use model name like "deepseek-r1:7b".
        </div>
      </div>

      <div style={styles.divider}></div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Prompt Template</label>
        <select
          style={`${styles.select}; margin-bottom: 12px`}
          value={activeTemplateId}
          onChange={(e) => handleTemplateChange((e.target as HTMLSelectElement).value)}
        >
          {templates.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} {['default', 'formal', 'brief'].includes(t.id) ? '(preset)' : ''}
            </option>
          ))}
        </select>
        <textarea
          style={`${styles.input}; min-height: 150px; resize: vertical; font-family: monospace; font-size: 12px; line-height: 1.5`}
          value={promptTemplate}
          onInput={(e) => onUpdate({ promptTemplate: (e.target as HTMLTextAreaElement).value })}
        />
        <div style={`font-size: 11px; color: ${styles.colors.textMuted}; margin-top: 8px; font-weight: 500`}>
          Variables: <code style={`background: ${resolvedTheme === 'dark' ? '#2a2a3a' : '#e8e8e8'}; padding: 2px 4px; border-radius: 3px`}>{'{{context}}'}</code>{' '}
          <code style={`background: ${resolvedTheme === 'dark' ? '#2a2a3a' : '#e8e8e8'}; padding: 2px 4px; border-radius: 3px`}>{'{{recent_messages}}'}</code>{' '}
          <code style={`background: ${resolvedTheme === 'dark' ? '#2a2a3a' : '#e8e8e8'}; padding: 2px 4px; border-radius: 3px`}>{'{{user_input}}'}</code>
        </div>

        <div style={`display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap`}>
          {!isPreset && activeTemplate && (
            <>
              <button
                style={`${styles.button} ${styles.secondaryButton}; padding: 8px 12px; font-size: 12px`}
                onClick={handleUpdateCurrent}
              >
                Update "{activeTemplate.name}"
              </button>
              <button
                style={`${styles.button}; padding: 8px 12px; font-size: 12px; background: ${styles.colors.errorLight}; color: ${styles.colors.error}; border: 1px solid ${styles.colors.error}`}
                onClick={handleDelete}
              >
                Delete
              </button>
            </>
          )}
          <button
            style={`${styles.button} ${styles.secondaryButton}; padding: 8px 12px; font-size: 12px`}
            onClick={() => setShowSaveAs(!showSaveAs)}
          >
            {showSaveAs ? 'Cancel' : 'Save as New...'}
          </button>
        </div>

        {showSaveAs && (
          <div style={`display: flex; gap: 8px; margin-top: 8px`}>
            <input
              type="text"
              style={`${styles.input}; flex: 1`}
              placeholder="Template name"
              value={newTemplateName}
              onInput={(e) => setNewTemplateName((e.target as HTMLInputElement).value)}
            />
            <button
              style={`${styles.button} ${styles.primaryButton}; padding: 8px 16px`}
              onClick={handleSaveAsNew}
              disabled={!newTemplateName.trim()}
            >
              Save
            </button>
          </div>
        )}
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
