import { DEFAULT_FALLBACK_DATA, type CortexDashboardSnapshot } from '@/shared/cortex'

const sameIdSet = <T extends { id: string }>(left: T[], right: T[]) =>
  left.length === right.length && left.every((entry, index) => entry.id === right[index]?.id)

export const isFallbackSnapshot = (snapshot: CortexDashboardSnapshot) =>
  sameIdSet(snapshot.missions, DEFAULT_FALLBACK_DATA.missions) &&
  sameIdSet(snapshot.agentLanes, DEFAULT_FALLBACK_DATA.agentLanes) &&
  sameIdSet(snapshot.vaultEntries, DEFAULT_FALLBACK_DATA.vaultEntries) &&
  sameIdSet(snapshot.auditEvents, DEFAULT_FALLBACK_DATA.auditEvents)

export const hasLiveDashboardData = (snapshot: CortexDashboardSnapshot | null) =>
  snapshot !== null && !isFallbackSnapshot(snapshot)
