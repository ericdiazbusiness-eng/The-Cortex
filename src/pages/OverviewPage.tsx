import { useEffect } from 'react'
import { CoreMind } from '@/components/CoreMind'
import { OverviewUsageRings } from '@/components/OverviewUsageRings'
import { useCortex } from '@/hooks/useCortex'

export const OverviewPage = () => {
  const { realtime, setViewContext, snapshot, toggleRealtimeVoice, uiMode } = useCortex()

  useEffect(() => {
    if (!snapshot) {
      return
    }

    setViewContext({
      details: {
        neuralLoad: snapshot.system.neuralLoad,
        signalCoherence: snapshot.system.signalCoherence,
        activeNodes: snapshot.system.activeNodes,
      },
    })
  }, [
    setViewContext,
    snapshot,
    snapshot?.system.activeNodes,
    snapshot?.system.neuralLoad,
    snapshot?.system.signalCoherence,
  ])

  if (!snapshot) {
    return null
  }

  return (
    <div className="overview-brain-only">
      <div className="overview-hud">
        <OverviewUsageRings uiMode={uiMode} />
        <CoreMind
          onToggle={toggleRealtimeVoice}
          realtimeState={realtime}
          uiMode={uiMode}
        />
      </div>
    </div>
  )
}
