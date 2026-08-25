/**
 * App root — includes Phase 5 team formation routes.
 *
 * Critical route order:
 *   /hackathons/:hackathonId/teams/create  (before /hackathons/:id)
 *   /hackathons/:hackathonId/teams
 *   /hackathons/:id
 *   /teams/:id
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './hooks/useTheme'
import { AuthProvider } from './context/AuthContext'
import { ProfileProvider } from './context/ProfileContext'
import { NotificationProvider } from './context/NotificationContext'
import RootLayout from './components/layout/RootLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import EditProfile from './pages/EditProfile'
import Profile from './pages/Profile'
import MyTeams from './pages/MyTeams'
import Hackathons from './pages/Hackathons'
import HackathonDetails from './pages/HackathonDetails'
import HackathonTeams from './pages/HackathonTeams'
import CreateTeam from './pages/CreateTeam'
import TeamDetails from './pages/TeamDetails'
import Bookmarks from './pages/Bookmarks'
import AdminHackathons from './pages/AdminHackathons'
import FindTeammates from './pages/FindTeammates'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<RootLayout />}>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />

                  <Route
                    path="/profile/edit"
                    element={
                      <ProtectedRoute>
                        <EditProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/profile" element={<Navigate to="/profile/edit" replace />} />
                  <Route path="/profile/:id" element={<Profile />} />

                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/find-teammates"
                    element={
                      <ProtectedRoute>
                        <FindTeammates />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hackathons"
                    element={
                      <ProtectedRoute>
                        <Hackathons />
                      </ProtectedRoute>
                    }
                  />
                  {/* Phase 5 — must be before /hackathons/:id */}
                  <Route
                    path="/hackathons/:hackathonId/teams/create"
                    element={
                      <ProtectedRoute>
                        <CreateTeam />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hackathons/:hackathonId/teams"
                    element={
                      <ProtectedRoute>
                        <HackathonTeams />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hackathons/:id"
                    element={
                      <ProtectedRoute>
                        <HackathonDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/teams/:id"
                    element={
                      <ProtectedRoute>
                        <TeamDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-teams"
                    element={
                      <ProtectedRoute>
                        <MyTeams />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/teams" element={<Navigate to="/my-teams" replace />} />
                  <Route
                    path="/bookmarks"
                    element={
                      <ProtectedRoute>
                        <Bookmarks />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/hackathons"
                    element={
                      <ProtectedRoute>
                        <AdminHackathons />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
