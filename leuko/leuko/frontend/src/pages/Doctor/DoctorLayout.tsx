import React from "react";
import { Link, Outlet } from "react-router-dom";

const DoctorLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-green-800 text-white p-6">
        <h2 className="text-2xl font-bold mb-6">Doctor Panel</h2>
        <nav className="flex flex-col gap-4">
          <Link to="/doctor/dashboard" className="hover:text-green-400">Dashboard</Link>
          <Link to="/doctor/patient-info" className="hover:text-green-400">Patient Info</Link>
          <Link to="/doctor/settings" className="hover:text-green-400">Settings</Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-100 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default DoctorLayout;
