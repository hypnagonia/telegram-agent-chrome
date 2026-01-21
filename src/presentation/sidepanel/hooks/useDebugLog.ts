import { useState, useEffect, useCallback } from 'preact/hooks'

interface LogEntry {
  id: number
  level: 'log' | 'warn' | 'error' | 'info'
  message: string
  timestamp: Date
}

let logId = 0
const logListeners: ((entry: LogEntry) => void)[] = []

function createLogEntry(level: LogEntry['level'], args: unknown[]): LogEntry {
  return {
    id: logId++,
    level,
    message: args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' '),
    timestamp: new Date(),
  }
}

const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
}

let isPatched = false

export function patchConsole() {
  if (isPatched) return
  isPatched = true

  console.log = (...args: unknown[]) => {
    originalConsole.log(...args)
    const entry = createLogEntry('log', args)
    logListeners.forEach(fn => fn(entry))
  }

  console.warn = (...args: unknown[]) => {
    originalConsole.warn(...args)
    const entry = createLogEntry('warn', args)
    logListeners.forEach(fn => fn(entry))
  }

  console.error = (...args: unknown[]) => {
    originalConsole.error(...args)
    const entry = createLogEntry('error', args)
    logListeners.forEach(fn => fn(entry))
  }

  console.info = (...args: unknown[]) => {
    originalConsole.info(...args)
    const entry = createLogEntry('info', args)
    logListeners.forEach(fn => fn(entry))
  }
}

export function useDebugLog(maxEntries = 100) {
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    patchConsole()

    const listener = (entry: LogEntry) => {
      setLogs(prev => [...prev.slice(-(maxEntries - 1)), entry])
    }

    logListeners.push(listener)
    return () => {
      const idx = logListeners.indexOf(listener)
      if (idx > -1) logListeners.splice(idx, 1)
    }
  }, [maxEntries])

  const clear = useCallback(() => {
    setLogs([])
  }, [])

  const getLogsAsText = useCallback(() => {
    return logs.map(l =>
      `[${l.timestamp.toISOString()}] [${l.level.toUpperCase()}] ${l.message}`
    ).join('\n')
  }, [logs])

  return { logs, clear, getLogsAsText }
}
