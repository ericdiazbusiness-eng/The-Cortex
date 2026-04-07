import {
  hasExplicitExecutionIntent,
  hasExplicitUiNavigationIntent,
  isExecutionToolName,
  isUiActionToolName,
} from './realtime-intent'

describe('realtime intent helpers', () => {
  it('detects explicit UI-navigation language', () => {
    expect(hasExplicitUiNavigationIntent('Show me the queue depth card.')).toBe(true)
    expect(hasExplicitUiNavigationIntent('Open the memories page.')).toBe(true)
    expect(hasExplicitUiNavigationIntent('What is queue depth right now?')).toBe(false)
  })

  it('detects explicit execution language', () => {
    expect(hasExplicitExecutionIntent('Run the ops sync command.')).toBe(true)
    expect(hasExplicitExecutionIntent('Restart that process.')).toBe(true)
    expect(hasExplicitExecutionIntent('What command would help here?')).toBe(false)
  })

  it('classifies tool names by architecture group', () => {
    expect(isUiActionToolName('focus_system_metric')).toBe(true)
    expect(isUiActionToolName('get_system_metrics')).toBe(false)
    expect(isExecutionToolName('run_command')).toBe(true)
    expect(isExecutionToolName('navigate_ui')).toBe(false)
  })
})
