import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";
import Label from "@/components/ui/label";
import { Eye, EyeOff, Camera, Mail, Phone, Calendar, MapPin, User, Settings, Lock, Shield, Bell } from "lucide-react";

// -------------------- Types --------------------
interface Preferences {
  theme: "light" | "dark";
  notifications: boolean;
}

interface PersonalInfo {
  id?: number;
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  address?: string;
  photo?: string;
  role?: string;
  created_at?: string;
  password?: string;
}

interface Passwords {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// API Response Types
interface PreferencesResponse {
  preferences?: Preferences;
}

interface PersonalInfoResponse {
  user?: PersonalInfo;
  message?: string;
}

interface ForgotPasswordResponse {
  message: string;
  resetLink?: string;
  token?: string;
}

// -------------------- Component --------------------
const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showPassword, setShowPassword] = useState(false);

  // --- Modal / reset password states ---
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: User },
    { id: 'preferences', name: 'Preferences', icon: Settings },
    { id: 'security', name: 'Security', icon: Lock },
  ];

  const [preferences, setPreferences] = useState<Preferences>({ theme: theme as "light" | "dark", notifications: true });
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [passwords, setPasswords] = useState<Passwords>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");

  // -------------------- Fetch Preferences & Personal Info --------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const prefRes = await axios.get<PreferencesResponse>("http://localhost:4000/api/users/preferences", { withCredentials: true });
        if (prefRes.data?.preferences) {
          setPreferences(prefRes.data.preferences);
          document.documentElement.classList.toggle("dark", prefRes.data.preferences.theme === "dark");
        }

        const userRes = await axios.get<PersonalInfoResponse>("http://localhost:4000/api/users/info", { withCredentials: true });
        if (userRes.data?.user) {
          setPersonalInfo(userRes.data.user);
        }

        // Fetch current password for admin users
        if (user?.role === 'admin') {
          try {
            const passwordRes = await axios.get<{plain_password: string}>("http://localhost:4000/api/users/current-password", { withCredentials: true });
            if (passwordRes.data?.plain_password) {
              setCurrentPassword(passwordRes.data.plain_password);
            }
          } catch (err) {
            console.error("Error fetching current password:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // -------------------- Handlers --------------------
  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setPhotoFile(e.target.files[0]);
  };

  const handlePreferencesChange = async (field: keyof Preferences, value: any) => {
    const newPrefs = { ...preferences, [field]: value };
    setPreferences(newPrefs);
    if (field === "theme") document.documentElement.classList.toggle("dark", value === "dark");
    try {
      await axios.put("http://localhost:4000/api/users/preferences", newPrefs, { withCredentials: true });
    } catch (err) {
      console.error("Failed to update preferences:", err);
    }
  };

  const handleUpdatePersonal = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(personalInfo).forEach(([key, value]) => {
        if (value) formData.append(key, value as string);
      });
      if (photoFile) formData.append("photo", photoFile);

      const res = await axios.put<PersonalInfoResponse>("http://localhost:4000/api/users/info", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.user) {
        setPersonalInfo(res.data.user);
        setPhotoFile(null);
        alert(res.data.message || "Personal info updated successfully");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to update personal info";
      console.error(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("New password and confirm password must match");
      return;
    }
    try {
      await axios.put("http://localhost:4000/api/users/change-password", passwords, { withCredentials: true });
      alert("Password changed successfully");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to change password";
      console.error(msg);
      alert(msg);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      alert("Please enter your email address");
      return;
    }
    
    try {
      const res = await axios.post<ForgotPasswordResponse>("http://localhost:4000/api/forgot-password", {
        email: forgotPasswordEmail
      });
      
      alert(res.data.message);
      
      // For demo purposes, show the reset link
      if (res.data.resetLink) {
        console.log("Reset link:", res.data.resetLink);
        alert(`For demo: Reset link is ${res.data.resetLink}`);
      }
      
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to send reset email";
      console.error(msg);
      alert(msg);
    }
  };

  // --- Reset password handlers ---
  const handleOpenReset = () => {
    setNewPassword("");
    setConfirmNewPassword("");
    setResetOpen(true);
  };

  const handleCloseReset = () => {
    setResetOpen(false);
    setResetLoading(false);
  };

  const handleResetPassword = async () => {
    if (!currentPassword || currentPassword.trim() === "") {
      alert("Current password is required.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setResetLoading(true);

      const res = await fetch(`http://localhost:4000/api/users/change-password`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          currentPassword: currentPassword,
          newPassword, 
          confirmPassword: confirmNewPassword 
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to reset password");
      }

      const data = await res.json();

      alert("Password reset successfully");
      handleCloseReset();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to reset password");
      setResetLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading your profile information...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 ml-auto mb-1" />
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{personalInfo.fullName || personalInfo.name || 'Admin'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center space-x-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    {personalInfo.photo ? (
                      <img
                        src={`http://localhost:4000${personalInfo.photo}`}
                        alt="Profile"
                        className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                      />
                    ) : photoFile ? (
                      <img
                        src={URL.createObjectURL(photoFile)}
                        alt="Profile"
                        className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    <label
                      htmlFor="photo-upload"
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Photo</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">JPG, PNG or GIF. Max size 2MB</p>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      User ID
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        id="id"
                        name="id"
                        type="text"
                        value={personalInfo.id || ''}
                        onChange={handlePersonalChange}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg cursor-not-allowed"
                        placeholder="User ID"
                        disabled
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        id="role"
                        name="role"
                        type="text"
                        value="admin"
                        onChange={handlePersonalChange}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg cursor-not-allowed"
                        placeholder="Role"
                        disabled
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="created_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Member Since
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        id="created_at"
                        name="created_at"
                        type="text"
                        value={personalInfo.created_at ? new Date(personalInfo.created_at).toLocaleDateString() : ''}
                        onChange={handlePersonalChange}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg cursor-not-allowed"
                        placeholder="Member Since"
                        disabled
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={personalInfo.fullName || ''}
                        onChange={handlePersonalChange}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        id="username"
                        name="username"
                        type="text"
                        value={personalInfo.username || ''}
                        onChange={handlePersonalChange}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter your username"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={personalInfo.email || ''}
                        onChange={handlePersonalChange}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={personalInfo.phone || ''}
                        onChange={handlePersonalChange}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        id="dob"
                        name="dob"
                        type="date"
                        value={personalInfo.dob || ''}
                        onChange={handlePersonalChange}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={personalInfo.gender || ''}
                      onChange={handlePersonalChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <textarea
                        id="address"
                        name="address"
                        value={personalInfo.address || ''}
                        onChange={handlePersonalChange}
                        rows={3}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        placeholder="Enter your address"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Theme
                    </label>
                    <select
                      id="theme"
                      name="theme"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="notifications" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notifications
                    </label>
                    <div className="flex items-center space-x-3 mt-3">
                      <Bell className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notifications}
                          onChange={(e) => handlePreferencesChange("notifications", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {preferences.notifications ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="password-display" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        id="password-display"
                        type={showPassword ? "text" : "password"}
                        value={showPassword ? (currentPassword || "") : "••••••"}
                        onChange={handlePersonalChange}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg cursor-not-allowed"
                        placeholder="Password"
                        disabled
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Click eye to view your current password</p>
                  </div>
                </div>

                {/* Reset password button */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleOpenReset}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            type="submit"
            onClick={handleUpdatePersonal}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span className="ml-2">Saving...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Save Changes</span>
              </div>
            )}
          </button>
        </div>

        {/* Reset Password Modal */}
        {resetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Reset Password</h3>

              <div className="space-y-3">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your current password"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter new password (min 6 chars)"
                  />
                </div>

                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseReset}
                  disabled={resetLoading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="ml-2">Saving...</span>
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
