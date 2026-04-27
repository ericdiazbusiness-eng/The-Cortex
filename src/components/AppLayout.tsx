import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatedBackground } from './AnimatedBackground'
import { useCortex } from '@/hooks/useCortex'
import {
  getModeContent,
  getPageMeta,
  getWorkspaceHomeRoute,
  normalizeLegacyRoute,
} from '@/lib/ui-mode'
import {
  getRealtimeModeProfile,
  getVisibleRealtimeModes,
  type CortexRealtimeMode,
  type CortexRoute,
} from '@/shared/cortex'

const MODE_FLASH_LABELS: Record<CortexRealtimeMode, string> = {
  premium_voice: 'PRIME',
  neural_voice: 'NEURAL',
  lean_voice: 'ECO',
  tool_voice: 'VECTOR',
  ui_director: 'GUIDE',
}

const MODE_FLASH_MS = 900

export const AppLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const modeFlashTickRef = useRef(0)
  const [modeFlash, setModeFlash] = useState<{
    mode: CortexRealtimeMode
    label: string
    tick: number
  } | null>(null)
  const modeFlashTimeoutRef = useRef<number | null>(null)
  const {
    navigateUi,
    realtimeMode,
    setRealtimeMode,
    snapshot,
    businessSnapshot,
    syncUiRoute,
    uiFocus,
    uiMode,
    setViewContext,
    toggleUiMode,
  } = useCortex()
  const content = getModeContent(uiMode)
  const currentRoute = normalizeLegacyRoute(location.pathname) as CortexRoute
  const isOverview = currentRoute === '/cortex' || currentRoute === '/business'
  const statusChips =
    uiMode === 'business'
      ? [
          {
            label: 'Open Relationships',
            value: businessSnapshot?.relationships.length ?? 0,
          },
          {
            label: 'Queued Actions',
            value: businessSnapshot?.queue.filter((item) => item.status !== 'ready').length ?? 0,
          },
          {
            label: 'Active Sections',
            value: businessSnapshot?.sections.length ?? 0,
          },
        ]
      : [
          {
            label: 'Approvals Needed',
            value: snapshot?.approvals.filter((approval) => approval.state === 'pending').length ?? 0,
          },
          {
            label: 'Blocked Missions',
            value: snapshot?.missions.filter((mission) => mission.status === 'blocked').length ?? 0,
          },
          {
            label: 'Live Drops',
            value: snapshot?.drops.filter((drop) => drop.status === 'live').length ?? 0,
          },
        ]

  useEffect(() => {
    const pageMeta = getPageMeta(uiMode, currentRoute)
    setViewContext({
      route: currentRoute,
      routeTitle: pageMeta.title,
      routeSubtitle: pageMeta.subtitle,
      workspace: uiMode,
      details: {},
    })
  }, [currentRoute, setViewContext, uiMode])

  useEffect(() => {
    syncUiRoute(currentRoute)
  }, [currentRoute, syncUiRoute])

  useEffect(() => {
    if (uiFocus.revision > 0 && uiFocus.route && uiFocus.route !== currentRoute) {
      navigate(uiFocus.route)
    }
  }, [currentRoute, navigate, uiFocus.revision, uiFocus.route])

  useEffect(() => {
    return () => {
      if (modeFlashTimeoutRef.current !== null) {
        window.clearTimeout(modeFlashTimeoutRef.current)
      }
    }
  }, [])

  const triggerModeFlash = (mode: CortexRealtimeMode) => {
    if (modeFlashTimeoutRef.current !== null) {
      window.clearTimeout(modeFlashTimeoutRef.current)
    }

    setModeFlash({
      mode,
      label: MODE_FLASH_LABELS[mode],
      tick: (modeFlashTickRef.current += 1),
    })

    modeFlashTimeoutRef.current = window.setTimeout(() => {
      setModeFlash((current) => (current?.mode === mode ? null : current))
      modeFlashTimeoutRef.current = null
    }, MODE_FLASH_MS)
  }

  const handleRealtimeModeSelect = (mode: CortexRealtimeMode) => {
    setRealtimeMode(mode)
    triggerModeFlash(mode)
  }

  return (
    <div
      className="app-shell"
      data-mode={uiMode}
      data-route={currentRoute}
      data-background-scope={isOverview ? 'overview' : 'page'}
      data-active-scene={isOverview ? 'overview' : 'route'}
    >
      {isOverview ? (
        <AnimatedBackground mode={uiMode} />
      ) : (
        <div className="page-backdrop-static" aria-hidden="true" />
      )}

      <div className="content-shell">
        {modeFlash ? (
          <div
            className="realtime-mode-flash-shell"
            aria-live="polite"
          >
            <span
              key={`${modeFlash.mode}-${modeFlash.tick}`}
              className={`realtime-mode-flash realtime-mode-flash-${getRealtimeModeProfile(modeFlash.mode).color}`}
            >
              {modeFlash.label}
            </span>
          </div>
        ) : null}

        <header className="top-bar">
          <div className="top-bar-left">
            <span className="brand-mark">{uiMode === 'business' ? 'Business OS' : 'The Cortex'}</span>
          </div>

          <div className="top-bar-status">
            {statusChips.map((chip) => (
              <div key={chip.label} className="status-chip" aria-label={`${chip.value} ${chip.label.toLowerCase()}`}>
                <span>{chip.label}</span>
                <strong className="status-chip-value">{chip.value}</strong>
              </div>
            ))}
            <div className="realtime-mode-strip" role="radiogroup" aria-label="Realtime mode">
              {getVisibleRealtimeModes().map((mode) => {
                const profile = getRealtimeModeProfile(mode)

                return (
                  <button
                    key={profile.id}
                    type="button"
                    role="radio"
                    aria-label={profile.ariaLabel}
                    aria-checked={realtimeMode === profile.id}
                    className={`realtime-mode-toggle realtime-mode-toggle-${profile.color}${
                      realtimeMode === profile.id ? ' is-active' : ''
                    }`}
                    onClick={() => handleRealtimeModeSelect(profile.id)}
                  >
                    <span
                      aria-hidden="true"
                      className="realtime-mode-glyph"
                      data-glyph={profile.glyph}
                    />
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              className={`mode-slider${uiMode === 'business' ? ' is-active' : ''}`}
              onClick={toggleUiMode}
              aria-label="Toggle workspace context"
              aria-pressed={uiMode === 'business'}
            >
              <span className="mode-slider-track" aria-hidden="true">
                <span className="mode-slider-thumb" />
              </span>
            </button>
          </div>
        </header>

        <div
          className={`page-viewport${isOverview ? ' page-viewport-overview' : ''}`}
          data-scene-runtime={isOverview ? 'overview' : 'route'}
        >
          <AnimatePresence mode="wait">
            <motion.main
              key={`${uiMode}:${location.pathname}`}
              className={`page-shell${isOverview ? ' page-shell-overview' : ''}`}
              initial={isOverview ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={isOverview ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={isOverview ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: isOverview ? 0.22 : 0.35, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      <nav className="bottom-dock" aria-label="Main navigation">
        <div className="dock-glass">
          {content.nav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === getWorkspaceHomeRoute(uiMode)}
              className={({ isActive }) => `dock-item${isActive ? ' is-active' : ''}`}
              aria-label={item.label}
              onClick={() => navigateUi(item.path as CortexRoute)}
            >
              {({ isActive }) => (
                <>
                  <span className="dock-icon">{item.icon}</span>
                  <span className={`dock-active-label${isActive ? ' is-visible' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
