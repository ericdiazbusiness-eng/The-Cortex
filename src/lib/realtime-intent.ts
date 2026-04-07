import {
  CORTEX_EXECUTION_TOOL_NAMES,
  CORTEX_UI_ACTION_TOOL_NAMES,
} from '@/shared/cortex'

const EXPLICIT_UI_NAVIGATION_PATTERN =
  /\b(show|open|display|reveal|highlight|focus|go to|goto|navigate|take me to|bring up)\b/i

const EXPLICIT_EXECUTION_PATTERN =
  /\b(run|execute|trigger|start|stop|restart|refresh|sync|pause|resume)\b/i

export const isUiActionToolName = (toolName: string) =>
  CORTEX_UI_ACTION_TOOL_NAMES.includes(
    toolName as (typeof CORTEX_UI_ACTION_TOOL_NAMES)[number],
  )

export const isExecutionToolName = (toolName: string) =>
  CORTEX_EXECUTION_TOOL_NAMES.includes(
    toolName as (typeof CORTEX_EXECUTION_TOOL_NAMES)[number],
  )

export const hasExplicitUiNavigationIntent = (transcript: string | null | undefined) =>
  typeof transcript === 'string' && EXPLICIT_UI_NAVIGATION_PATTERN.test(transcript)

export const hasExplicitExecutionIntent = (transcript: string | null | undefined) =>
  typeof transcript === 'string' && EXPLICIT_EXECUTION_PATTERN.test(transcript)
