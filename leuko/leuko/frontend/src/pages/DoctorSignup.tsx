import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const DoctorSignup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    gender: "",
    country: "",
    area: "",
    specialty: "",
    department: "",
    degree: "",
    experience: "",
    designation: "",
    license: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    fullname: "",
    email: "",
    phone: "",
    gender: "",
    country: "",
    area: "",
    specialty: "",
    department: "",
    degree: "",
    experience: "",
    designation: "",
    license: "",
  });

  const [documents, setDocuments] = useState<File[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleDocumentAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
      });

      if (newFiles.length !== files.length) {
        alert('Some files were rejected. Please ensure files are PDF, JPG, or PNG and under 5MB each.');
      }

      setDocuments(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const handleDocumentRemove = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (validTypes.includes(file.type) && file.size <= 2 * 1024 * 1024) {
        setProfilePicture(file);
      } else {
        alert('Please select a JPG or PNG image under 2MB for profile picture.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields before submission
    const newFieldErrors = { ...fieldErrors };
    
    if (!formData.fullname.trim()) {
      newFieldErrors.fullname = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      newFieldErrors.email = "Email is required";
    }
    
    if (!formData.license.trim()) {
      newFieldErrors.license = "Medical license is required";
    }
    
    setFieldErrors(newFieldErrors);

    
    try {
      setLoading(true);
      const formDataToSend = new FormData();

      for (const key in formData) {
        formDataToSend.append(key, formData[key as keyof typeof formData]);
      }

      documents.forEach((doc, index) => {
        formDataToSend.append(`documents[${index}]`, doc);
      });

      if (profilePicture) {
        formDataToSend.append("profilePicture", profilePicture);
      }

      const res = await fetch("http://localhost:4000/api/signup/doctor", {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Doctor request failed");

      // Create success popup
      const popup = document.createElement('div');
      popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 400px;
        text-align: center;
        border: 2px solid #4f46e5;
      `;
      
      popup.innerHTML = `
        <div style="color: #4f46e5; font-size: 48px; margin-bottom: 15px;">✓</div>
        <h3 style="color: #1f2937; font-size: 20px; font-weight: bold; margin-bottom: 10px;">Request Submitted Successfully!</h3>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
          Your doctor registration request has been sent to the admin for review.<br><br>
          After confirmation, you will receive an email with your account details.
        </p>
        <button id="closePopup" style="
          background: #4f46e5;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        ">OK</button>
      `;
      
      document.body.appendChild(popup);
      
      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
      `;
      document.body.appendChild(backdrop);
      
      // Close popup handlers
      const closePopup = () => {
        document.body.removeChild(popup);
        document.body.removeChild(backdrop);
        navigate("/login");
      };
      
      document.getElementById('closePopup')?.addEventListener('click', closePopup);
      backdrop.addEventListener('click', closePopup);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen grid place-items-center bg-gradient-to-r from-blue-50 to-blue-200 p-4">
      <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Doctor Registration 🩺
        </h2>

        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Personal Information</h3>
            
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
              <div className="flex items-start space-x-6">
                <div 
                  className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors flex items-center justify-center bg-gray-50"
                  onClick={() => document.getElementById('profilePicture')?.click()}
                >
                  {profilePicture ? (
                    <img 
                      src={URL.createObjectURL(profilePicture)} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-xs text-gray-500">Add Photo</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    id="profilePicture"
                    name="profilePicture"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                  {profilePicture && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Selected: {profilePicture.name}</p>
                      <button
                        type="button"
                        onClick={() => setProfilePicture(null)}
                        className="text-sm text-red-600 hover:text-red-800 mt-1"
                      >
                        Remove Photo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                value={formData.fullname}
                onChange={handleChange}
                required
                placeholder="Dr. John Smith"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400 ${fieldErrors.fullname ? 'border-red-500' : ''}`}
              />
              {fieldErrors.fullname && (
                <p className="text-red-500 text-sm mt-1">Full name is required</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="doctor@hospital.com"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400 ${fieldErrors.email ? 'border-red-500' : ''}`}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-sm mt-1">Email is required</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
              />
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
              >
                <option value="">Select Country</option>
                <option value="Pakistan">Pakistan</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Area */}
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">Area/City</label>
              <input
                id="area"
                name="area"
                type="text"
                value={formData.area}
                onChange={handleChange}
                placeholder="New York, NY"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">Professional Information</h3>
            
            {/* Specialty */}
            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">Medical Specialty</label>
              <input
                id="specialty"
                name="specialty"
                type="text"
                value={formData.specialty}
                onChange={handleChange}
                placeholder="e.g., Cardiology, Neurology"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
              />
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g., Internal Medicine"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
              />
            </div>

            {/* Degree */}
            <div>
              <label htmlFor="degree" className="block text-sm font-medium text-gray-700 mb-1">Medical Degree</label>
              <input
                id="degree"
                name="degree"
                type="text"
                value={formData.degree}
                onChange={handleChange}
                placeholder="e.g., MBBS, MD"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
              />
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
              <input
                id="experience"
                name="experience"
                type="text"
                value={formData.experience}
                onChange={handleChange}
                placeholder="e.g., 5 years"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
              />
            </div>

            {/* Designation */}
            <div>
              <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">Professional Designation</label>
              <input
                id="designation"
                name="designation"
                type="text"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g., Senior Consultant"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
              />
            </div>

            {/* License */}
            <div>
              <label htmlFor="license" className="block text-sm font-medium text-gray-700 mb-1">Medical License Number</label>
              <input
                id="license"
                name="license"
                type="text"
                value={formData.license}
                onChange={handleChange}
                placeholder="Enter your medical license number"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400 ${fieldErrors.license ? 'border-red-500' : ''}`}
              />
              {fieldErrors.license && (
                <p className="text-red-500 text-sm mt-1">Medical license is required</p>
              )}
            </div>

            {/* Documents */}
            <div>
              <label htmlFor="documents" className="block text-sm font-medium text-gray-700 mb-1">Professional Documents (PDF, JPG, PNG - Max 5MB each)</label>
              <input
                id="documents"
                name="documents"
                type="file"
                multiple
                accept="application/pdf,image/jpeg,image/jpg,image/png"
                onChange={handleDocumentAdd}
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
              />
              {documents.length > 0 && (
                <div className="mt-2 space-y-1">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                      <span>{doc.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDocumentRemove(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full py-3 rounded-xl font-semibold text-white transition relative z-10 ${loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            {loading ? "Submitting Request..." : "Submit Request for Approval"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DoctorSignup;