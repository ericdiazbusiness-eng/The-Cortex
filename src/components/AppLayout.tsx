import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatedBackground } from './AnimatedBackground'
import { useCortex } from '@/hooks/useCortex'
import { getModeContent, getPageMeta } from '@/lib/ui-mode'
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
    realtimeMode,
    setRealtimeMode,
    uiFocus,
    uiMode,
    setViewContext,
    toggleUiMode,
  } = useCortex()
  const content = getModeContent(uiMode)
  const isOverview = location.pathname === '/'
  const currentRoute = location.pathname as CortexRoute

  useEffect(() => {
    const pageMeta = getPageMeta(uiMode, currentRoute)
    setViewContext({
      route: currentRoute,
      routeTitle: pageMeta.title,
      routeSubtitle: pageMeta.subtitle,
      uiMode,
      details: {},
    })
  }, [currentRoute, setViewContext, uiMode])

  useEffect(() => {
    if (uiFocus.route && uiFocus.route !== location.pathname) {
      navigate(uiFocus.route)
    }
  }, [location.pathname, navigate, uiFocus.revision, uiFocus.route])

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
      data-background-scope={isOverview ? 'overview' : 'page'}
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
            <span className="brand-mark">The Cortex</span>
          </div>

          <div className="top-bar-status">
            <div className="status-chip status-chip-empty" aria-label="Active Priorities pending agent updates">
              <span>Active Priorities</span>
              <span className="status-chip-indicator" aria-hidden="true" />
            </div>
            <div className="status-chip status-chip-empty" aria-label="Urgent Items pending agent updates">
              <span>Urgent Items</span>
              <span className="status-chip-indicator" aria-hidden="true" />
            </div>
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
              aria-label="Toggle theme mode"
              aria-pressed={uiMode === 'business'}
            >
              <span className="mode-slider-track" aria-hidden="true">
                <span className="mode-slider-thumb" />
              </span>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
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

      <nav className="bottom-dock" aria-label="Main navigation">
        <div className="dock-glass">
          {content.nav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `dock-item${isActive ? ' is-active' : ''}`}
              aria-label={item.label}
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
