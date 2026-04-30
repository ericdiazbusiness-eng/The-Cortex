import { useEffect, useState } from 'react'
import { Panel } from '@/components/Panel'
import { useCortex } from '@/hooks/useCortex'
import {
  type CortexWorkflow,
  type CortexWorkflowAssetUpload,
  type CortexWorkflowCreateInput,
  type CortexWorkflowUpdateInput,
} from '@/shared/cortex'
import { formatDateTime } from './mission-os-utils'
import { buildWorkflowModels, getWorkspaceRoute } from './workspace-page-models'

type ComposerMode = 'create' | 'edit' | null

type ComposerState = {
  title: string
  description: string
  architecture: string
  toolsUsed: string[]
  pendingTool: string
  diagramSourceFile: File | null
  diagramPreviewFile: File | null
  zipFile: File | null
  removeZip: boolean
}

const createEmptyComposer = (): ComposerState => ({
  title: '',
  description: '',
  architecture: '',
  toolsUsed: [],
  pendingTool: '',
  diagramSourceFile: null,
  diagramPreviewFile: null,
  zipFile: null,
  removeZip: false,
})

const createComposerFromWorkflow = (workflow: CortexWorkflow): ComposerState => ({
  title: workflow.title,
  description: workflow.description,
  architecture: workflow.architecture,
  toolsUsed: workflow.toolsUsed,
  pendingTool: '',
  diagramSourceFile: null,
  diagramPreviewFile: null,
  zipFile: null,
  removeZip: false,
})

const fileToBase64 = async (file: File) => {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }

  return btoa(binary)
}

const fileToUpload = async (file: File): Promise<CortexWorkflowAssetUpload> => ({
  fileName: file.name,
  mimeType: file.type || 'application/octet-stream',
  dataBase64: await fileToBase64(file),
})

const trimTools = (toolsUsed: string[]) =>
  toolsUsed
    .map((tool) => tool.trim())
    .filter(Boolean)

export const WorkflowsPage = () => {
  const {
    businessSnapshot,
    snapshot,
    uiFocus,
    focusUi,
    setViewContext,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    downloadWorkflowAsset,
    uiMode,
  } = useCortex()
  const [composerMode, setComposerMode] = useState<ComposerMode>(null)
  const [composer, setComposer] = useState<ComposerState>(createEmptyComposer)
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [fileInputRevision, setFileInputRevision] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const workflowRoute = getWorkspaceRoute(uiMode, '/cortex/workflows')
  const workflows = snapshot?.workflows ?? []
  const workflowModels = buildWorkflowModels(uiMode, snapshot, businessSnapshot)
  const selectedWorkflowModel =
    workflowModels.find((workflow) => workflow.id === uiFocus.workflowId) ?? null
  const selectedWorkflow =
    uiMode === 'cortex'
      ? workflows.find((workflow) => workflow.id === uiFocus.workflowId) ?? null
      : null
  const canMutateWorkflows = uiMode === 'cortex'

  useEffect(() => {
    const nextWorkflowModels = buildWorkflowModels(uiMode, snapshot, businessSnapshot)
    if (!nextWorkflowModels.length && (uiMode === 'cortex' ? !snapshot : !businessSnapshot)) {
      return
    }

    setViewContext({
      details: {
        workflows: nextWorkflowModels.length,
        zippedWorkflows: nextWorkflowModels.filter((workflow) => workflow.zipFileName).length,
        focusedWorkflowId: selectedWorkflowModel?.id ?? null,
      },
    })
  }, [businessSnapshot, selectedWorkflowModel?.id, setViewContext, snapshot, uiMode])

  const startCreate = () => {
    setComposerMode('create')
    setComposer(createEmptyComposer())
    setFormMessage(null)
    setFormError(null)
    setDownloadMessage(null)
    setIsPreviewOpen(false)
    setFileInputRevision((current) => current + 1)
  }

  const startEdit = () => {
    if (!selectedWorkflow) {
      return
    }

    setComposerMode('edit')
    setComposer(createComposerFromWorkflow(selectedWorkflow))
    setFormMessage(null)
    setFormError(null)
    setDownloadMessage(null)
    setIsPreviewOpen(false)
    setFileInputRevision((current) => current + 1)
  }

  const cancelComposer = () => {
    setComposerMode(null)
    setComposer(
      selectedWorkflow ? createComposerFromWorkflow(selectedWorkflow) : createEmptyComposer(),
    )
    setFormMessage(null)
    setFormError(null)
    setFileInputRevision((current) => current + 1)
  }

  const addTool = () => {
    const nextTool = composer.pendingTool.trim()
    if (!nextTool) {
      return
    }

    setComposer((current) => ({
      ...current,
      toolsUsed: current.toolsUsed.includes(nextTool)
        ? current.toolsUsed
        : [...current.toolsUsed, nextTool],
      pendingTool: '',
    }))
  }

  const removeTool = (toolToRemove: string) => {
    setComposer((current) => ({
      ...current,
      toolsUsed: current.toolsUsed.filter((tool) => tool !== toolToRemove),
    }))
  }

  const handleDownload = async (assetKey: 'diagramSource' | 'diagramPreview' | 'zipAsset') => {
    if (!selectedWorkflow) {
      return
    }

    setDownloadMessage(null)
    try {
      const result = await downloadWorkflowAsset({
        workflowId: selectedWorkflow.id,
        assetKey,
      })

      if (result.canceled) {
        setDownloadMessage('Download canceled.')
        return
      }

      setDownloadMessage(`Saved ${assetKey} to ${result.filePath}.`)
    } catch (error) {
      setDownloadMessage(error instanceof Error ? error.message : 'Workflow asset download failed.')
    }
  }

  const validateForm = () => {
    if (!composer.title.trim()) {
      return 'Title is required.'
    }

    if (!composer.description.trim()) {
      return 'Description is required.'
    }

    if (!trimTools(composer.toolsUsed).length) {
      return 'Add at least one tool.'
    }

    if (!composer.architecture.trim()) {
      return 'Architecture is required.'
    }

    if (composerMode === 'create' && !composer.diagramSourceFile) {
      return 'Diagram source is required for a new workflow.'
    }

    if (composerMode === 'create' && !composer.diagramPreviewFile) {
      return 'Diagram preview is required for a new workflow.'
    }

    return null
  }

  const handleSave = async () => {
    const nextError = validateForm()
    if (nextError) {
      setFormError(nextError)
      setFormMessage(null)
      return
    }

    setIsSaving(true)
    setFormError(null)
    setFormMessage(null)

    try {
      if (composerMode === 'create') {
        const payload: CortexWorkflowCreateInput = {
          title: composer.title,
          description: composer.description,
          toolsUsed: trimTools(composer.toolsUsed),
          architecture: composer.architecture,
          diagramSource: await fileToUpload(composer.diagramSourceFile as File),
          diagramPreview: await fileToUpload(composer.diagramPreviewFile as File),
          zipAsset: composer.zipFile ? await fileToUpload(composer.zipFile) : null,
        }

        await createWorkflow(payload)
        setFormMessage('Workflow created.')
      } else if (composerMode === 'edit' && selectedWorkflow) {
        const payload: CortexWorkflowUpdateInput = {
          id: selectedWorkflow.id,
          title: composer.title,
          description: composer.description,
          toolsUsed: trimTools(composer.toolsUsed),
          architecture: composer.architecture,
          diagramSource: composer.diagramSourceFile
            ? {
                mode: 'replace',
                ...(await fileToUpload(composer.diagramSourceFile)),
              }
            : { mode: 'keep' },
          diagramPreview: composer.diagramPreviewFile
            ? {
                mode: 'replace',
                ...(await fileToUpload(composer.diagramPreviewFile)),
              }
            : { mode: 'keep' },
          zipAsset: composer.zipFile
            ? {
                mode: 'replace',
                ...(await fileToUpload(composer.zipFile)),
              }
            : composer.removeZip
              ? { mode: 'remove' }
              : { mode: 'keep' },
        }

        await updateWorkflow(payload)
        setFormMessage('Workflow updated.')
      }

      setComposerMode(null)
      setComposer(createEmptyComposer())
      setFileInputRevision((current) => current + 1)
      setIsPreviewOpen(false)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Workflow save failed.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedWorkflow) {
      return
    }

    const confirmed =
      typeof window === 'undefined' || typeof window.confirm !== 'function'
        ? true
        : window.confirm(`Delete workflow "${selectedWorkflow.title}"?`)

    if (!confirmed) {
      return
    }

    setFormError(null)
    setFormMessage(null)

    try {
      await deleteWorkflow(selectedWorkflow.id)
      setComposerMode(null)
      setComposer(createEmptyComposer())
      setFormMessage('Workflow deleted.')
      setIsPreviewOpen(false)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Workflow delete failed.')
    }
  }

  if (uiMode === 'cortex' ? !snapshot : !businessSnapshot) {
    return null
  }

  return (
    <div className="mission-os-grid workflow-grid page-motif-workflows">
      <Panel
        title={selectedWorkflowModel ? 'Workflow Selector' : 'Workflow Registry'}
        eyebrow={uiMode === 'business' ? 'Business owner loops and automations' : 'Scavenjer automations and runbooks'}
        className="minimal-panel"
      >
        <div className="workflow-toolbar">
          <p className="workflow-toolbar-copy">
            {selectedWorkflowModel
              ? uiMode === 'business'
                ? 'Select a different business workflow loop. The shared detail view stays read-only until a live business workflow adapter exists.'
                : 'Select a different Scavenjer workflow or open a new one. The detail view stays compact until you explicitly edit.'
              : uiMode === 'business'
                ? 'Choose a business owner workflow for proposals, delivery, finance, relationships, studio, or integrations.'
                : 'Choose a Scavenjer operations workflow, or create a new one for drops, minting, community, studio, or integrations.'}
          </p>
          {canMutateWorkflows ? (
            <button type="button" className="command-button primary" onClick={startCreate}>
              New Workflow
            </button>
          ) : (
            <span className="status-badge status-active">read-only loops</span>
          )}
        </div>

        <div className={`workflow-catalog${selectedWorkflowModel ? ' is-compact' : ' is-selector'}`}>
          {workflowModels.map((workflow) => (
            <button
              key={workflow.id}
              type="button"
              className={`record-card workflow-card workflow-selector-card accent-${workflow.accent}${selectedWorkflowModel?.id === workflow.id ? ' is-focused' : ''}`}
              onClick={() =>
                focusUi({
                  route: workflowRoute,
                  workflowId: workflow.id,
                })
              }
            >
              <span className="workflow-selector-title">{workflow.title}</span>
            </button>
          ))}
        </div>
      </Panel>

      {selectedWorkflowModel ? (
        <div className="mission-os-detail-grid workflow-detail-grid">
          <Panel title="Workflow Opener" eyebrow="Selected workflow detail" className="minimal-panel">
            <div className="workflow-opener workflow-detail-scroll">
              <div className="workflow-opener-head">
                <div>
                  <div className="record-card-head">
                    <span className="status-badge status-active">workflow</span>
                    <span className="record-card-meta">{formatDateTime(selectedWorkflowModel.updatedAt)}</span>
                  </div>
                  <h3>{selectedWorkflowModel.title}</h3>
                </div>

                <div className="command-row compact">
                  <button
                    type="button"
                    className="command-button secondary"
                    onClick={() =>
                      focusUi({
                        route: workflowRoute,
                        workflowId: null,
                      })
                    }
                  >
                    Back
                  </button>
                  {canMutateWorkflows ? (
                    <>
                      <button type="button" className="command-button secondary" onClick={startEdit}>
                        Edit
                      </button>
                      <button type="button" className="command-button danger" onClick={handleDelete}>
                        Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              <p className="workflow-body-copy">{selectedWorkflowModel.description}</p>

              <button
                type="button"
                className="workflow-preview-frame workflow-preview-button"
                onClick={() => setIsPreviewOpen(true)}
              >
                {selectedWorkflowModel.diagramPreviewUrl ? (
                  <img
                    src={selectedWorkflowModel.diagramPreviewUrl}
                    alt={`${selectedWorkflowModel.title} workflow preview`}
                    className="workflow-preview-image"
                  />
                ) : (
                  <div className="workflow-preview-empty">
                    <strong>No preview available</strong>
                    <span>Upload a rendered flowgraph image to visualize this workflow.</span>
                  </div>
                )}
                <span className="workflow-preview-hint">Click to enlarge</span>
              </button>

              <div className="workflow-detail-columns">
                <div className="record-footnote workflow-detail-card">
                  <strong>Tools Used</strong>
                  <div className="chip-row compact">
                    {selectedWorkflowModel.toolsUsed.map((tool) => (
                      <span key={tool} className="data-chip">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="record-footnote workflow-detail-card">
                  <strong>Architecture</strong>
                  <span>{selectedWorkflowModel.architecture}</span>
                </div>
              </div>

              <div className="workflow-asset-grid">
                <div className="record-footnote workflow-detail-card">
                  <strong>Excalidraw Source</strong>
                  <span>{selectedWorkflowModel.diagramSourceFileName}</span>
                  {canMutateWorkflows ? (
                    <button
                      type="button"
                      className="command-button secondary"
                      onClick={() => handleDownload('diagramSource')}
                    >
                      Download Source
                    </button>
                  ) : null}
                </div>
                <div className="record-footnote workflow-detail-card">
                  <strong>Preview Image</strong>
                  <span>{selectedWorkflowModel.diagramPreviewFileName}</span>
                  {canMutateWorkflows ? (
                    <button
                      type="button"
                      className="command-button secondary"
                      onClick={() => handleDownload('diagramPreview')}
                    >
                      Download Preview
                    </button>
                  ) : null}
                </div>
                <div className="record-footnote workflow-detail-card">
                  <strong>ZIP Bundle</strong>
                  <span>{selectedWorkflowModel.zipFileName ?? 'No ZIP attached'}</span>
                  {canMutateWorkflows ? (
                    <button
                      type="button"
                      className="command-button secondary"
                      disabled={!selectedWorkflow?.zipAsset}
                      onClick={() => handleDownload('zipAsset')}
                    >
                      Download ZIP
                    </button>
                  ) : null}
                </div>
              </div>

              {downloadMessage ? <p className="workflow-feedback">{downloadMessage}</p> : null}
            </div>
          </Panel>

          {composerMode && canMutateWorkflows ? (
            <Panel
              title={composerMode === 'edit' ? 'Edit Workflow' : 'Create Workflow'}
              eyebrow="Structured workflow record"
              className="minimal-panel"
            >
              <div className="workflow-form workflow-detail-scroll" key={fileInputRevision}>
                <label className="workflow-field">
                  <span>Title</span>
                  <input
                    type="text"
                    value={composer.title}
                    onChange={(event) =>
                      setComposer((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Workflow title"
                  />
                </label>

                <label className="workflow-field">
                  <span>Description</span>
                  <textarea
                    rows={4}
                    value={composer.description}
                    onChange={(event) =>
                      setComposer((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="What the workflow does and why it exists"
                  />
                </label>

                <div className="workflow-field">
                  <span>Tools Used</span>
                  <div className="workflow-tool-entry">
                    <input
                      type="text"
                      value={composer.pendingTool}
                      onChange={(event) =>
                        setComposer((current) => ({ ...current, pendingTool: event.target.value }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addTool()
                        }
                      }}
                      placeholder="Add a tool"
                    />
                    <button type="button" className="command-button secondary" onClick={addTool}>
                      Add Tool
                    </button>
                  </div>
                  <div className="chip-row compact">
                    {composer.toolsUsed.map((tool) => (
                      <button
                        key={tool}
                        type="button"
                        className="data-chip workflow-chip-button"
                        onClick={() => removeTool(tool)}
                      >
                        {tool}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="workflow-field">
                  <span>Architecture</span>
                  <textarea
                    rows={5}
                    value={composer.architecture}
                    onChange={(event) =>
                      setComposer((current) => ({ ...current, architecture: event.target.value }))
                    }
                    placeholder="Describe the trigger, processing steps, storage, and outputs"
                  />
                </label>

                <div className="workflow-field-grid">
                  <label className="workflow-field">
                    <span>Excalidraw Source</span>
                    <input
                      type="file"
                      accept=".excalidraw"
                      onChange={(event) =>
                        setComposer((current) => ({
                          ...current,
                          diagramSourceFile: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                    <small>
                      {composer.diagramSourceFile?.name ??
                        (composerMode === 'edit'
                          ? selectedWorkflow?.diagramSource.fileName
                          : 'Required')}
                    </small>
                  </label>

                  <label className="workflow-field">
                    <span>Preview Image</span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(event) =>
                        setComposer((current) => ({
                          ...current,
                          diagramPreviewFile: event.target.files?.[0] ?? null,
                        }))
                      }
                    />
                    <small>
                      {composer.diagramPreviewFile?.name ??
                        (composerMode === 'edit'
                          ? selectedWorkflow?.diagramPreview.fileName
                          : 'Required')}
                    </small>
                  </label>
                </div>

                <div className="workflow-field-grid">
                  <label className="workflow-field">
                    <span>ZIP Bundle</span>
                    <input
                      type="file"
                      accept=".zip,application/zip"
                      onChange={(event) =>
                        setComposer((current) => ({
                          ...current,
                          zipFile: event.target.files?.[0] ?? null,
                          removeZip: false,
                        }))
                      }
                    />
                    <small>
                      {composer.zipFile?.name ??
                        (composerMode === 'edit'
                          ? selectedWorkflow?.zipAsset?.fileName ?? 'Optional'
                          : 'Optional')}
                    </small>
                  </label>

                  {composerMode === 'edit' && selectedWorkflow?.zipAsset ? (
                    <label className="workflow-toggle">
                      <input
                        type="checkbox"
                        checked={composer.removeZip}
                        onChange={(event) =>
                          setComposer((current) => ({
                            ...current,
                            removeZip: event.target.checked,
                            zipFile: event.target.checked ? null : current.zipFile,
                          }))
                        }
                      />
                      <span>Remove current ZIP attachment</span>
                    </label>
                  ) : (
                    <div className="workflow-toggle workflow-toggle-placeholder">
                      <span>ZIP attachments remain optional.</span>
                    </div>
                  )}
                </div>

                {formError ? <p className="workflow-feedback workflow-feedback-error">{formError}</p> : null}
                {formMessage ? <p className="workflow-feedback">{formMessage}</p> : null}

                <div className="command-row compact">
                  <button
                    type="button"
                    className="command-button primary"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving
                      ? 'Saving...'
                      : composerMode === 'edit'
                        ? 'Save Changes'
                        : 'Create Workflow'}
                  </button>
                  <button
                    type="button"
                    className="command-button secondary"
                    onClick={cancelComposer}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Panel>
          ) : null}
        </div>
      ) : composerMode ? (
        <Panel
          title="Create Workflow"
          eyebrow="Structured workflow record"
          className="minimal-panel"
        >
          <div className="workflow-form workflow-detail-scroll" key={fileInputRevision}>
            <label className="workflow-field">
              <span>Title</span>
              <input
                type="text"
                value={composer.title}
                onChange={(event) =>
                  setComposer((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Workflow title"
              />
            </label>

            <label className="workflow-field">
              <span>Description</span>
              <textarea
                rows={4}
                value={composer.description}
                onChange={(event) =>
                  setComposer((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="What the workflow does and why it exists"
              />
            </label>

            <div className="workflow-field">
              <span>Tools Used</span>
              <div className="workflow-tool-entry">
                <input
                  type="text"
                  value={composer.pendingTool}
                  onChange={(event) =>
                    setComposer((current) => ({ ...current, pendingTool: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addTool()
                    }
                  }}
                  placeholder="Add a tool"
                />
                <button type="button" className="command-button secondary" onClick={addTool}>
                  Add Tool
                </button>
              </div>
              <div className="chip-row compact">
                {composer.toolsUsed.map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    className="data-chip workflow-chip-button"
                    onClick={() => removeTool(tool)}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>

            <label className="workflow-field">
              <span>Architecture</span>
              <textarea
                rows={5}
                value={composer.architecture}
                onChange={(event) =>
                  setComposer((current) => ({ ...current, architecture: event.target.value }))
                }
                placeholder="Describe the trigger, processing steps, storage, and outputs"
              />
            </label>

            <div className="workflow-field-grid">
              <label className="workflow-field">
                <span>Excalidraw Source</span>
                <input
                  type="file"
                  accept=".excalidraw"
                  onChange={(event) =>
                    setComposer((current) => ({
                      ...current,
                      diagramSourceFile: event.target.files?.[0] ?? null,
                    }))
                  }
                />
                <small>
                  {composer.diagramSourceFile?.name ?? 'Required'}
                </small>
              </label>

              <label className="workflow-field">
                <span>Preview Image</span>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(event) =>
                    setComposer((current) => ({
                      ...current,
                      diagramPreviewFile: event.target.files?.[0] ?? null,
                    }))
                  }
                />
                <small>
                  {composer.diagramPreviewFile?.name ?? 'Required'}
                </small>
              </label>
            </div>

            <div className="workflow-field-grid">
              <label className="workflow-field">
                <span>ZIP Bundle</span>
                <input
                  type="file"
                  accept=".zip,application/zip"
                  onChange={(event) =>
                    setComposer((current) => ({
                      ...current,
                      zipFile: event.target.files?.[0] ?? null,
                      removeZip: false,
                    }))
                  }
                />
                <small>
                  {composer.zipFile?.name ?? 'Optional'}
                </small>
              </label>

              <div className="workflow-toggle workflow-toggle-placeholder">
                <span>ZIP attachments remain optional.</span>
              </div>
            </div>

            {formError ? <p className="workflow-feedback workflow-feedback-error">{formError}</p> : null}
            {formMessage ? <p className="workflow-feedback">{formMessage}</p> : null}

            <div className="command-row compact">
              <button
                type="button"
                className="command-button primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : composerMode === 'edit' ? 'Save Changes' : 'Create Workflow'}
              </button>
              <button type="button" className="command-button secondary" onClick={cancelComposer}>
                Cancel
              </button>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel title="Select A Workflow" eyebrow="Minimal selection stage" className="minimal-panel">
          <div className="workflow-selection-empty">
            <strong>Choose a workflow card to open its details.</strong>
            <span>The detail surface stays hidden until you select one.</span>
          </div>
        </Panel>
      )}

      {isPreviewOpen && selectedWorkflow?.diagramPreview.previewUrl ? (
        <div
          className="workflow-preview-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedWorkflow.title} preview`}
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="workflow-preview-modal-frame"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="command-button secondary workflow-preview-close"
              onClick={() => setIsPreviewOpen(false)}
            >
              Close
            </button>
            <img
              src={selectedWorkflow.diagramPreview.previewUrl}
              alt={`${selectedWorkflow.title} large workflow preview`}
              className="workflow-preview-modal-image"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
