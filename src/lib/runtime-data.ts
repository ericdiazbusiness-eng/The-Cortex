import { DEFAULT_FALLBACK_DATA, type CortexDashboardSnapshot } from '@/shared/cortex'

const sameIdSet = <T extends { id: string }>(left: T[], right: T[]) =>
  left.length === right.length && left.every((entry, index) => entry.id === right[index]?.id)

export const isFallbackSnapshot = (snapshot: CortexDashboardSnapshot) =>
  sameIdSet(snapshot.agents, DEFAULT_FALLBACK_DATA.agents) &&
  sameIdSet(snapshot.memories, DEFAULT_FALLBACK_DATA.memories) &&
  sameIdSet(snapshot.jobs, DEFAULT_FALLBACK_DATA.jobs) &&
  sameIdSet(snapshot.logs, DEFAULT_FALLBACK_DATA.logs)

export const hasLiveDashboardData = (snapshot: CortexDashboardSnapshot | null) =>
  snapshot !== null && !isFallbackSnapshot(snapshot)
