import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useCortex } from '@/hooks/useCortex'
import {
  BUSINESS_ROLE_DESCRIPTIONS,
  BUSINESS_ZIB_PROFILES,
  SCAVENJER_ROLE_DESCRIPTIONS,
  SCAVENJER_XYLOS_PROFILES,
  ZIB_ROLE_ORDER,
  type ZibPlaceholder,
  type ZibRoleGroup,
} from '@/lib/zib-profiles'

import './ZibzPage.css'

type ZibWorkspaceSection = 'missions' | 'context' | 'memory' | 'outputs'
type ZibReadiness = 'Ready' | 'Active' | 'Queueing' | 'Synced' | 'Idle'

type WorkspaceSectionCopy = {
  label: string
  eyebrow: string
  title: string
  description: string
  notes: string[]
}

type RoleCardCopy = {
  icon: string
  title: ZibRoleGroup
  description: string
  accent: string
  secondary: string
  tertiary: string
}

const WORKSPACE_SECTIONS: Record<ZibWorkspaceSection, WorkspaceSectionCopy> = {
  missions: {
    label: 'Missions',
    eyebrow: 'Selection queue',
    title: 'Autonomous work stack',
    description:
      'The selected ZiB owns the next queue of decisions, approvals, and action loops for this role.',
    notes: ['Priority queue', 'Approval dependency', 'Measurable outcome'],
  },
  context: {
    label: 'Context',
    eyebrow: 'Runtime surface',
    title: 'Operating context',
    description:
      'Current state, source material, blockers, and fresh signals stay attached to this ZiB lane.',
    notes: ['Current status', 'Source context', 'Recent changes'],
  },
  memory: {
    label: 'Memory',
    eyebrow: 'Knowledge surface',
    title: 'Decision memory',
    description:
      'Persistent references, reusable decisions, relationship details, and operating doctrine for this role.',
    notes: ['Reference shelf', 'Doctrine sync', 'Recall thread'],
  },
  outputs: {
    label: 'Outputs',
    eyebrow: 'Delivery surface',
    title: 'Ship rail',
    description:
      'Artifacts, approvals, evidence, and completed work produced by this autonomous role.',
    notes: ['Artifact list', 'Approval receipt', 'Ship log'],
  },
}

const ROLE_CARDS: Record<ZibRoleGroup, RoleCardCopy> = {
  Command: {
    icon: 'C',
    title: 'Command',
    description: 'Lead operations and drive mission execution.',
    accent: '#ff4db2',
    secondary: '#2defff',
    tertiary: '#ff6f3d',
  },
  Intelligence: {
    icon: 'I',
    title: 'Intelligence',
    description: 'Analyze data and surface critical insights.',
    accent: '#2aa8ff',
    secondary: '#66f7ff',
    tertiary: '#8a7cff',
  },
  Field: {
    icon: 'F',
    title: 'Field',
    description: 'Operate in the field and close the distance.',
    accent: '#67d66f',
    secondary: '#9cffac',
    tertiary: '#3ec5ff',
  },
  Creative: {
    icon: 'A',
    title: 'Creative',
    description: 'Generate ideas and craft compelling content.',
    accent: '#9c5cff',
    secondary: '#db86ff',
    tertiary: '#4ddfff',
  },
  Systems: {
    icon: 'S',
    title: 'Systems',
    description: 'Build, automate, and optimize systems.',
    accent: '#38baff',
    secondary: '#65f2ff',
    tertiary: '#4b7cff',
  },
  Oversight: {
    icon: 'O',
    title: 'Oversight',
    description: 'Govern, audit, and ensure accountability.',
    accent: '#f5b93f',
    secondary: '#ffe47c',
    tertiary: '#55dfff',
  },
}

const ROLE_READINESS: Record<ZibRoleGroup, ZibReadiness> = {
  Command: 'Active',
  Intelligence: 'Synced',
  Field: 'Queueing',
  Creative: 'Ready',
  Systems: 'Synced',
  Oversight: 'Ready',
}

const READINESS_LOAD: Record<ZibReadiness, number> = {
  Ready: 78,
  Active: 92,
  Queueing: 64,
  Synced: 86,
  Idle: 42,
}

const ROLE_OPERATOR_LIMIT = 2

const getPlaceholderInitials = (label: string) =>
  label
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

const getModeSubtitle = (uiMode: string) =>
  uiMode === 'business'
    ? 'Select a ZiB and business-operation role to enter the workspace.'
    : 'Select a ZiB and Scavenjer-operation role to enter the workspace.'

const getRoleProfileSummary = (profiles: ZibPlaceholder[]) =>
  profiles
    .slice(0, ROLE_OPERATOR_LIMIT)
    .map((profile) => profile.name)
    .join(' / ')

export const ZibzPage = () => {
  const { setViewContext, uiMode } = useCortex()
  const [selectedRole, setSelectedRole] = useState<ZibRoleGroup>('Command')
  const [activeSection, setActiveSection] = useState<ZibWorkspaceSection>('missions')

  const sectionName = uiMode === 'business' ? 'ZiBz' : 'Xylos'
  const profiles = uiMode === 'business' ? BUSINESS_ZIB_PROFILES : SCAVENJER_XYLOS_PROFILES
  const roleDescriptions =
    uiMode === 'business' ? BUSINESS_ROLE_DESCRIPTIONS : SCAVENJER_ROLE_DESCRIPTIONS

  const activeRoleCopy = ROLE_CARDS[selectedRole]
  const activeReadiness = ROLE_READINESS[selectedRole]
  const activeWorkspace = WORKSPACE_SECTIONS[activeSection]
  const activeProfiles = useMemo(
    () => profiles.filter((profile) => profile.group === selectedRole),
    [profiles, selectedRole],
  )

  useEffect(() => {
    setViewContext({
      details: {
        selectedRole,
        selectedZib: selectedRole,
        hasSelectedZib: true,
        zibWorkspaceSection: activeSection,
        selectedZibStatus: activeReadiness,
        sectionName,
      },
    })
  }, [activeReadiness, activeSection, sectionName, selectedRole, setViewContext])

  const handleRoleSelect = (role: ZibRoleGroup) => {
    setSelectedRole(role)
    setActiveSection('missions')
  }

  return (
    <div className="zibz-unified-page page-motif-zibz">
      <div className="zs-shell">
        <header className="zs-hero">
          <span className="zs-hero-kicker">The Cortex</span>
          <h1>Choose a ZiB</h1>
          <p>{getModeSubtitle(uiMode)}</p>
        </header>

        <section className="zs-role-card-grid" aria-label={`${sectionName} role selection`}>
          {ZIB_ROLE_ORDER.map((role) => {
            const card = ROLE_CARDS[role]
            const roleProfiles = profiles.filter((profile) => profile.group === role)
            const isSelected = role === selectedRole
            const readiness = ROLE_READINESS[role]
            const load = READINESS_LOAD[readiness]

            return (
              <button
                key={role}
                type="button"
                className={`zs-choice-card ${isSelected ? 'is-selected' : ''}`}
                style={
                  {
                    '--zib-accent': card.accent,
                    '--zib-secondary': card.secondary,
                    '--zib-tertiary': card.tertiary,
                  } as CSSProperties
                }
                aria-pressed={isSelected}
                onClick={() => handleRoleSelect(role)}
              >
                <span className="zs-selected-check" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path
                      d="m5 12 4.2 4.2L19 6.8"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>

                <span className="zs-bot" aria-hidden="true">
                  <span className="zs-bot-antenna is-left" />
                  <span className="zs-bot-antenna is-right" />
                  <span className="zs-bot-helmet">
                    <span className="zs-bot-face">{card.icon}</span>
                  </span>
                  <span className="zs-bot-ear is-left" />
                  <span className="zs-bot-ear is-right" />
                  <span className="zs-bot-torso" />
                  <span className="zs-bot-arm is-left" />
                  <span className="zs-bot-arm is-right" />
                  <span className="zs-bot-leg is-left" />
                  <span className="zs-bot-leg is-right" />
                  <span className="zs-bot-foot is-left" />
                  <span className="zs-bot-foot is-right" />
                  <span className="zs-bot-tool" />
                </span>

                <span className="zs-choice-copy">
                  <span className="zs-choice-heading">
                    <span className="zs-choice-icon">{card.icon}</span>
                    <strong>{card.title}</strong>
                  </span>
                  <span className="zs-choice-description">{card.description}</span>
                  <span className="zs-choice-separator" />
                  <span className="zs-choice-action">
                    <span>Select ZiB</span>
                    <span aria-hidden="true">›</span>
                  </span>
                  <span className="zs-choice-meta">
                    {roleProfiles.length} operators / {load}% {readiness.toLowerCase()}
                  </span>
                </span>
              </button>
            )
          })}
        </section>

        <section className="zs-active-summary" aria-label="Active ZiB summary">
          <div className="zs-summary-mark" style={{ '--zib-accent': activeRoleCopy.accent } as CSSProperties}>
            <span>{activeRoleCopy.icon}</span>
          </div>
          <div className="zs-summary-copy">
            <h2>One ZiB. One Focus. Maximum Impact.</h2>
            <p>
              {roleDescriptions[selectedRole]} {getRoleProfileSummary(activeProfiles)}
              {activeProfiles.length ? ' are ready inside this lane.' : ''}
            </p>
          </div>
          <div className="zs-summary-state">
            <span>Your Active ZiB</span>
            <strong>{selectedRole}</strong>
            <em>{activeReadiness}</em>
          </div>
        </section>

        <section
          className="zs-workspace-panel"
          style={
            {
              '--zib-accent': activeRoleCopy.accent,
              '--zib-secondary': activeRoleCopy.secondary,
            } as CSSProperties
          }
          aria-label={`${selectedRole} workspace`}
        >
          <div className="zs-workspace-head">
            <div>
              <span>{sectionName} workspace</span>
              <h2>{selectedRole} Workspace</h2>
            </div>
            <nav className="zs-workspace-nav" aria-label="Workspace sections">
              {(Object.entries(WORKSPACE_SECTIONS) as Array<[ZibWorkspaceSection, WorkspaceSectionCopy]>).map(
                ([sectionId, section]) => (
                  <button
                    key={sectionId}
                    type="button"
                    className={`zs-workspace-tab ${sectionId === activeSection ? 'is-active' : ''}`}
                    onClick={() => setActiveSection(sectionId)}
                  >
                    {section.label}
                  </button>
                ),
              )}
            </nav>
          </div>

          <div className="zs-workspace-grid">
            <article className="zs-workspace-primary">
              <span>{activeWorkspace.eyebrow}</span>
              <h3>{activeWorkspace.title}</h3>
              <p>{activeWorkspace.description}</p>
              <div className="zs-workspace-note-list">
                {activeWorkspace.notes.map((note) => (
                  <span key={note}>{note}</span>
                ))}
              </div>
            </article>

            <div className="zs-operator-list">
              {activeProfiles.slice(0, ROLE_OPERATOR_LIMIT).map((profile) => (
                <article key={profile.id} className="zs-operator-mini">
                  <span className="zs-operator-avatar">{getPlaceholderInitials(profile.name)}</span>
                  <div>
                    <strong>{profile.name}</strong>
                    <p>{profile.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
