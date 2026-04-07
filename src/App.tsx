import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CortexProvider } from '@/context/CortexContext'
import { AppLayout } from '@/components/AppLayout'
import { OverviewPage } from '@/pages/OverviewPage'
import { AgentsPage } from '@/pages/AgentsPage'
import { MemoriesPage } from '@/pages/MemoriesPage'
import { SchedulesPage } from '@/pages/SchedulesPage'
import { SystemLogsPage } from '@/pages/SystemLogsPage'

function App() {
  return (
    <CortexProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="marketing" element={<Navigate to="/agents" replace />} />
            <Route path="memories" element={<MemoriesPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="system" element={<SystemLogsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </CortexProvider>
  )
}

export default App
