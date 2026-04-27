import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CortexProvider } from '@/context/CortexContext'
import { AppLayout } from '@/components/AppLayout'
import { getWorkspaceHomeRoute, resolveStoredWorkspaceContext } from '@/lib/ui-mode'
import { OverviewPage } from '@/pages/OverviewPage'
import { ZibzPage } from '@/pages/ZibzPage'
import { KnowledgePage } from '@/pages/KnowledgePage'
import { WorkflowsPage } from '@/pages/WorkflowsPage'
import { OperationsPage } from '@/pages/OperationsPage'
import { EconomyPage } from '@/pages/EconomyPage'
import { CommunityPage } from '@/pages/CommunityPage'
import { StudioPage } from '@/pages/StudioPage'
import { IntegrationsPage } from '@/pages/IntegrationsPage'
import { RealtimeDebugPage } from '@/pages/RealtimeDebugPage'
import { BusinessOverviewPage } from '@/pages/BusinessOverviewPage'
import { BusinessPlaceholderPage } from '@/pages/BusinessPlaceholderPage'

const businessPlaceholderCopy = {
  knowledge: {
    title: 'Knowledge',
    eyebrow: 'Client memory and operating truth',
    description: 'A business-owner source of truth for clients, proposals, retainers, offers, proof points, and reusable decision context.',
  },
  workflows: {
    title: 'Workflows',
    eyebrow: 'Owner loops and automations',
    description: 'Repeatable proposal, renewal, follow-up, delivery, finance, and relationship loops that reduce owner busywork.',
  },
  operations: {
    title: 'Operations',
    eyebrow: 'Delivery and commitments',
    description: 'A business execution surface for client delivery, handoffs, due dates, owner bottlenecks, and active promises.',
  },
  economy: {
    title: 'Economy',
    eyebrow: 'Cash, margin, and pipeline',
    description: 'Cash flow, invoice timing, pipeline quality, margin, subscriptions, and monthly close signals in one place.',
  },
  community: {
    title: 'Community',
    eyebrow: 'Relationships and referrals',
    description: 'Client, partner, referral, and personal relationship rhythm without noisy CRM overhead.',
  },
  studio: {
    title: 'Studio',
    eyebrow: 'Sales and publishing assets',
    description: 'Proposals, case studies, offer pages, sales decks, and publishing assets tied to active revenue work.',
  },
  integrations: {
    title: 'Integrations',
    eyebrow: 'Tooling and reliability',
    description: 'Inbox, calendar, CRM, docs, finance tooling, and automations kept clean enough for the business owner to trust.',
  },
} as const

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/debug" element={<RealtimeDebugPage />} />
        <Route
          path="/"
          element={
            <CortexProvider>
              <AppLayout />
            </CortexProvider>
          }
        >
          <Route
            index
            element={<Navigate to={getWorkspaceHomeRoute(resolveStoredWorkspaceContext())} replace />}
          />
          <Route path="cortex">
            <Route index element={<OverviewPage />} />
            <Route path="missions" element={<Navigate to="/cortex/zibz" replace />} />
            <Route path="zibz" element={<ZibzPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="workflows" element={<WorkflowsPage />} />
            <Route path="operations" element={<OperationsPage />} />
            <Route path="economy" element={<EconomyPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="studio" element={<StudioPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
          </Route>
          <Route path="business">
            <Route index element={<BusinessOverviewPage />} />
            <Route path="missions" element={<Navigate to="/business/zibz" replace />} />
            <Route path="zibz" element={<ZibzPage />} />
            <Route path="knowledge" element={<BusinessPlaceholderPage {...businessPlaceholderCopy.knowledge} />} />
            <Route path="workflows" element={<BusinessPlaceholderPage {...businessPlaceholderCopy.workflows} />} />
            <Route path="operations" element={<BusinessPlaceholderPage {...businessPlaceholderCopy.operations} />} />
            <Route path="economy" element={<BusinessPlaceholderPage {...businessPlaceholderCopy.economy} />} />
            <Route path="community" element={<BusinessPlaceholderPage {...businessPlaceholderCopy.community} />} />
            <Route path="studio" element={<BusinessPlaceholderPage {...businessPlaceholderCopy.studio} />} />
            <Route path="integrations" element={<BusinessPlaceholderPage {...businessPlaceholderCopy.integrations} />} />
          </Route>
          <Route path="missions" element={<Navigate to="/cortex/missions" replace />} />
          <Route path="zibz" element={<Navigate to="/cortex/zibz" replace />} />
          <Route path="knowledge" element={<Navigate to="/cortex/knowledge" replace />} />
          <Route path="workflows" element={<Navigate to="/cortex/workflows" replace />} />
          <Route path="operations" element={<Navigate to="/cortex/operations" replace />} />
          <Route path="economy" element={<Navigate to="/cortex/economy" replace />} />
          <Route path="community" element={<Navigate to="/cortex/community" replace />} />
          <Route path="studio" element={<Navigate to="/cortex/studio" replace />} />
          <Route path="integrations" element={<Navigate to="/cortex/integrations" replace />} />
          <Route path="*" element={<Navigate to="/cortex" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
