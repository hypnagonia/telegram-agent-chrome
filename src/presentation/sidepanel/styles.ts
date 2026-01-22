export type Theme = 'light' | 'dark' | 'system'

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

const lightColors = {
  bg: '#fafafa',
  surface: '#ffffff',
  surfaceHover: '#f8f9fa',
  border: 'rgba(0, 0, 0, 0.06)',
  borderHover: 'rgba(0, 0, 0, 0.12)',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  primaryLight: 'rgba(99, 102, 241, 0.08)',
  success: '#10b981',
  successLight: 'rgba(16, 185, 129, 0.08)',
  warning: '#f59e0b',
  warningLight: 'rgba(245, 158, 11, 0.08)',
  error: '#ef4444',
  errorLight: 'rgba(239, 68, 68, 0.08)',
  accent: '#8b5cf6',
  noteYellow: '#fef9c3',
  noteBorder: '#fde047',
  noteText: '#92400e',
}

const darkColors = {
  bg: '#0f0f14',
  surface: '#1a1a24',
  surfaceHover: '#24242f',
  border: 'rgba(255, 255, 255, 0.06)',
  borderHover: 'rgba(255, 255, 255, 0.12)',
  text: '#e4e4eb',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  primary: '#818cf8',
  primaryHover: '#6366f1',
  primaryLight: 'rgba(129, 140, 248, 0.12)',
  success: '#34d399',
  successLight: 'rgba(52, 211, 153, 0.12)',
  warning: '#fbbf24',
  warningLight: 'rgba(251, 191, 36, 0.12)',
  error: '#f87171',
  errorLight: 'rgba(248, 113, 113, 0.12)',
  accent: '#a78bfa',
  noteYellow: '#422006',
  noteBorder: '#854d0e',
  noteText: '#fcd34d',
}

export function getStyles(theme: Theme = 'light') {
  const colors = theme === 'dark' ? darkColors : lightColors

  return {
    container: `
      padding: 20px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${colors.bg};
      min-height: 100vh;
      box-sizing: border-box;
      color: ${colors.text};
    `,
    header: `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    `,
    title: `
      font-size: 20px;
      font-weight: 700;
      color: ${colors.text};
      margin: 0;
      letter-spacing: -0.025em;
    `,
    tabs: `
      display: flex;
      gap: 4px;
      margin-bottom: 20px;
      background: ${colors.surface};
      padding: 4px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
      border: 1px solid ${colors.border};
    `,
    tab: `
      flex: 1;
      padding: 10px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: ${colors.textSecondary};
      border-radius: 8px;
      transition: all 0.2s ease;
    `,
    tabActive: `
      background: ${colors.primary};
      color: white;
      box-shadow: 0 2px 8px ${theme === 'dark' ? 'rgba(129, 140, 248, 0.3)' : 'rgba(99, 102, 241, 0.3)'};
    `,
    section: `
      margin-bottom: 24px;
    `,
    sectionTitle: `
      font-size: 11px;
      font-weight: 600;
      color: ${colors.textMuted};
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    `,
    button: `
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
      letter-spacing: -0.01em;
    `,
    primaryButton: `
      background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%);
      color: white;
      box-shadow: 0 4px 14px ${theme === 'dark' ? 'rgba(129, 140, 248, 0.25)' : 'rgba(99, 102, 241, 0.35)'};
    `,
    secondaryButton: `
      background: ${colors.surface};
      color: ${colors.text};
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid ${colors.border};
    `,
    hintCard: `
      background: ${colors.surface};
      border: 1px solid ${colors.border};
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    `,
    hintText: `
      font-size: 14px;
      color: ${colors.text};
      line-height: 1.6;
      letter-spacing: -0.01em;
    `,
    noteCard: `
      background: ${colors.noteYellow};
      border: 1px solid ${colors.noteBorder};
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 10px;
      box-shadow: 0 2px 8px ${theme === 'dark' ? 'rgba(133, 77, 14, 0.2)' : 'rgba(253, 224, 71, 0.2)'};
    `,
    noteContent: `
      font-size: 14px;
      color: ${theme === 'dark' ? '#fef3c7' : colors.text};
      white-space: pre-wrap;
      line-height: 1.6;
    `,
    noteTimestamp: `
      font-size: 11px;
      color: ${colors.noteText};
      margin-top: 12px;
      font-weight: 500;
    `,
    input: `
      width: 100%;
      padding: 12px 16px;
      border: 1px solid ${colors.border};
      border-radius: 10px;
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
      background: ${colors.surface};
      color: ${colors.text};
    `,
    textarea: `
      width: 100%;
      padding: 14px 16px;
      border: 1px solid ${colors.border};
      border-radius: 12px;
      font-size: 14px;
      outline: none;
      resize: vertical;
      min-height: 120px;
      font-family: inherit;
      box-sizing: border-box;
      background: ${colors.surface};
      color: ${colors.text};
      line-height: 1.6;
      transition: all 0.2s ease;
    `,
    label: `
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: ${colors.textSecondary};
      margin-bottom: 8px;
      letter-spacing: 0.01em;
    `,
    formGroup: `
      margin-bottom: 20px;
    `,
    status: `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
    `,
    statusSuccess: `
      background: ${colors.successLight};
      color: ${colors.success};
      border: 1px solid ${theme === 'dark' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.2)'};
    `,
    statusPending: `
      background: ${colors.warningLight};
      color: ${colors.warning};
      border: 1px solid ${theme === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.2)'};
    `,
    statusError: `
      background: ${colors.errorLight};
      color: ${colors.error};
      border: 1px solid ${theme === 'dark' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
    `,
    emptyState: `
      text-align: center;
      padding: 48px 24px;
      color: ${colors.textMuted};
    `,
    emptyStateIcon: `
      font-size: 56px;
      margin-bottom: 16px;
      opacity: 0.8;
    `,
    loading: `
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
      color: ${colors.textSecondary};
      font-size: 14px;
      font-weight: 500;
    `,
    dialogueInfo: `
      background: ${colors.surface};
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03);
      border: 1px solid ${colors.border};
    `,
    dialogueName: `
      font-weight: 700;
      color: ${colors.text};
      font-size: 16px;
      letter-spacing: -0.02em;
    `,
    dialogueStats: `
      font-size: 12px;
      color: ${colors.textMuted};
      margin-top: 6px;
      font-weight: 500;
    `,
    select: `
      width: 100%;
      padding: 12px 16px;
      border: 1px solid ${colors.border};
      border-radius: 10px;
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
      background: ${colors.surface};
      color: ${colors.text};
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${encodeURIComponent(colors.textSecondary)}' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 16px center;
      padding-right: 40px;
    `,
    badge: `
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
    `,
    badgeSuccess: `
      background: ${colors.successLight};
      color: ${colors.success};
    `,
    badgePrimary: `
      background: ${colors.primaryLight};
      color: ${colors.primary};
    `,
    divider: `
      height: 1px;
      background: ${colors.border};
      margin: 20px 0;
    `,
    card: `
      background: ${colors.surface};
      border: 1px solid ${colors.border};
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    `,
    colors,
  }
}

export const styles = getStyles('light')
