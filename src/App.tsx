import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { SelectedPatientProvider } from './contexts/SelectedPatientContext';
import { initializeSupabase } from './lib/supabase';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Patients = lazy(() => import('./pages/Patients').then(module => ({ default: module.Patients })));
const Appointments = lazy(() => import('./pages/Appointments').then(module => ({ default: module.Appointments })));
const Calendar = lazy(() => import('./pages/Calendar').then(module => ({ default: module.Calendar })));
const Agenda2 = lazy(() => import('./pages/Agenda2').then(module => ({ default: module.Agenda2 })));
const ClinicalHistory = lazy(() => import('./pages/ClinicalHistory').then(module => ({ default: module.ClinicalHistory })));
const ClinicalEvolution = lazy(() => import('./pages/ClinicalEvolution').then(module => ({ default: module.ClinicalEvolution })));
const Prescriptions = lazy(() => import('./pages/Prescriptions').then(module => ({ default: module.Prescriptions })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

function AppRoutes() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          
          <Route path="/patients" element={
            <Layout>
              <Patients />
            </Layout>
          } />
          
          <Route path="/appointments" element={
            <Layout>
              <Appointments />
            </Layout>
          } />

          <Route path="/calendar" element={
            <Layout>
              <Calendar />
            </Layout>
          } />

          <Route path="/agenda2" element={
            <Layout>
              <Agenda2 />
            </Layout>
          } />
          
          <Route path="/clinical-history" element={
            <Layout>
              <ClinicalHistory />
            </Layout>
          } />
          
          <Route path="/clinical-evolution" element={
            <Layout>
              <ClinicalEvolution />
            </Layout>
          } />
          
          <Route path="/prescriptions" element={
            <Layout>
              <Prescriptions />
            </Layout>
          } />
          
          <Route path="/settings" element={
            <Layout>
              <Settings />
            </Layout>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
}

function App() {
  useEffect(() => {
    initializeSupabase();
  }, []);

  return (
    <ThemeProvider>
      <SelectedPatientProvider>
        <AppRoutes />
      </SelectedPatientProvider>
    </ThemeProvider>
  );
}

export default App;