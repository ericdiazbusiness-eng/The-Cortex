import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CortexProvider } from '@/context/CortexContext'
import { AppLayout } from '@/components/AppLayout'
import { OverviewPage } from '@/pages/OverviewPage'
import { AgentsPage } from '@/pages/AgentsPage'
import { MemoriesPage } from '@/pages/MemoriesPage'
import { SchedulesPage } from '@/pages/SchedulesPage'
import { SystemLogsPage } from '@/pages/SystemLogsPage'
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
          <Route index element={<OverviewPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="marketing" element={<Navigate to="/agents" replace />} />
          <Route path="memories" element={<MemoriesPage />} />
          <Route path="schedules" element={<SchedulesPage />} />
          <Route path="system" element={<SystemLogsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
