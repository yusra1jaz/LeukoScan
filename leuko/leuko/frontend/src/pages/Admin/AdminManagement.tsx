import React, { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";
import { Search } from "lucide-react";

interface Admin {
  id: number;
  username: string;
  fullName?: string;
  email: string;
  phone?: string;
  created_at: string;
}

interface NewAdmin {
  username: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

interface AdminListResponse {
  admins: Admin[];
  message?: string;
}

interface AdminActionResponse {
  message: string;
}

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [newAdmin, setNewAdmin] = useState<NewAdmin>({
    username: "",
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await axios.get<AdminListResponse>("http://localhost:4000/api/admin/admins", {
        withCredentials: true,
      });
      setAdmins(res.data.admins);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching admins:", err);
      setError(err.response?.data?.message || "Failed to fetch admins");
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newAdmin.username || !newAdmin.email || !newAdmin.password) {
      setError("Username, email, and password are required");
      return;
    }

    if (newAdmin.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      const res = await axios.post<AdminActionResponse>("http://localhost:4000/api/admin/add", newAdmin, {
        withCredentials: true,
      });
      
      setSuccess(res.data.message);
      setNewAdmin({ username: "", fullName: "", email: "", password: "", phone: "" });
      setShowAddForm(false);
      fetchAdmins(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add admin");
    }
  };

  const handleDeleteAdmin = async (adminId: number, adminUsername: string) => {
    if (!window.confirm(`Are you sure you want to delete admin "${adminUsername}"?`)) {
      return;
    }

    try {
      const res = await axios.delete<AdminActionResponse>(`http://localhost:4000/api/admin/delete/${adminId}`, {
        withCredentials: true,
      });
      
      setSuccess(res.data.message);
      fetchAdmins(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete admin");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAdmin(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading admins...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showAddForm ? "Cancel" : "Add New Admin"}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center gap-3">
          <label htmlFor="search" className="font-medium text-gray-700">Search:</label>
          <div className="relative flex-1 max-w-sm">
            <Input
              id="search"
              type="text"
              className="w-full pr-10"
              placeholder="Search by admin ID, name, or email..."
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
              // Optional: You can add search functionality here
              console.log('Search clicked for:', search);
            }}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
          <span className="text-sm text-gray-500">
            {admins.filter(admin => 
              admin.id.toString().includes(search.toLowerCase()) ||
              admin.username.toLowerCase().includes(search.toLowerCase()) ||
              admin.email.toLowerCase().includes(search.toLowerCase())
            ).length} of {admins.length} admins
          </span>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Add Admin Form */}
      {showAddForm && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Add New Admin</h2>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <Input
                  id="username"
                  name="username"
                  value={newAdmin.username}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={newAdmin.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newAdmin.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={newAdmin.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  placeholder="Enter password (min 6 chars)"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={newAdmin.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
              >
                Add Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewAdmin({ username: "", fullName: "", email: "", password: "", phone: "" });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Admins List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Admins List</h2>
          <p className="text-sm text-gray-600 mt-1">Total admins: {admins.length}</p>
        </div>
        
        {admins.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No admins found. Click "Add New Admin" to create one.
          </div>
        ) : admins.filter(admin => 
            admin.id.toString().includes(search.toLowerCase()) ||
            (admin.fullName && admin.fullName.toLowerCase().includes(search.toLowerCase())) ||
            admin.username.toLowerCase().includes(search.toLowerCase()) ||
            admin.email.toLowerCase().includes(search.toLowerCase())
          ).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-lg font-medium">No admins found</div>
            <p className="text-sm mt-2">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins
                  .filter(admin => 
                    admin.id.toString().includes(search.toLowerCase()) ||
                    (admin.fullName && admin.fullName.toLowerCase().includes(search.toLowerCase())) ||
                    admin.username.toLowerCase().includes(search.toLowerCase()) ||
                    admin.email.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {admin.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {admin.fullName || admin.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {admin.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {admin.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAdmin(admin.id, admin.fullName || admin.username)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </Button>
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

export default AdminManagement;
