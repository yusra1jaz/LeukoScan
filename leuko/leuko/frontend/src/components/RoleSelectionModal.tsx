import React from "react";
import { X, User, Stethoscope } from "lucide-react";

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: "user" | "doctor") => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectRole 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Choose Your Role</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-8 text-center">
          Select how you want to use LeukoScan. You can always change this later.
        </p>

        {/* Role Options */}
        <div className="space-y-4">
          {/* User Option */}
          <button
            onClick={() => onSelectRole("user")}
            className="w-full p-6 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-lg text-gray-800">Patient</h3>
                <p className="text-sm text-gray-600">
                  Get AI diagnosis, track symptoms, and manage your health
                </p>
              </div>
            </div>
          </button>

          {/* Doctor Option */}
          <button
            onClick={() => onSelectRole("doctor")}
            className="w-full p-6 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                <Stethoscope className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-lg text-gray-800">Doctor</h3>
                <p className="text-sm text-gray-600">
                  Manage patients, review diagnoses, and provide care
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{" "}
            <button
              onClick={onClose}
              className="text-blue-600 hover:underline font-medium"
            >
              Cancel
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
