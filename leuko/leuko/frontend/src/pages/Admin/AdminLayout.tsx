import React from "react";
import { Link, Outlet } from "react-router-dom";

const AdminLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-6">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <nav className="flex flex-col gap-4">
          <Link to="/admin/dashboard" className="hover:text-indigo-400">Dashboard</Link>
          <Link to="/admin/manage-doctors" className="hover:text-indigo-400">Manage Doctors</Link>
          <Link to="/admin/manage-patients" className="hover:text-indigo-400">Manage Patients</Link>
          <Link to="/admin/reports" className="hover:text-indigo-400">Reports</Link>
          <Link to="/admin/settings" className="hover:text-indigo-400">Settings</Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-100 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
