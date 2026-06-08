import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Label from "@/components/ui/label";
import { User, Upload, ArrowLeft, FileText, Image } from "lucide-react";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  name: string;
  gender: string;
  dob: string;
  role: string;
  phone?: string;
  address?: string;
  photo?: string;
}

const DoctorBooking: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id: doctorId } = useParams<{ id: string }>();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [additionalText, setAdditionalText] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File upload triggered', e.target.files);
    const files = Array.from(e.target.files || []);
    console.log('Files selected:', files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    console.log('Files dropped:', files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/users/info", {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.user);
      } else {
        console.error("Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleConsult = async () => {
    setSubmitting(true);
    
    try {
      // Create consultation request with file uploads using FormData
      const formData = new FormData();
      
      // Add consultation data
      formData.append('doctor_id', doctorId || '1'); // Use doctorId from URL params
      formData.append('patient_id', user?.id?.toString() || '');
      formData.append('preferred_date', new Date().toISOString().split('T')[0]); // Today's date
      formData.append('preferred_time', new Date().toTimeString().split(' ')[0].substring(0, 5)); // Current time
      formData.append('consultation_type', 'general');
      formData.append('symptoms', 'General consultation request');
      formData.append('urgency', 'medium');
      formData.append('notes', additionalText || 'No additional notes provided');
      
      // Add uploaded files
      if (uploadedFiles && uploadedFiles.length > 0) {
        for (let i = 0; i < uploadedFiles.length; i++) {
          formData.append('documents', uploadedFiles[i]);
        }
      }

      const res = await fetch("http://localhost:4000/api/consultations/request-with-files", {
        method: "POST",
        credentials: "include",
        body: formData, // Don't set Content-Type header for FormData
      });

      if (res.ok) {
        alert("Consultation request submitted successfully! Doctors will review your request.");
        navigate('/appointment');
      } else {
        const error = await res.json();
        alert(error.message || "Failed to submit consultation request");
      }
    } catch (error) {
      console.error("Error submitting consultation:", error);
      alert("Failed to submit consultation request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading patient information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/appointment')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Appointments
          </Button>
        </div>

        <div className="space-y-6">
          {/* Patient Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Patient Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</Label>
                  <p className="text-gray-900 dark:text-white">{userProfile?.fullName || user?.fullName || user?.username || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Patient ID</Label>
                  <p className="text-gray-900 dark:text-white">#{userProfile?.id || user?.id || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</Label>
                  <p className="text-gray-900 dark:text-white">{userProfile?.gender || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</Label>
                  <p className="text-gray-900 dark:text-white">{userProfile?.dob || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload Documents</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Upload medical reports, images, or other relevant documents
              </p>
            </div>
            <div className="p-6">
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver 
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="mb-4">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-blue-600 dark:text-blue-400 hover:text-blue-500">
                      Click to upload
                    </span>
                    {' '}or drag and drop
                  </Label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.doc,.docx,.txt"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PDF, JPG, PNG, DOC, DOCX up to 10MB each
                </p>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Uploaded Files ({uploadedFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-gray-400">
                            {getFileIcon(file.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => navigate('/appointment')}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConsult}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? "Submitting..." : "Consult"}
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Text Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Additional Information</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Please provide any additional details or concerns you may have.
              </p>
              
              {/* MR Number Warning */}
              <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                      <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">!</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-amber-800 dark:text-amber-200 mb-1">
                      Important: MR Number Required
                    </h4>
                    <p className="text-amber-700 dark:text-amber-300 text-sm mb-2">
                      Please ensure your MR Number is added to your notes. Doctors need your MR Number to access your medical records and provide proper consultation.
                    </p>
                    <div className="bg-amber-100 dark:bg-amber-900/30 rounded-md p-2">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                        <strong>How to check MR Number:</strong> Go to Manage Account in your profile and your MR Number is in medical information section. MR numbers are allotted by the system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <textarea
                value={additionalText}
                onChange={(e) => setAdditionalText(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                placeholder="Type your additional information here..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorBooking;