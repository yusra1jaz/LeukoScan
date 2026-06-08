import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MRVerificationModal from "@/components/ui/MRVerificationModal";

interface Patient {
  id: number;
  username: string;
  fullName?: string;
  email: string;
  mr_number?: string;
  created_at: string;
}

const DoctorPatientInfo: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMRModal, setShowMRModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/patients", {
        credentials: "include",
      });
      const data = await res.json();
      setPatients(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching patients:", error);
      setLoading(false);
    }
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowMRModal(true);
  };

  const handleMRVerified = () => {
    if (selectedPatient) {
      navigate(`/doctor/patient/${selectedPatient.id}`);
    }
  };

  const handleModalClose = () => {
    setShowMRModal(false);
    setSelectedPatient(null);
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.username.toLowerCase().includes(search.toLowerCase()) ||
      patient.email.toLowerCase().includes(search.toLowerCase()) ||
      patient.id.toString().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Patient Information</h1>
        <div className="w-64">
          <Input
            placeholder="Search by patient name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {search ? "No patients found matching your search" : "No patients registered"}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {patient.fullName ? patient.fullName.charAt(0).toUpperCase() : patient.username.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.fullName || patient.username}
                          </div>
                          <div className="text-sm text-gray-500">ID: #{patient.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{patient.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(patient.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(patient)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={() => navigate(`/doctor/patient-symptoms/${patient.id}`)}
                          className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 font-medium"
                        >
                          Track Symptoms
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* MR Verification Modal */}
      {selectedPatient && (
        <MRVerificationModal
          isOpen={showMRModal}
          onClose={handleModalClose}
          patientName={selectedPatient.fullName || selectedPatient.username}
          patientId={selectedPatient.id}
          onSuccess={handleMRVerified}
        />
      )}
    </div>
  );
};

export default DoctorPatientInfo;
