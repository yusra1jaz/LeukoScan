import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { User, Users, Stethoscope } from "lucide-react"; // icons

interface Counts {
  doctors: number;
  patients: number;
  admins: number;
}

const AdminDashboard: React.FC = () => {
  const [counts, setCounts] = useState<Counts>({ doctors: 0, patients: 0, admins: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        console.log('AdminDashboard: Fetching user counts...');
        // Fetch users grouped by role
        const usersRes = await fetch("http://localhost:4000/api/admin/users-by-role", { credentials: "include" });
        
        if (!usersRes.ok) {
          console.error('AdminDashboard: API call failed:', usersRes.status, usersRes.statusText);
          if (usersRes.status === 401 || usersRes.status === 403) {
            console.error('AdminDashboard: Authentication issue - redirecting might be needed');
          }
          return;
        }
        
        const usersData = await usersRes.json();
        console.log('AdminDashboard: Got user data:', usersData);

        setCounts({
          doctors: usersData.doctors?.length || 0,
          patients: usersData.patients?.length || 0,
          admins: usersData.admins?.length || 0,
        });
      } catch (err) {
        console.error("AdminDashboard: Failed to fetch counts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  if (loading) return <p className="p-6 text-xl">Loading dashboard...</p>;

  const cards = [
    { title: "Doctors", count: counts.doctors, color: "bg-gradient-to-r from-indigo-500 to-purple-500", icon: <Stethoscope size={36} /> },
    { title: "Patients", count: counts.patients, color: "bg-gradient-to-r from-green-400 to-teal-500", icon: <Users size={36} /> },
    { title: "Admins", count: counts.admins, color: "bg-gradient-to-r from-yellow-400 to-orange-500", icon: <User size={36} /> },
  ];

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`relative p-6 rounded-xl shadow-2xl transform hover:-translate-y-2 transition-all duration-300 text-white ${card.color}`}
          >
            <div className="absolute top-4 right-4 opacity-20">{card.icon}</div>
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="text-4xl font-bold mt-4">{card.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
