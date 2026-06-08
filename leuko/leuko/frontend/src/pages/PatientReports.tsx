import React, { useState, useEffect } from "react";
import { useAuth } from "@/auth/AuthContext";
import Button from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, FileText, Stethoscope, Download, Trash, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface DoctorNote {
  id: number;
  patient_id: number;
  doctor_id: number;
  note: string;
  created_at: string;
  doctor_name: string;
}

const PatientReports: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'assessment'>('list');
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const NOTES_PER_PAGE = 7;

  // Debug state changes
  useEffect(() => {
    console.log('PatientReports state changed:', {
      viewMode,
      notesLoading,
      doctorNotesLength: doctorNotes.length,
      doctorNotes
    });
  }, [viewMode, notesLoading, doctorNotes]);

  useEffect(() => {
    if (user) {
      fetchPatientReports();
    }
  }, [user]);

  const fetchPatientReports = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/reports/my-reports`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data || []);
      } else if (response.status === 404) {
        setReports([]);
      } else {
        throw new Error('Failed to fetch reports');
      }
    } catch (error) {
      console.error("Error fetching patient reports:", error);
      toast({
        title: "Error",
        description: "Failed to load your medical reports",
        variant: "destructive",
      });
    } finally {
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

  const fetchDoctorNotes = async () => {
    if (!user) {
      console.log('fetchDoctorNotes: No user found');
      return;
    }
    
    console.log('fetchDoctorNotes: User:', user);
    setNotesLoading(true);
    try {
      console.log('fetchDoctorNotes: Making API call to', `http://localhost:4000/api/patients/${user.id}/notes-patient`);
      const response = await fetch(`http://localhost:4000/api/patients/${user.id}/notes-patient`, {
        credentials: 'include',
      });

      console.log('fetchDoctorNotes: Response status:', response.status);
      const data = await response.json();
      console.log('fetchDoctorNotes: Response data:', data);

      if (response.ok) {
        const notes = data.notes || [];
        setDoctorNotes(notes);
        setCurrentPage(1); // Reset to first page when new notes are loaded
        console.log('fetchDoctorNotes: Notes loaded:', notes.length);
        console.log('fetchDoctorNotes: Notes data:', notes);
      } else {
        console.error('fetchDoctorNotes: API error:', data);
        throw new Error('Failed to fetch doctor notes');
      }
    } catch (error) {
      console.error("Error fetching doctor notes:", error);
      toast({
        title: "Error",
        description: "Failed to load your doctor assessments",
        variant: "destructive",
      });
    } finally {
      setNotesLoading(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(doctorNotes.length / NOTES_PER_PAGE);
  const startIndex = (currentPage - 1) * NOTES_PER_PAGE;
  const endIndex = startIndex + NOTES_PER_PAGE;
  const currentNotes = doctorNotes.slice(startIndex, endIndex);

  const handleViewAssessments = () => {
    console.log('handleViewAssessments: Current user:', user);
    console.log('handleViewAssessments: User ID:', user?.id);
    setViewMode('assessment');
    fetchDoctorNotes();
  };

  const toggleNoteExpansion = (noteId: number) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handleHideNote = async (noteId: number) => {
    if (!user) return;
    
    if (!window.confirm('Are you sure you want to delete this?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/patients/${user.id}/notes/${noteId}/hide`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        // Remove the note from the local state
        setDoctorNotes(doctorNotes.filter(note => note.id !== noteId));
        toast({
          title: "Success",
          description: "Assessment hidden from your view",
        });
      } else {
        throw new Error('Failed to hide assessment');
      }
    } catch (error) {
      console.error("Error hiding note:", error);
      toast({
        title: "Error",
        description: "Failed to hide assessment",
        variant: "destructive",
      });
    }
  };

  const handleHideReport = async (reportId: number) => {
    if (!user) return;
    
    if (!window.confirm('Are you sure you want to delete this?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/reports/${reportId}/hide`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (response.ok) {
        // Remove the report from the local state
        setReports(reports.filter(report => report.id !== reportId));
        toast({
          title: "Success",
          description: "Report hidden from your view",
        });
      } else {
        throw new Error('Failed to hide report');
      }
    } catch (error) {
      console.error("Error hiding report:", error);
      toast({
        title: "Error",
        description: "Failed to hide report",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = async (report: Report) => {
    try {
      // Create a temporary div to render the report content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.padding = '0';
      tempDiv.style.margin = '0';
      tempDiv.style.fontFamily = 'Times New Roman, serif';
      tempDiv.style.fontSize = '12pt';
      tempDiv.style.lineHeight = '1.5';
      tempDiv.style.color = '#000';
      tempDiv.style.backgroundColor = '#fff';
      
      // Build the HTML content to match the exact layout shown in the image
      tempDiv.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="font-size: 24pt; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 2px; color: #000;">LEUKEMIA TREATMENT CENTER</h1>
          <h2 style="font-size: 16pt; margin: 5px 0 0 0; font-weight: normal; color: #333;">Medical Report</h2>
        </div>
        
        <div style="margin-bottom: 25px; background: #f0f4f8; padding: 20px;">
          <h3 style="font-size: 16pt; font-weight: bold; margin-bottom: 15px; color: #000;">PATIENT INFORMATION</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="margin-bottom: 12px;"><strong style="color: #000;">Patient Name:</strong> <span style="color: #000;">${report.patient_name}</span></div>
            <div style="margin-bottom: 12px;"><strong style="color: #000;">Patient ID:</strong> <span style="color: #000;">#${report.patient_id}</span></div>
            <div style="margin-bottom: 12px;"><strong style="color: #000;">Date of Birth:</strong> <span style="color: #000;">${report.patient_info?.dob || 'Not specified'}</span></div>
            <div style="margin-bottom: 12px;"><strong style="color: #000;">Gender:</strong> <span style="color: #000;">${report.patient_info?.gender || 'Not specified'}</span></div>
            <div style="margin-bottom: 12px;"><strong style="color: #000;">Guardian Name:</strong> <span style="color: #000;">${report.patient_name}</span></div>
            <div style="margin-bottom: 12px;"><strong style="color: #000;">Contact:</strong> <span style="color: #000;">${report.patient_info?.phone || report.patient_info?.email}</span></div>
            <div style="margin-bottom: 12px;"><strong style="color: #000;">Report Date:</strong> <span style="color: #000;">${new Date(report.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
            <div style="margin-bottom: 12px;"><strong style="color: #000;">Report Type:</strong> <span style="color: #000;">${report.report_type}</span></div>
          </div>
        </div>
        
        <div style="margin-bottom: 25px; background: #ffffff; padding: 20px;">
          <h3 style="font-size: 16pt; font-weight: bold; margin-bottom: 15px; padding: 5px 0; border-bottom: 2px solid #000; color: #000;">MEDICAL REPORT</h3>
          <div style="background: #ffffff; padding: 20px; min-height: 500px; white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; line-height: 1.6;">
            ${report.assessment || report.plan || report.chief_complaint || 'No medical content available'}
          </div>
          <div style="font-size: 11pt; color: #666; margin-top: 10px; text-align: right;">
            Characters: ${(report.assessment || report.plan || report.chief_complaint || '').length}
          </div>
        </div>
        
        ${report.history_present_illness ? `
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px solid #ccc; color: #1f2937;">History of Present Illness</h3>
          <div style="background: #f9f9f9; border: 2px solid #d1d5db; padding: 15px; white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 11pt; color: #1f2937;">
            ${report.history_present_illness}
          </div>
        </div>
        ` : ''}
        
        ${report.physical_examination ? `
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px solid #ccc; color: #1f2937;">Physical Examination</h3>
          <div style="background: #f9f9f9; border: 2px solid #d1d5db; padding: 15px; white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 11pt; color: #1f2937;">
            ${report.physical_examination}
          </div>
        </div>
        ` : ''}
        
        ${report.plan ? `
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px solid #ccc; color: #1f2937;">Treatment Plan</h3>
          <div style="background: #f9f9f9; border: 2px solid #d1d5db; padding: 15px; white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 11pt; color: #1f2937;">
            ${report.plan}
          </div>
        </div>
        ` : ''}
        
        ${report.medications ? `
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px solid #ccc; color: #1f2937;">Medications</h3>
          <div style="background: #f9f9f9; border: 2px solid #d1d5db; padding: 15px; white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 11pt; color: #1f2937;">
            ${report.medications}
          </div>
        </div>
        ` : ''}
        
        ${report.follow_up ? `
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px solid #ccc; color: #1f2937;">Follow-up Instructions</h3>
          <div style="background: #f9f9f9; border: 2px solid #d1d5db; padding: 15px; white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 11pt; color: #1f2937;">
            ${report.follow_up}
          </div>
        </div>
        ` : ''}
        
        ${report.additional_notes ? `
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 10px; padding: 5px 0; border-bottom: 1px solid #ccc; color: #1f2937;">Additional Notes</h3>
          <div style="background: #f9f9f9; border: 2px solid #d1d5db; padding: 15px; white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 11pt; color: #1f2937;">
            ${report.additional_notes}
          </div>
        </div>
        ` : ''}
        
        <div style="margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px solid #000; padding-top: 30px;">
          <div style="text-align: left;">
            <div style="font-weight: bold; color: #000; font-size: 14pt;">Examining Doctor:</div>
            <div style="color: #000; font-size: 12pt; margin-top: 5px;">Dr. ${report.doctor_name}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; color: #000; font-size: 14pt;">Signature:</div>
            <div style="border-bottom: 2px solid #000; width: 250px; margin: 10px 0;"></div>
          </div>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #000; font-size: 10pt; color: #666; text-align: center;">
          <p>Report generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>Leukemia Treatment Center - Confidential Medical Document</p>
        </div>
      `;
      
      // Add to document temporarily
      document.body.appendChild(tempDiv);
      
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create canvas from HTML with proper dimensions
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: tempDiv.scrollHeight, // Use actual content height
        windowWidth: 794,
        windowHeight: tempDiv.scrollHeight
      });
      
      // Remove temporary div
      document.body.removeChild(tempDiv);
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions to fit A4 page
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Save PDF
      const fileName = `medical-report-${report.patient_name}-${new Date(report.created_at).toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Downloaded",
        description: "Your medical report has been downloaded as a PDF document",
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading your medical reports...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      {viewMode !== 'assessment' && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Medical Reports</h1>
              <p className="text-gray-600">
                View and download your medical reports from the Leukemia Treatment Center
              </p>
            </div>
            <Button
              onClick={handleViewAssessments}
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <Stethoscope className="mr-2 h-4 w-4" />
              Doctor Assessments
            </Button>
          </div>
        </div>
      )}

      {viewMode === 'assessment' ? (
        <div className="space-y-6">
          {/* Assessment Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Doctor Assessments & Notes</h2>
            <Button
              onClick={handleBackToList}
              variant="outline"
              size="sm"
            >
              Back to Reports
            </Button>
          </div>
          
          {/* Assessment Summary */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Stethoscope className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-purple-800 font-medium">
                  You have {doctorNotes.length} doctor assessment{doctorNotes.length !== 1 ? 's' : ''}
                </span>
              </div>
              {doctorNotes.length > 0 && (
                <span className="text-sm text-purple-600">
                  Latest: {new Date(Math.max(...doctorNotes.map(note => new Date(note.created_at).getTime()))).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Doctor Assessment View */}
          {notesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-lg text-gray-600">Loading assessments...</div>
            </div>
          ) : doctorNotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <Stethoscope className="h-16 w-16 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Doctor Assessments Found</h3>
              <p className="text-gray-500 mb-6">
                Your doctor hasn't added any assessments or notes yet. Check back after your next consultation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentNotes.map((note) => {
                const noteDate = new Date(note.created_at);
                const dayName = noteDate.toLocaleDateString('en-US', { weekday: 'long' });
                const formattedDate = noteDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
                const formattedTime = noteDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={note.id} className="bg-white border-2 border-purple-200 rounded-lg shadow-sm">
                    <div 
                      className="border-b border-purple-200 bg-purple-50 p-4 cursor-pointer hover:bg-purple-100 transition-colors"
                      onClick={() => toggleNoteExpansion(note.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Stethoscope className="h-5 w-5 text-purple-600" />
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Dr. {note.doctor_name}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{dayName}, {formattedDate}</span>
                              <Clock className="h-4 w-4 ml-2" />
                              <span>{formattedTime}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="text-xs text-purple-600 font-medium">Assessment Note</div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHideNote(note.id);
                            }}
                            className="text-red-500 hover:text-red-700 transition-colors p-2 rounded hover:bg-red-50"
                            title="Hide assessment from my view"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                          <div className="text-purple-600">
                            {expandedNotes.has(note.id) ? 
                              <ChevronUp className="h-5 w-5" /> : 
                              <ChevronDown className="h-5 w-5" />
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    {expandedNotes.has(note.id) && (
                      <div className="p-6 border-t border-purple-100">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Assessment Details:</h5>
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {note.note}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t border-purple-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Reports view (list/detail modes)
        <div className="space-y-6">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <FileText className="h-16 w-16 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Medical Reports Found</h3>
              <p className="text-gray-500 mb-6">
                You don't have any medical reports yet. Your doctor will create reports for you after consultations.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Bar */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-blue-800 font-medium">
                      You have {reports.length} medical report{reports.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {viewMode === 'detail' && (
                    <Button
                      onClick={handleBackToList}
                      variant="outline"
                      size="sm"
                    >
                      Back to Date List
                    </Button>
                  )}
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
                    <div key={date} className="space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <h4 className="text-lg font-semibold text-gray-900">{date}</h4>
                        <span className="text-sm text-gray-600">
                          ({dateReports.length} report{dateReports.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                      {dateReports.map((report) => (
                        <div 
                          key={report.id}
                          onClick={() => handleDateClick(date)}
                          className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        >
                          <div className="relative" style={{ paddingRight: '80px', minHeight: '60px' }}>
                            <div className="flex items-center space-x-3" style={{ maxWidth: 'calc(100% - 80px)' }}>
                              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate">{report.report_type}</p>
                                <p className="text-sm text-gray-600 truncate">Dr. {report.doctor_name}</p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHideReport(report.id);
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors p-2 rounded-md border border-red-200"
                              style={{ position: 'absolute', top: '8px', right: '8px' }}
                              title="Hide report from my view"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Detail View - Full Reports for Selected Date */}
              {viewMode === 'detail' && selectedDate && (
                <div className="space-y-6">
                  <div className="flex items-center">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Reports for {selectedDate}
                    </h3>
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
                          <div className="p-4 whitespace-pre-wrap text-gray-800" style={{ minHeight: '500px' }}>
                            {report.assessment || report.plan || report.chief_complaint || "No medical content available"}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          Characters: {(report.assessment || report.plan || report.chief_complaint || "").length}
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

                      {/* Action Buttons */}
                      <div className="border-t-2 border-gray-300 bg-gray-50 p-4">
                        <div className="flex justify-end space-x-4">
                          <Button
                            onClick={() => handleDownloadReport(report)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientReports;
