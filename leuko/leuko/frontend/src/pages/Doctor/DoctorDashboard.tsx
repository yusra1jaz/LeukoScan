import React from "react";
import { Link } from "react-router-dom";
import { Users, FileText, Brain, Pill, Heart, MessageCircle } from "lucide-react";

const DoctorDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Professional Medical Header */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <Heart className="w-10 h-10" />
                Leukemia Treatment Center
              </h1>
              <p className="text-orange-100 mt-2 text-lg">Doctor Portal - Patient Management System</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-100">Medical Professional Dashboard</p>
              <p className="text-2xl font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg border border-orange-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, Doctor</h2>
              
            </div>
            
          </div>
        </div>

        {/* Main Actions Grid - 5 Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Link to="/doctor/patient-info" className="group">
            <div className="p-6 text-center hover:bg-orange-50 rounded-lg transition-all duration-300">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    Patient Info
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">View and manage patient records</p>
                </div>
                <div className="text-xs text-orange-600 font-medium">Access Patients →</div>
              </div>
            </div>
          </Link>

          <Link to="/doctor/reports" className="group">
            <div className="p-6 text-center hover:bg-yellow-50 rounded-lg transition-all duration-300">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                    Medical Reports
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Create and view reports</p>
                </div>
                <div className="text-xs text-yellow-600 font-medium">Manage Reports →</div>
              </div>
            </div>
          </Link>

          <Link to="/ai-diagnosis" className="group">
            <div className="p-6 text-center hover:bg-amber-50 rounded-lg transition-all duration-300">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-lime-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                    AI Diagnosis
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Get AI-powered medical diagnosis</p>
                </div>
                <div className="text-xs text-amber-600 font-medium">Get Diagnosis →</div>
              </div>
            </div>
          </Link>

          <Link to="/medication-guide" className="group">
            <div className="p-6 text-center hover:bg-lime-50 rounded-lg transition-all duration-300">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-lime-500 to-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Pill className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-lime-600 transition-colors">
                    Medication Guide
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Medication information</p>
                </div>
                <div className="text-xs text-lime-600 font-medium">View Medications →</div>
              </div>
            </div>
          </Link>

          <Link to="/chatbot" className="group">
            <div className="p-6 text-center hover:bg-teal-50 rounded-lg transition-all duration-300">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                    AI Chatbot
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Medical assistant chatbot</p>
                </div>
                <div className="text-xs text-teal-600 font-medium">Start Chat →</div>
              </div>
            </div>
          </Link>
        </div>
        
      </div>
    </div>
  );
};

export default DoctorDashboard;
