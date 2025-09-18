import React, { useEffect, lazy, Suspense, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PrivateRoute } from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SelectedPatientProvider } from './contexts/SelectedPatientContext';
import { UserManagementProvider } from './contexts/UserManagementContext';
import { AgendaProvider } from './contexts/AgendaContext';

// Lazy load pages
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const LogoutTestPage = lazy(() => import('./pages/LogoutTestPage'));

const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })));
const Terms = lazy(() => import('./pages/Terms').then(module => ({ default: module.Terms })));
const Privacy = lazy(() => import('./pages/Privacy').then(module => ({ default: module.Privacy })));

const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const CitasPage = lazy(() => import('./pages/CitasPage').then(module => ({ default: module.CitasPage })));

const Patients = lazy(() => import('./pages/Patients').then(module => ({ default: module.Patients })));
const Appointments = lazy(() => import('./pages/Appointments').then(module => ({ default: module.Appointments}))); 
const CIE10 = lazy(() => import('./pages/CIE10').then(module => ({ default: module.CIE10 })));

const Calendar = lazy(() => import('./pages/Calendar').then(module => ({ default: module.Calendar })));
const Agenda = lazy(() => import('./modules/agenda/Agenda').then(module => ({ default: module.Agenda })));
const ClinicalEvolution = lazy(() => import('./pages/ClinicalEvolution'));
const Prescriptions = lazy(() => import('./pages/Prescriptions').then(module => ({ default: module.Prescriptions })));
const Somatometry = lazy(() => import('./pages/Somatometry').then(module => ({ default: module.Somatometry })));
const PatientFilesPage = lazy(() => import('./pages/PatientFilesPage').then(module => ({ default: module.PatientFilesPage })));
const AntecedentesNoPatologicos = lazy(() => import('./pages/AntecedentesNoPatologicos').then(module => ({ default: module.AntecedentesNoPatologicos })));
const HeredoFamHistory = lazy(() => import('./pages/HeredoFamHistory').then(module => ({ default: module.HeredoFamHistory })));
const PathologicalHistory = lazy(() => import('./pages/PathologicalHistory').then(module => ({ default: module.PathologicalHistory })));
const GynecoObstetricHistory = lazy(() => import('./pages/GynecoObstetricHistory').then(module => ({ default: module.GynecoObstetricHistory })));
const Users = lazy(() => import('./pages/Users').then(module => ({ default: module.Users })));
const BusinessUnits = lazy(() => import('./modules/clinica/BusinessUnits').then(module => ({ default: module.BusinessUnits })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const InsuranceManagement = lazy(() => import('./pages/InsuranceManagement').then(module => ({ default: module.InsuranceManagement })));
const PatientReportPage = lazy(() => import('./pages/PatientReportPage').then(module => ({ default: module.PatientReportPage })));
const ScheduleConfiguration = lazy(() => import('./pages/ScheduleConfiguration').then(module => ({ default: module.ScheduleConfiguration })));
const PatologiesManagement = lazy(() => import('./pages/PatologiesManagement').then(module => ({ default: module.PatologiesManagement })));

// Loading fallback
const PageLoader = () => {
  return (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-gray-600">Cargando DoctorSoft...</p>
  </div>
  );
};

// Componente interno que tiene acceso a useNavigate y useAuth
function AppContent() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [initError, setInitError] = useState<Error | null>(null);
  
  // Si hay un error de inicialización
  if (initError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error de Conexión</h2>
          <div className="bg-red-50 p-4 rounded-md mb-4">
            <p className="text-red-800 font-medium">{initError.message}</p>
          </div>
          <p className="text-gray-600 mb-4">
            No se pudo conectar con el servicio de Supabase. Por favor, verifica tu conexión a internet y las credenciales en el archivo .env.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  console.log('AppContent: Rendering main application content');
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/logout-test" element={<LogoutTestPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout>
              <Dashboard/>
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
           
        
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/patient-report/:id" element={
          <PrivateRoute>
            <PatientReportPage />
          </PrivateRoute>
        } />

           
        <Route path="/pathological-history" element={
          <PrivateRoute>
            <Layout>
              <PathologicalHistory />
            </Layout>
          </PrivateRoute>
        } />
            
        <Route path="/gyneco-obstetric-history" element={
          <PrivateRoute>
            <Layout>
              <GynecoObstetricHistory />
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
            
       <Route path="/appointments" element={
          <PrivateRoute>
            <Layout>
              <Appointments/>
            </Layout>
          </PrivateRoute>
        } />
 
            
        <Route path="/cie10" element={
          <PrivateRoute>
            <Layout>
              <CIE10 />
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
            
        <Route path="/antecedentes-no-patologicos" element={
          <PrivateRoute>
            <Layout>
              <AntecedentesNoPatologicos />
            </Layout>
          </PrivateRoute>
        } />
            
        <Route path="/heredo-familial-history" element={
          <PrivateRoute>
            <Layout>
              <HeredoFamHistory />
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
            
        <Route path="/settings/schedule" element={
          <PrivateRoute>
            <Layout>
              <ScheduleConfiguration />
            </Layout>
          </PrivateRoute>
        } />
            
        <Route path="/settings/patologias" element={
          <PrivateRoute>
            <Layout>
              <PatologiesManagement />
            </Layout>
          </PrivateRoute>
        } />
         
            

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  //console.log('App component started rendering');

  return (
    
      <AuthProvider>
        <ThemeProvider>
          <SelectedPatientProvider>
            <UserManagementProvider>
              <AgendaProvider>
                <AppContent />
              </AgendaProvider>
            </UserManagementProvider>
          </SelectedPatientProvider>
        </ThemeProvider>
      </AuthProvider>
    
  );
}

export default App;