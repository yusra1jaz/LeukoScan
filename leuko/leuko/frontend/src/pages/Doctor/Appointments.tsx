import React, { useState, useEffect } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, FileText, Image, Download, ArrowLeft, Trash } from "lucide-react";

interface ConsultationRequest {
  id: number;
  patient_id?: number;
  patient_name: string;
  patient_email: string;
  dob?: string;
  gender?: string;
  preferred_date: string;
  preferred_time: string;
  consultation_type: string;
  symptoms: string;
  urgency: string;
  notes: string;
  status: string;
  created_at: string;
}

interface ConsultationDocument {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
}

const Appointments: React.FC = () => {
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ConsultationRequest | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [documents, setDocuments] = useState<ConsultationDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  useEffect(() => {
    fetchConsultationRequests();
  }, []);

  const fetchConsultationRequests = async () => {
    try {
      // Clear existing requests first
      setRequests([]);
      
      const res = await fetch("http://localhost:4000/api/consultations/doctor-requests", {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched consultation requests:', data);
        setRequests(data);
      } else {
        console.error("Failed to fetch consultation requests");
        setRequests([]);
      }
    } catch (error) {
      console.error("Error fetching consultation requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: number, status: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/consultations/update-status/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        // Refresh the requests list
        fetchConsultationRequests();
        // If we're in details view, go back to list
        if (viewMode === 'details') {
          setViewMode('list');
          setSelectedRequest(null);
        }
      } else {
        console.error("Failed to update request status");
      }
    } catch (error) {
      console.error("Error updating request status:", error);
    }
  };

  const handleRequestClick = (request: ConsultationRequest) => {
    console.log('🔍 DEBUG - Selected request data:', request);
    setSelectedRequest(request);
    setViewMode('details');
    fetchConsultationDocuments(request.id);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedRequest(null);
    setDocuments([]);
  };

  const deleteConsultationRequest = async (requestId: number) => {
    if (!window.confirm('Are you sure you want to delete this consultation request? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/consultations/delete/${requestId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        console.log('Consultation request deleted successfully');
        // Force refresh the requests list
        await fetchConsultationRequests();
        // If we're in details view, go back to list
        if (viewMode === 'details') {
          setViewMode('list');
          setSelectedRequest(null);
          setDocuments([]);
        }
      } else {
        const errorData = await res.json();
        console.error("Failed to delete consultation request:", errorData.message);
        alert('Failed to delete consultation request: ' + errorData.message);
      }
    } catch (error) {
      console.error("Error deleting consultation request:", error);
      alert('Error deleting consultation request. Please try again.');
    }
  };

  const fetchConsultationDocuments = async (consultationId: number) => {
    setDocumentsLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/consultations/documents/${consultationId}`, {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else {
        console.error("Failed to fetch consultation documents");
      }
    } catch (error) {
      console.error("Error fetching consultation documents:", error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDownloadDocument = (doc: ConsultationDocument) => {
    const link = window.document.createElement('a');
    link.href = `http://localhost:4000/api/consultations/download-document/${doc.id}`;
    link.download = doc.original_name;
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {viewMode === 'list' ? (
        <>
          <h1 className="text-3xl font-bold mb-6">Consultation Requests</h1>
          
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No consultation requests at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <Card 
                  key={request.id} 
                  className="w-full cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleRequestClick(request)}
                >
                  <CardContent className="py-5 px-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <div className="mt-2 mb-1">
                          <h3 className="font-medium text-gray-900">{request.patient_name}</h3>
                          <p className="text-sm text-gray-600">ID: #{request.patient_id || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right mt-2 mb-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            Sent: {new Date(request.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {new Date(request.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConsultationRequest(request.id);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors p-2 rounded"
                          title="Delete consultation request"
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={handleBackToList}
              className="flex items-center gap-2"
            >
              ← Back to List
            </Button>
            <h1 className="text-3xl font-bold">Consultation Details</h1>
          </div>
          
          {selectedRequest && (
            <div className="space-y-4">
              {/* Patient Information Card */}
              <Card className="w-full">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Patient Information</h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</h4>
                      <p className="text-gray-900 dark:text-white">{selectedRequest.patient_name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Patient ID</h4>
                      <p className="text-gray-900 dark:text-white">#{selectedRequest.patient_id || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</h4>
                      <p className="text-gray-900 dark:text-white">{selectedRequest.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</h4>
                      <p className="text-gray-900 dark:text-white">{selectedRequest.dob || 'N/A'}</p>
                    </div>
                                        <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sent Date</h4>
                      <p className="text-gray-900 dark:text-white">{new Date(selectedRequest.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sent Time</h4>
                      <p className="text-gray-900 dark:text-white">{new Date(selectedRequest.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Documents Section - Only show if documents exist */}
              {documents.length > 0 && (
                <Card className="w-full">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Uploaded Documents</h2>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      Medical reports, images, or other relevant documents
                    </p>
                  </div>
                  <div className="p-4">
                    {documentsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documents.map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="text-gray-400">
                                {getFileIcon(doc.original_name)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                  {doc.original_name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Additional Information Section */}
              <Card className="w-full">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Consultation Details</h2>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Patient Notes:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {selectedRequest.notes && selectedRequest.notes !== 'No additional notes provided' ? selectedRequest.notes : selectedRequest.symptoms || 'No notes provided'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Delete Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => deleteConsultationRequest(selectedRequest.id)}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Appointments;
