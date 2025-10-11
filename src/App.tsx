import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PrivateRoute } from './components/PrivateRoute';
import { AgendaWrapper } from './components/AgendaWrapper';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SelectedPatientProvider } from './contexts/SelectedPatientContext';
import { UserManagementProvider } from './contexts/UserManagementContext';

// Import pages for immediate load
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { Register } from './pages/Register';

// Lazy load non-critical pages
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CitasPage = lazy(() => import('./pages/CitasPage').then(m => ({ default: m.CitasPage })));
const Patients = lazy(() => import('./pages/Patients').then(m => ({ default: m.Patients })));
const Appointments = lazy(() => import('./pages/AppointmentsNew').then(m => ({ default: m.AppointmentsNew})));
const CIE10 = lazy(() => import('./pages/CIE10').then(m => ({ default: m.CIE10 })));
const Calendar = lazy(() => import('./pages/Calendar').then(m => ({ default: m.Calendar })));
const Agenda = lazy(() => import('./modules/agenda/Agenda').then(m => ({ default: m.Agenda })));
const ClinicalEvolution = lazy(() => import('./pages/ClinicalEvolution'));
const Prescriptions = lazy(() => import('./pages/Prescriptions').then(m => ({ default: m.Prescriptions })));
const Somatometry = lazy(() => import('./pages/Somatometry').then(m => ({ default: m.Somatometry })));
const GrowthCharts = lazy(() => import('./pages/GrowthCharts'));
const PatientFilesPage = lazy(() => import('./pages/PatientFilesPage').then(m => ({ default: m.PatientFilesPage })));
const AntecedentesNoPatologicos = lazy(() => import('./pages/AntecedentesNoPatologicos').then(m => ({ default: m.AntecedentesNoPatologicos })));
const HeredoFamHistory = lazy(() => import('./pages/HeredoFamHistory').then(m => ({ default: m.HeredoFamHistory })));
const PathologicalHistory = lazy(() => import('./pages/PathologicalHistory').then(m => ({ default: m.PathologicalHistory })));
const GynecoObstetricHistory = lazy(() => import('./pages/GynecoObstetricHistory').then(m => ({ default: m.GynecoObstetricHistory })));
const Users = lazy(() => import('./pages/Users').then(m => ({ default: m.Users })));
const BusinessUnits = lazy(() => import('./modules/clinica/BusinessUnits').then(m => ({ default: m.BusinessUnits })));
const Settings = lazy(() => import('./pages/Settings'));
const InsuranceManagement = lazy(() => import('./pages/InsuranceManagement').then(m => ({ default: m.InsuranceManagement })));
const VaccineManagement = lazy(() => import('./pages/VaccineManagement').then(m => ({ default: m.VaccineManagement })));
const PatientReportPage = lazy(() => import('./pages/PatientReportPage').then(m => ({ default: m.PatientReportPage })));
const ScheduleConfiguration = lazy(() => import('./pages/ScheduleConfiguration').then(m => ({ default: m.ScheduleConfiguration })));
const PatologiesManagement = lazy(() => import('./pages/PatologiesManagement').then(m => ({ default: m.PatologiesManagement })));
const ActivityPage = lazy(() => import('./pages/ActivityPage').then(m => ({ default: m.ActivityPage })));
const VitalSigns = lazy(() => import('./pages/VitalSigns').then(m => ({ default: m.VitalSigns })));
const VitalSignsCatalog = lazy(() => import('./pages/VitalSignsCatalog').then(m => ({ default: m.VitalSignsCatalog })));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-gray-600">Cargando DoctorSoft...</p>
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* Private Routes */}
      <Route path="/" element={<PrivateRoute><Layout><Dashboard/></Layout></PrivateRoute>} />
      <Route path="/citas" element={<PrivateRoute><AgendaWrapper><Layout><CitasPage /></Layout></AgendaWrapper></PrivateRoute>} />
      <Route path="/patients" element={<PrivateRoute><Layout><Patients /></Layout></PrivateRoute>} />
      <Route path="/appointments" element={<PrivateRoute><Layout><Appointments/></Layout></PrivateRoute>} />
      <Route path="/cie10" element={<PrivateRoute><Layout><CIE10 /></Layout></PrivateRoute>} />
      <Route path="/calendar" element={<PrivateRoute><Layout><Calendar /></Layout></PrivateRoute>} />
      <Route path="/agenda/agenda" element={<PrivateRoute><AgendaWrapper><Layout><Agenda /></Layout></AgendaWrapper></PrivateRoute>} />
      <Route path="/clinical-evolution" element={<PrivateRoute><Layout><ClinicalEvolution /></Layout></PrivateRoute>} />
      <Route path="/prescriptions" element={<PrivateRoute><Layout><Prescriptions /></Layout></PrivateRoute>} />
      <Route path="/somatometry" element={<PrivateRoute><Layout><Somatometry /></Layout></PrivateRoute>} />
      <Route path="/growth-charts" element={<PrivateRoute><Layout><GrowthCharts /></Layout></PrivateRoute>} />
      <Route path="/patient-files" element={<PrivateRoute><Layout><PatientFilesPage /></Layout></PrivateRoute>} />
      <Route path="/antecedentes-no-patologicos" element={<PrivateRoute><Layout><AntecedentesNoPatologicos /></Layout></PrivateRoute>} />
      <Route path="/heredo-familial-history" element={<PrivateRoute><Layout><HeredoFamHistory /></Layout></PrivateRoute>} />
      <Route path="/pathological-history" element={<PrivateRoute><Layout><PathologicalHistory /></Layout></PrivateRoute>} />
      <Route path="/gyneco-obstetric-history" element={<PrivateRoute><Layout><GynecoObstetricHistory /></Layout></PrivateRoute>} />
      <Route path="/clinica" element={<PrivateRoute><Layout><BusinessUnits /></Layout></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><Layout><Users /></Layout></PrivateRoute>} />
      <Route path="/insurance" element={<PrivateRoute><Layout><InsuranceManagement /></Layout></PrivateRoute>} />
      <Route path="/vaccines" element={<PrivateRoute><Layout><VaccineManagement /></Layout></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Layout><Settings /></Layout></PrivateRoute>} />
      <Route path="/settings/schedule" element={<PrivateRoute><AgendaWrapper><Layout><ScheduleConfiguration /></Layout></AgendaWrapper></PrivateRoute>} />
      <Route path="/settings/patologias" element={<PrivateRoute><Layout><PatologiesManagement /></Layout></PrivateRoute>} />
      <Route path="/activity" element={<PrivateRoute><Layout><ActivityPage /></Layout></PrivateRoute>} />
      <Route path="/vital-signs" element={<PrivateRoute><Layout><VitalSigns /></Layout></PrivateRoute>} />
      <Route path="/vital-signs-catalog" element={<PrivateRoute><Layout><VitalSignsCatalog /></Layout></PrivateRoute>} />
      <Route path="/patient-report/:id" element={<PrivateRoute><PatientReportPage /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

function App() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-red-600 mb-4">Error de autenticación: {error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Re intentar
        </button>
      </div>
    );
  }

  // Dejar que el router y PrivateRoute manejen la autenticación
  return (
    <ThemeProvider>
      <SelectedPatientProvider>
        <UserManagementProvider>
          <AppRoutes />
        </UserManagementProvider>
      </SelectedPatientProvider>
    </ThemeProvider>
  );
}

export default App;