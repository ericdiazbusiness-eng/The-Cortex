import { CoreMind } from './CoreMind'
import type { UiMode } from '@/lib/ui-mode'
import type { CortexRealtimeState } from '@/shared/cortex'

export const NeurobrainVoiceControl = ({
  onToggle,
  realtimeState,
  uiMode,
}: {
  onToggle: () => Promise<void>
  realtimeState: CortexRealtimeState
  uiMode: UiMode
}) => (
  <CoreMind
    onToggle={onToggle}
    realtimeState={realtimeState}
    uiMode={uiMode}
  />
)
