import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  department: string;
  experience: number;
  designation: string;
  photo?: string;
}

const Appointment: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my-appointments' | 'book-appointment'>('my-appointments');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
    fetchPatientAppointments();
  }, []);

  const fetchPatientAppointments = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/consultations/patient-requests", {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      } else {
        console.error("Failed to fetch patient appointments");
      }
    } catch (error) {
      console.error("Error fetching patient appointments:", error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/doctors/list", {
        credentials: "include",
      });
      
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      }
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const withdrawConsultationRequest = async (requestId: number) => {
    if (!window.confirm('Are you sure you want to withdraw this consultation request? This action cannot be undone and will remove the request from both your and the doctor\'s portal.')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/consultations/withdraw/${requestId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        console.log('Consultation request withdrawn successfully');
        // Refresh the appointments list
        fetchPatientAppointments();
      } else {
        const errorData = await res.json();
        console.error("Failed to withdraw consultation request:", errorData.message);
        alert('Failed to withdraw consultation request: ' + errorData.message);
      }
    } catch (error) {
      console.error("Error withdrawing consultation request:", error);
      alert('Error withdrawing consultation request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Appointments
          </h1>
        </div>

        {/* Two Main Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div 
            onClick={() => setActiveTab('my-appointments')}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Appointments</h2>
                <p className="text-gray-600 dark:text-gray-300">View your scheduled appointments</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('book-appointment')}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <User className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Book Appointment</h2>
                <p className="text-gray-600 dark:text-gray-300">Schedule a new consultation</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Appointments Section */}
        {activeTab === 'my-appointments' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Appointments</h2>
            </div>
            <div className="p-6">
              {appointmentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-300">
                    No appointments scheduled yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-gray-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              Dr. {appointment.doctor_name}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              appointment.status === 'approved' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(appointment.preferred_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {appointment.preferred_time}
                            </div>
                            <div>
                              <span className="font-medium">Department:</span> {appointment.department}
                            </div>
                            <div>
                              <span className="font-medium">Specialty:</span> {appointment.specialty}
                            </div>
                          </div>
                        </div>
                        {appointment.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => withdrawConsultationRequest(appointment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                          >
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Book Appointment Section */}
        {activeTab === 'book-appointment' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Book Appointment</h2>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by doctor name, department, or specialty..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              {doctorsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-300">
                    No doctors available at the moment.
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Doctor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Specialty
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Experience
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {doctors
                          .filter((doctor) =>
                            doctor.name.toLowerCase().includes(search.toLowerCase()) ||
                            doctor.department.toLowerCase().includes(search.toLowerCase()) ||
                            doctor.specialty.toLowerCase().includes(search.toLowerCase())
                          )
                          .map((doctor) => (
                          <tr 
                            key={doctor.id} 
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                            onClick={() => navigate(`/doctor-booking/${doctor.id}`)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {doctor.photo ? (
                                  <img
                                    src={`http://localhost:4000${doctor.photo}`}
                                    alt={doctor.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">Dr. {doctor.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">ID: #{doctor.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">{doctor.department}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {doctor.specialty}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">{doctor.experience} years</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointment;
