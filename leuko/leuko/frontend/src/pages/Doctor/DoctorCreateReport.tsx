import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PersonalInfo {
  id: number;
  username: string;
  fullName?: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
}

const DoctorCreateReport: React.FC = () => {
  const params = useParams();
  const patientId = params.id;
  const navigate = useNavigate();
  
  const [patientInfo, setPatientInfo] = useState<PersonalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Professional report form data
  const [reportData, setReportData] = useState({
    report_type: "",
    report_content: ""
  });

  useEffect(() => {
    if (patientId) {
      fetchPatientInfo();
    }
  }, [patientId]);

  const fetchPatientInfo = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/patients/${patientId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setPatientInfo(data.patient);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching patient info:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveReport = async () => {
    if (!reportData.report_type.trim() || !reportData.report_content.trim()) {
      alert("Please fill in both Report Type and Report Content");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("http://localhost:4000/api/reports", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          patient_id: patientId,
          patient_name: patientInfo?.fullName || patientInfo?.username,
          report_type: reportData.report_type,
          chief_complaint: reportData.report_content.substring(0, 100) + "...",
          history_present_illness: "",
          physical_examination: "",
          assessment: reportData.report_content,
          plan: "",
          medications: "",
          follow_up: "",
          additional_notes: ""
        })
      });

      if (res.ok) {
        alert("Report saved successfully!");
        navigate(`/doctor/patient-reports/${patientId}`);
      } else {
        const errorText = await res.text();
        console.error("Server response:", errorText);
        alert(`Failed to save report: ${errorText}`);
      }
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading patient information...</div>
      </div>
    );
  }

  if (!patientInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Patient not found</div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Medical Report</h1>
        <Button
          onClick={() => navigate(`/doctor/reports`)}
          variant="outline"
          className="border-gray-300"
        >
          Back to Reports
        </Button>
      </div>

      {/* Professional Medical Report Form */}
      <div className="bg-white border-2 border-gray-300 shadow-lg">
        {/* Hospital Header */}
        <div className="border-b-2 border-gray-300 bg-gray-50 p-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">LEUKEMIA TREATMENT CENTER</h2>
            <p className="text-gray-600">Medical Report</p>
          </div>
        </div>

        {/* Patient Information Section */}
        <div className="border-b-2 border-gray-300 bg-blue-50 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">PATIENT INFORMATION</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-semibold">Patient Name:</span>
              <p className="text-gray-900">{patientInfo.fullName || patientInfo.username}</p>
            </div>
            <div>
              <span className="font-semibold">Patient ID:</span>
              <p className="text-gray-900">#{patientInfo.id}</p>
            </div>
            <div>
              <span className="font-semibold">Date of Birth:</span>
              <p className="text-gray-900">{patientInfo.dob || "Not specified"}</p>
            </div>
            <div>
              <span className="font-semibold">Gender:</span>
              <p className="text-gray-900">{patientInfo.gender || "Not specified"}</p>
            </div>
            <div>
              <span className="font-semibold">Contact:</span>
              <p className="text-gray-900">{patientInfo.phone || patientInfo.email}</p>
            </div>
            <div>
              <span className="font-semibold">Report Date:</span>
              <p className="text-gray-900">{currentDate}</p>
            </div>
            <div>
              <span className="font-semibold">Report Type:</span>
              <select
                value={reportData.report_type}
                onChange={(e) => handleInputChange('report_type', e.target.value)}
                className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Type</option>
                <option value="Initial Consultation">Initial Consultation</option>
                <option value="Follow-up Visit">Follow-up Visit</option>
                <option value="Lab Results">Lab Results</option>
                <option value="Treatment Assessment">Treatment Assessment</option>
                <option value="Progress Report">Progress Report</option>
                <option value="Discharge Summary">Discharge Summary</option>
                <option value="Emergency Report">Emergency Report</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Medical Report Content Section */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">MEDICAL REPORT</h3>
          <div className="bg-white border-2 border-gray-200 rounded">
            <textarea
              value={reportData.report_content}
              onChange={(e) => handleInputChange('report_content', e.target.value)}
              placeholder="Enter the complete medical report here...

Include:
• Chief Complaint
• History of Present Illness
• Physical Examination Findings
• Assessment and Diagnosis
• Treatment Plan
• Medications Prescribed
• Follow-up Instructions
• Additional Notes

This should be a comprehensive medical report documenting the patient's condition, examination findings, diagnosis, and treatment plan."
              className="w-full px-4 py-3 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={20}
              style={{ minHeight: '500px' }}
            />
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Characters: {reportData.report_content.length}
          </div>
        </div>

        {/* Doctor Signature Section */}
        <div className="border-t-2 border-gray-300 bg-gray-50 p-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-600">Examining Doctor:</p>
              <p className="font-semibold text-gray-800">Dr. _______________________</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Signature:</p>
              <p className="font-semibold text-gray-800">_________________________</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-6">
        <Button
          onClick={() => navigate(`/doctor/reports`)}
          variant="outline"
          className="border-gray-300"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveReport}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? "Saving..." : "Save Report"}
        </Button>
      </div>
    </div>
  );
};

export default DoctorCreateReport;
