import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";
import Label from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Search, CheckCircle, XCircle, Clock, FileText, User, Mail, Phone, Calendar } from "lucide-react";

interface DoctorRequest {
  id: number;
  fullname: string;
  email: string;
  phone: string;
  gender: string;
  country: string;
  area: string;
  specialty: string;
  department: string;
  degree: string;
  experience: string;
  designation: string;
  license: string;
  profile_picture: string;
  documents: string;
  status: string;
  created_at: string;
}

const RequestDoctor: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DoctorRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DoctorRequest | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch doctor requests from backend
  const fetchRequests = async () => {
    try {
      setLoading(true);
      console.log('Fetching doctor requests from backend...');
      const res = await fetch("http://localhost:4000/api/admin/doctor-requests", {
        credentials: "include", // include cookie for admin
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to fetch doctor requests:', errorText);
        throw new Error('Failed to fetch doctor requests');
      }
      
      const data = await res.json();
      console.log('Doctor requests data received:', data);
      console.log('Number of requests:', data.length);
      console.log('First request details:', data[0]);
      setRequests(data);
      console.log('Requests state updated');
    } catch (error) {
      console.error('Error fetching doctor requests:', error);
      alert("Failed to load doctor requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  
  const handleReject = async (id: number) => {
    if (!window.confirm("Are you sure you want to reject this doctor request?")) return;

    try {
      const res = await fetch(`http://localhost:4000/api/admin/doctor-requests/${id}/reject`, {
        method: "PUT",
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to reject request:', errorText);
        alert('Failed to reject request');
        return;
      }
      
      alert('Doctor request rejected successfully');
      fetchRequests(); // Refresh the list
      setSelectedRequest(null); // Go back to list view
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const handleDelete = async (id: number) => {
    console.log('Delete button clicked for request ID:', id);
    
    if (!window.confirm("Are you sure you want to delete this doctor request? This action cannot be undone and will also delete any uploaded files.")) {
      console.log('Delete cancelled by user');
      return;
    }

    try {
      console.log('Sending delete request for ID:', id);
      const res = await fetch(`http://localhost:4000/api/admin/doctor-requests/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      console.log('Delete response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to delete request:', errorText);
        alert('Failed to delete request: ' + errorText);
        return;
      }
      
      const data = await res.json();
      console.log('Delete response data:', data);
      alert('Doctor request deleted successfully');
      
      // Clear selected request and refresh list
      setSelectedRequest(null);
      console.log('Refreshing requests list...');
      await fetchRequests(); // Refresh the list
      setRefreshKey(prev => prev + 1); // Force re-render
      console.log('Requests list refreshed');
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request: ' + (error as Error).message);
    }
  };

  const handleViewDetails = (request: DoctorRequest) => {
    setSelectedRequest(request);
  };

  const handleBackToList = () => {
    setSelectedRequest(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = requests.filter(request =>
    request.fullname.toLowerCase().includes(search.toLowerCase()) ||
    request.email.toLowerCase().includes(search.toLowerCase()) ||
    request.specialty.toLowerCase().includes(search.toLowerCase()) ||
    request.department.toLowerCase().includes(search.toLowerCase())
  );
  
  console.log('Current requests state:', requests);
  console.log('Filtered requests:', filteredRequests);
  console.log('Search term:', search);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {selectedRequest ? 'Doctor Request Details' : 'Doctor Requests'}
        </h1>
        <div className="flex gap-3">
          {selectedRequest && (
            <Button onClick={handleBackToList} variant="outline">
              Back to List
            </Button>
          )}
          <Button onClick={() => navigate("/admin/manage-doctors")} variant="outline">
            Back to Manage Doctors
          </Button>
        </div>
      </div>

      {selectedRequest ? (
        // Detail View
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedRequest.fullname}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Personal Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Gender:</span>
                        <span className="text-gray-600">{selectedRequest.gender || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Email:</span>
                        <span className="text-gray-600">{selectedRequest.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Phone:</span>
                        <span className="text-gray-600">{selectedRequest.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Applied:</span>
                        <span className="text-gray-600">{new Date(selectedRequest.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Professional Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Specialty:</span>
                        <span className="text-gray-600">{selectedRequest.specialty}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Department:</span>
                        <span className="text-gray-600">{selectedRequest.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Degree:</span>
                        <span className="text-gray-600">{selectedRequest.degree}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Experience:</span>
                        <span className="text-gray-600">{selectedRequest.experience}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Designation:</span>
                        <span className="text-gray-600">{selectedRequest.designation}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Location & License</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">License:</span>
                        <span className="text-gray-600">{selectedRequest.license}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Area:</span>
                        <span className="text-gray-600">{selectedRequest.area}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Country:</span>
                        <span className="text-gray-600">{selectedRequest.country}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Documents & Media</h3>
                    <div className="space-y-4">
                      {/* Profile Picture */}
                      {selectedRequest.profile_picture && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Profile Picture</h4>
                          <div className="flex items-center gap-4">
                            <img
                              src={`http://localhost:4000/uploads/${selectedRequest.profile_picture}`}
                              alt="Profile Picture"
                              className="w-24 h-24 rounded-lg object-cover border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch(`http://localhost:4000/uploads/${selectedRequest.profile_picture}`);
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = selectedRequest.profile_picture;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                } catch (error) {
                                  console.error('Download failed:', error);
                                  alert('Download failed. Please try again.');
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                            >
                              <FileText className="h-4 w-4" />
                              Download Profile Picture
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Documents */}
                      {selectedRequest.documents && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Professional Documents</h4>
                          <div className="space-y-2">
                            {(() => {
                              console.log('Documents string:', selectedRequest.documents);
                              try {
                                const documents = JSON.parse(selectedRequest.documents);
                                console.log('Parsed documents:', documents);
                                return documents.map((doc: string, index: number) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm text-gray-700">{doc}</span>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(`http://localhost:4000/uploads/${doc}`);
                                          const blob = await response.blob();
                                          const url = window.URL.createObjectURL(blob);
                                          const link = document.createElement('a');
                                          link.href = url;
                                          link.download = doc;
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                          window.URL.revokeObjectURL(url);
                                        } catch (error) {
                                          console.error('Download failed:', error);
                                          alert('Download failed. Please try again.');
                                        }
                                      }}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                    >
                                      <FileText className="h-4 w-4" />
                                      Download
                                    </button>
                                  </div>
                                ));
                              } catch (error) {
                                console.error('Error parsing documents:', error);
                                return <p className="text-sm text-gray-500">No documents available</p>;
                              }
                            })()}
                          </div>
                        </div>
                      )}
                      
                      {!selectedRequest.profile_picture && !selectedRequest.documents && (
                        <p className="text-sm text-gray-500">No documents or profile picture uploaded</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  {selectedRequest.status === 'pending' && (
                    <Button
                      onClick={() => handleReject(selectedRequest.id)}
                      variant="destructive"
                    >
                      Reject Request
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(selectedRequest.id)}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Request
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // List View
        <>
          {/* Search Bar */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
            <div className="flex items-center gap-3">
              <label htmlFor="search" className="font-medium text-gray-700">Search:</label>
              <div className="relative flex-1 max-w-sm">
                <Input
                  id="search"
                  className="w-full pr-10"
                  placeholder="Search by name, email, specialty..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {filteredRequests.length} of {requests.length} requests
              </span>
            </div>
          </div>

          {/* Doctor Requests List */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="text-gray-500">Loading doctor requests...</div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-500">No doctor requests found</div>
              </div>
            ) : (
              <div className="divide-y">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetails(request)}>
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{request.fullname}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{request.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span>{request.specialty}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(request)}>
                          View Details
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(request.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RequestDoctor;
