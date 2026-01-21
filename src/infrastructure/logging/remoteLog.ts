const REMOTE_LOG_URL = 'http://localhost:3999/log'

export function remoteLog(source: string, ...args: unknown[]) {
  console.log(`[${source}]`, ...args)
  const message = args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ')
  fetch(REMOTE_LOG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, message }),
  }).catch(() => {})
}

export const createLogger = (source: string) => ({
  log: (...args: unknown[]) => remoteLog(source, ...args),
  info: (...args: unknown[]) => remoteLog(source, '[INFO]', ...args),
  warn: (...args: unknown[]) => remoteLog(source, '[WARN]', ...args),
  error: (...args: unknown[]) => remoteLog(source, '[ERROR]', ...args),
})
