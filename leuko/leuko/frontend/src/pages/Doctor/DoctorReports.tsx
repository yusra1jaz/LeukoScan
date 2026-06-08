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



interface Report {

  id: number;

  patient_id: number;

  patient_name: string;

  report_type: string;

  report_content: string;

  created_at: string;

  doctor_name: string;

}



const DoctorReports: React.FC = () => {

  const [patients, setPatients] = useState<Patient[]>([]);

  const [reports, setReports] = useState<Report[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [showMRModal, setShowMRModal] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [actionType, setActionType] = useState<'create' | 'view' | null>(null);

  const navigate = useNavigate();



  useEffect(() => {

    fetchPatients();

    fetchReports();

  }, []);



  const fetchPatients = async () => {

    try {

      const res = await fetch("http://localhost:4000/api/patients", {

        credentials: "include",

      });

      const data = await res.json();

      setPatients(data);

    } catch (error) {

      console.error("Error fetching patients:", error);

    }

  };



  const fetchReports = async () => {

    try {

      const res = await fetch("http://localhost:4000/api/reports", {

        credentials: "include",

      });

      const data = await res.json();

      setReports(data || []);

      setLoading(false);

    } catch (error) {

      console.error("Error fetching reports:", error);

      setLoading(false);

    }

  };



  const filteredPatients = patients.filter(

    (patient) =>

      (patient.fullName && patient.fullName.toLowerCase().includes(search.toLowerCase())) ||

      patient.username.toLowerCase().includes(search.toLowerCase()) ||

      patient.email.toLowerCase().includes(search.toLowerCase()) ||

      patient.id.toString().includes(search.toLowerCase())

  );



  const getPatientReports = (patientId: number) => {

    return reports.filter(report => report.patient_id === patientId);

  };



  const handleCreateReport = (patient: Patient) => {

    setSelectedPatient(patient);

    setActionType('create');

    setShowMRModal(true);

  };



  const handleViewReports = (patient: Patient) => {

    setSelectedPatient(patient);

    setActionType('view');

    setShowMRModal(true);

  };



  const handleMRVerified = () => {

    if (selectedPatient) {

      if (actionType === 'create') {

        navigate(`/doctor/create-report/${selectedPatient.id}`);

      } else if (actionType === 'view') {

        navigate(`/doctor/patient-reports/${selectedPatient.id}`);

      }

    }

  };



  const handleModalClose = () => {

    setShowMRModal(false);

    setSelectedPatient(null);

    setActionType(null);

  };



  if (loading) {

    return (

      <div className="flex items-center justify-center h-64">

        <div className="text-lg text-gray-600">Loading reports...</div>

      </div>

    );

  }



  return (

    <div className="max-w-7xl mx-auto p-6">

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-3xl font-bold text-gray-900">Medical Reports</h1>

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

                    Reports

                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

                    Last Report

                  </th>

                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">

                    Actions

                  </th>

                </tr>

              </thead>

              <tbody className="bg-white divide-y divide-gray-200">

                {filteredPatients.map((patient) => {

                  const patientReports = getPatientReports(patient.id);

                  const latestReport = patientReports.length > 0 

                    ? patientReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

                    : null;



                  return (

                    <tr key={patient.id} className="hover:bg-gray-50">

                      <td className="px-6 py-4 whitespace-nowrap">

                        <div className="flex items-center">

                          <div className="h-10 w-10 flex-shrink-0">

                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">

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

                          {patientReports.length} report{patientReports.length !== 1 ? 's' : ''}

                        </div>

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">

                        {latestReport ? (

                          <div>

                            <div className="text-sm text-gray-900">

                              {new Date(latestReport.created_at).toLocaleDateString()}

                            </div>

                            <div className="text-xs text-gray-500">

                              {latestReport.report_type}

                            </div>

                          </div>

                        ) : (

                          <div className="text-sm text-gray-500">No reports</div>

                        )}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">

                        <div className="flex justify-end space-x-2">

                          <Button

                            size="sm"

                            variant="outline"

                            onClick={() => handleCreateReport(patient)}

                            className="border-green-600 text-green-600 hover:bg-green-50"

                          >

                            Create Report

                          </Button>

                          {patientReports.length > 0 && (

                            <Button

                              size="sm"

                              variant="outline"

                              onClick={() => handleViewReports(patient)}

                              className="border-blue-600 text-blue-600 hover:bg-blue-50"

                            >

                              View Reports

                            </Button>

                          )}

                        </div>

                      </td>

                    </tr>

                  );

                })}

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



export default DoctorReports;

