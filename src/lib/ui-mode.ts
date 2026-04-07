import type { CortexAgent, CortexCampaign, CortexOutreachQueueItem } from '@/shared/cortex'

export type UiMode = 'scavenjer' | 'business'

export const UI_MODE_STORAGE_KEY = 'cortex-ui-mode'
const CORE_GREETING_BY_MODE: Record<UiMode, string> = {
  scavenjer: 'Hello Zaidek',
  business: 'Hello Eric',
}

type RoutePath = '/' | '/marketing' | '/agents' | '/memories' | '/schedules' | '/system'

type NavItem = {
  path: RoutePath
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
    RoutePath,
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
  agents: {
    loading: string
    panelTitle: string
    panelEyebrow: string
    memoryUnit: string
    lastActiveLabel: string
    fallbackIcon: string
  }
  marketing: {
    loading: string
    metricsTitle: string
    metricsEyebrow: string
    campaignsTitle: string
    campaignsEyebrow: string
    queueTitle: string
    queueEyebrow: string
    audienceLabel: string
    ownerLabel: string
    dueLabel: string
    nextActionLabel: string
  }
  memories: {
    loading: string
    panelTitle: string
    panelEyebrow: string
    allAgentsLabel: string
    searchLabel: string
    searchPlaceholder: string
    pinnedLabel: string
    focusTitle: string
    focusEyebrow: string
    empty: string
  }
  schedules: {
    loading: string
    panelTitle: string
    panelEyebrow: string
    lastRunLabel: string
    nextRunLabel: string
    driftLabel: string
    runNowLabel: string
    pauseLabel: string
    retryLabel: string
  }
  system: {
    loading: string
    diagnosticsTitle: string
    diagnosticsEyebrow: string
    logsTitle: string
    logsEyebrow: string
    resultTitle: string
    resultEyebrow: string
    throughputLabel: string
    memoryIntegrityLabel: string
    activeNodesLabel: string
    queueDepthLabel: string
    ranAtLabel: string
    empty: string
  }
}

const BUSINESS_AGENT_PRESENTATION: Record<
  string,
  { role: string; description: string; displayName?: string }
> = {
  zib00: {
    role: 'Executive operator',
    description:
      'Coordinates priorities, dashboards, delegation, and day-to-day business execution across the Cortex.',
  },
  zib001: {
    role: 'Growth lead',
    description:
      'Owns campaign planning, outreach sequencing, publishing rhythm, and top-of-funnel momentum for the business.',
  },
  zib002: {
    role: 'Client success lead',
    description:
      'Tracks delivery readiness, partner coordination, and hands-on follow-through for external business activations.',
  },
  zib003: {
    role: 'Finance and research lead',
    description:
      'Monitors automation economics, operating efficiency, system reliability, and the research signals behind smarter decisions.',
  },
}

const DISPLAY_NAME_BY_MODE: Record<UiMode, Record<string, string>> = {
  scavenjer: {
    zib00: 'ZiB00',
    zib001: 'ZiB001',
    zib002: 'ZiB002',
    zib003: 'ZiB003',
    'drop-ops': 'Drop Ops',
    'ledger-watch': 'Ledger Watch',
  },
  business: {
    zib00: 'Operator',
    zib001: 'Marketing',
    zib002: 'Client Success',
    zib003: 'Finance / Research',
    'drop-ops': 'Client Success',
    'ledger-watch': 'Finance / Research',
  },
}

const MODE_CONTENT: Record<UiMode, ModeContent> = {
  scavenjer: {
    shell: {
      badge: 'THE CORTEX',
      subtitle: 'Scavenjer operations lattice',
      modeLabel: 'Scavenjer',
    },
    nav: [
      { path: '/', label: 'Overview', icon: '◉', detail: 'Scavenjer ops state' },
      { path: '/agents', label: 'ZiBz', icon: '⬢', detail: 'Operational roles and cycling view' },
      { path: '/memories', label: 'Ops Memory', icon: '◈', detail: 'Pinned context and decisions' },
      { path: '/schedules', label: 'Schedules', icon: '◷', detail: 'Cron and recurring tasks' },
      { path: '/system', label: 'Runtime / Logs', icon: '⚙', detail: 'Diagnostics and usage' },
    ],
    pages: {
      '/': { title: 'Overview', subtitle: 'Scavenjer command presence' },
      '/marketing': { title: 'ZiBz', subtitle: 'ZiBz operational cycling view' },
      '/agents': { title: 'ZiBz', subtitle: 'ZiBz operational cycling view' },
      '/memories': { title: 'Ops Memory', subtitle: 'Pinned lessons, decisions, and operating context' },
      '/schedules': { title: 'Schedules', subtitle: 'Recurring tasks, drift, and retries' },
      '/system': { title: 'Runtime / Logs', subtitle: 'Diagnostics, usage, and execution traces' },
    },
    overview: {
      kicker: 'Scavenjer central nexus',
      title: 'Operational sentience',
      description:
        'A live orchestration surface for Scavenjer priorities, marketing execution, manual drop coordination, and runtime discipline.',
      statusLabel: 'Dark mode operations',
    },
    agents: {
      loading: 'Syncing agents...',
      panelTitle: 'ZiBz operations channel',
      panelEyebrow: 'Cycle through operational roles',
      memoryUnit: 'memories',
      lastActiveLabel: 'Last active',
      fallbackIcon: 'AG',
    },
    marketing: {
      loading: 'Loading ZiB001 marketing systems...',
      metricsTitle: 'ZiB001 marketing command',
      metricsEyebrow: 'Campaigns, outreach, and metrics',
      campaignsTitle: 'Campaigns',
      campaignsEyebrow: 'What ZiB001 is pushing',
      queueTitle: 'Outreach queue',
      queueEyebrow: 'Posts, emails, DMs, and partnerships',
      audienceLabel: 'Audience',
      ownerLabel: 'Owner',
      dueLabel: 'Due',
      nextActionLabel: 'Next action',
    },
    memories: {
      loading: 'Retrieving recollections...',
      panelTitle: 'Central memory stream',
      panelEyebrow: 'Agent-filtered timeline',
      allAgentsLabel: 'All agents',
      searchLabel: 'Search memory',
      searchPlaceholder: 'Pinned recall, anomaly, archive...',
      pinnedLabel: 'Pinned',
      focusTitle: 'Focused recall',
      focusEyebrow: 'Selected memory',
      empty: 'No memories matched the current filters.',
    },
    schedules: {
      loading: 'Resolving temporal jobs...',
      panelTitle: 'Scheduled orchestration lanes',
      panelEyebrow: 'Cron and temporal tasks',
      lastRunLabel: 'Last run',
      nextRunLabel: 'Next run',
      driftLabel: 'Drift',
      runNowLabel: 'Run now',
      pauseLabel: 'Pause',
      retryLabel: 'Retry',
    },
    system: {
      loading: 'Bringing diagnostics online...',
      diagnosticsTitle: 'System diagnostics',
      diagnosticsEyebrow: 'Core telemetry',
      logsTitle: 'Live event stream',
      logsEyebrow: 'Realtime logs',
      resultTitle: 'Last command result',
      resultEyebrow: 'Execution feedback',
      throughputLabel: 'Throughput',
      memoryIntegrityLabel: 'Memory integrity',
      activeNodesLabel: 'Active nodes',
      queueDepthLabel: 'Queue depth',
      ranAtLabel: 'Ran at',
      empty: 'Run a command to capture execution feedback.',
    },
  },
  business: {
    shell: {
      badge: 'THE CORTEX',
      subtitle: 'Business operations command hub',
      modeLabel: 'Business',
    },
    nav: [
      { path: '/', label: 'Command Hub', icon: '◉', detail: 'Executive overview' },
      { path: '/agents', label: 'ZiBz', icon: '⬢', detail: 'Executive operational roles' },
      { path: '/memories', label: 'Decisions', icon: '◈', detail: 'Context, notes, and recall' },
      { path: '/schedules', label: 'Automations', icon: '◷', detail: 'Recurring business workflows' },
      { path: '/system', label: 'Runtime / Insights', icon: '⚙', detail: 'Performance and activity' },
    ],
    pages: {
      '/': { title: 'Command Hub', subtitle: 'Executive business orchestration' },
      '/marketing': { title: 'ZiBz', subtitle: 'ZiBz operational cycling view' },
      '/agents': { title: 'ZiBz', subtitle: 'ZiBz operational cycling view' },
      '/memories': { title: 'Decisions', subtitle: 'Shared context, pinned learnings, and strategic memory' },
      '/schedules': { title: 'Automations', subtitle: 'Recurring workflows, priorities, and retries' },
      '/system': { title: 'Runtime / Insights', subtitle: 'Performance signals, telemetry, and command output' },
    },
    overview: {
      kicker: 'Business command presence',
      title: 'Executive orchestration',
      description:
        'A lighter Cortex skin for personal business operations, giving every agent role a premium executive surface while preserving the same orchestration engine.',
      statusLabel: 'Business light mode',
    },
    agents: {
      loading: 'Syncing executive roles...',
      panelTitle: 'ZiBz operations channel',
      panelEyebrow: 'Cycle through operational roles',
      memoryUnit: 'records',
      lastActiveLabel: 'Last signal',
      fallbackIcon: 'EX',
    },
    marketing: {
      loading: 'Loading growth systems...',
      metricsTitle: 'Growth command',
      metricsEyebrow: 'Campaign health, outreach, and momentum',
      campaignsTitle: 'Growth initiatives',
      campaignsEyebrow: 'What the business is advancing now',
      queueTitle: 'Outreach pipeline',
      queueEyebrow: 'Posts, email, DMs, partnerships, and follow-through',
      audienceLabel: 'Audience',
      ownerLabel: 'Role',
      dueLabel: 'Target date',
      nextActionLabel: 'Next move',
    },
    memories: {
      loading: 'Retrieving decision records...',
      panelTitle: 'Decision stream',
      panelEyebrow: 'Role-filtered context timeline',
      allAgentsLabel: 'All roles',
      searchLabel: 'Search decisions',
      searchPlaceholder: 'Client note, strategy, finance, growth...',
      pinnedLabel: 'Pinned',
      focusTitle: 'Focused decision',
      focusEyebrow: 'Selected record',
      empty: 'No decision records matched the current filters.',
    },
    schedules: {
      loading: 'Resolving business automations...',
      panelTitle: 'Automation lanes',
      panelEyebrow: 'Recurring business workflows',
      lastRunLabel: 'Last run',
      nextRunLabel: 'Next run',
      driftLabel: 'Delay',
      runNowLabel: 'Run now',
      pauseLabel: 'Pause',
      retryLabel: 'Retry',
    },
    system: {
      loading: 'Bringing insights online...',
      diagnosticsTitle: 'Runtime insights',
      diagnosticsEyebrow: 'Executive telemetry',
      logsTitle: 'Activity stream',
      logsEyebrow: 'Realtime insights',
      resultTitle: 'Latest command result',
      resultEyebrow: 'Execution feedback',
      throughputLabel: 'Throughput',
      memoryIntegrityLabel: 'Integrity',
      activeNodesLabel: 'Active roles',
      queueDepthLabel: 'Queue depth',
      ranAtLabel: 'Ran at',
      empty: 'Run a workflow to capture execution feedback.',
    },
  },
}

export const getModeContent = (uiMode: UiMode) => MODE_CONTENT[uiMode]

export const getCoreGreeting = (uiMode: UiMode) => CORE_GREETING_BY_MODE[uiMode]

export const getPageMeta = (uiMode: UiMode, pathname: string) =>
  MODE_CONTENT[uiMode].pages[(pathname as RoutePath) ?? '/'] ?? MODE_CONTENT[uiMode].pages['/']

export const getDisplayName = (id: string, uiMode: UiMode) =>
  DISPLAY_NAME_BY_MODE[uiMode][id] ?? id

export const getAgentPresentation = (agent: CortexAgent, uiMode: UiMode) => {
  if (uiMode === 'business') {
    const presentation = BUSINESS_AGENT_PRESENTATION[agent.id]
    return {
      displayName: presentation?.displayName ?? getDisplayName(agent.id, uiMode),
      role: presentation?.role ?? agent.role,
      description: presentation?.description ?? agent.description,
    }
  }

  return {
    displayName: agent.name,
    role: agent.role,
    description: agent.description,
  }
}

export const getCampaignOwner = (campaign: CortexCampaign, uiMode: UiMode) =>
  getDisplayName(campaign.ownerAgentId, uiMode)

export const getOutreachOwner = (
  item: CortexOutreachQueueItem,
  uiMode: UiMode,
) => getDisplayName(item.ownerAgentId, uiMode)
