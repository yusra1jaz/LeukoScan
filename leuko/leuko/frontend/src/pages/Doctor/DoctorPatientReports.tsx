import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "@/components/ui/button";
import { Trash2, Calendar } from "lucide-react";

interface PatientInfo {
  id: number;
  username: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
}

interface Report {
  id: number;
  patient_id: number;
  patient_name: string;
  report_type: string;
  chief_complaint: string;
  history_present_illness: string;
  physical_examination: string;
  assessment: string;
  plan: string;
  medications: string;
  follow_up: string;
  additional_notes: string;
  created_at: string;
  doctor_name: string;
  patient_info?: PatientInfo;
}

const DoctorPatientReports: React.FC = () => {
  const params = useParams();
  const patientId = params.id;
  const navigate = useNavigate();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    if (patientId) {
      fetchPatientReports();
    }
  }, [patientId]);

  const fetchPatientReports = async () => {
    try {
      // Fetch reports
      const reportsRes = await fetch(`http://localhost:4000/api/reports/patient/${patientId}`, {
        credentials: 'include',
      });
      const reportsData = await reportsRes.json();

      // Fetch patient information
      const patientRes = await fetch(`http://localhost:4000/api/patients/${patientId}`, {
        credentials: 'include',
      });
      const patientData = await patientRes.json();

      // Combine patient info with each report
      if (reportsRes.ok && patientRes.ok) {
        const reportsWithPatientInfo = reportsData.map((report: any) => ({
          ...report,
          patient_info: patientData.patient
        }));
        setReports(reportsWithPatientInfo || []);
      } else {
        setReports(reportsData || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching patient reports:", error);
      setLoading(false);
    }
  };

  // Group reports by date
  const getReportsByDate = () => {
    const grouped: { [date: string]: Report[] } = {};
    
    reports.forEach(report => {
      const date = new Date(report.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(report);
    });
    
    return grouped;
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedDate(null);
    setViewMode('list');
  };

  const getReportsForSelectedDate = () => {
    if (!selectedDate) return [];
    const grouped = getReportsByDate();
    return grouped[selectedDate] || [];
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/reports/${reportId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        // Remove the deleted report from the list
        setReports(prev => prev.filter(report => report.id !== reportId));
        // If in detail view and no more reports for selected date, go back to list
        if (viewMode === 'detail' && selectedDate) {
          const remainingReports = getReportsForSelectedDate().filter(r => r.id !== reportId);
          if (remainingReports.length === 0) {
            handleBackToList();
          }
        }
        alert("Report deleted successfully");
      } else {
        const errorData = await res.json().catch(() => null);
        alert(errorData?.message || "Failed to delete report");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Failed to delete report");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading patient reports...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Medical Reports</h1>
          <p className="text-gray-600 mt-1">
            Patient ID: #{patientId} - {reports.length} report{reports.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => navigate(`/doctor/create-report/${patientId}`)}
            className="bg-green-600 hover:bg-green-700"
          >
            Create New Report
          </Button>
          <Button
            onClick={() => navigate(`/doctor/reports`)}
            variant="outline"
            className="border-gray-300"
          >
            Back to All Reports
          </Button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">No reports found for this patient</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Reports Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">
                  Patient has {reports.length} medical report{reports.length !== 1 ? 's' : ''}
                </span>
              </div>
                            <span className="text-sm text-blue-600">
                Latest: {new Date(Math.max(...reports.map(r => new Date(r.created_at).getTime()))).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Date List View */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Reports by Date</h3>
              {Object.entries(getReportsByDate()).map(([date, dateReports]) => (
                <div 
                  key={date}
                  onClick={() => handleDateClick(date)}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
                >
                  <div className="flex items-center justify-between pr-16">
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-6 w-6 text-blue-600" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{date}</h4>
                        <p className="text-sm text-gray-600">
                          {dateReports.length} report{dateReports.length !== 1 ? 's' : ''} on this day
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">
                        {dateReports.map(r => r.report_type).join(', ')}
                      </div>
                      <div className="text-sm text-gray-500">
                        Dr. {dateReports[0].doctor_name}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button for Date Group */}
                  {dateReports.length === 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReport(dateReports[0].id);
                      }}
                      className="absolute top-4 right-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Detail View - Full Reports for Selected Date */}
          {viewMode === 'detail' && selectedDate && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Reports for {selectedDate}
                </h3>
                <Button
                  onClick={handleBackToList}
                  variant="outline"
                >
                  Back to Date List
                </Button>
              </div>

              {getReportsForSelectedDate().map((report) => (
                <div key={report.id} className="bg-white border-2 border-gray-300 shadow-lg">
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
                        <p className="text-gray-900">{report.patient_name}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Patient ID:</span>
                        <p className="text-gray-900">#{report.patient_id}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Date of Birth:</span>
                        <p className="text-gray-900">{report.patient_info?.dob || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Gender:</span>
                        <p className="text-gray-900">{report.patient_info?.gender || "Not specified"}</p>
                      </div>
                                            <div>
                        <span className="font-semibold">Contact:</span>
                        <p className="text-gray-900">{report.patient_info?.phone || report.patient_info?.email}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Report Date:</span>
                        <p className="text-gray-900">{new Date(report.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Report Type:</span>
                        <p className="text-gray-900">{report.report_type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Report Content Section */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">MEDICAL REPORT</h3>
                    <div className="bg-white border-2 border-gray-200 rounded">
                      <div className="w-full px-4 py-3 border-0 resize-none text-gray-800 whitespace-pre-wrap" style={{ minHeight: '500px' }}>
                        {report.assessment || report.plan || report.chief_complaint || 'No medical content available'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Characters: {(report.assessment || report.plan || report.chief_complaint || '').length}
                    </div>
                  </div>

                  {/* Doctor Signature Section */}
                  <div className="border-t-2 border-gray-300 bg-gray-50 p-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-gray-600">Examining Doctor:</p>
                        <p className="font-semibold text-gray-800">Dr. {report.doctor_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Signature:</p>
                        <p className="font-semibold text-gray-800">_________________________</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorPatientReports;
