import type {
  AccentTone,
  BusinessDashboardSnapshot,
  CortexCommand,
  CortexDashboardSnapshot,
  CortexLoreAtlas,
  CortexWorkflowGraph,
  CortexRoute,
  WorkspaceContext,
} from '@/shared/cortex'
import { SCAVENJER_LORE_ATLAS } from '@/data/scavenjer-lore'

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
  diagramGraph?: CortexWorkflowGraph | null
  updatedAt: string
  accent: AccentTone
  source: 'cortex' | 'business'
  diagramPreviewUrl?: string | null
  diagramPreviewFileName?: string
  diagramSourceFileName?: string
  zipFileName?: string | null
}

export type KnowledgeSourceChip =
  | 'Notion'
  | 'scavenjer.com'
  | 'NeoMarket'
  | 'Simulations'
  | 'Cortex'

export type CortexKnowledgeEntryModel = {
  id: string
  title: string
  summary: string
  status: string
  meta: string
  accent: AccentTone
  sources: KnowledgeSourceChip[]
  points: string[]
}

export type CortexKnowledgeCategoryModel = {
  id: string
  title: string
  eyebrow: string
  summary: string
  accent: AccentTone
  entries: CortexKnowledgeEntryModel[]
}

export type CortexKnowledgeStatModel = {
  id: string
  label: string
  value: string
  detail: string
  accent: AccentTone
}

export type CortexKnowledgeWatchModel = {
  id: string
  title: string
  summary: string
  status: string
  accent: AccentTone
  sources: KnowledgeSourceChip[]
}

export type CortexKnowledgeModel = {
  kind: 'cortex'
  title: string
  eyebrow: string
  summary: string
  stats: CortexKnowledgeStatModel[]
  sourceClusters: KnowledgeSourceChip[]
  canonicalVaultEntries: number
  categories: CortexKnowledgeCategoryModel[]
  watchTitle: string
  watchEyebrow: string
  watchItems: CortexKnowledgeWatchModel[]
  loreAtlas: CortexLoreAtlas
}

export type BusinessKnowledgeModel = {
  kind: 'business'
  title: string
  eyebrow: string
  cards: WorkspaceCardModel[]
  focusedCard: WorkspaceCardModel | null
  detailTitle: string
  detailEyebrow: string
  supportTitle: string
  supportEyebrow: string
  supportItems: WorkspaceListModel[]
}

export type KnowledgeModel = CortexKnowledgeModel | BusinessKnowledgeModel

export const getWorkspaceRoute = (
  uiMode: WorkspaceContext,
  page: Exclude<CortexRoute, '/' | '/cortex' | '/business'>,
) => (uiMode === 'business' ? page.replace('/cortex', '/business') : page) as CortexRoute

const CORTEX_KNOWLEDGE_SOURCES: KnowledgeSourceChip[] = [
  'Notion',
  'scavenjer.com',
  'NeoMarket',
  'Simulations',
  'Cortex',
]

const buildCortexKnowledgeCategories = (): CortexKnowledgeCategoryModel[] => [
  {
    id: 'core-ecosystem',
    title: 'Core Ecosystem',
    eyebrow: 'Platform thesis',
    summary:
      'Scavenjer is the connective layer between real-world hunts, digital ownership, creative IP, and partner value.',
    accent: 'cyan',
    entries: [
      {
        id: 'cross-media-platform',
        title: 'Cross-media AR platform',
        summary:
          'A cyberpunk AR, blockchain, and original IP ecosystem designed to make physical exploration part of games, commerce, and media.',
        status: 'canonical',
        meta: 'strategy',
        accent: 'cyan',
        sources: ['Notion', 'scavenjer.com', 'Cortex'],
        points: [
          'Real-world exploration anchors the player loop.',
          'Digital assets carry ownership, access, and future game utility.',
          'Scavenjer Studios gives the product a story and media engine.',
        ],
      },
      {
        id: 'complete-integration-loop',
        title: 'Complete integration loop',
        summary:
          'The long-term product direction is a daily loop: collect outside, use assets in games or commerce, watch the story, then re-enter the world.',
        status: 'vision',
        meta: 'north star',
        accent: 'green',
        sources: ['Notion', 'Simulations', 'Cortex'],
        points: [
          'AR hunts create the source event.',
          'Marketplace, games, and media reuse the same assets.',
          'Community participation should feed the next drop or story beat.',
        ],
      },
    ],
  },
  {
    id: 'drops-field-ops',
    title: 'Drops & Field Ops',
    eyebrow: 'Live gameplay',
    summary:
      'Drops convert locations into time-sensitive challenges with city voting, registration thresholds, rewards, and field proof.',
    accent: 'amber',
    entries: [
      {
        id: 'marbleverse-ar-drops',
        title: 'Marbleverse AR drops',
        summary:
          'Players use Marbleverse to find AR marbles or game-area assets tied to real locations, countdowns, rewards, and competitors.',
        status: 'active',
        meta: 'field loop',
        accent: 'amber',
        sources: ['scavenjer.com', 'Notion', 'Cortex'],
        points: [
          'Drops can hold media, links, blockchain assets, or reward claims.',
          'Registration and countdown state shape when a drop goes live.',
          'Location checks, QR scans, and evidence protect claim quality.',
        ],
      },
      {
        id: 'city-voting-requests',
        title: 'City voting and drop requests',
        summary:
          'Eko-aware users can request drops, vote on cities and time slots, then route approved events through Discord and site notifications.',
        status: 'mapped',
        meta: 'request system',
        accent: 'green',
        sources: ['Notion', 'scavenjer.com', 'Cortex'],
        points: [
          'City votes indicate demand before scheduling field work.',
          'Weekend time slots keep registration-to-live timing predictable.',
          'Discord alerts and admin approvals close the operations loop.',
        ],
      },
    ],
  },
  {
    id: 'ekos-identity',
    title: 'Ekos & Identity',
    eyebrow: 'Access layer',
    summary:
      'Ekos and profile identity turn users into known Scavenjers with access, voting power, avatars, and segment-aware experiences.',
    accent: 'magenta',
    entries: [
      {
        id: 'eko-utility-layer',
        title: 'Eko utility layer',
        summary:
          'Ekos are the flagship collectible for access, avatar identity, city voting, requested drops, and Dark Circuit rewards.',
        status: 'canonical',
        meta: 'NFT utility',
        accent: 'magenta',
        sources: ['Notion', 'scavenjer.com', 'NeoMarket', 'Cortex'],
        points: [
          'Holders vote on cities, drops, music/video decisions, and creative direction.',
          'Eko checks gate premium game areas and certain reward flows.',
          'Dark Circuit rewards rotate around owned or featured Ekos.',
        ],
      },
      {
        id: 'scavenjer-types',
        title: 'Scavenjer Types',
        summary:
          'Profiles segment players into Pop Gs, The Family, The Futurists, The Foodies, The Hidden, and The Health-Minded.',
        status: 'stable',
        meta: 'profile choice',
        accent: 'cyan',
        sources: ['scavenjer.com', 'Cortex'],
        points: [
          'Type selection gives community content a cleaner audience map.',
          'Segments can guide campaigns, support prompts, and reward themes.',
          'The choice is identity-first and should stay lightweight in UI.',
        ],
      },
    ],
  },
  {
    id: 'business-rewards',
    title: 'Business & Rewards',
    eyebrow: 'Partner value',
    summary:
      'Scavenjer turns businesses into playable destinations and ties reward inventory to measurable attention, visits, and recap content.',
    accent: 'green',
    entries: [
      {
        id: 'partner-drop-promise',
        title: 'Partner drop promise',
        summary:
          'Businesses sponsor or host drops to earn foot traffic, guaranteed exposure, social recaps, and conversion evidence.',
        status: 'offer',
        meta: 'B2B',
        accent: 'green',
        sources: ['scavenjer.com', 'Notion', 'Cortex'],
        points: [
          'Locations become the destination instead of buying passive ads.',
          'Rewards can be products, services, gift cards, or sponsor prizes.',
          'Partner recaps should prove reach, engagement, and redemption value.',
        ],
      },
      {
        id: 'support-shop-rewards',
        title: 'Support shop and reward supply',
        summary:
          'The support shop connects purchases, collectible fulfillment, and local-business support with the broader reward economy.',
        status: 'live path',
        meta: 'commerce',
        accent: 'amber',
        sources: ['scavenjer.com', 'Cortex'],
        points: [
          'Stripe checkout can fund collectible and reward inventory.',
          'Shop items should reinforce the real-world game, not sit apart from it.',
          'Fulfillment context belongs in mint and support queues.',
        ],
      },
    ],
  },
  {
    id: 'marketplace-economy',
    title: 'Marketplace & Economy',
    eyebrow: 'Ownership rails',
    summary:
      'NeoMarket, Nexus voting, Axium, and reward exchanges are the economic surfaces around owned Scavenjer assets.',
    accent: 'cyan',
    entries: [
      {
        id: 'neomarket-exchange',
        title: 'NeoMarket exchange',
        summary:
          'NeoMarket hosts Eko exploration, collections, listings, buying, selling, user-owned Ekos, auctions, and activity history.',
        status: 'active',
        meta: 'marketplace',
        accent: 'cyan',
        sources: ['NeoMarket', 'Cortex'],
        points: [
          'Exchange listings enrich NFTs with price, seller, traits, and collection data.',
          'Collection pages keep Scavenjers and Eko inventory browsable.',
          'Burn/exchange reward paths need admin visibility before large pushes.',
        ],
      },
      {
        id: 'nexus-axium',
        title: 'Nexus and Axium utility',
        summary:
          'Nexus gives Eko holders proposal voting while Axium is framed as utility for rewards, marketplace transactions, staking, and ecosystem growth.',
        status: 'planned rails',
        meta: 'governance',
        accent: 'magenta',
        sources: ['NeoMarket', 'Notion', 'Cortex'],
        points: [
          'Proposal categories cover music, gaming, city voting, and creative content.',
          'Axium messaging should focus on utility, access, and progress.',
          'No price or profit claims should appear in operational UI.',
        ],
      },
    ],
  },
  {
    id: 'simulations-lore',
    title: 'Simulations & Lore',
    eyebrow: 'Story engine',
    summary:
      'Simulations, Codex entries, Chronicles, and studio output organize the narrative universe behind the drops.',
    accent: 'magenta',
    entries: [
      {
        id: 'simulation-codex',
        title: 'Simulation map and Codex',
        summary:
          'The Simulations app models universes, locations, characters, factions, artifacts, events, relationships, and unlock states.',
        status: 'mapped',
        meta: 'lore data',
        accent: 'magenta',
        sources: ['Simulations', 'Notion', 'Cortex'],
        points: [
          'Codex types include characters, factions, simulations, artifacts, and events.',
          'Locations can carry inhabitants, factions, resources, threat, and access rules.',
          'Locked sections preserve reveal pacing for story and gameplay.',
        ],
      },
      {
        id: 'studios-chronicles',
        title: 'Scavenjer Studios and Chronicles',
        summary:
          'Studios produces music, trailers, short films, anime, manga, comics, and Chronicles content that reveals events and lore.',
        status: 'creative lane',
        meta: 'media',
        accent: 'green',
        sources: ['Notion', 'scavenjer.com', 'Simulations'],
        points: [
          'Content should bridge live AR gameplay and the broader universe.',
          'Community votes can influence tracks, videos, films, and lore direction.',
          'Micro-stories and creator contests are useful first-format candidates.',
        ],
      },
    ],
  },
  {
    id: 'infrastructure-admin',
    title: 'Infrastructure & Admin',
    eyebrow: 'Operating system',
    summary:
      'The admin and integration layer keeps profiles, drops, commerce, Discord, wallets, and source truth reliable enough for live operations.',
    accent: 'amber',
    entries: [
      {
        id: 'admin-entities',
        title: 'Admin operating entities',
        summary:
          'Admin modules manage members, hosts, game modes, city events, assets, drops, requests, collections, mint jobs, presale, and image library records.',
        status: 'mapped',
        meta: 'Supabase',
        accent: 'amber',
        sources: ['scavenjer.com', 'Cortex'],
        points: [
          'DropOps needs clean control over city events, assets, drops, and requests.',
          'Commerce needs visibility into mint jobs and collection tracking.',
          'Image and game-area libraries support faster field setup.',
        ],
      },
      {
        id: 'integration-reliability',
        title: 'Integration reliability',
        summary:
          'The operating stack spans Supabase, Thirdweb, SIWE wallet linking, Discord webhooks, Crossmint, Stripe, and Marbleverse Connect.',
        status: 'watch',
        meta: 'systems',
        accent: 'cyan',
        sources: ['scavenjer.com', 'NeoMarket', 'Simulations', 'Cortex'],
        points: [
          'Thirdweb powers wallet auth, ownership checks, and contract reads.',
          'Discord routes announcements, admin notifications, and drop alerts.',
          'Crossmint, Stripe, and mint queues are trust-critical commerce paths.',
        ],
      },
    ],
  },
]

const buildCortexWatchItems = (): CortexKnowledgeWatchModel[] => [
  {
    id: 'subdomain-routing',
    title: 'Subdomain routing',
    summary:
      'The named Simulations and Marketplace subdomains did not resolve in this environment; the main site currently routes Simulations to the Vercel app and marketplace traffic to NeoMarket paths.',
    status: 'route watch',
    accent: 'amber',
    sources: ['scavenjer.com', 'NeoMarket', 'Simulations'],
  },
  {
    id: 'mint-reward-queue',
    title: 'Mint and reward queues',
    summary:
      'Commerce and reward exchange queues should be reviewed before Eko pushes, support-shop campaigns, or high-visibility partner drops.',
    status: 'ops watch',
    accent: 'amber',
    sources: ['NeoMarket', 'Cortex'],
  },
  {
    id: 'contest-guardrails',
    title: 'Contest guardrails',
    summary:
      'Paid or sponsored hunts need clear rules, skill-based framing, eligibility, safety, privacy, and prize fulfillment language before launch.',
    status: 'policy watch',
    accent: 'red',
    sources: ['Notion', 'Cortex'],
  },
  {
    id: 'read-only-source-adapter',
    title: 'Read-only source adapter',
    summary:
      'This page uses curated source truth today; a later adapter can connect live Scavenjer Supabase records without changing this compact index layout.',
    status: 'future adapter',
    accent: 'cyan',
    sources: ['Cortex', 'scavenjer.com'],
  },
]

export const buildKnowledgeModel = (
  uiMode: WorkspaceContext,
  snapshot: CortexDashboardSnapshot | null,
  businessSnapshot: BusinessDashboardSnapshot | null,
  focusedId?: string | null,
): KnowledgeModel | null => {
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
      kind: 'business',
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

  const categories = buildCortexKnowledgeCategories()
  const watchItems = buildCortexWatchItems()
  const loreAtlas = SCAVENJER_LORE_ATLAS
  const loreAtlasRecordCount =
    loreAtlas.loreUniverses.length +
    loreAtlas.loreCharacters.length +
    loreAtlas.loreEnvironments.length +
    loreAtlas.loreFactions.length +
    loreAtlas.loreArtifacts.length
  const canonicalVaultEntries = snapshot.vaultEntries.filter((entry) => entry.canonical).length
  const knowledgeEntries = categories.reduce((total, category) => total + category.entries.length, 0)

  return {
    kind: 'cortex',
    title: 'Scavenjer Knowledge Index',
    eyebrow: 'Compact source truth across Notion, site, marketplace, simulations, and Cortex',
    summary:
      'A categorized working map of what Scavenjer is, how the player loop works, what powers the economy, and which source areas need operational attention.',
    stats: [
      {
        id: 'knowledge-categories',
        label: 'Categories',
        value: String(categories.length),
        detail: 'Core source areas',
        accent: 'cyan',
      },
      {
        id: 'knowledge-entries',
        label: 'Entries',
        value: String(knowledgeEntries),
        detail: 'Curated index rows',
        accent: 'green',
      },
      {
        id: 'knowledge-sources',
        label: 'Sources',
        value: String(CORTEX_KNOWLEDGE_SOURCES.length),
        detail: 'Quiet provenance chips',
        accent: 'magenta',
      },
      {
        id: 'canonical-vault',
        label: 'Vault',
        value: `${canonicalVaultEntries}/${snapshot.vaultEntries.length}`,
        detail: 'Canonical Cortex entries',
        accent: 'amber',
      },
      {
        id: 'lore-nodes',
        label: 'Lore',
        value: String(loreAtlasRecordCount),
        detail: 'Structured atlas records',
        accent: 'magenta',
      },
      {
        id: 'integration-watch',
        label: 'Systems',
        value: String(snapshot.integrationMonitors.length),
        detail: 'Integration monitors',
        accent: 'cyan',
      },
    ],
    sourceClusters: CORTEX_KNOWLEDGE_SOURCES,
    canonicalVaultEntries,
    categories,
    watchTitle: 'Watch Items',
    watchEyebrow: 'Known routing, policy, and reliability follow-ups',
    watchItems,
    loreAtlas,
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
      diagramGraph: null,
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
    diagramGraph: workflow.diagramGraph ?? null,
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
