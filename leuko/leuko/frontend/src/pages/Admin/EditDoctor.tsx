import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";
import Label from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface Doctor {
  id: number;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  specialty: string;
  department: string;
  degree: string;
  experience: number;
  designation: string;
  username: string;
  password: string;
  photo?: string | File;
  plain_password?: string;
}

const EditDoctor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor>({
    id: Number(id),
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    specialty: "",
    department: "",
    degree: "",
    experience: 0,
    designation: "",
    username: "",
    password: "",
    photo: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- Modal / reset password states ---
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/admin/doctors/${id}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Doctor not found");

        const data = await res.json();

        setDoctor({
          ...data,
          password: data.plain_password || "",
        });

      } catch (err) {
        alert("Failed to load doctor info");
        navigate("/admin/manage-doctors");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [id, navigate]);

  const handleSave = async () => {
    try {
      const formData = new FormData();

      Object.entries(doctor).forEach(([key, value]) => {
        if (value !== undefined && key !== "id") {
          // Do not append if password is empty string — avoid overwriting unintentionally
          if (key === "password" && (value as string).trim() === "") return;
          formData.append(key, value as any);
        }
      });

      if (doctor.photo instanceof File) {
        formData.append("photo", doctor.photo);
      }

      const res = await fetch(`http://localhost:4000/api/admin/doctors/${id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || "Failed to update doctor");
      }

      alert("Doctor updated successfully");
      navigate("/admin/manage-doctors");

    } catch (err) {
      console.error(err);
      alert("Failed to save doctor info");
    }
  };

  // ---------------- Reset password handler ----------------
  const handleOpenReset = () => {
    setNewPassword("");
    setConfirmNewPassword("");
    setResetOpen(true);
  };

  const handleCloseReset = () => {
    setResetOpen(false);
    setResetLoading(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setResetLoading(true);

      const res = await fetch(`http://localhost:4000/api/admin/doctors/${id}/reset-password`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to reset password");
      }

      const data = await res.json();

      // Update local doctor object so the UI reflects new plain_password if present
      if (data && data.doctor) {
        setDoctor(prev => ({ ...prev, password: data.doctor.plain_password || newPassword, plain_password: data.doctor.plain_password || newPassword }));
      } else {
        setDoctor(prev => ({ ...prev, password: newPassword, plain_password: newPassword }));
      }

      alert("Password reset successfully");
      handleCloseReset();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to reset password");
      setResetLoading(false);
    }
  };

  if (loading) return <p>Loading doctor info...</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white shadow-lg rounded-lg space-y-8">

      <h1 className="text-3xl font-bold">Edit Doctor Profile</h1>

      {/* PHOTO SECTION */}
      <section className="border p-6 rounded-lg shadow-sm bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Profile Photo</h2>

        <div className="flex items-start gap-6">

          <div className="w-40 h-40 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {doctor.photo ? (
              typeof doctor.photo === "string" ? (
                <img
                  src={`http://localhost:4000${doctor.photo}`}
                  alt="Doctor"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={URL.createObjectURL(doctor.photo)}
                  alt="Doctor"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <span className="text-gray-400">No Photo</span>
            )}
          </div>

          <div className="flex flex-col">
            <Label htmlFor="photo">Upload New Photo</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (file.size > 2 * 1024 * 1024) {
                  alert("Max size 2MB");
                  return;
                }

                setDoctor({ ...doctor, photo: file });
              }}
            />
            <p className="text-xs text-gray-500 mt-1">Max size 2MB</p>
          </div>

        </div>
      </section>

      {/* PERSONAL INFORMATION */}
      <section className="border p-6 rounded-lg shadow-sm bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={doctor.name}
              onChange={(e) => setDoctor({ ...doctor, name: e.target.value })}
              placeholder="Enter full name"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={doctor.email}
              onChange={(e) => setDoctor({ ...doctor, email: e.target.value })}
              placeholder="Email address"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={doctor.phone}
              onChange={(e) => setDoctor({ ...doctor, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>

          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={doctor.dob}
              onChange={(e) => setDoctor({ ...doctor, dob: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              title="Select gender"
              value={doctor.gender}
              onChange={(e) => setDoctor({ ...doctor, gender: e.target.value })}
              className="border rounded-lg p-2 w-full"
            >
              <option value="">Choose gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={doctor.address}
              onChange={(e) => setDoctor({ ...doctor, address: e.target.value })}
              placeholder="Home address"
            />
          </div>

        </div>
      </section>

      {/* PROFESSIONAL INFORMATION */}
      <section className="border p-6 rounded-lg shadow-sm bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Professional Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <Label htmlFor="specialty">Specialty</Label>
            <Input
              id="specialty"
              value={doctor.specialty}
              onChange={(e) => setDoctor({ ...doctor, specialty: e.target.value })}
              placeholder="Specialization"
            />
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={doctor.department}
              onChange={(e) => setDoctor({ ...doctor, department: e.target.value })}
              placeholder="Department"
            />
          </div>

          <div>
            <Label htmlFor="degree">Degree</Label>
            <Input
              id="degree"
              value={doctor.degree}
              onChange={(e) => setDoctor({ ...doctor, degree: e.target.value })}
              placeholder="Degree"
            />
          </div>

          <div>
            <Label htmlFor="experience">Experience (Years)</Label>
            <Input
              id="experience"
              type="number"
              value={doctor.experience}
              onChange={(e) => setDoctor({ ...doctor, experience: Number(e.target.value) })}
              placeholder="Years of experience"
            />
          </div>

          <div>
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              value={doctor.designation}
              onChange={(e) =>
                setDoctor({ ...doctor, designation: e.target.value })
              }
              placeholder="Designation (Doctor / Consultant)"
            />
          </div>

        </div>
      </section>

      {/* ACCOUNT CREDENTIALS */}
      <section className="border p-6 rounded-lg shadow-sm bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Account Credentials</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={doctor.username}
              onChange={(e) => setDoctor({ ...doctor, username: e.target.value })}
              placeholder="Username"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={doctor.password}
                onChange={(e) => setDoctor({ ...doctor, password: e.target.value })}
                placeholder="Password"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave empty to keep current password.</p>
          </div>

        </div>

        {/* Reset password button (modal) */}
        <div className="mt-4">
          <Button variant="outline" onClick={handleOpenReset}>Reset Password</Button>
          <p className="text-xs text-gray-500 mt-2">
            Use this to set a new password for the doctor — admin does not need the old password.
          </p>
        </div>
      </section>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-4 pt-4">
        <Button variant="outline" onClick={() => navigate("/admin/manage-doctors")}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      {/* ---------------- Reset Password Modal ---------------- */}
      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Reset Doctor Password</h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                />
              </div>

              <div>
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseReset} disabled={resetLoading}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword} disabled={resetLoading}>
                {resetLoading ? "Saving..." : "Reset Password"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EditDoctor;
