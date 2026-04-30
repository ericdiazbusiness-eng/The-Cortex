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
            <Route index element={<OverviewPage />} />
            <Route path="missions" element={<Navigate to="/business/zibz" replace />} />
            <Route path="zibz" element={<ZibzPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="workflows" element={<WorkflowsPage />} />
            <Route path="operations" element={<OperationsPage />} />
            <Route path="economy" element={<EconomyPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="studio" element={<StudioPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
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
