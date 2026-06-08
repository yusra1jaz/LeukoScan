import React, { useState, useEffect } from "react";

import { useParams, useNavigate } from "react-router-dom";

import Button from "@/components/ui/button";

import { Trash } from "lucide-react";



interface PersonalInfo {

  id: number;

  username: string;

  fullName?: string;

  email: string;

  phone?: string;

  dob?: string;

  gender?: string;

  address?: string;

  created_at: string;

}



interface DiseaseInfo {

  leukemiaType?: string;

  stage?: string;

  medications?: string;

  hospital?: string;

}



interface DoctorNote {

  id: number;

  note: string;

  created_at: string;

  doctor_name: string;

}



interface PatientResponse {

  patient: PersonalInfo;

}



interface DiseaseResponse {

  disease: DiseaseInfo;

}



interface NotesResponse {

  notes: DoctorNote[];

}



interface AddNoteResponse {

  note: DoctorNote;

}



const DoctorPatientAssessment: React.FC = () => {

  const params = useParams();

  const patientId = params.id; // Use params.id instead of destructuring

  const navigate = useNavigate();

  

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);

  const [diseaseInfo, setDiseaseInfo] = useState<DiseaseInfo | null>(null);

  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([]);

  const [newNote, setNewNote] = useState("");

  const [loading, setLoading] = useState(true);

  const [savingNote, setSavingNote] = useState(false);



  // Pagination and filtering states

  const [currentPage, setCurrentPage] = useState(1);

  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  const notesPerPage = 3; // Show only 3 notes per page



  // Filter notes by date

  const filteredNotes = doctorNotes.filter(note => {

    const noteDate = new Date(note.created_at);

    const now = new Date();

    

    switch (dateFilter) {

      case 'week':

        return (now.getTime() - noteDate.getTime()) <= (7 * 24 * 60 * 60 * 1000);

      case 'month':

        return (now.getTime() - noteDate.getTime()) <= (30 * 24 * 60 * 60 * 1000);

      case 'year':

        return (now.getTime() - noteDate.getTime()) <= (365 * 24 * 60 * 60 * 1000);

      default:

        return true;

    }

  });



  // Pagination

  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);

  const startIndex = (currentPage - 1) * notesPerPage;

  const paginatedNotes = filteredNotes.slice(startIndex, startIndex + notesPerPage);



  const handlePageChange = (page: number) => {

    setCurrentPage(page);

  };



  useEffect(() => {

    if (patientId) {

      fetchPatientData();

    } else {

      setLoading(false);

    }

  }, [patientId]);



  const fetchPatientData = async () => {

    try {

      // Fetch personal info

      const personalRes = await fetch(`http://localhost:4000/api/patients/${patientId}`, {

        credentials: 'include',

      });

      const personalData = await personalRes.json();

      

      // Fetch disease info

      const diseaseRes = await fetch(`http://localhost:4000/api/patients/${patientId}/disease`, {

        credentials: 'include',

      });

      const diseaseData = await diseaseRes.json();

      

      // Fetch doctor notes

      const notesRes = await fetch(`http://localhost:4000/api/patients/${patientId}/notes`, {

        credentials: 'include',

      });

      const notesData = await notesRes.json();



      if (!personalRes.ok || !diseaseRes.ok || !notesRes.ok) {

        throw new Error('Failed to fetch patient data');

      }



      setPersonalInfo(personalData.patient);

      setDiseaseInfo(diseaseData.disease || {});

      setDoctorNotes(notesData.notes || []);

      setLoading(false);

    } catch (error) {

      console.error("Error fetching patient data:", error);

      setLoading(false);

    }

  };



  

  const handleDeleteNote = async (noteId: number) => {

    if (!window.confirm('Are you sure you want to delete this assessment note?')) {

      return;

    }



    try {

      const res = await fetch(`http://localhost:4000/api/patients/${patientId}/notes/${noteId}`, {

        method: 'DELETE',

        credentials: 'include',

      });



      if (res.ok) {

        setDoctorNotes(doctorNotes.filter(note => note.id !== noteId));

      } else {

        alert('Failed to delete note');

      }

    } catch (error) {

      console.error('Error deleting note:', error);

      alert('Failed to delete note');

    }

  };



  const handleAddNote = async () => {

    if (!newNote.trim()) return;



    setSavingNote(true);

    try {

      const res = await fetch(`http://localhost:4000/api/patients/${patientId}/notes`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

        },

        credentials: 'include',

        body: JSON.stringify({ note: newNote })

      });

      

      const data = await res.json();

      

      if (!res.ok) {

        throw new Error('Failed to add note');

      }

      

      setDoctorNotes([data.note, ...doctorNotes]);

      setNewNote("");

    } catch (error) {

      console.error("Error adding note:", error);

      alert("Failed to add note");

    } finally {

      setSavingNote(false);

    }

  };



  if (loading) {

    return (

      <div className="flex items-center justify-center h-64">

        <div className="text-lg text-gray-600">Loading patient information...</div>

      </div>

    );

  }



  if (!personalInfo) {

    return (

      <div className="flex items-center justify-center h-64">

        <div className="text-lg text-red-600">Patient not found</div>

      </div>

    );

  }



  return (

    <div className="max-w-6xl mx-auto p-6">

      {/* Header */}

      <div className="flex justify-between items-center mb-6">

        <div>

          <h1 className="text-3xl font-bold text-gray-900">Patient Assessment</h1>

          <p className="text-gray-600 mt-1">Patient: {personalInfo.fullName || personalInfo.username} (ID: #{personalInfo.id})</p>

        </div>

        <div className="flex space-x-2">

          <Button

            onClick={() => navigate(`/doctor/patient-symptoms/${patientId}`)}

            variant="outline"

            className="border-green-600 text-green-600 hover:bg-green-50"

          >

            Track Symptoms

          </Button>

          <Button

            onClick={() => navigate("/doctor/patient-info")}

            variant="outline"

            className="border-gray-300"

          >

            Back to Patients

          </Button>

        </div>

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Personal Information */}

        <div className="lg:col-span-2 space-y-6">

          {/* Personal Info Card */}

          <div className="bg-white rounded-lg shadow-sm border">

            <div className="px-6 py-4 border-b border-gray-200">

              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>

            </div>

            <div className="p-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>

                  <p className="text-gray-900">{personalInfo.fullName || personalInfo.username}</p>

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>

                  <p className="text-gray-900">{personalInfo.email}</p>

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>

                  <p className="text-gray-900">{personalInfo.phone || "Not provided"}</p>

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>

                  <p className="text-gray-900">

                    {personalInfo.dob ? new Date(personalInfo.dob).toLocaleDateString() : "Not provided"}

                  </p>

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>

                  <p className="text-gray-900">{personalInfo.gender || "Not provided"}</p>

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Date</label>

                  <p className="text-gray-900">

                    {new Date(personalInfo.created_at).toLocaleDateString()}

                  </p>

                </div>

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>

                  <p className="text-gray-900">{personalInfo.address || "Not provided"}</p>

                </div>

              </div>

            </div>

          </div>



          {/* Disease Information */}

          <div className="bg-white rounded-lg shadow-sm border">

            <div className="px-6 py-4 border-b border-gray-200">

              <h2 className="text-xl font-semibold text-gray-900">Disease Information</h2>

            </div>

            <div className="p-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Leukemia Type</label>

                  <p className="text-gray-900">{diseaseInfo?.leukemiaType || "Not specified"}</p>

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>

                  <p className="text-gray-900">{diseaseInfo?.stage || "Not specified"}</p>

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Medications</label>

                  <p className="text-gray-900 whitespace-pre-wrap">{diseaseInfo?.medications || "Not specified"}</p>

                </div>

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>

                  <p className="text-gray-900">{diseaseInfo?.hospital || "Not specified"}</p>

                </div>

              </div>

            </div>

          </div>

        </div>



        {/* Doctor Notes Section */}

        <div className="space-y-6">

          {/* Add Note */}

          <div className="bg-white rounded-lg shadow-sm border">

            <div className="px-6 py-4 border-b border-gray-200">

              <h2 className="text-xl font-semibold text-gray-900">Doctor Notes</h2>

            </div>

            <div className="p-6">

              <div className="space-y-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">Add Assessment Note</label>

                  <textarea

                    value={newNote}

                    onChange={(e) => setNewNote(e.target.value)}

                    placeholder="Enter your assessment notes, observations, or treatment recommendations..."

                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

                    rows={4}

                  />

                </div>

                <Button

                  onClick={handleAddNote}

                  disabled={!newNote.trim() || savingNote}

                  className="w-full"

                >

                  {savingNote ? "Adding Note..." : "Add Note"}

                </Button>

              </div>

            </div>

          </div>



          {/* Notes History */}

          <div className="bg-white rounded-lg shadow-sm border">

            <div className="px-6 py-4 border-b border-gray-200">

              <div className="flex justify-between items-center">

                <h3 className="text-lg font-semibold text-gray-900">Assessment History</h3>

                <div className="flex items-center space-x-2">

                  <label className="text-sm font-medium text-gray-700">Filter:</label>

                  <select

                    value={dateFilter}

                    onChange={(e) => {

                      setDateFilter(e.target.value as 'all' | 'week' | 'month' | 'year');

                      setCurrentPage(1); // Reset to first page when filter changes

                    }}

                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"

                  >

                    <option value="all">All Time</option>

                    <option value="week">Last Week</option>

                    <option value="month">Last Month</option>

                    <option value="year">Last Year</option>

                  </select>

                </div>

              </div>

            </div>

            <div className="p-6">

              {paginatedNotes.length === 0 ? (

                <div className="text-center py-8">

                  <p className="text-gray-500">

                    {dateFilter === 'all' ? 'No assessment notes found' : `No notes found in selected time period`}

                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {paginatedNotes.map((note) => (

                    <div key={note.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg">

                      <div className="flex justify-between items-start mb-2">

                        <div>

                          <span className="font-medium text-gray-900">{note.doctor_name}</span>

                          <span className="text-sm text-gray-500 ml-2">

                            {new Date(note.created_at).toLocaleDateString()}

                          </span>

                        </div>

                        <span className="text-xs text-gray-500">

                          {new Date(note.created_at).toLocaleTimeString()}

                        </span>

                      </div>

                      <p className="text-gray-700 whitespace-pre-wrap">{note.note}</p>

                    </div>

                  ))}

                </div>

              )}



              {/* Pagination */}

              {totalPages > 1 && (

                <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t border-gray-200">

                  <Button

                    variant="outline"

                    size="sm"

                    onClick={() => handlePageChange(currentPage - 1)}

                    disabled={currentPage === 1}

                    className="border-gray-300"

                  >

                    Previous

                  </Button>

                  

                  <span className="text-sm text-gray-600">

                    Page {currentPage} of {totalPages}

                  </span>

                  

                  <Button

                    variant="outline"

                    size="sm"

                    onClick={() => handlePageChange(currentPage + 1)}

                    disabled={currentPage === totalPages}

                    className="border-gray-300"

                  >

                    Next

                  </Button>

                </div>

              )}



              {/* Notes count */}

              <div className="text-center text-sm text-gray-500 mt-4">

                Showing {paginatedNotes.length} of {filteredNotes.length} notes

                {dateFilter !== 'all' && ` (${dateFilter})`}

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};



export default DoctorPatientAssessment;

