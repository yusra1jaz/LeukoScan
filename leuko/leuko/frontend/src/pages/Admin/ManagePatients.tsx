import React, { useState, useEffect } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

interface Patient {
  id: number;
  username: string;
  fullName?: string;
  email: string;
  created_at: string;
}

const ManagePatients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Delete patient function
  const handleDeletePatient = async (id: number, username: string) => {
    if (!window.confirm(`Are you sure you want to delete patient ${username}?`)) return;

    try {
      console.log('Deleting patient with ID:', id);
      const res = await fetch(`http://localhost:4000/api/admin/delete-user/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      console.log('Delete patient response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to delete patient:', errorText);
        alert('Failed to delete patient');
        return;
      }
      
      console.log('Patient deleted successfully');
      setPatients(patients.filter(p => p.id !== id));
      alert('Patient deleted successfully');
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Failed to delete patient');
    }
  };

  // Fetch all patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        console.log('Fetching patients from backend...');
        const res = await fetch("http://localhost:4000/api/admin/patients-list", {
          credentials: "include",
        });
        
        console.log('Patients response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Failed to fetch patients:', errorText);
          throw new Error("Failed to fetch patients");
        }
        
        const data = await res.json();
        console.log('Patients data received:', data);
        setPatients(data);
      } catch (err) {
        console.error('Error fetching patients:', err);
        alert("Failed to load patients");
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg text-gray-600">Loading patients...</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Patients</h1>
        <div className="text-sm text-gray-500">
          Total Patients: {patients.length}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center gap-3">
          <label htmlFor="search" className="font-medium text-gray-700">Search:</label>
          <div className="relative flex-1 max-w-sm">
            <Input
              id="search"
              className="w-full pr-10"
              placeholder="Search by patient ID, name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('Search clicked for patients:', search);
            }}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
          <span className="text-sm text-gray-500">
            {patients.filter(p => 
              p.id.toString().includes(search.toLowerCase()) ||
              (p.fullName && p.fullName.toLowerCase().includes(search.toLowerCase())) ||
              p.username.toLowerCase().includes(search.toLowerCase()) ||
              p.email.toLowerCase().includes(search.toLowerCase())
            ).length} of {patients.length} patients
          </span>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {patients.filter(p => 
          p.id.toString().includes(search.toLowerCase()) ||
          (p.fullName && p.fullName.toLowerCase().includes(search.toLowerCase())) ||
          p.username.toLowerCase().includes(search.toLowerCase()) ||
          p.email.toLowerCase().includes(search.toLowerCase())
        ).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-lg font-medium">No patients found</div>
            <p className="text-sm mt-2">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Information
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
              <tbody className="divide-y divide-gray-200">
                {patients
                  .filter(p => 
                    p.id.toString().includes(search.toLowerCase()) ||
                    (p.fullName && p.fullName.toLowerCase().includes(search.toLowerCase())) ||
                    p.username.toLowerCase().includes(search.toLowerCase()) ||
                    p.email.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {patient.fullName ? patient.fullName.charAt(0).toUpperCase() : patient.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{patient.fullName || patient.username}</div>
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
                        <div className="text-xs text-gray-500">
                          {new Date(patient.created_at).toLocaleTimeString()}
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
                            onClick={() => {
                              console.log('Edit button clicked for patient:', patient.id, patient.fullName || patient.username);
                              navigate(`/admin/patient/${patient.id}`);
                            }}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePatient(patient.id, patient.username)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagePatients;
