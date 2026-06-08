import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";
import Label from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

interface Doctor {
  id: number;
  name: string;
  email: string;
  specialty: string;
  username: string;
  password: string;
  photo?: string;
}

const ManageDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Fetch doctors from backend
  const fetchDoctors = async () => {
    try {
      console.log('Fetching doctors from backend...');
      const res = await fetch("http://localhost:4000/api/admin/doctors", {
        credentials: "include", // include cookie for admin
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to fetch doctors:', errorText);
        throw new Error('Failed to fetch doctors');
      }
      
      const data = await res.json();
      console.log('Doctors data received:', data);
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      alert("Failed to load doctors");
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;

    try {
      console.log('Deleting doctor with ID:', id);
      const res = await fetch(`http://localhost:4000/api/admin/doctors/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      console.log('Delete response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to delete doctor:', errorText);
        alert('Failed to delete doctor');
        return;
      }
      
      console.log('Doctor deleted successfully');
      setDoctors(doctors.filter(d => d.id !== id));
      alert('Doctor deleted successfully');
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Doctors</h1>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/admin/request-doctor")} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
            Request
          </Button>
          <Button onClick={() => navigate("/admin/add-doctor")} className="bg-blue-600 hover:bg-blue-700">
            Add Doctor
          </Button>
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
              placeholder="Search by doctor ID, name, or email..."
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
              console.log('Search clicked for doctors:', search);
            }}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
          <span className="text-sm text-gray-500">
            {doctors.filter(d => 
              d.id.toString().includes(search.toLowerCase()) ||
              d.name.toLowerCase().includes(search.toLowerCase()) ||
              d.email.toLowerCase().includes(search.toLowerCase())
            ).length} of {doctors.length} doctors
          </span>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {doctors.filter(d => 
              d.id.toString().includes(search.toLowerCase()) ||
              d.name.toLowerCase().includes(search.toLowerCase()) ||
              d.email.toLowerCase().includes(search.toLowerCase())
            ).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-lg font-medium">No doctors found</div>
            <p className="text-sm mt-2">Try adjusting your search or add a new doctor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {doctors
                  .filter(d => 
                    d.id.toString().includes(search.toLowerCase()) ||
                    d.name.toLowerCase().includes(search.toLowerCase()) ||
                    d.email.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={doctor.photo ? `http://localhost:4000${doctor.photo}` : "/default-doctor.png"}
                            alt={doctor.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                            <div className="text-xs text-gray-500">ID: #{doctor.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doctor.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {doctor.specialty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            onClick={() => navigate(`/admin/edit-doctor/${doctor.id}`)}
                            variant="outline"
                            size="sm"
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(doctor.id)}
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

export default ManageDoctors;
