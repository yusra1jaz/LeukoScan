import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "@/pages/Index";
import AIDiagnosis from "@/pages/AIDiagnosis";
import ChatbotFinal from "@/pages/ChatbotFinal";
import HospitalLocator from "@/pages/HospitalLocator";
import MedicationGuide from "@/pages/MedicationGuide";
import Explainability from "@/pages/Explainability";
import FAQs from "@/pages/FAQs";
import SymptomTracker from "@/pages/SymptomTracker";
import Appointment from "@/pages/Appointment";
import DoctorBooking from "@/pages/DoctorBooking";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import DoctorSignup from "@/pages/DoctorSignup";
import ForgotPassword from "@/pages/ForgotPassword";
import NotFound from "@/pages/NotFound";
import LoginTest from "@/debug/LoginTest";

// Admin Pages
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import ManageDoctors from "@/pages/Admin/ManageDoctors";
import ManagePatients from "@/pages/Admin/ManagePatients";
import AdminManagement from "@/pages/Admin/AdminManagement";
import PatientAssessment from "@/pages/Admin/PatientAssessment";
import AdminSettings from "@/pages/Admin/Settings";
import EditDoctor from "@/pages/Admin/EditDoctor";
import AddDoctor from "@/pages/Admin/AddDoctor";
import RequestDoctor from "@/pages/Admin/RequestDoctor";

// Doctor Pages
import DoctorDashboard from "@/pages/Doctor/DoctorDashboard";
import DoctorPatientInfo from "@/pages/Doctor/PatientInfo";
import DoctorPatientAssessment from "@/pages/Doctor/DoctorPatientAssessment";
import DoctorPatientSymptoms from "@/pages/Doctor/DoctorPatientSymptoms";
import DoctorPatientSymptomTracker from "@/pages/Doctor/DoctorPatientSymptomTracker";
import DoctorReports from "@/pages/Doctor/DoctorReports";
import DoctorCreateReport from "@/pages/Doctor/DoctorCreateReport";
import DoctorPatientReports from "@/pages/Doctor/DoctorPatientReports";
import DoctorSettings from "@/pages/Doctor/DoctorSettings";
import DoctorAppointments from "@/pages/Doctor/Appointments";

// Patient Pages
import ManageAccount from "@/pages/patient/ManageAccount";
import PatientReports from "@/pages/PatientReports";

const queryClient = new QueryClient();

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const hideChrome = location.pathname === "/login" || location.pathname === "/signup";

  console.log('AppRoutes render:', { user: user?.username, role: user?.role, loading, path: location.pathname });

  // Handle navigation when user authenticates on login page
  useEffect(() => {
    if (user && !loading && location.pathname === "/login") {
      console.log('AppRoutes: User authenticated on login page, navigating to:', user.role);
      console.log('AppRoutes: Current pathname before navigation:', location.pathname);
      
      // Add a small delay to ensure state is settled
      setTimeout(() => {
        console.log('AppRoutes: Executing navigation after delay...');
        if (user.role === "admin") {
          console.log('AppRoutes: Navigating to /admin/dashboard');
          navigate("/admin/dashboard", { replace: true });
        } else if (user.role === "doctor") {
          console.log('AppRoutes: Navigating to /doctor/dashboard');
          navigate("/doctor/dashboard", { replace: true });
        } else {
          console.log('AppRoutes: Navigating to / (home page)');
          navigate("/", { replace: true });
        }
      }, 100);
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground">
      {!hideChrome && <Navbar />}
      <main className="flex-1 w-full">
        <Routes>
          {!user ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/signup/doctor" element={<DoctorSignup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ForgotPassword />} />
              <Route path="/debug-login" element={<LoginTest />} />
                            <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={
                <ProtectedRoute>
                  {user.role === "admin" ? <Navigate to="/admin/dashboard" replace /> :
                   user.role === "doctor" ? <Navigate to="/doctor/dashboard" replace /> :
                   <Index />}
                </ProtectedRoute>
              } />

              {/* Admin routes */}
              {user.role === "admin" && (
                <>
                  <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/manage-doctors" element={<ProtectedRoute><ManageDoctors /></ProtectedRoute>} />
                  <Route path="/admin/manage-patients" element={<ProtectedRoute><ManagePatients /></ProtectedRoute>} />
                  <Route path="/admin/admin-management" element={<ProtectedRoute><AdminManagement /></ProtectedRoute>} />
                  <Route path="/admin/patient/:id" element={<ProtectedRoute><PatientAssessment /></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
                  <Route path="/admin/edit-doctor/:id" element={<ProtectedRoute><EditDoctor /></ProtectedRoute>}/>
                  <Route path="/admin/add-doctor" element={<ProtectedRoute><AddDoctor /></ProtectedRoute>} />
                  <Route path="/admin/request-doctor" element={<ProtectedRoute><RequestDoctor /></ProtectedRoute>} />
                </>
              )}

              {/* Doctor routes */}
              {user.role === "doctor" && (
                <>
                  <Route path="/doctor/dashboard" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
                  <Route path="/doctor/patient-info" element={<ProtectedRoute><DoctorPatientInfo /></ProtectedRoute>} />
                  <Route path="/doctor/patient/:id" element={<ProtectedRoute><DoctorPatientAssessment /></ProtectedRoute>} />
                  <Route path="/doctor/patient-symptoms" element={<ProtectedRoute><DoctorPatientSymptomTracker /></ProtectedRoute>} />
                  <Route path="/doctor/patient-symptoms/:id" element={<ProtectedRoute><DoctorPatientSymptomTracker /></ProtectedRoute>} />
                  <Route path="/doctor/settings" element={<ProtectedRoute><DoctorSettings /></ProtectedRoute>} />
                  <Route path="/doctor/reports" element={<ProtectedRoute><DoctorReports /></ProtectedRoute>} />
                  <Route path="/doctor/create-report/:id" element={<ProtectedRoute><DoctorCreateReport /></ProtectedRoute>} />
                  <Route path="/doctor/patient-reports/:id" element={<ProtectedRoute><DoctorPatientReports /></ProtectedRoute>} />
                  <Route path="/doctor/appointments" element={<ProtectedRoute><DoctorAppointments /></ProtectedRoute>} />
                </>
              )}

              {/* Common routes */}
              <Route path="/ai-diagnosis" element={<ProtectedRoute><AIDiagnosis /></ProtectedRoute>} />
              <Route path="/chatbot" element={<ProtectedRoute><ChatbotFinal /></ProtectedRoute>} />
              <Route path="/hospital-locator" element={<ProtectedRoute><HospitalLocator /></ProtectedRoute>} />
              <Route path="/medication-guide" element={<ProtectedRoute><MedicationGuide /></ProtectedRoute>} />
              <Route path="/appointment" element={<ProtectedRoute><Appointment /></ProtectedRoute>} />
              <Route path="/patient-reports" element={<ProtectedRoute><PatientReports /></ProtectedRoute>} />
              <Route path="/explainability" element={<ProtectedRoute><Explainability /></ProtectedRoute>} />
              <Route path="/faqs" element={<ProtectedRoute><FAQs /></ProtectedRoute>} />
              <Route path="/symptom-tracker" element={<ProtectedRoute><SymptomTracker /></ProtectedRoute>} />
              <Route path="/manage-account" element={<ProtectedRoute><ManageAccount /></ProtectedRoute>} />
              <Route path="/patient/requests" element={<ProtectedRoute><Appointment /></ProtectedRoute>} />
              <Route path="/patient/symptoms" element={<ProtectedRoute><SymptomTracker /></ProtectedRoute>} />
              <Route path="/patient/manage-account" element={<ProtectedRoute><ManageAccount /></ProtectedRoute>} />
              <Route path="/doctor-booking/:id" element={<ProtectedRoute><DoctorBooking /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
      </main>
      {!hideChrome && <Footer />}
    </div>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
