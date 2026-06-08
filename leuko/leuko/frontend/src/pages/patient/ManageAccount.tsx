import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Camera, Save, Eye, EyeOff, Upload, User, FileText, Heart, Settings, Lock, Phone, Mail, Calendar, MapPin, Activity } from "lucide-react";

interface PersonalInfo {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  country: string;
  address: string;
  photo?: string;
}

interface DiseaseInfo {
  leukemiaType: string;
  stage: string;
  medications: string;
  hospital: string;
  mrNumber: string;
}

interface UserPreferences {
  theme: string;
  notifications: boolean;
}

interface UserInfoResponse {
  user: PersonalInfo & DiseaseInfo;
}

const ManageAccount: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [personal, setPersonal] = useState<PersonalInfo>({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    country: "",
    address: "",
  });

  const [disease, setDisease] = useState<DiseaseInfo>({
    leukemiaType: "",
    stage: "",
    medications: "",
    hospital: "",
    mrNumber: "",
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: theme,
    notifications: true,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [showPasswordForm, setShowPasswordForm] = useState<boolean>(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [previewImage, setPreviewImage] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get<UserInfoResponse>("http://localhost:4000/api/users/info", {
          withCredentials: true,
        });
        
        const userData = res.data.user;
        
        // Set personal info
        setPersonal({
          username: userData.username || "",
          fullName: userData.fullName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          dob: userData.dob || "",
          gender: userData.gender || "",
          country: userData.country || "",
          address: userData.address || "",
          photo: userData.photo || "",
        });

        // Set disease info
        setDisease({
          leukemiaType: userData.leukemiaType || "",
          stage: userData.stage || "",
          medications: userData.medications || "",
          hospital: userData.hospital || "",
          mrNumber: userData.mrNumber || "",
        });

        // Set preview image if photo exists
        if (userData.photo) {
          setPreviewImage(`http://localhost:4000${userData.photo}`);
        }
        
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sync theme context with preferences
  useEffect(() => {
    setPreferences(prev => ({ ...prev, theme }));
  }, [theme]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    section: "personal" | "disease" | "preferences"
  ) => {
    const { name, value, type } = e.target;
    
    if (section === "personal") {
      setPersonal((prev) => ({ ...prev, [name]: value }));
    } else if (section === "disease") {
      setDisease((prev) => ({ ...prev, [name]: value }));
    } else if (section === "preferences") {
      const finalValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
      setPreferences((prev) => ({ ...prev, [name]: finalValue }));
      
      // If theme is changed, update the theme context
      if (name === 'theme') {
        setTheme(finalValue as 'light' | 'dark' | 'system');
      }
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      
      // Add personal info
      Object.entries(personal).forEach(([key, value]) => {
        if (key !== 'photo') {
          formData.append(key, value);
        }
      });
      
      // Add disease info
      Object.entries(disease).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Add file if exists
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append('photo', fileInput.files[0]);
      }

      await axios.put(
        "http://localhost:4000/api/users/info",
        formData,
        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
      );

      alert("Account updated successfully");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update account");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New password and confirm password must match");
      return;
    }
    
    try {
      await axios.put(
        "http://localhost:4000/api/users/change-password",
        passwordData,
        { withCredentials: true }
      );

      alert("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to change password");
    }
  };

  const handlePreferencesSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(
        "http://localhost:4000/api/users/preferences",
        preferences,
        { withCredentials: true }
      );

      alert("Preferences updated successfully");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update preferences");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account?")) return;
    try {
      await axios.delete("http://localhost:4000/api/users/delete", {
        withCredentials: true,
      });
      alert("Account deleted successfully");
      logout();
      navigate("/login");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete account");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading your account information...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Account</h1>
              
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'personal', name: 'Personal Info', icon: User },
                { id: 'medical', name: 'Medical Data', icon: Heart },
                { id: 'security', name: 'Security', icon: Lock },
                { id: 'preferences', name: 'Preferences', icon: Settings },
              ].map((tab) => (
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center space-x-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    {previewImage ? (
                      <img
                        src={previewImage}
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
                        onChange={handleImageUpload}
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
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={personal.fullName}
                        onChange={(e) => handleChange(e, "personal")}
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
                        value={personal.username}
                        onChange={(e) => handleChange(e, "personal")}
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
                        value={personal.email}
                        onChange={(e) => handleChange(e, "personal")}
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
                        value={personal.phone}
                        onChange={(e) => handleChange(e, "personal")}
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
                        value={personal.dob}
                        onChange={(e) => handleChange(e, "personal")}
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
                      value={personal.gender}
                      onChange={(e) => handleChange(e, "personal")}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={personal.country}
                      onChange={(e) => handleChange(e, "personal")}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select country</option>
                      <option value="Pakistan">Pakistan</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
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
                        value={personal.address}
                        onChange={(e) => handleChange(e, "personal")}
                        rows={3}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter your full address"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Medical Data Tab */}
            {activeTab === 'medical' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-blue-900">Medical Information</h3>
                  </div>
                  <p className="text-blue-700 text-sm mt-1">Keep your medical information up to date for better care</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="mrNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      MR Number (Medical Record Number)
                    </label>
                    <div className="relative">
                      <input
                        id="mrNumber"
                        name="mrNumber"
                        type="text"
                        value={disease.mrNumber}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100 text-gray-900 font-medium"
                        placeholder="System Generated"
                      />
                      <div className="absolute right-3 top-3">
                        <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Unique medical record number generated by system</p>
                  </div>

                  <div>
                    <label htmlFor="leukemiaType" className="block text-sm font-medium text-gray-700 mb-2">
                      Leukemia Type
                    </label>
                    <select
                      id="leukemiaType"
                      name="leukemiaType"
                      value={disease.leukemiaType}
                      onChange={(e) => handleChange(e, "disease")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select type</option>
                      <option value="ALL">Acute Lymphoblastic Leukemia (ALL)</option>
                      <option value="AML">Acute Myeloid Leukemia (AML)</option>
                      <option value="CLL">Chronic Lymphocytic Leukemia (CLL)</option>
                      <option value="CML">Chronic Myeloid Leukemia (CML)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
                      Disease Stage
                    </label>
                    <select
                      id="stage"
                      name="stage"
                      value={disease.stage}
                      onChange={(e) => handleChange(e, "disease")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select stage</option>
                      <option value="Early">Early Stage</option>
                      <option value="Intermediate">Intermediate Stage</option>
                      <option value="Advanced">Advanced Stage</option>
                      <option value="Remission">Remission</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="medications" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Medications
                    </label>
                    <textarea
                      id="medications"
                      name="medications"
                      value={disease.medications}
                      onChange={(e) => handleChange(e, "disease")}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="List your current medications, dosages, and frequency..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Hospital/Clinic
                    </label>
                    <input
                      id="hospital"
                      name="hospital"
                      type="text"
                      value={disease.hospital}
                      onChange={(e) => handleChange(e, "disease")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Hospital or clinic name"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save Medical Data'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-lg font-medium text-yellow-900">Security Settings</h3>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">Manage your password and account security</p>
                </div>

                {!showPasswordForm ? (
                  <div className="text-center py-8">
                    <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Change Password</h3>
                    <p className="text-gray-500 mb-4">Regularly updating your password helps keep your account secure</p>
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          name="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Confirm new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Update Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                        }}
                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-medium text-purple-900 dark:text-purple-100">Preferences</h3>
                  </div>
                  <p className="text-purple-700 dark:text-purple-300 text-sm mt-1">Customize your experience</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Theme
                    </label>
                    <select
                      id="theme"
                      name="theme"
                      value={theme}
                      onChange={(e) => handleChange(e, "preferences")}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Notifications
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive email updates about your account</p>
                    </div>
                    <input
                      id="notifications"
                      name="notifications"
                      type="checkbox"
                      checked={preferences.notifications}
                      onChange={(e) => handleChange(e, "preferences")}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Preferences
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAccount;


