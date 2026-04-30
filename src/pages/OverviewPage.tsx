import { useEffect } from 'react'
import { NeurobrainVoiceControl } from '@/components/NeurobrainVoiceControl'
import { OverviewUsageRings } from '@/components/OverviewUsageRings'
import { useCortex } from '@/hooks/useCortex'
import { DEFAULT_GATEWAY_STATE } from '@/shared/cortex'

export const OverviewPage = () => {
  const { businessSnapshot, realtime, setViewContext, snapshot, toggleRealtimeVoice, uiMode } = useCortex()

  useEffect(() => {
    if (uiMode === 'business') {
      if (!businessSnapshot) {
        return
      }

      setViewContext({
        details: {
          relationships: businessSnapshot.relationships.length,
          queueItems: businessSnapshot.queue.length,
          sections: businessSnapshot.sections.length,
        },
      })
      return
    }

    if (!snapshot) {
      return
    }

    const gateway = snapshot.gateway ?? DEFAULT_GATEWAY_STATE

    setViewContext({
      details: {
        missionCount: snapshot.missions.length,
        blockedMissions: snapshot.missions.filter((mission) => mission.status === 'blocked').length,
        activeAgents: snapshot.agentLanes.filter((lane) => lane.status === 'active').length,
        approvalsNeeded: snapshot.approvals.filter((approval) => approval.state === 'pending').length,
        liveDrops: snapshot.drops.filter((drop) => drop.status === 'live').length,
        gatewayStatus: gateway.status,
        gatewayProcessName: gateway.processName,
      },
    })
  }, [
    businessSnapshot,
    setViewContext,
    snapshot,
    snapshot?.gateway?.processName,
    snapshot?.gateway?.status,
    snapshot?.system.activeNodes,
    snapshot?.system.neuralLoad,
    snapshot?.system.signalCoherence,
    uiMode,
  ])

  if (uiMode === 'business') {
    if (!businessSnapshot) {
      return null
    }

    return (
      <div className="overview-brain-only">
        <div className="overview-center-stage">
          <NeurobrainVoiceControl
            onToggle={toggleRealtimeVoice}
            realtimeState={realtime}
            uiMode={uiMode}
          />
        </div>
      </div>
    )
  }

  if (!snapshot) {
    return null
  }

  const gateway = snapshot.gateway ?? DEFAULT_GATEWAY_STATE

  return (
    <div className="overview-brain-only">
      <div className="overview-top-layer">
        <OverviewUsageRings uiMode={uiMode} snapshot={snapshot} gateway={gateway} />
      </div>
      <div className="overview-center-stage">
        <NeurobrainVoiceControl
          onToggle={toggleRealtimeVoice}
          realtimeState={realtime}
          uiMode={uiMode}
        />
      </div>
    </div>
  )
}
