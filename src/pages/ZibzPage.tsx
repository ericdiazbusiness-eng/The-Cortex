import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Panel } from '@/components/Panel'
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

type ZibWorkspaceSection = 'missions' | 'context' | 'memory' | 'outputs'

type WorkspaceSectionCopy = {
  label: string
  eyebrow: string
  title: string
  description: string
  notes: string[]
}

const WORKSPACE_SECTIONS: Record<ZibWorkspaceSection, WorkspaceSectionCopy> = {
  missions: {
    label: 'Missions',
    eyebrow: 'Selection-gated queue',
    title: 'Autonomous work stack',
    description:
      'The selected operator owns the next queue of decisions, approvals, and action loops for this role.',
    notes: ['Priority queue', 'Approval dependency', 'Measurable outcome'],
  },
  context: {
    label: 'Context',
    eyebrow: 'Runtime surface',
    title: 'Operating context',
    description:
      'Current state, supporting source material, blockers, and fresh signals stay attached to the selected operator.',
    notes: ['Current status', 'Active source context', 'Recent changes'],
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

const getPlaceholderInitials = (label: string) =>
  label
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

const getZibCardStyle = (placeholder: ZibPlaceholder) =>
  ({
    '--zib-primary': placeholder.primary,
    '--zib-secondary': placeholder.secondary,
    '--zib-tertiary': placeholder.tertiary,
  }) as CSSProperties

export const ZibzPage = () => {
  const { setViewContext, uiMode } = useCortex()
  const [selectedRole, setSelectedRole] = useState<ZibRoleGroup>('Command')
  const [selectedPlaceholderId, setSelectedPlaceholderId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<ZibWorkspaceSection>('missions')
  const sectionName = uiMode === 'business' ? 'ZiBz' : 'Xylos'
  const itemName = uiMode === 'business' ? 'ZiB' : 'Xylos'
  const indexTitle = uiMode === 'business' ? 'ZiB Index' : 'Xylos Index'
  const profiles = uiMode === 'business' ? BUSINESS_ZIB_PROFILES : SCAVENJER_XYLOS_PROFILES
  const roleDescriptions =
    uiMode === 'business' ? BUSINESS_ROLE_DESCRIPTIONS : SCAVENJER_ROLE_DESCRIPTIONS

  const visiblePlaceholders = useMemo(
    () => profiles.filter((entry) => entry.group === selectedRole),
    [profiles, selectedRole],
  )

  const selectedPlaceholder =
    visiblePlaceholders.find((entry) => entry.id === selectedPlaceholderId) ?? null

  const activeWorkspace = selectedPlaceholder ? WORKSPACE_SECTIONS[activeSection] : null

  useEffect(() => {
    setViewContext({
      details: {
        selectedRole,
        selectedZib: selectedPlaceholder?.name ?? null,
        hasSelectedZib: Boolean(selectedPlaceholder),
        zibWorkspaceSection: selectedPlaceholder ? activeSection : null,
        sectionName,
      },
    })
  }, [activeSection, sectionName, selectedPlaceholder, selectedRole, setViewContext])

  const handleRoleSelect = (role: ZibRoleGroup) => {
    setSelectedRole(role)
    setSelectedPlaceholderId(null)
    setActiveSection('missions')
  }

  const handleZibSelect = (placeholder: ZibPlaceholder) => {
    setSelectedPlaceholderId(placeholder.id)
    setActiveSection('missions')
  }

  return (
    <div className="mission-os-grid zibz-index-page">
      <Panel title={indexTitle} eyebrow="Selection-first operator surface" className="minimal-panel">
        <div className="zibz-index-shell">
          <div className="zibz-index-intro">
            <div className="zibz-index-copy">
              <span className="zibz-index-kicker">{selectedRole}</span>
              <h3>{roleDescriptions[selectedRole]}</h3>
              <p>
                Select a role, choose an autonomous {itemName}, then reveal the operating workspace.
                The structure stays fixed while the role context changes between Scavenjer and business mode.
              </p>
            </div>

            <div className="zibz-index-stats">
              <div>
                <span>Role View</span>
                <strong>{selectedRole}</strong>
              </div>
              <div>
                <span>Visible Slots</span>
                <strong>{visiblePlaceholders.length}</strong>
              </div>
              <div>
                <span>Workspace</span>
                <strong>{selectedPlaceholder ? 'Open' : 'Locked'}</strong>
              </div>
            </div>
          </div>

          <div className="zibz-role-band" role="tablist" aria-label={`${sectionName} role groups`}>
            {ZIB_ROLE_ORDER.map((role) => (
              <button
                key={role}
                type="button"
                role="tab"
                aria-selected={role === selectedRole}
                className={`zibz-role-band-button${role === selectedRole ? ' is-active' : ''}`}
                onClick={() => handleRoleSelect(role)}
              >
                <span>{role}</span>
              </button>
            ))}
          </div>

          <div className="zibz-selector-stage">
            <div
              className={`zibz-display-stage${selectedPlaceholder ? ' is-ready' : ''}`}
              style={selectedPlaceholder ? getZibCardStyle(selectedPlaceholder) : undefined}
            >
              <div className="zibz-display-frame">
                {selectedPlaceholder ? (
                  selectedPlaceholder.imageSrc ? (
                    <img
                      className="zibz-display-image"
                      src={selectedPlaceholder.imageSrc}
                      alt={selectedPlaceholder.name}
                    />
                  ) : (
                    <div className="zibz-display-placeholder" aria-hidden="true">
                      <span>{getPlaceholderInitials(selectedPlaceholder.name)}</span>
                    </div>
                  )
                ) : (
                  <div className="zibz-display-empty">
                    <span className="zibz-display-empty-mark">{itemName}</span>
                    <strong>Select a {itemName}</strong>
                    <p>Missions, context, memory, and outputs remain scoped until a role-specific {itemName} is chosen.</p>
                  </div>
                )}

                <div className="zibz-display-tag">
                  <strong>{selectedPlaceholder?.name ?? `${selectedRole} Index`}</strong>
                  <span>{selectedPlaceholder?.role ?? 'Selection required'}</span>
                </div>
              </div>

              <div className="zibz-display-caption">
                <span className="surface-label">
                  {selectedPlaceholder ? `Selected ${itemName}` : 'Selection gate'}
                </span>
                <strong>
                  {selectedPlaceholder ? selectedPlaceholder.note : 'No operator workspace is shown yet.'}
                </strong>
                <p>
                  {selectedPlaceholder
                    ? `The workspace below now shows the core operating sections for this ${itemName}.`
                    : 'Choose a role card to unlock Missions, Context, Memory, and Outputs.'}
                </p>
              </div>
            </div>

            <div className="zibz-card-rail" aria-label={`${selectedRole} ${sectionName} slots`}>
              {visiblePlaceholders.map((entry) => {
                const isActive = entry.id === selectedPlaceholder?.id

                return (
                  <button
                    key={entry.id}
                    type="button"
                    aria-pressed={isActive}
                    className={`zibz-rail-card${isActive ? ' is-active' : ''}`}
                    style={getZibCardStyle(entry)}
                    onClick={() => handleZibSelect(entry)}
                  >
                    <span className="zibz-rail-chip">{sectionName}</span>

                    <div className="zibz-rail-art">
                      {entry.imageSrc ? (
                        <img className="zibz-rail-image" src={entry.imageSrc} alt={entry.name} />
                      ) : (
                        <div className="zibz-rail-avatar" aria-hidden="true">
                          <span>{getPlaceholderInitials(entry.name)}</span>
                        </div>
                      )}
                    </div>

                    <div className="zibz-rail-tag">
                      <strong>{entry.name}</strong>
                      <span>{entry.role}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Panel>

      {selectedPlaceholder && activeWorkspace ? (
        <Panel
          title={`${selectedPlaceholder.name} Workspace`}
          eyebrow={`Unlocked after ${itemName} selection`}
          className="minimal-panel"
        >
          <div className="zibz-workspace-shell" style={getZibCardStyle(selectedPlaceholder)}>
            <aside className="zibz-workspace-nav" aria-label={`${sectionName} workspace sections`}>
              {(
                Object.entries(WORKSPACE_SECTIONS) as Array<
                  [ZibWorkspaceSection, WorkspaceSectionCopy]
                >
              ).map(([sectionId, section]) => (
                <button
                  key={sectionId}
                  type="button"
                  className={`zibz-workspace-nav-card${sectionId === activeSection ? ' is-active' : ''}`}
                  onClick={() => setActiveSection(sectionId)}
                >
                  <span className="surface-label">{section.eyebrow}</span>
                  <strong>{section.label}</strong>
                  <p>{section.title}</p>
                </button>
              ))}
            </aside>

            <section className="zibz-workspace-stage">
              <div className="zibz-workspace-head">
                <div>
                  <span className="surface-label">{activeWorkspace.eyebrow}</span>
                  <h3>{activeWorkspace.title}</h3>
                </div>
                <span className="status-badge status-active">operator profile</span>
              </div>

              <p className="zibz-workspace-description">{activeWorkspace.description}</p>

              <div className="zibz-workspace-meta">
                <div>
                  <span>{itemName}</span>
                  <strong>{selectedPlaceholder.name}</strong>
                </div>
                <div>
                  <span>Role</span>
                  <strong>{selectedPlaceholder.role}</strong>
                </div>
                <div>
                  <span>Section</span>
                  <strong>{activeWorkspace.label}</strong>
                </div>
              </div>

              <div className="zibz-workspace-note-grid">
                {activeWorkspace.notes.map((note) => (
                  <article key={note} className="record-card">
                    <span className="surface-label">{activeWorkspace.label}</span>
                    <strong>{note}</strong>
                    <p>{selectedPlaceholder.name} owns this part of the operating loop.</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </Panel>
      ) : (
        <Panel title={`${itemName} Workspace Locked`} eyebrow="Selection required" className="minimal-panel">
          <div className="zibz-workspace-empty">
            <strong>Choose a {itemName} card first.</strong>
            <p>
              The workspace stays gated until a role is selected, then reveals the operating loop for that {itemName}.
            </p>
          </div>
        </Panel>
      )}
    </div>
  )
}
