import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import logo from "../assets/logo.jpg";

interface NavItem {
  name: string;
  href: string;
}

const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const optionsRef = useRef<HTMLDivElement>(null);
  const consultationRef = useRef<HTMLDivElement>(null);
  const consultationButtonRef = useRef<HTMLButtonElement>(null);

  // ------------------ Handle click outside options ------------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setOptionsOpen(false);
      }
      if (consultationRef.current && !consultationRef.current.contains(event.target as Node)) {
        setConsultationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ------------------ Calculate dropdown position ------------------
  useEffect(() => {
    if (consultationOpen && consultationButtonRef.current) {
      const buttonRect = consultationButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + window.scrollY + 8, // 8px margin
        left: buttonRect.left + window.scrollX
      });
    }
  }, [consultationOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleManageAccount = () => {
    setOptionsOpen(false);
    navigate("/manage-account");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      setOptionsOpen(false);
      return;
    }
    
    try {
      await axios.delete("http://localhost:4000/api/users/delete", { withCredentials: true });
      alert("Account deleted successfully");
      logout();
      navigate("/login");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete account");
    } finally {
      setOptionsOpen(false);
    }
  };

  // ---------------- Role-aware Navigation ----------------
  let navigation: NavItem[] = [];
  if (!user) {
    navigation = [];
  } else if (user.role === "admin") {
    navigation = [
      { name: "Dashboard", href: "/admin/dashboard" },
      { name: "Manage Doctors", href: "/admin/manage-doctors" },
      { name: "Manage Patients", href: "/admin/manage-patients" },
      { name: "Admin Management", href: "/admin/admin-management" },
      { name: "Settings", href: "/admin/settings" },
    ];
  } else if (user.role === "doctor") {
    navigation = [
      { name: "Dashboard", href: "/doctor/dashboard" },
      { name: "Patient Info", href: "/doctor/patient-info" },
      { name: "Appointments", href: "/doctor/appointments" },
      { name: "Reports", href: "/doctor/reports" },
      { name: "Settings", href: "/doctor/settings" },
    ];
  } else {
    navigation = [
      { name: "Home", href: "/" },
      { name: "AI Diagnosis", href: "/ai-diagnosis" },
      { name: "Chatbot", href: "/chatbot" },
      { name: "Hospital Locator", href: "/hospital-locator" },
      { name: "Medications", href: "/medication-guide" },
      { name: "Explainability", href: "/explainability" },
      { name: "Symptom Tracker", href: "/symptom-tracker" },
      { name: "FAQs", href: "/faqs" },
    ];
  }
  // --------------------------------------------------------

  // ---------------- Generate random circle color ----------------
  const getRoleColor = (role: string | undefined) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500", 
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
      "bg-teal-500"
    ];
    
    // Generate a consistent random color based on username
    const seed = role ? role.charCodeAt(0) : Math.random() * 1000;
    const colorIndex = seed % colors.length;
    return colors[colorIndex];
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "";
    const names = name.split(" ");
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[1][0]).toUpperCase();
  };

  return (
    <nav className="nav">
      <div className="nav-container">
        {/* Logo */}
        <div className="nav-logo">
          <Link to="/" className="flex items-center space-x-2">
            <img src={logo} alt="Leukoscan Logo" className="w-10 h-10 object-contain" />
            <span className="font-extrabold text-2xl md:text-3xl text-primary tracking-tight">
              Leukoscan
            </span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex nav-items">
          {navigation.map((item, index) => {
            // Show consultation dropdown after "Explainability" (index 5)
            const shouldShowConsultation = user && user.role === 'user' && index === 5;
            
            return (
              <React.Fragment key={item.href}>
                <div className="nav-item">
                  <Link
                    to={item.href}
                    className={`text-base md:text-lg font-medium transition-colors duration-200 
                      ${location.pathname === item.href ? "text-primary underline" : "text-foreground hover:text-primary"}`}
                  >
                    {item.name}
                  </Link>
                </div>
                
                {/* Consultation Dropdown for Patients - positioned after Explainability */}
                {shouldShowConsultation && (
                  <div className="relative" ref={consultationRef}>
                    <button
                      ref={consultationButtonRef}
                      onClick={() => setConsultationOpen(!consultationOpen)}
                      className={`text-base md:text-lg font-medium transition-colors duration-200 flex items-center space-x-1
                        ${location.pathname === '/patient-reports' || location.pathname === '/appointment' 
                          ? "text-primary underline" : "text-foreground hover:text-primary"}`}
                    >
                      <span>Consultation</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {consultationOpen && (
                      <div 
                        className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-[100]"
                        style={{
                          top: `${dropdownPosition.top}px`,
                          left: `${dropdownPosition.left}px`
                        }}
                      >
                        <div className="py-1">
                          <Link
                            to="/appointment"
                            onClick={() => setConsultationOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            My Appointments
                          </Link>
                          <Link
                            to="/patient-reports"
                            onClick={() => setConsultationOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            My Reports
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* User & Logout */}
        <div className="nav-actions">
          {user ? (
            <div className="nav-user-section">
              {/* Mobile Menu */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(!open)}
                >
                  {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>

              {/* Mobile Menu Overlay */}
              {open && (
                <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setOpen(false)}>
                  <div className="fixed right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold">Menu</h3>
                        <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {navigation.map((item, index) => {
                          // Show consultation dropdown after "Explainability" (index 5)
                          const shouldShowConsultation = user && user.role === 'user' && index === 5;
                          
                          return (
                            <React.Fragment key={item.href}>
                              <Link
                                to={item.href}
                                onClick={() => setOpen(false)}
                                className={`block px-3 py-2 rounded-lg text-lg font-medium transition-colors duration-200 
                                  ${location.pathname === item.href ? "text-primary bg-primary/10" : "text-foreground hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                              >
                                {item.name}
                              </Link>
                              
                              {/* Consultation Dropdown for Mobile Patients - positioned after Explainability */}
                              {shouldShowConsultation && (
                                <div className="relative">
                                  <button
                                    onClick={() => setConsultationOpen(!consultationOpen)}
                                    className={`block w-full px-3 py-2 rounded-lg text-lg font-medium transition-colors duration-200 text-left flex items-center justify-between
                                      ${location.pathname === '/patient-reports' || location.pathname === '/appointment' 
                                        ? "text-primary bg-primary/10" : "text-foreground hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                                  >
                                    <span>Consultation</span>
                                    <svg className={`w-4 h-4 transition-transform ${consultationOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  
                                  {consultationOpen && (
                                    <div className="ml-4 mt-2 space-y-1">
                                      <Link
                                        to="/appointment"
                                        onClick={() => { setConsultationOpen(false); setOpen(false); }}
                                        className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded"
                                      >
                                        My Appointments
                                      </Link>
                                      <Link
                                        to="/patient-reports"
                                        onClick={() => { setConsultationOpen(false); setOpen(false); }}
                                        className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded"
                                      >
                                        My Reports
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                        
                        {/* Mobile User Actions */}
                        <div className="border-t pt-4 space-y-2">
                          {user.role !== 'doctor' && user.role !== 'admin' && (
                            <button
                              onClick={() => { handleManageAccount(); setOpen(false); }}
                              className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded"
                            >
                              Manage Account
                            </button>
                          )}
                          <button
                            onClick={() => { handleDeleteAccount(); setOpen(false); }}
                            className="block w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded"
                          >
                            Delete Account
                          </button>
                          <Button
                            onClick={() => { handleLogout(); setOpen(false); }}
                            className="w-full"
                          >
                            Logout
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop User Actions */}
              <div className="hidden md:flex items-center space-x-4">
                {/* Circle with initials */}
                <div className="relative" ref={optionsRef}>
                  <div
                    onClick={() => setOptionsOpen(!optionsOpen)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-90 transition-opacity ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {getInitials(user.fullName || user.username)}
                  </div>
                  
                  {/* Dropdown Options */}
                  {optionsOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        {/* Show Manage Account only for patient/user roles, not for doctors or admins */}
                        {user.role !== 'doctor' && user.role !== 'admin' && (
                          <button
                            onClick={handleManageAccount}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            Manage Account
                          </button>
                        )}
                        <button
                          onClick={handleDeleteAccount}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Button className="px-4 py-2 text-sm md:text-base" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <Link to="/login">
              <Button className="px-4 py-2 text-sm md:text-base">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
