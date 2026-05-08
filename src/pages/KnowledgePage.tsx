import areaEconomyImage from '@/assets/knowledge/area-economy.svg'
import areaGameplayImage from '@/assets/knowledge/area-gameplay.svg'
import areaStudiosImage from '@/assets/knowledge/area-studios.svg'
import categoryAdminImage from '@/assets/knowledge/category-admin.svg'
import categoryCoreImage from '@/assets/knowledge/category-core.svg'
import categoryDropsImage from '@/assets/knowledge/category-drops.svg'
import categoryEkosImage from '@/assets/knowledge/category-ekos.svg'
import categoryMarketplaceImage from '@/assets/knowledge/category-marketplace.svg'
import categoryRewardsImage from '@/assets/knowledge/category-rewards.svg'
import categorySimulationsImage from '@/assets/knowledge/category-simulations.svg'
import componentArtifactsImage from '@/assets/knowledge/component-artifacts.svg'
import componentCharactersImage from '@/assets/knowledge/component-characters.svg'
import componentEnvironmentsImage from '@/assets/knowledge/component-environments.svg'
import componentFactionsImage from '@/assets/knowledge/component-factions.svg'
import landingLoreImage from '@/assets/knowledge/landing-lore.svg'
import landingOperationsImage from '@/assets/knowledge/landing-operations.svg'
import { useEffect, useMemo, useState } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'
import {
  buildKnowledgeModel,
  type BusinessKnowledgeModel,
  type CortexKnowledgeCategoryModel,
  type CortexKnowledgeModel,
} from './workspace-page-models'
import type {
  CortexLoreArtifact,
  CortexLoreCharacter,
  CortexLoreEnvironment,
  CortexLoreFaction,
  CortexLoreRecordBase,
  CortexLoreUniverse,
} from '@/shared/cortex'

type KnowledgeDrilldownView =
  | 'landing'
  | 'operationsAreas'
  | 'operationsCategoryItems'
  | 'operationsDetail'
  | 'loreSimulations'
  | 'loreComponentTypes'
  | 'loreRecordGrid'
  | 'loreRecordDetail'
type OperationAreaId = 'gameplay' | 'business' | 'studios'
type LoreComponentKind = 'characters' | 'environments' | 'factions' | 'artifacts'
type LoreAtlasRecord =
  | CortexLoreUniverse
  | CortexLoreCharacter
  | CortexLoreEnvironment
  | CortexLoreFaction
  | CortexLoreArtifact

type OperationArea = {
  id: OperationAreaId
  title: string
  label: string
  categoryIds: string[]
  imageUrl: string
}

const SIMULATION_CARD_META: Record<string, { code: string; file: string; status: string }> = {
  'universe-scavenjer-prime': { code: 'U-001', file: 'FILE // U-001-A', status: 'Stable' },
  'universe-resonance': { code: 'U-002', file: 'FILE // U-002-R', status: 'Under Review' },
  'universe-veliental-ascendance': { code: 'U-003', file: 'FILE // U-003-V', status: 'Mythic' },
}

const OPERATION_AREAS: OperationArea[] = [
  {
    id: 'gameplay',
    title: 'Gameplay Loop',
    label: 'Live play',
    categoryIds: ['drops-field-ops', 'ekos-identity'],
    imageUrl: areaGameplayImage,
  },
  {
    id: 'business',
    title: 'Business & Economy',
    label: 'Partner value',
    categoryIds: ['business-rewards', 'marketplace-economy', 'infrastructure-admin'],
    imageUrl: areaEconomyImage,
  },
  {
    id: 'studios',
    title: 'Studios View',
    label: 'Media engine',
    categoryIds: ['core-ecosystem', 'simulations-lore'],
    imageUrl: areaStudiosImage,
  },
]

const CATEGORY_IMAGES: Record<string, string> = {
  'drops-field-ops': categoryDropsImage,
  'ekos-identity': categoryEkosImage,
  'business-rewards': categoryRewardsImage,
  'marketplace-economy': categoryMarketplaceImage,
  'infrastructure-admin': categoryAdminImage,
  'core-ecosystem': categoryCoreImage,
  'simulations-lore': categorySimulationsImage,
}

const COMPONENT_IMAGES: Record<LoreComponentKind, string> = {
  characters: componentCharactersImage,
  environments: componentEnvironmentsImage,
  factions: componentFactionsImage,
  artifacts: componentArtifactsImage,
}

const getLoreRecordMeta = (record: LoreAtlasRecord) => {
  switch (record.kind) {
    case 'universe':
      return record.layer
    case 'character':
      return record.role
    case 'environment':
      return record.environmentType
    case 'faction':
      return record.agenda
    case 'artifact':
      return record.function
    default:
      return ''
  }
}

const getAllLoreRecords = (model: CortexKnowledgeModel): LoreAtlasRecord[] => [
  ...model.loreAtlas.loreUniverses,
  ...model.loreAtlas.loreCharacters,
  ...model.loreAtlas.loreEnvironments,
  ...model.loreAtlas.loreFactions,
  ...model.loreAtlas.loreArtifacts,
]

const getRelatedLoreRecords = (
  model: CortexKnowledgeModel,
  record: CortexLoreRecordBase,
): LoreAtlasRecord[] => {
  const relatedIds = new Set([
    ...record.relatedCharacterIds,
    ...record.relatedEnvironmentIds,
    ...record.relatedFactionIds,
    ...record.relatedArtifactIds,
  ])

  return getAllLoreRecords(model).filter((entry) => relatedIds.has(entry.id))
}

const getLoreComponentRecords = (
  model: CortexKnowledgeModel,
  simulation: CortexLoreUniverse | null,
  component: LoreComponentKind | null,
): LoreAtlasRecord[] => {
  if (!simulation || !component) {
    return []
  }

  switch (component) {
    case 'characters':
      return model.loreAtlas.loreCharacters.filter(
        (record) =>
          record.universeId === simulation.id || simulation.relatedCharacterIds.includes(record.id),
      )
    case 'environments':
      return model.loreAtlas.loreEnvironments.filter(
        (record) =>
          record.universeId === simulation.id || simulation.relatedEnvironmentIds.includes(record.id),
      )
    case 'factions':
      return model.loreAtlas.loreFactions.filter(
        (record) =>
          record.universeId === simulation.id || simulation.relatedFactionIds.includes(record.id),
      )
    case 'artifacts':
      return model.loreAtlas.loreArtifacts.filter(
        (record) =>
          record.universeId === simulation.id || simulation.relatedArtifactIds.includes(record.id),
      )
    default:
      return []
  }
}

const BusinessKnowledgeView = ({ model }: { model: BusinessKnowledgeModel }) => (
  <div className="mission-os-grid page-motif-knowledge">
    <Panel title={model.title} eyebrow={model.eyebrow} className="minimal-panel">
      <div className="record-grid">
        {model.cards.map((entry) => (
          <article
            key={entry.id}
            className={`record-card accent-${entry.accent}${model.focusedCard?.id === entry.id ? ' is-focused' : ''}`}
          >
            <div className="record-card-head">
              <span className="status-badge status-active">{entry.status}</span>
              <span className="record-card-meta">{entry.meta}</span>
            </div>
            <h3>{entry.title}</h3>
            <p>{entry.body}</p>
            <div className="chip-row compact">
              {(entry.chips ?? []).map((tag) => (
                <span key={tag} className="data-chip">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </Panel>

    <div className="mission-os-detail-grid">
      <Panel title={model.detailTitle} eyebrow={model.detailEyebrow} className="minimal-panel">
        {model.focusedCard ? (
          <div className="record-card accent-cyan">
            <div className="record-card-head">
              <span className="status-badge status-active">{model.focusedCard.status}</span>
              <span className="record-card-meta">{model.focusedCard.meta}</span>
            </div>
            <h3>{model.focusedCard.title}</h3>
            <p>{model.focusedCard.body}</p>
            {(model.focusedCard.footnotes ?? []).map((footnote) => (
              <div key={footnote.label} className="record-footnote">
                <strong>{footnote.label}</strong>
                <span>{footnote.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>

      <Panel title={model.supportTitle} eyebrow={model.supportEyebrow} className="minimal-panel">
        <div className="stack-list">
          {model.supportItems.map((entry) => (
            <article key={entry.id} className={`list-row accent-${entry.accent}`}>
              <div>
                <strong>{entry.title}</strong>
                <span>{entry.subtitle}</span>
              </div>
              <div>
                <strong>{entry.status}</strong>
                <span>{entry.meta}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  </div>
)

const KnowledgeBackButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button type="button" className="knowledge-flow-back" onClick={onClick}>
    <span aria-hidden="true">‹</span>
    {label}
  </button>
)

const ImageSelectionCard = ({
  ariaLabel,
  imageUrl,
  label,
  meta,
  onClick,
  title,
}: {
  ariaLabel: string
  imageUrl: string
  label?: string
  meta?: string
  onClick: () => void
  title: string
}) => (
  <button
    type="button"
    aria-label={ariaLabel}
    className="knowledge-flow-card"
    onClick={onClick}
  >
    <img src={imageUrl} alt="" aria-hidden="true" />
    <span>{label}</span>
    <strong>{title}</strong>
    {meta ? <small>{meta}</small> : null}
  </button>
)

const OperationDetailView = ({
  category,
  model,
  onBack,
}: {
  category: CortexKnowledgeCategoryModel
  model: CortexKnowledgeModel
  onBack: () => void
}) => {
  const showWatchItems = category.id === 'infrastructure-admin'

  return (
    <section className={`knowledge-flow-detail accent-${category.accent}`} aria-label={`${category.title} detail view`}>
      <div className="knowledge-flow-detail-head">
        <KnowledgeBackButton label="Back" onClick={onBack} />
        <div>
          <span>{category.eyebrow}</span>
          <h2>{category.title}</h2>
          <p>{category.summary}</p>
        </div>
      </div>

      <div className="knowledge-flow-detail-scroll">
        <div className="knowledge-flow-entry-grid">
          {category.entries.map((entry) => (
            <article key={entry.id} className={`knowledge-flow-entry accent-${entry.accent}`}>
              <div className="knowledge-flow-entry-head">
                <div>
                  <span>{entry.meta}</span>
                  <h3>{entry.title}</h3>
                </div>
                <strong>{entry.status}</strong>
              </div>
              <p>{entry.summary}</p>
              <ul>
                {entry.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <div className="knowledge-source-row compact" aria-label={`${entry.title} sources`}>
                {entry.sources.map((source) => (
                  <span key={source} className="knowledge-source-chip">
                    {source}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        {showWatchItems ? (
          <section className="knowledge-flow-watch" aria-label={model.watchTitle}>
            <div className="knowledge-flow-section-head">
              <span>{model.watchEyebrow}</span>
              <h3>{model.watchTitle}</h3>
            </div>
            <div className="knowledge-flow-entry-grid compact">
              {model.watchItems.map((item) => (
                <article key={item.id} className={`knowledge-flow-entry accent-${item.accent}`}>
                  <div className="knowledge-flow-entry-head">
                    <div>
                      <span>{item.status}</span>
                      <h3>{item.title}</h3>
                    </div>
                  </div>
                  <p>{item.summary}</p>
                  <div className="knowledge-source-row compact" aria-label={`${item.title} sources`}>
                    {item.sources.map((source) => (
                      <span key={source} className="knowledge-source-chip">
                        {source}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  )
}

const LoreRecordDetailView = ({
  model,
  onBack,
  record,
}: {
  model: CortexKnowledgeModel
  onBack: () => void
  record: LoreAtlasRecord
}) => {
  const relatedRecords = getRelatedLoreRecords(model, record)

  return (
    <section className={`knowledge-flow-detail lore-detail accent-${record.accent}`} aria-label={`${record.title} detail view`}>
      <div className="knowledge-flow-detail-head lore-detail-head">
        <KnowledgeBackButton label="Back" onClick={onBack} />
        <img src={record.imageUrl} alt={`${record.title} thumbnail`} />
        <div>
          <span>{record.kind}</span>
          <h2>{record.title}</h2>
          <p>{record.summary}</p>
        </div>
      </div>

      <div className="knowledge-flow-detail-scroll">
        <div className="knowledge-flow-entry-grid">
          <article className={`knowledge-flow-entry accent-${record.accent}`}>
            <div className="knowledge-flow-entry-head">
              <div>
                <span>Aesthetic Direction</span>
                <h3>Visual and Story Tone</h3>
              </div>
              <strong>{record.canonStatus}</strong>
            </div>
            <p>{record.aesthetic}</p>
            <div className="knowledge-flow-prompt">
              <span>Visual Prompt</span>
              <p>{record.visualPrompt}</p>
            </div>
          </article>

          <article className={`knowledge-flow-entry accent-${record.accent}`}>
            <div className="knowledge-flow-entry-head">
              <div>
                <span>Agent Context</span>
                <h3>Automation Context</h3>
              </div>
            </div>
            <p>{record.automationContext}</p>
            <div className="knowledge-flow-prompt">
              <span>Personality Context</span>
              <p>{record.personalityContext}</p>
            </div>
          </article>

          <article className={`knowledge-flow-entry accent-${record.accent}`}>
            <div className="knowledge-flow-entry-head">
              <div>
                <span>Links</span>
                <h3>Related Records</h3>
              </div>
            </div>
            {relatedRecords.length > 0 ? (
              <div className="knowledge-source-row compact">
                {relatedRecords.map((entry) => (
                  <span key={entry.id} className="knowledge-source-chip">
                    {entry.title}
                  </span>
                ))}
              </div>
            ) : (
              <p>No linked records in the initial atlas seed.</p>
            )}
          </article>

          <article className={`knowledge-flow-entry accent-${record.accent}`}>
            <div className="knowledge-flow-entry-head">
              <div>
                <span>Provenance</span>
                <h3>Source References</h3>
              </div>
            </div>
            <div className="knowledge-source-row compact">
              {record.sourceRefs.map((source) => (
                <span key={`${source.source}:${source.label}`} className="knowledge-source-chip">
                  {source.source}: {source.label}
                </span>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

const CortexKnowledgeIndex = ({ model }: { model: CortexKnowledgeModel }) => {
  const [view, setView] = useState<KnowledgeDrilldownView>('landing')
  const [selectedAreaId, setSelectedAreaId] = useState<OperationAreaId | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedSimulationId, setSelectedSimulationId] = useState<string | null>(null)
  const [selectedLoreComponent, setSelectedLoreComponent] = useState<LoreComponentKind | null>(null)
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)

  const selectedArea = OPERATION_AREAS.find((area) => area.id === selectedAreaId) ?? null
  const selectedCategory =
    model.categories.find((category) => category.id === selectedCategoryId) ?? null
  const selectedSimulation =
    model.loreAtlas.loreUniverses.find((universe) => universe.id === selectedSimulationId) ?? null
  const selectedRecord =
    getAllLoreRecords(model).find((record) => record.id === selectedRecordId) ?? null
  const selectedAreaCategories = selectedArea
    ? selectedArea.categoryIds
        .map((categoryId) => model.categories.find((category) => category.id === categoryId))
        .filter((category): category is CortexKnowledgeCategoryModel => Boolean(category))
    : []
  const loreRecords = useMemo(
    () => getLoreComponentRecords(model, selectedSimulation, selectedLoreComponent),
    [model, selectedLoreComponent, selectedSimulation],
  )
  const loreComponentCards: Array<{
    id: LoreComponentKind
    title: string
    count: number
    imageUrl: string
  }> = [
    {
      id: 'characters',
      title: 'Characters',
      count: getLoreComponentRecords(model, selectedSimulation, 'characters').length,
      imageUrl: COMPONENT_IMAGES.characters,
    },
    {
      id: 'environments',
      title: 'Environments',
      count: getLoreComponentRecords(model, selectedSimulation, 'environments').length,
      imageUrl: COMPONENT_IMAGES.environments,
    },
    {
      id: 'factions',
      title: 'Factions',
      count: getLoreComponentRecords(model, selectedSimulation, 'factions').length,
      imageUrl: COMPONENT_IMAGES.factions,
    },
    {
      id: 'artifacts',
      title: 'Artifacts',
      count: getLoreComponentRecords(model, selectedSimulation, 'artifacts').length,
      imageUrl: COMPONENT_IMAGES.artifacts,
    },
  ]

  const goBack = () => {
    switch (view) {
      case 'operationsAreas':
      case 'loreSimulations':
        setView('landing')
        break
      case 'operationsCategoryItems':
        setSelectedAreaId(null)
        setView('operationsAreas')
        break
      case 'operationsDetail':
        setSelectedCategoryId(null)
        setView('operationsCategoryItems')
        break
      case 'loreComponentTypes':
        setSelectedSimulationId(null)
        setView('loreSimulations')
        break
      case 'loreRecordGrid':
        setSelectedLoreComponent(null)
        setView('loreComponentTypes')
        break
      case 'loreRecordDetail':
        setSelectedRecordId(null)
        setView('loreRecordGrid')
        break
      case 'landing':
      default:
        break
    }
  }

  useEffect(() => {
    if (view === 'landing') {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        goBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  if (view === 'operationsDetail' && selectedCategory) {
    return (
      <div className="knowledge-flow-page page-motif-knowledge">
        <OperationDetailView category={selectedCategory} model={model} onBack={goBack} />
      </div>
    )
  }

  if (view === 'loreRecordDetail' && selectedRecord) {
    return (
      <div className="knowledge-flow-page page-motif-knowledge">
        <LoreRecordDetailView model={model} record={selectedRecord} onBack={goBack} />
      </div>
    )
  }

  return (
    <div className="knowledge-flow-page page-motif-knowledge">
      {view !== 'landing' ? (
        <div className="knowledge-flow-toolbar">
          <KnowledgeBackButton label="Back" onClick={goBack} />
        </div>
      ) : null}

      {view === 'landing' ? (
        <section className="knowledge-flow-center" aria-label="Knowledge mode selection">
          <div className="knowledge-flow-choice-grid two">
            <ImageSelectionCard
              ariaLabel="Operations knowledge mode"
              imageUrl={landingOperationsImage}
              label="Live systems"
              onClick={() => setView('operationsAreas')}
              title="Operations"
            />
            <ImageSelectionCard
              ariaLabel="Lore knowledge mode"
              imageUrl={landingLoreImage}
              label="Simulation atlas"
              onClick={() => setView('loreSimulations')}
              title="Lore"
            />
          </div>
        </section>
      ) : null}

      {view === 'operationsAreas' ? (
        <section className="knowledge-flow-center" aria-label="Operations area selection">
          <div className="knowledge-flow-choice-grid three">
            {OPERATION_AREAS.map((area) => (
              <ImageSelectionCard
                key={area.id}
                ariaLabel={`Select ${area.title}`}
                imageUrl={area.imageUrl}
                label={area.label}
                onClick={() => {
                  setSelectedAreaId(area.id)
                  setView('operationsCategoryItems')
                }}
                title={area.title}
              />
            ))}
          </div>
        </section>
      ) : null}

      {view === 'operationsCategoryItems' && selectedArea ? (
        <section className="knowledge-flow-center" aria-label={`${selectedArea.title} category selection`}>
          <div className="knowledge-flow-choice-grid category">
            {selectedAreaCategories.map((category) => (
              <ImageSelectionCard
                key={category.id}
                ariaLabel={`Open ${category.title}`}
                imageUrl={CATEGORY_IMAGES[category.id] ?? selectedArea.imageUrl}
                label={category.eyebrow}
                meta={category.entries.length === 1 ? '1 entry' : `${category.entries.length} entries`}
                onClick={() => {
                  setSelectedCategoryId(category.id)
                  setView('operationsDetail')
                }}
                title={category.title}
              />
            ))}
          </div>
        </section>
      ) : null}

      {view === 'loreSimulations' ? (
        <section className="knowledge-flow-center" aria-label="Simulation selection">
          <div className="simulation-selection-grid knowledge-flow-simulations">
            {model.loreAtlas.loreUniverses.map((universe) => {
              const meta = SIMULATION_CARD_META[universe.id] ?? {
                code: universe.id.toUpperCase(),
                file: `FILE // ${universe.layer.toUpperCase()}`,
                status: universe.canonStatus,
              }

              return (
                <button
                  key={universe.id}
                  type="button"
                  aria-label={`Select ${universe.title} simulation`}
                  className={`simulation-card accent-${universe.accent}`}
                  onClick={() => {
                    setSelectedSimulationId(universe.id)
                    setView('loreComponentTypes')
                  }}
                >
                  <img src={universe.imageUrl} alt="" aria-hidden="true" />
                  <div className="simulation-card-topline">
                    <span>{meta.code}</span>
                    <span>{meta.file}</span>
                  </div>
                  <strong>{universe.title}</strong>
                  <div className="simulation-card-footer">
                    <small>{meta.status}</small>
                    <span>Canon Status</span>
                    <i aria-hidden="true" />
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      {view === 'loreComponentTypes' && selectedSimulation ? (
        <section className="knowledge-flow-center" aria-label={`${selectedSimulation.title} component selection`}>
          <div className="knowledge-flow-choice-grid four">
            {loreComponentCards.map((component) => (
              <ImageSelectionCard
                key={component.id}
                ariaLabel={`Open ${component.title}`}
                imageUrl={component.imageUrl}
                label={selectedSimulation.title}
                meta={`${component.count} records`}
                onClick={() => {
                  setSelectedLoreComponent(component.id)
                  setView('loreRecordGrid')
                }}
                title={component.title}
              />
            ))}
          </div>
        </section>
      ) : null}

      {view === 'loreRecordGrid' && selectedSimulation && selectedLoreComponent ? (
        <section className="knowledge-flow-list-screen" aria-label={`${selectedSimulation.title} ${selectedLoreComponent}`}>
          <header className="knowledge-flow-list-head">
            <span>{selectedSimulation.title}</span>
            <h2>{selectedLoreComponent}</h2>
          </header>
          <div className="knowledge-flow-scroll-grid">
            {loreRecords.map((record) => (
              <button
                key={record.id}
                type="button"
                className={`knowledge-flow-record-card accent-${record.accent}`}
                onClick={() => {
                  setSelectedRecordId(record.id)
                  setView('loreRecordDetail')
                }}
              >
                <img src={record.imageUrl} alt={`${record.title} thumbnail`} />
                <span>{record.kind}</span>
                <strong>{record.title}</strong>
                <small>{getLoreRecordMeta(record)}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

export const KnowledgePage = () => {
  const { businessSnapshot, setViewContext, snapshot, uiFocus, uiMode } = useCortex()

  const model = buildKnowledgeModel(uiMode, snapshot, businessSnapshot, uiFocus.vaultEntryId)

  useEffect(() => {
    const nextModel = buildKnowledgeModel(uiMode, snapshot, businessSnapshot, uiFocus.vaultEntryId)
    if (!nextModel) {
      return
    }

    if (nextModel.kind === 'cortex') {
      const loreAtlasRecords =
        nextModel.loreAtlas.loreUniverses.length +
        nextModel.loreAtlas.loreCharacters.length +
        nextModel.loreAtlas.loreEnvironments.length +
        nextModel.loreAtlas.loreFactions.length +
        nextModel.loreAtlas.loreArtifacts.length
      setViewContext({
        details: {
          knowledgeCategories: nextModel.categories.length,
          knowledgeEntries: nextModel.categories.reduce(
            (total, category) => total + category.entries.length,
            0,
          ),
          sourceClusters: nextModel.sourceClusters.length,
          canonicalVaultEntries: nextModel.canonicalVaultEntries,
          loreAtlasRecords,
          loreCharacters: nextModel.loreAtlas.loreCharacters.length,
          loreEnvironments: nextModel.loreAtlas.loreEnvironments.length,
        },
      })
      return
    }

    setViewContext({
      details: {
        vaultEntries: nextModel.cards.length,
        canonicalEntries: nextModel.cards.filter((entry) => entry.meta === 'canonical').length,
        loreEntries: nextModel.supportItems.length,
      },
    })
  }, [businessSnapshot, setViewContext, snapshot, uiFocus.vaultEntryId, uiMode])

  if (!model) {
    return null
  }

  return model.kind === 'cortex' ? (
    <CortexKnowledgeIndex model={model} />
  ) : (
    <BusinessKnowledgeView model={model} />
  )
}
