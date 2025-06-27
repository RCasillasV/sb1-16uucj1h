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
const LogoutTestPage = lazy(() => import('./pages/LogoutTestPage').then(module => ({ default: module.LogoutTestPage })));


function App() {
  return (
    <div style={{ backgroundColor: 'lightblue', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h1>¡Hola, DoctorSoft!</h1>
      {/* Aquí agregas el componente LogoutTestPage */}
      <LogoutTestPage />
    </div>
  );
}

export default App;