import { useState, useCallback, useEffect } from 'preact/hooks'
import { useCurrentDialogue, useHints, useNotes, useSettings, useSystemTheme, usePromptTemplates, useNoteSearch } from './hooks'
import { patchConsole } from './hooks/useDebugLog'
import { HintPanel, NoteEditor, Settings, IndexStatus, DebugPanel } from './components'
import { getStyles } from './styles'
import {
  MessageType,
  sendToBackground,
  type IndexDialoguePayload,
  type ClearIndexPayload,
  type InsertTextPayload,
} from '@infrastructure/adapters/telegram/MessageBridge'
import type { Hint } from '@domain/entities/Hint'

patchConsole()

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
)

const Footer = ({ theme }: { theme: 'light' | 'dark' }) => (
  <div style={`
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 16px;
    margin-top: auto;
    border-top: 1px solid ${theme === 'dark' ? '#2a2a3a' : '#e0e0e0'};
  `}>
    <a
      href="https://t.me/Zunso"
      target="_blank"
      rel="noopener noreferrer"
      style={`
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${theme === 'dark' ? '#2a2a3a' : '#e8e8e8'};
        color: ${theme === 'dark' ? '#888' : '#666'};
        text-decoration: none;
        transition: all 0.2s;
      `}
    >
      <TelegramIcon />
    </a>
    <a
      href="https://www.linkedin.com/in/zunso/"
      target="_blank"
      rel="noopener noreferrer"
      style={`
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${theme === 'dark' ? '#2a2a3a' : '#e8e8e8'};
        color: ${theme === 'dark' ? '#888' : '#666'};
        text-decoration: none;
        transition: all 0.2s;
      `}
    >
      <LinkedInIcon />
    </a>
    <a
      href="https://github.com/hypnagonia/telegram-agent-chrome"
      target="_blank"
      rel="noopener noreferrer"
      style={`
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${theme === 'dark' ? '#2a2a3a' : '#e8e8e8'};
        color: ${theme === 'dark' ? '#888' : '#666'};
        text-decoration: none;
        transition: all 0.2s;
      `}
    >
      <GitHubIcon />
    </a>
  </div>
)

type Tab = 'hints' | 'notes' | 'settings'

interface IndexDialogueResponse {
  success: boolean
  messageCount: number
  chunkCount: number
}

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('hints')
  const [indexing, setIndexing] = useState(false)

  const dialogue = useCurrentDialogue()
  const hints = useHints()
  const notes = useNotes(dialogue.peerId)
  const noteSearch = useNoteSearch()
  const settings = useSettings()
  const promptTemplates = usePromptTemplates()

  const themeSetting = settings.settings.theme || 'system'
  const resolvedTheme = useSystemTheme(themeSetting)
  const styles = getStyles(resolvedTheme)

  useEffect(() => {
    console.log('[App] mounted')
    console.log('[App] dialogue state:', {
      peerId: dialogue.peerId,
      peerName: dialogue.peerName,
      loading: dialogue.loading,
    })
  }, [])

  useEffect(() => {
    console.log('[App] dialogue updated:', {
      peerId: dialogue.peerId,
      peerName: dialogue.peerName,
    })
  }, [dialogue.peerId, dialogue.peerName])

  useEffect(() => {
    document.body.style.background = resolvedTheme === 'dark' ? '#0f0f14' : '#fafafa'
    document.body.style.color = resolvedTheme === 'dark' ? '#e4e4eb' : '#1a1a2e'
  }, [resolvedTheme])

  const handleIndex = useCallback(async () => {
    if (!dialogue.peerId || !dialogue.peerName) return

    setIndexing(true)
    try {
      await sendToBackground<IndexDialoguePayload, IndexDialogueResponse>({
        type: MessageType.INDEX_DIALOGUE,
        payload: { peerId: dialogue.peerId, peerName: dialogue.peerName },
      })
      dialogue.refresh()
    } catch (err) {
      console.error('Failed to index dialogue:', err)
    } finally {
      setIndexing(false)
    }
  }, [dialogue.peerId, dialogue.peerName, dialogue.refresh])

  const handleClearIndex = useCallback(async () => {
    if (!dialogue.peerId) return

    setIndexing(true)
    try {
      await sendToBackground<ClearIndexPayload, { success: boolean }>({
        type: MessageType.CLEAR_INDEX,
        payload: { peerId: dialogue.peerId },
      })
      console.log('[App] Index cleared for:', dialogue.peerId)
      dialogue.refresh()
    } catch (err) {
      console.error('Failed to clear index:', err)
    } finally {
      setIndexing(false)
    }
  }, [dialogue.peerId, dialogue.refresh])

  const handleGenerateHints = useCallback(
    (message: string) => {
      if (!dialogue.peerId) return
      hints.generate(dialogue.peerId, message)
    },
    [dialogue.peerId, hints.generate]
  )

  const handleSelectHint = useCallback(async (hint: Hint) => {
    console.log('[App] handleSelectHint called:', hint.text.slice(0, 50))
    try {
      const result = await sendToBackground<InsertTextPayload, { success: boolean }>({
        type: MessageType.INSERT_TEXT,
        payload: { text: hint.text },
      })
      console.log('[App] INSERT_TEXT result:', result)
      if (!result?.success) {
        navigator.clipboard.writeText(hint.text)
      }
    } catch (err) {
      console.log('[App] INSERT_TEXT error, copying to clipboard:', err)
      navigator.clipboard.writeText(hint.text)
    }
  }, [])

  const handleSaveNote = useCallback(
    (id: string | null, content: string, tags: string[]) => {
      console.log('[App] handleSaveNote called:', { id, content, tags })
      notes.save(id, content, tags)
    },
    [notes.save]
  )

  const handleSaveSettings = useCallback(() => {
    settings.save(settings.settings)
  }, [settings.save, settings.settings])

  const renderTab = (tab: Tab, label: string) => (
    <button
      style={`${styles.tab}${activeTab === tab ? styles.tabActive : ''}`}
      onClick={() => setActiveTab(tab)}
    >
      {label}
    </button>
  )

  const isDisabled = !dialogue.peerId && !dialogue.loading

  if (isDisabled) {
    return (
      <div style={`${styles.container}; display: flex; flex-direction: column; min-height: 100vh;`}>
        <div style={`
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          opacity: 0.6;
          flex: 1;
        `}>
          <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
          <div style={`font-size: 16px; font-weight: 600; color: ${resolvedTheme === 'dark' ? '#888' : '#666'}; margin-bottom: 8px`}>
            Not on Telegram
          </div>
          <div style={`font-size: 13px; color: ${resolvedTheme === 'dark' ? '#666' : '#888'}; line-height: 1.5`}>
            Open <strong>web.telegram.org</strong> to use this extension
          </div>
        </div>
        <Footer theme={resolvedTheme} />
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <IndexStatus
        dialogue={dialogue.dialogue}
        peerName={dialogue.peerId}
        loading={indexing || dialogue.loading}
        onIndex={handleIndex}
        onClearIndex={handleClearIndex}
        theme={resolvedTheme}
      />

      <div style={styles.tabs}>
        {renderTab('hints', 'Hints')}
        {renderTab('notes', 'Notes')}
        {renderTab('settings', 'Settings')}
      </div>

      {activeTab === 'hints' && (
        <HintPanel
          hints={hints.hints}
          loading={hints.loading}
          error={hints.error}
          contextUsed={hints.contextUsed}
          tokenInfo={hints.tokenInfo}
          onGenerate={handleGenerateHints}
          onSelectHint={handleSelectHint}
          theme={resolvedTheme}
        />
      )}

      {activeTab === 'notes' && (
        <NoteEditor
          notes={notes.notes}
          loading={notes.loading}
          error={notes.error}
          searchResults={noteSearch.results}
          searchQuery={noteSearch.query}
          searchLoading={noteSearch.loading}
          onSave={handleSaveNote}
          onDelete={notes.remove}
          onSearch={noteSearch.search}
          onClearSearch={noteSearch.clear}
          theme={resolvedTheme}
        />
      )}

      {activeTab === 'settings' && (
        <Settings
          apiKey={settings.settings.apiKey}
          apiProvider={settings.settings.apiProvider}
          theme={themeSetting}
          resolvedTheme={resolvedTheme}
          promptTemplate={settings.settings.promptTemplate}
          activeTemplateId={settings.settings.activeTemplateId}
          templates={promptTemplates.templates}
          loading={settings.loading}
          error={settings.error}
          saved={settings.saved}
          onUpdate={settings.update}
          onSave={handleSaveSettings}
          onSaveTemplate={promptTemplates.save}
          onDeleteTemplate={promptTemplates.remove}
        />
      )}

      {import.meta.env.DEV && <DebugPanel theme={resolvedTheme} />}

      <Footer theme={resolvedTheme} />
    </div>
  )
}
