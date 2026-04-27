import { useEffect } from 'react'
import { NeurobrainVoiceControl } from '@/components/NeurobrainVoiceControl'
import { useCortex } from '@/hooks/useCortex'

export const BusinessOverviewPage = () => {
  const {
    businessSnapshot,
    realtime,
    setViewContext,
    toggleRealtimeVoice,
    uiMode,
  } = useCortex()

  useEffect(() => {
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
  }, [businessSnapshot, setViewContext])

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
