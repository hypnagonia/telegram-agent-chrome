import { useState } from 'preact/hooks'
import type { Note } from '@domain/entities/Note'
import { getStyles, type Theme } from '../styles'

interface NoteEditorProps {
  notes: Note[]
  loading: boolean
  error: string | null
  onSave: (id: string | null, content: string, tags: string[]) => void
  onDelete: (id: string) => void
  theme: Theme
}

export function NoteEditor({ notes, loading, error, onSave, onDelete, theme }: NoteEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const styles = getStyles(theme)

  const handleStartCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setContent('')
  }

  const handleStartEdit = (note: Note) => {
    setIsCreating(false)
    setEditingId(note.id)
    setContent(note.content)
  }

  const handleSave = () => {
    if (!content.trim()) return
    onSave(editingId, content.trim(), [])
    setContent('')
    setEditingId(null)
    setIsCreating(false)
  }

  const handleCancel = () => {
    setContent('')
    setEditingId(null)
    setIsCreating(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this note?')) {
      onDelete(id)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      {error && (
        <div style={`${styles.status} ${styles.statusError}; margin-bottom: 16px`}>
          {error}
        </div>
      )}

      {(isCreating || editingId) && (
        <div style={`${styles.section}; margin-bottom: 24px`}>
          <textarea
            style={styles.textarea}
            placeholder="Write your note..."
            value={content}
            onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
          />
          <div style="display: flex; gap: 10px; margin-top: 12px">
            <button
              style={`${styles.button} ${styles.primaryButton}; flex: 1`}
              onClick={handleSave}
              disabled={loading || !content.trim()}
            >
              {loading ? 'Saving...' : 'Save Note'}
            </button>
            <button
              style={`${styles.button} ${styles.secondaryButton}`}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isCreating && !editingId && (
        <button
          style={`${styles.button} ${styles.primaryButton}; width: 100%; margin-bottom: 20px`}
          onClick={handleStartCreate}
        >
          + New Note
        </button>
      )}

      {notes.length > 0 ? (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Your Notes ({notes.length})</div>
          {notes.map((note) => (
            <div key={note.id} style={styles.noteCard}>
              <div style={styles.noteContent}>{note.content}</div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px">
                <div style={styles.noteTimestamp}>
                  {formatDate(note.updatedAt)}
                </div>
                <div style="display: flex; gap: 8px">
                  <button
                    style={`padding: 6px 14px; font-size: 11px; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; background: ${styles.colors.surfaceHover}; color: ${styles.colors.textSecondary}; transition: all 0.15s ease`}
                    onClick={() => handleStartEdit(note)}
                  >
                    Edit
                  </button>
                  <button
                    style={`padding: 6px 14px; font-size: 11px; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; background: ${styles.colors.errorLight}; color: ${styles.colors.error}; transition: all 0.15s ease`}
                    onClick={() => handleDelete(note.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isCreating && (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>📝</div>
            <p style="font-size: 14px; line-height: 1.6">
              Add private notes for this conversation<br />
              that only you can see
            </p>
          </div>
        )
      )}
    </div>
  )
}
