import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PrivateRoute } from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SelectedPatientProvider } from './contexts/SelectedPatientContext';
import { initializeSupabase } from './lib/supabase';

// Lazy load pages
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })));
const Terms = lazy(() => import('./pages/Terms').then(module => ({ default: module.Terms })));
const Privacy = lazy(() => import('./pages/Privacy').then(module => ({ default: module.Privacy })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Patients = lazy(() => import('./pages/Patients').then(module => ({ default: module.Patients })));
// const Appointments = lazy(() => import('./pages/Appointments').then(module => ({ default: module.Appointments })));
const CIE10 = lazy(() => import('./pages/CIE10').then(module => ({ default: module.CIE10 })));
const CitasPage = lazy(() => import('./pages/CitasPage').then(module => ({ default: module.CitasPage })));
const Calendar = lazy(() => import('./pages/Calendar').then(module => ({ default: module.Calendar })));
const Agenda = lazy(() => import('./modules/agenda/Agenda').then(module => ({ default: module.Agenda })));
const ClinicalHistory = lazy(() => import('./pages/ClinicalHistory').then(module => ({ default: module.ClinicalHistory })));
const ClinicalEvolution = lazy(() => import('./pages/ClinicalEvolution').then(module => ({ default: module.ClinicalEvolution })));
const Prescriptions = lazy(() => import('./pages/Prescriptions').then(module => ({ default: module.Prescriptions })));
const Somatometry = lazy(() => import('./pages/Somatometry').then(module => ({ default: module.Somatometry })));
const PatientFilesPage = lazy(() => import('./pages/PatientFilesPage').then(module => ({ default: module.PatientFilesPage })));
const Users = lazy(() => import('./pages/Users').then(module => ({ default: module.Users })));
const BusinessUnits = lazy(() => import('./modules/clinica/BusinessUnits').then(module => ({ default: module.BusinessUnits })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const InsuranceManagement = lazy(() => import('./pages/InsuranceManagement').then(module => ({ default: module.InsuranceManagement })));
const LogoutTestPage = lazy(() => import('./pages/LogoutTestPage'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
  useEffect(() => {
    initializeSupabase();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <SelectedPatientProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/logout-test" element={<LogoutTestPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/register" element={<Register />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />                
                <Route path="/" element={
                  <PrivateRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/patients" element={
                  <PrivateRoute>
                    <Layout>
                      <Patients />
                    </Layout>
                  </PrivateRoute>
                } />
                
                {/* 
                <Route path="/appointments" element={
                  <PrivateRoute>
                    <Layout>
                      <Appointments />
                    </Layout>
                  </PrivateRoute>
                } />
                */}
                
                <Route path="/cie10" element={
                  <PrivateRoute>
                    <Layout>
                      <CIE10 />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/citas" element={
                  <PrivateRoute>
                    <Layout>
                      <CitasPage />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/calendar" element={
                  <PrivateRoute>
                    <Layout>
                      <Calendar />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/agenda/agenda" element={
                  <PrivateRoute>
                    <Layout>
                      <Agenda />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/clinical-history" element={
                  <PrivateRoute>
                    <Layout>
                      <ClinicalHistory />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/clinical-evolution" element={
                  <PrivateRoute>
                    <Layout>
                      <ClinicalEvolution />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/prescriptions" element={
                  <PrivateRoute>
                    <Layout>
                      <Prescriptions />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/somatometry" element={
                  <PrivateRoute>
                    <Layout>
                      <Somatometry />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/patient-files" element={
                  <PrivateRoute>
                    <Layout>
                      <PatientFilesPage />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/clinica" element={
                  <PrivateRoute>
                    <Layout>
                      <BusinessUnits />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/users" element={
                  <PrivateRoute>
                    <Layout>
                      <Users />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/insurance" element={
                  <PrivateRoute>
                    <Layout>
                      <InsuranceManagement />
                    </Layout>
                  </PrivateRoute>
                } />
                
                <Route path="/settings" element={
                  <PrivateRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </PrivateRoute>
                } />
              </Routes>
            </Suspense>
          </SelectedPatientProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;