import type {
  AccentTone,
  BusinessDashboardSnapshot,
  CortexCommand,
  CortexDashboardSnapshot,
  CortexRoute,
  WorkspaceContext,
} from '@/shared/cortex'

export type WorkspaceMetricModel = {
  id: string
  label: string
  value: string
  detail: string
  accent: AccentTone
}

export type WorkspaceCardModel = {
  id: string
  title: string
  body: string
  accent: AccentTone
  status: string
  meta: string
  chips?: string[]
  footnotes?: Array<{ label: string; value: string }>
  columns?: Array<{ label: string; value: string }>
}

export type WorkspaceListModel = {
  id: string
  title: string
  subtitle: string
  status: string
  meta: string
  accent: AccentTone
}

export type WorkspaceWorkflowModel = {
  id: string
  title: string
  description: string
  toolsUsed: string[]
  architecture: string
  updatedAt: string
  accent: AccentTone
  source: 'cortex' | 'business'
  diagramPreviewUrl?: string | null
  diagramPreviewFileName?: string
  diagramSourceFileName?: string
  zipFileName?: string | null
}

export const getWorkspaceRoute = (
  uiMode: WorkspaceContext,
  page: Exclude<CortexRoute, '/' | '/cortex' | '/business'>,
) => (uiMode === 'business' ? page.replace('/cortex', '/business') : page) as CortexRoute

export const buildKnowledgeModel = (
  uiMode: WorkspaceContext,
  snapshot: CortexDashboardSnapshot | null,
  businessSnapshot: BusinessDashboardSnapshot | null,
  focusedId?: string | null,
) => {
  if (uiMode === 'business') {
    if (!businessSnapshot) {
      return null
    }

    const cards: WorkspaceCardModel[] = businessSnapshot.relationships.map((relationship) => ({
      id: relationship.id,
      title: relationship.name,
      body: relationship.summary,
      accent: relationship.accent,
      status: relationship.stage,
      meta: relationship.type,
      chips: ['client memory', 'relationship truth', 'next touch'],
      footnotes: [{ label: 'Next Touch', value: relationship.nextTouch }],
    }))

    return {
      title: 'Business Source Truth',
      eyebrow: 'Client memory and operating context',
      cards,
      focusedCard: cards.find((card) => card.id === focusedId) ?? cards[0] ?? null,
      detailTitle: 'Focused Relationship',
      detailEyebrow: 'Owner memory detail',
      supportTitle: 'Operating References',
      supportEyebrow: 'Offers, workflows, sections',
      supportItems: businessSnapshot.sections.map((section) => ({
        id: section.id,
        title: section.title,
        subtitle: section.description,
        status: section.status,
        meta: section.route,
        accent: section.accent,
      })),
    }
  }

  if (!snapshot) {
    return null
  }

  const cards: WorkspaceCardModel[] = snapshot.vaultEntries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    body: entry.summary,
    accent: entry.accent,
    status: entry.category,
    meta: entry.canonical ? 'canonical' : 'draft',
    chips: entry.tags,
    footnotes: [{ label: 'Source', value: entry.source }],
  }))

  return {
    title: 'Scavenjer Source Truth',
    eyebrow: 'Doctrine, rules, admin context',
    cards,
    focusedCard: cards.find((card) => card.id === focusedId) ?? cards[0] ?? null,
    detailTitle: 'Focused Vault Entry',
    detailEyebrow: 'Canonical memory detail',
    supportTitle: 'Lore / Simulations',
    supportEyebrow: 'Ekos, identity, phase trees',
    supportItems: snapshot.loreEntries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      subtitle: entry.arc,
      status: entry.canonStatus,
      meta: entry.phaseTree,
      accent: entry.accent,
    })),
  }
}

export const buildOperationsModel = (
  uiMode: WorkspaceContext,
  snapshot: CortexDashboardSnapshot | null,
  businessSnapshot: BusinessDashboardSnapshot | null,
  focusedId?: string | null,
) => {
  if (uiMode === 'business') {
    if (!businessSnapshot) {
      return null
    }

    return {
      title: 'Business Operations Board',
      eyebrow: 'Delivery, handoffs, commitments',
      controlsTitle: 'Operations Controls',
      controlsEyebrow: 'Owner and delivery actions',
      cards: businessSnapshot.queue.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.nextAction,
        accent: item.accent,
        status: item.status,
        meta: item.owner,
        columns: [
          { label: 'Owner', value: item.owner },
          { label: 'Due', value: item.dueAt },
          { label: 'Status', value: item.status },
          { label: 'Queue', value: 'Business' },
        ],
        footnotes: [{ label: 'Next Action', value: item.nextAction }],
      })),
      focusedId,
      commands: businessSnapshot.commands,
      commandContext: focusedId ?? 'business-operations',
    }
  }

  if (!snapshot) {
    return null
  }

  return {
    title: 'Scavenjer Operations Board',
    eyebrow: 'Drops, hosts, rewards, scheduling',
    controlsTitle: 'Operations Controls',
    controlsEyebrow: 'Drop and field actions',
    cards: snapshot.drops.map((drop) => ({
      id: drop.id,
      title: drop.name,
      body: drop.location,
      accent: drop.accent,
      status: drop.status,
      meta: drop.city,
      columns: [
        { label: 'Host', value: drop.host },
        { label: 'Reward', value: drop.reward },
        { label: 'Countdown', value: drop.countdown },
        { label: 'Scheduled', value: drop.scheduledFor },
      ],
      footnotes: [{ label: 'Completion', value: drop.completionState }],
    })),
    focusedId,
    commands: snapshot.commands.filter((command) => command.scope === 'operations'),
    commandContext: focusedId ?? 'operations',
  }
}

export const buildEconomyModel = (
  uiMode: WorkspaceContext,
  snapshot: CortexDashboardSnapshot | null,
  businessSnapshot: BusinessDashboardSnapshot | null,
) => {
  if (uiMode === 'business') {
    if (!businessSnapshot) {
      return null
    }

    return {
      title: 'Business Economy',
      eyebrow: 'Cash, margin, pipeline quality',
      metrics: businessSnapshot.metrics,
      riskTitle: 'Risk Watch',
      riskEyebrow: 'Blocked, stale, or revenue-leaking work',
      risks: businessSnapshot.queue
        .filter((item) => item.status === 'blocked' || item.status === 'active')
        .map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.nextAction,
          status: item.status,
          meta: item.owner,
          accent: item.accent,
        })),
    }
  }

  if (!snapshot) {
    return null
  }

  return {
    title: 'Scavenjer Economy',
    eyebrow: 'Rewards, minting, partner proof',
    metrics: snapshot.economyMetrics,
    riskTitle: 'Risk Watch',
    riskEyebrow: 'Blocked, stale, or revenue-leaking work',
    risks: snapshot.missions
      .filter((mission) => mission.status === 'stale' || mission.status === 'blocked')
      .map((mission) => ({
        id: mission.id,
        title: mission.title,
        subtitle: mission.nextAction,
        status: mission.priority,
        meta: mission.status,
        accent: mission.accent,
      })),
  }
}

export const buildCommunityModel = (
  uiMode: WorkspaceContext,
  snapshot: CortexDashboardSnapshot | null,
  businessSnapshot: BusinessDashboardSnapshot | null,
) => {
  if (uiMode === 'business') {
    if (!businessSnapshot) {
      return null
    }

    return {
      title: 'Business Community Pulse',
      eyebrow: 'Clients, partners, referrals',
      cards: businessSnapshot.relationships.map((relationship) => ({
        id: relationship.id,
        title: relationship.name,
        body: relationship.summary,
        accent: relationship.accent,
        status: relationship.stage,
        meta: relationship.type,
        columns: [
          { label: 'Last Touch', value: relationship.lastTouch },
          { label: 'Next', value: relationship.nextTouch },
        ],
        footnotes: [{ label: 'Relationship', value: relationship.type }],
      })),
    }
  }

  if (!snapshot) {
    return null
  }

  return {
    title: 'Scavenjer Community Pulse',
    eyebrow: 'City votes, Discord, players, hosts',
    cards: snapshot.communitySignals.map((signal) => ({
      id: signal.id,
      title: signal.title,
      body: signal.blocked || signal.readyToShip || signal.staleReason,
      accent: signal.accent,
      status: signal.status,
      meta: signal.ownerLaneId,
      columns: [
        { label: 'Happened', value: signal.happened },
        { label: 'Now', value: signal.happeningNow },
      ],
      footnotes: [{ label: 'Approval', value: signal.approvalNeeded }],
    })),
  }
}

export const buildStudioModel = (
  uiMode: WorkspaceContext,
  snapshot: CortexDashboardSnapshot | null,
  businessSnapshot: BusinessDashboardSnapshot | null,
  focusedId?: string | null,
) => {
  if (uiMode === 'business') {
    if (!businessSnapshot) {
      return null
    }

    return {
      title: 'Business Studio',
      eyebrow: 'Proposals, decks, proof assets',
      focusedId,
      cards: businessSnapshot.sections
        .filter((section) => section.title === 'Studio' || section.title === 'Knowledge' || section.title === 'Economy')
        .map((section) => ({
          id: section.id,
          title: section.title,
          body: section.description,
          accent: section.accent,
          status: section.status,
          meta: section.route,
          footnotes: [
            { label: 'Approval', value: section.status === 'live' ? 'ready' : 'pending' },
            { label: 'Updated', value: businessSnapshot.system.lastUpdated },
          ],
        })),
    }
  }

  if (!snapshot) {
    return null
  }

  return {
    title: 'Broadcast Studio',
    eyebrow: 'Drops, recaps, Chronicles, partner proof',
    focusedId,
    cards: snapshot.studioAssets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      body: asset.brief,
      accent: asset.accent,
      status: asset.status,
      meta: asset.format,
      footnotes: [
        { label: 'Approval', value: asset.approvalState },
        { label: 'Updated', value: asset.updatedAt },
      ],
    })),
  }
}

export const buildIntegrationsModel = (
  uiMode: WorkspaceContext,
  snapshot: CortexDashboardSnapshot | null,
  businessSnapshot: BusinessDashboardSnapshot | null,
  focusedId?: string | null,
) => {
  if (uiMode === 'business') {
    if (!businessSnapshot) {
      return null
    }

    return {
      title: 'Business Integration Monitor',
      eyebrow: 'Inbox, calendar, CRM, docs, finance',
      focusedId,
      cards: businessSnapshot.sections.map((section) => ({
        id: section.id,
        title: section.title,
        body: section.description,
        accent: section.accent,
        status: section.status,
        meta: section.route,
        chips: ['trusted source', 'owner loop', 'automation-ready'],
        footnotes: [{ label: 'Action Required', value: section.status === 'live' ? 'None' : 'Review' }],
      })),
    }
  }

  if (!snapshot) {
    return null
  }

  return {
    title: 'Scavenjer Integration Monitor',
    eyebrow: 'Supabase, wallets, commerce, Discord',
    focusedId,
    cards: snapshot.integrationMonitors.map((monitor) => ({
      id: monitor.id,
      title: monitor.name,
      body: monitor.source,
      accent: monitor.accent,
      status: monitor.status,
      meta: monitor.freshness,
      chips: monitor.failureFlags,
      footnotes: [{ label: 'Action Required', value: monitor.actionRequired ?? 'None' }],
    })),
  }
}

export const buildWorkflowModels = (
  uiMode: WorkspaceContext,
  snapshot: CortexDashboardSnapshot | null,
  businessSnapshot: BusinessDashboardSnapshot | null,
): WorkspaceWorkflowModel[] => {
  if (uiMode === 'business') {
    if (!businessSnapshot) {
      return []
    }

    return businessSnapshot.sections.map((section) => ({
      id: section.id,
      title: `${section.title} Operating Loop`,
      description: section.description,
      toolsUsed: ['Owner context', 'Queue triage', 'Decision memory'],
      architecture: `Business ${section.title.toLowerCase()} context enters the owner queue, gets prioritized by the active ZiB, then ships as a concrete next action.`,
      updatedAt: businessSnapshot.system.lastUpdated,
      accent: section.accent,
      source: 'business',
      diagramPreviewUrl: null,
      diagramPreviewFileName: 'Business loop preview',
      diagramSourceFileName: 'Read-only business workflow',
      zipFileName: null,
    }))
  }

  return (snapshot?.workflows ?? []).map((workflow) => ({
    id: workflow.id,
    title: workflow.title,
    description: workflow.description,
    toolsUsed: workflow.toolsUsed,
    architecture: workflow.architecture,
    updatedAt: workflow.updatedAt,
    accent: workflow.accent,
    source: 'cortex',
    diagramPreviewUrl: workflow.diagramPreview.previewUrl,
    diagramPreviewFileName: workflow.diagramPreview.fileName,
    diagramSourceFileName: workflow.diagramSource.fileName,
    zipFileName: workflow.zipAsset?.fileName ?? null,
  }))
}

export const getCommandSet = (commands: CortexCommand[], scope?: CortexCommand['scope']) =>
  scope ? commands.filter((command) => command.scope === scope) : commands
