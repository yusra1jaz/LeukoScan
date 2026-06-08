import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import Button from "@/components/ui/button";
import Label from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Doctor {
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
  license: string;
  username: string;
  password: string;
  photo?: File | null;
}

const AddDoctor: React.FC = () => {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor>({
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
    license: "",
    username: "",
    password: "",
    photo: null,
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    try {
      const formData = new FormData();
      for (const key in doctor) {
        const value = doctor[key as keyof Doctor];
        if (value !== undefined && value !== null) {
          if (key === "photo" && value instanceof File) {
            formData.append("photo", value);
          } else {
            formData.append(key, value.toString());
          }
        }
      }

      const res = await fetch("http://localhost:4000/api/admin/doctors", {
      method: "POST",
      body: formData,
      credentials: "include", // include cookie for admin auth
     });


      if (!res.ok) {
        const data = await res.json();
        console.error("Backend error:", data);
        throw new Error(data.message || "Failed to add doctor");
      }

      alert("Doctor added successfully!");
      navigate("/admin/manage-doctors");
    } catch (err: any) {
      console.error(err);
      alert("Failed to add doctor. Check console for details.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-8">Add New Doctor</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Photo */}
        <div className="flex flex-col items-center lg:w-1/4 gap-4">
          <div className="w-48 h-48 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {doctor.photo ? (
              <img
                src={URL.createObjectURL(doctor.photo)}
                alt="Doctor"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400">No Photo</span>
            )}
          </div>
          <Label>Upload Photo</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 2 * 1024 * 1024) {
                alert("Max file size is 2MB");
                return;
              }
              setDoctor({ ...doctor, photo: file });
            }}
          />
          <p className="text-xs text-gray-500">Max size 2MB</p>
        </div>

        {/* Form Fields */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Personal Info */}
          <section className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={doctor.name}
                  onChange={(e) => setDoctor({ ...doctor, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={doctor.email}
                  onChange={(e) => setDoctor({ ...doctor, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={doctor.phone}
                  onChange={(e) => setDoctor({ ...doctor, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={doctor.dob}
                  onChange={(e) => setDoctor({ ...doctor, dob: e.target.value })}
                />
              </div>
              <div>
                <Label>Gender</Label>
                <Input
                  value={doctor.gender}
                  onChange={(e) => setDoctor({ ...doctor, gender: e.target.value })}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={doctor.address}
                  onChange={(e) => setDoctor({ ...doctor, address: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Professional Info */}
          <section className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Professional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Specialty</Label>
                <Input
                  value={doctor.specialty}
                  onChange={(e) => setDoctor({ ...doctor, specialty: e.target.value })}
                />
              </div>
              <div>
                <Label>Department</Label>
                <Input
                  value={doctor.department}
                  onChange={(e) => setDoctor({ ...doctor, department: e.target.value })}
                />
              </div>
              <div>
                <Label>Degree</Label>
                <Input
                  value={doctor.degree}
                  onChange={(e) => setDoctor({ ...doctor, degree: e.target.value })}
                />
              </div>
              <div>
                <Label>Designation</Label>
                <Input
                  value={doctor.designation}
                  onChange={(e) => setDoctor({ ...doctor, designation: e.target.value })}
                />
              </div>
              <div>
                <Label>Experience</Label>
                <Input
                  type="number"
                  value={doctor.experience}
                  onChange={(e) => setDoctor({ ...doctor, experience: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>License Number</Label>
                <Input
                  value={doctor.license}
                  onChange={(e) => setDoctor({ ...doctor, license: e.target.value })}
                  placeholder="Enter medical license number"
                />
              </div>
            </div>
          </section>

          {/* Login Credentials */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Login Credentials</h2>
            <div className="mb-4 w-1/2">
              <Label>Username</Label>
              <Input
                value={doctor.username}
                onChange={(e) => setDoctor({ ...doctor, username: e.target.value })}
              />
            </div>
            <div className="relative w-1/2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={doctor.password}
                  onChange={(e) => setDoctor({ ...doctor, password: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => navigate("/admin/manage-doctors")}>Cancel</Button>
            <Button onClick={handleSave}>Add Doctor</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDoctor;
