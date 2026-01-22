import { useState } from 'preact/hooks'
import type { Note } from '@domain/entities/Note'
import { getStyles, type Theme } from '../styles'

interface NoteEditorProps {
  notes: Note[]
  loading: boolean
  error: string | null
  searchResults: Note[]
  searchQuery: string
  searchLoading: boolean
  onSave: (id: string | null, content: string, tags: string[]) => void
  onDelete: (id: string) => void
  onSearch: (query: string) => void
  onClearSearch: () => void
  theme: Theme
}

export function NoteEditor({
  notes,
  loading,
  error,
  searchResults,
  searchQuery,
  searchLoading,
  onSave,
  onDelete,
  onSearch,
  onClearSearch,
  theme,
}: NoteEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [localSearchQuery, setLocalSearchQuery] = useState('')
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

  const handleSearchSubmit = () => {
    onSearch(localSearchQuery)
  }

  const handleClearSearch = () => {
    setLocalSearchQuery('')
    onClearSearch()
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isSearching = searchQuery.length > 0
  const displayNotes = isSearching ? searchResults : notes

  return (
    <div>
      {error && (
        <div style={`${styles.status} ${styles.statusError}; margin-bottom: 16px`}>
          {error}
        </div>
      )}

      <div style={`display: flex; gap: 8px; margin-bottom: 16px`}>
        <input
          type="text"
          style={`${styles.input}; flex: 1`}
          placeholder="Search all notes..."
          value={localSearchQuery}
          onInput={(e) => setLocalSearchQuery((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearchSubmit()
          }}
        />
        {isSearching ? (
          <button
            style={`${styles.button} ${styles.secondaryButton}; padding: 8px 16px`}
            onClick={handleClearSearch}
          >
            Clear
          </button>
        ) : (
          <button
            style={`${styles.button} ${styles.primaryButton}; padding: 8px 16px`}
            onClick={handleSearchSubmit}
            disabled={!localSearchQuery.trim()}
          >
            Search
          </button>
        )}
      </div>

      {isSearching && (
        <div style={`${styles.badge} ${styles.badgePrimary}; margin-bottom: 16px`}>
          {searchLoading ? 'Searching...' : `${searchResults.length} results for "${searchQuery}"`}
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

      {!isCreating && !editingId && !isSearching && (
        <button
          style={`${styles.button} ${styles.primaryButton}; width: 100%; margin-bottom: 20px`}
          onClick={handleStartCreate}
        >
          + New Note
        </button>
      )}

      {displayNotes.length > 0 ? (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            {isSearching ? 'Search Results' : `Your Notes (${notes.length})`}
          </div>
          {displayNotes.map((note) => (
            <div key={note.id} style={styles.noteCard}>
              {isSearching && (
                <div style={`font-size: 10px; color: ${styles.colors.textMuted}; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em`}>
                  {note.peerId}
                </div>
              )}
              <div style={styles.noteContent}>{note.content}</div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px">
                <div style={styles.noteTimestamp}>
                  {formatDate(note.updatedAt)}
                </div>
                <div style="display: flex; gap: 8px">
                  {!isSearching && (
                    <button
                      style={`padding: 6px 14px; font-size: 11px; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; background: ${styles.colors.surfaceHover}; color: ${styles.colors.textSecondary}; transition: all 0.15s ease`}
                      onClick={() => handleStartEdit(note)}
                    >
                      Edit
                    </button>
                  )}
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
        !isCreating && !isSearching && (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>📝</div>
            <p style="font-size: 14px; line-height: 1.6">
              Add private notes for this conversation<br />
              that only you can see
            </p>
          </div>
        )
      )}

      {isSearching && displayNotes.length === 0 && !searchLoading && (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>🔍</div>
          <p style="font-size: 14px; line-height: 1.6">
            No notes found for "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  )
}
