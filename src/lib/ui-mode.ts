import type { CortexRoute, WorkspaceContext } from '@/shared/cortex'

export type UiMode = WorkspaceContext

export const UI_MODE_STORAGE_KEY = 'cortex-ui-mode'
export const WORKSPACE_CONTEXT_STORAGE_KEY = 'cortex-workspace-context'

const CORE_GREETING_BY_MODE: Record<WorkspaceContext, string> = {
  cortex: 'Hello Zaidek',
  business: 'Hello Eric',
}

type NavItem = {
  path: CortexRoute
  label: string
  icon: string
  detail: string
}

type ModeContent = {
  shell: {
    badge: string
    subtitle: string
    modeLabel: string
  }
  nav: NavItem[]
  pages: Record<
    CortexRoute,
    {
      title: string
      subtitle: string
    }
  >
  overview: {
    kicker: string
    title: string
    description: string
    statusLabel: string
  }
}

const CORTEX_NAV_ITEMS: NavItem[] = [
  { path: '/cortex', label: 'Overview', icon: 'O', detail: 'Mission-wide operational state' },
  { path: '/cortex/zibz', label: 'Xylos', icon: 'X', detail: 'Scavenjer autonomous operator profiles' },
  { path: '/cortex/knowledge', label: 'Knowledge', icon: 'K', detail: 'Scavenjer doctrine, rules, and source truth' },
  { path: '/cortex/workflows', label: 'Workflows', icon: 'W', detail: 'Drop, minting, community, and studio runbooks' },
  { path: '/cortex/operations', label: 'Operations', icon: 'P', detail: 'Drops, hosts, rewards, and scheduling' },
  { path: '/cortex/economy', label: 'Economy', icon: 'E', detail: 'Rewards, minting, partner proof, and risk' },
  { path: '/cortex/community', label: 'Community', icon: 'C', detail: 'City votes, Discord, players, and hosts' },
  { path: '/cortex/studio', label: 'Studio', icon: 'S', detail: 'Broadcast, recaps, Chronicles, and partner proof' },
  { path: '/cortex/integrations', label: 'Integrations', icon: 'I', detail: 'Supabase, wallets, commerce, Discord, and routes' },
]

const BUSINESS_NAV_ITEMS: NavItem[] = [
  { path: '/business', label: 'Overview', icon: 'O', detail: 'Business-wide operational state' },
  { path: '/business/zibz', label: 'ZiBz', icon: 'Z', detail: 'Business owner autonomous operator profiles' },
  { path: '/business/knowledge', label: 'Knowledge', icon: 'K', detail: 'Client memory, offers, and operating truth' },
  { path: '/business/workflows', label: 'Workflows', icon: 'W', detail: 'Proposal, renewal, finance, and follow-up loops' },
  { path: '/business/operations', label: 'Operations', icon: 'P', detail: 'Client delivery, handoffs, and commitments' },
  { path: '/business/economy', label: 'Economy', icon: 'E', detail: 'Cash, invoices, margin, and pipeline quality' },
  { path: '/business/community', label: 'Community', icon: 'C', detail: 'Clients, partners, referrals, and relationships' },
  { path: '/business/studio', label: 'Studio', icon: 'S', detail: 'Proposals, case studies, decks, and offer assets' },
  { path: '/business/integrations', label: 'Integrations', icon: 'I', detail: 'Inbox, calendar, CRM, docs, and finance tools' },
]

const CORTEX_PAGE_META: ModeContent['pages'] = {
  '/': { title: 'Overview', subtitle: 'Mission operating signal' },
  '/cortex': { title: 'Overview', subtitle: 'Mission operating signal' },
  '/cortex/missions': { title: 'Xylos', subtitle: 'Mission view now lives under the selected Xylos slot' },
  '/cortex/zibz': { title: 'Xylos', subtitle: 'Select a Xylos slot first, then reveal placeholder mission sections' },
  '/cortex/knowledge': { title: 'Knowledge', subtitle: 'Source of truth vault, canon, and simulation memory' },
  '/cortex/workflows': { title: 'Workflows', subtitle: 'Automations, cron jobs, diagrams, and attached bundles' },
  '/cortex/operations': { title: 'Operations', subtitle: 'Drop planning, execution lanes, and live readiness' },
  '/cortex/economy': { title: 'Economy', subtitle: 'Spend, efficiency, and stale operational drag' },
  '/cortex/community': { title: 'Community', subtitle: 'What happened, what is moving, and what is stale' },
  '/cortex/studio': { title: 'Studio', subtitle: 'Briefs, assets, approvals, and shipping pipeline' },
  '/cortex/integrations': { title: 'Integrations', subtitle: 'Connectors, freshness, and sync failures' },
  '/business': { title: 'Overview', subtitle: 'Business operating signal' },
  '/business/missions': { title: 'ZiBz', subtitle: 'Mission view now lives under the selected ZiB' },
  '/business/zibz': { title: 'ZiBz', subtitle: 'Select a ZiB first, then reveal placeholder mission sections' },
  '/business/knowledge': { title: 'Knowledge', subtitle: 'Source of truth vault, canon, and simulation memory' },
  '/business/workflows': { title: 'Workflows', subtitle: 'Automations, cron jobs, diagrams, and attached bundles' },
  '/business/operations': { title: 'Operations', subtitle: 'Drop planning, execution lanes, and live readiness' },
  '/business/economy': { title: 'Economy', subtitle: 'Spend, efficiency, and stale operational drag' },
  '/business/community': { title: 'Community', subtitle: 'What happened, what is moving, and what is stale' },
  '/business/studio': { title: 'Studio', subtitle: 'Briefs, assets, approvals, and shipping pipeline' },
  '/business/integrations': { title: 'Integrations', subtitle: 'Connectors, freshness, and sync failures' },
}

const CORTEX_CONTENT: ModeContent = {
  shell: {
    badge: 'THE CORTEX',
    subtitle: 'Mission OS operational lattice',
    modeLabel: 'Cortex',
  },
  nav: CORTEX_NAV_ITEMS,
  pages: CORTEX_PAGE_META,
  overview: {
    kicker: 'Mission OS nexus',
    title: 'Operational sentience',
    description:
      'A mission-first control surface for execution, approvals, agent lanes, community momentum, and operational evidence.',
    statusLabel: 'Mission OS',
  },
}

const BUSINESS_CONTENT: ModeContent = {
  shell: {
    badge: 'BUSINESS OS',
    subtitle: 'Client, personal, and relationship control layer',
    modeLabel: 'Business',
  },
  nav: BUSINESS_NAV_ITEMS,
  pages: CORTEX_PAGE_META,
  overview: {
    kicker: 'Business operations',
    title: 'Relationship command',
    description:
      'A separate workspace for clients, delivery, personal operations, and long-horizon relationship systems.',
    statusLabel: 'Business OS',
  },
}

const MODE_CONTENT: Record<WorkspaceContext, ModeContent> = {
  cortex: CORTEX_CONTENT,
  business: BUSINESS_CONTENT,
}

export const getModeContent = (uiMode: UiMode) => MODE_CONTENT[uiMode]

export const getCoreGreeting = (uiMode: UiMode) => CORE_GREETING_BY_MODE[uiMode]

export const getWorkspaceHomeRoute = (workspace: WorkspaceContext): CortexRoute =>
  workspace === 'business' ? '/business' : '/cortex'

export const getWorkspaceRouteOptions = (workspace: WorkspaceContext): CortexRoute[] =>
  workspace === 'business'
    ? [
        '/business',
        '/business/missions',
        '/business/zibz',
        '/business/knowledge',
        '/business/workflows',
        '/business/operations',
        '/business/economy',
        '/business/community',
        '/business/studio',
        '/business/integrations',
      ]
    : [
        '/cortex',
        '/cortex/missions',
        '/cortex/zibz',
        '/cortex/knowledge',
        '/cortex/workflows',
        '/cortex/operations',
        '/cortex/economy',
        '/cortex/community',
        '/cortex/studio',
        '/cortex/integrations',
      ]

export const getWorkspaceFromRoute = (pathname: string): WorkspaceContext =>
  pathname.startsWith('/business') ? 'business' : 'cortex'

export const resolveStoredWorkspaceContext = (): WorkspaceContext => {
  if (typeof window === 'undefined') {
    return 'cortex'
  }

  const storage = window.localStorage
  const storedWorkspace =
    storage && typeof storage.getItem === 'function'
      ? storage.getItem(WORKSPACE_CONTEXT_STORAGE_KEY)
      : null

  if (storedWorkspace === 'business' || storedWorkspace === 'cortex') {
    return storedWorkspace
  }

  const legacyWorkspace =
    storage && typeof storage.getItem === 'function'
      ? storage.getItem(UI_MODE_STORAGE_KEY)
      : null

  return legacyWorkspace === 'business' ? 'business' : 'cortex'
}

export const normalizeLegacyRoute = (pathname: string): CortexRoute => {
  switch (pathname) {
    case '/':
      return '/cortex'
    case '/missions':
      return '/cortex/missions'
    case '/zibz':
      return '/cortex/zibz'
    case '/knowledge':
      return '/cortex/knowledge'
    case '/workflows':
      return '/cortex/workflows'
    case '/operations':
      return '/cortex/operations'
    case '/economy':
      return '/cortex/economy'
    case '/community':
      return '/cortex/community'
    case '/studio':
      return '/cortex/studio'
    case '/integrations':
      return '/cortex/integrations'
    default:
      return pathname as CortexRoute
  }
}

export const getPageMeta = (uiMode: UiMode, pathname: string) => {
  const resolvedRoute = normalizeLegacyRoute(pathname)
  return (
    MODE_CONTENT[uiMode].pages[resolvedRoute] ??
    MODE_CONTENT[uiMode].pages[getWorkspaceHomeRoute(uiMode)]
  )
}
