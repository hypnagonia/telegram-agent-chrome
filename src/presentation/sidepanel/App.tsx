import { useState, useCallback, useEffect } from 'preact/hooks'
import { useCurrentDialogue, useHints, useNotes, useSettings } from './hooks'
import { patchConsole } from './hooks/useDebugLog'
import { HintPanel, NoteEditor, Settings, IndexStatus, DebugPanel } from './components'
import { getStyles } from './styles'
import {
  MessageType,
  sendToBackground,
  type IndexDialoguePayload,
  type ClearIndexPayload,
} from '@infrastructure/adapters/telegram/MessageBridge'
import type { Hint } from '@domain/entities/Hint'

patchConsole()

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
  const settings = useSettings()

  const theme = settings.settings.theme || 'light'
  const styles = getStyles(theme)

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
    document.body.style.background = theme === 'dark' ? '#0f0f14' : '#fafafa'
    document.body.style.color = theme === 'dark' ? '#e4e4eb' : '#1a1a2e'
  }, [theme])

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

  const handleSelectHint = useCallback((hint: Hint) => {
    navigator.clipboard.writeText(hint.text)
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Telegram Assistant</h1>
      </div>

      <IndexStatus
        dialogue={dialogue.dialogue}
        peerName={dialogue.peerId}
        loading={indexing || dialogue.loading}
        onIndex={handleIndex}
        onClearIndex={handleClearIndex}
        theme={theme}
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
          onGenerate={handleGenerateHints}
          onSelectHint={handleSelectHint}
          theme={theme}
        />
      )}

      {activeTab === 'notes' && (
        <NoteEditor
          notes={notes.notes}
          loading={notes.loading}
          error={notes.error}
          onSave={handleSaveNote}
          onDelete={notes.remove}
          theme={theme}
        />
      )}

      {activeTab === 'settings' && (
        <Settings
          apiKey={settings.settings.apiKey}
          apiProvider={settings.settings.apiProvider}
          theme={theme}
          loading={settings.loading}
          error={settings.error}
          saved={settings.saved}
          onUpdate={settings.update}
          onSave={handleSaveSettings}
        />
      )}

      <DebugPanel theme={theme} />
    </div>
  )
}
