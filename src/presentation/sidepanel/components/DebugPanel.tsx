import { useState } from 'preact/hooks'
import { useDebugLog } from '../hooks/useDebugLog'
import type { Theme } from '../styles'

interface DebugPanelProps {
  theme: Theme
}

const getPanelStyles = (theme: Theme) => ({
  container: `
    margin-top: 24px;
    border-radius: 14px;
    overflow: hidden;
    background: ${theme === 'dark' ? '#1a1a24' : '#1e1e2e'};
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'transparent'};
  `,
  header: `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    user-select: none;
    background: ${theme === 'dark' ? '#24242f' : 'linear-gradient(135deg, #313244 0%, #1e1e2e 100%)'};
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  `,
  title: `
    font-size: 11px;
    font-weight: 600;
    color: #cdd6f4;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  badge: `
    background: rgba(137, 180, 250, 0.15);
    color: #89b4fa;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
  `,
  toggle: `
    font-size: 10px;
    color: #6c7086;
    transition: transform 0.2s ease;
  `,
  content: `
    padding: 12px;
    max-height: 240px;
    overflow-y: auto;
    font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;
    font-size: 11px;
  `,
  entry: `
    padding: 6px 10px;
    border-radius: 6px;
    margin-bottom: 4px;
    word-break: break-all;
    white-space: pre-wrap;
    background: rgba(255, 255, 255, 0.02);
    transition: background 0.15s ease;
  `,
  log: `color: #a6adc8;`,
  info: `color: #89b4fa;`,
  warn: `color: #f9e2af;`,
  error: `color: #f38ba8;`,
  timestamp: `
    color: #585b70;
    margin-right: 10px;
    font-size: 10px;
  `,
  buttons: `
    display: flex;
    gap: 8px;
    padding: 0 12px 12px;
  `,
  button: `
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 500;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.05);
    color: #bac2de;
    transition: all 0.15s ease;
    border: 1px solid rgba(255, 255, 255, 0.05);
  `,
  empty: `
    color: #585b70;
    font-style: italic;
    padding: 24px;
    text-align: center;
    font-size: 12px;
  `,
})

export function DebugPanel({ theme }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true)
  const { logs, clear, getLogsAsText } = useDebugLog()
  const panelStyles = getPanelStyles(theme)

  const copyLogs = () => {
    navigator.clipboard.writeText(getLogsAsText())
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false })
  }

  return (
    <div style={panelStyles.container}>
      <div style={panelStyles.header} onClick={() => setIsOpen(!isOpen)}>
        <span style={panelStyles.title}>
          Console
          <span style={panelStyles.badge}>{logs.length}</span>
        </span>
        <span style={`${panelStyles.toggle}; transform: rotate(${isOpen ? '0' : '-90'}deg)`}>▼</span>
      </div>

      {isOpen && (
        <>
          <div style={panelStyles.buttons}>
            <button style={panelStyles.button} onClick={copyLogs}>
              Copy
            </button>
            <button style={panelStyles.button} onClick={clear}>
              Clear
            </button>
          </div>

          <div style={panelStyles.content}>
            {logs.length === 0 ? (
              <div style={panelStyles.empty}>No logs yet</div>
            ) : (
              logs.map((entry) => (
                <div
                  key={entry.id}
                  style={`${panelStyles.entry} ${panelStyles[entry.level]}`}
                >
                  <span style={panelStyles.timestamp}>{formatTime(entry.timestamp)}</span>
                  {entry.message}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
