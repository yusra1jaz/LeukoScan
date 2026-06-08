import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Label from "@/components/ui/label";
import Button from "@/components/ui/button";
import { Plus, Edit3, X, Trash2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// -------------------- Types --------------------
interface SymptomEntry {
  id: string;
  date: string;
  symptoms: Record<string, number | "">;
  notes: string;
}

interface PersonalInfo {
  id: number;
  username: string;
  fullName?: string;
  email: string;
}

// -------------------- Severity Options --------------------
const severityOptions = [
  { label: "None", value: 0 },
  { label: "Mild", value: 1 },
  { label: "Moderate", value: 2 },
  { label: "Severe", value: 3 },
];

// -------------------- Symptom List --------------------
const symptomList: Record<string, { label: string; type: "number" | "severity" }> = {
  fatigue: { label: "Fatigue", type: "severity" },
  bruising: { label: "Bruising", type: "severity" },
  fever: { label: "Fever (°C)", type: "number" },
  bleeding: { label: "Bleeding", type: "severity" },
  appetite: { label: "Loss of Appetite", type: "severity" },
  breathing: { label: "Breathing", type: "severity" },
  pain: { label: "Bone Pain", type: "severity" },
  nightSweats: { label: "Night Sweats", type: "severity" },
};

// -------------------- Component --------------------
const DoctorPatientSymptomTracker: React.FC = () => {
  const params = useParams();
  const patientId = params.id;
  const navigate = useNavigate();
  
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [patientInfo, setPatientInfo] = useState<PersonalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentEntry, setCurrentEntry] = useState<Record<string, number | "">>(
    Object.fromEntries(
      Object.keys(symptomList).map((key) => [
        key,
        symptomList[key].type === "severity" ? "" : 0,
      ])
    )
  );
  const [notes, setNotes] = useState("");
  const [editingEntry, setEditingEntry] = useState<SymptomEntry | null>(null);

  // -------------------- Timeline + Pagination --------------------
  const [timeRange, setTimeRange] = useState<"1D" | "7D" | "2W" | "1M" | "3M">("7D");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 7;

  // -------------------- Backend URL --------------------
  const backendURL = "http://localhost:4000";

  // -------------------- Fetch Patient Info --------------------
  const fetchPatientInfo = async () => {
    try {
      const res = await fetch(`${backendURL}/api/patients/${patientId}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setPatientInfo(data.patient);
      }
    } catch (error) {
      console.error("Error fetching patient info:", error);
    }
  };

  // -------------------- Fetch Entries --------------------
  const fetchEntries = async () => {
    try {
      const res = await fetch(`${backendURL}/api/patients/${patientId}/symptoms`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mappedEntries: SymptomEntry[] = data.map((e: any) => ({
            id: e._id || e.id,
            date: e.date || new Date().toISOString(),
            // Map unknown values to number or ""
            symptoms: Object.fromEntries(
              Object.entries(e.symptoms || {}).map(([k, v]) => [
                k,
                typeof v === "number" ? v : "" // If backend value is number, keep it, else ""
              ])
            ),
            notes: typeof e.notes === "string" ? e.notes : "",
          }));
          setEntries(mappedEntries);
        } else {
          setEntries([]);
        }
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.error("Failed to fetch symptom entries:", err);
      setEntries([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientInfo();
      fetchEntries();
    }
  }, [patientId]);

  // -------------------- Handle Form Changes --------------------
  const handleChange = (key: string, value: number | "") => {
    setCurrentEntry((prev) => ({ ...prev, [key]: value }));
  };

  // -------------------- Save Entry --------------------
  const handleSaveEntry = async () => {
    try {
      const url = editingEntry 
        ? `${backendURL}/api/symptoms/${editingEntry.id}`
        : `${backendURL}/api/symptoms`;
      
      const method = editingEntry ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          symptoms: currentEntry, 
          notes,
          userId: patientId // Add patient ID for doctors
        })
      });
      
      if (res.ok) {
        fetchEntries();
        resetForm();
      } else {
        const errorData = await res.json();
        alert(`Failed to ${editingEntry ? 'update' : 'save'} symptom entry: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(`Failed to ${editingEntry ? 'update' : 'save'} symptom entry:`, err);
      alert(`Failed to ${editingEntry ? 'update' : 'save'} entry`);
    }
  };

  // -------------------- Edit & Delete Functions --------------------
  const handleEditEntry = (entry: SymptomEntry) => {
    setEditingEntry(entry);
    setCurrentEntry(entry.symptoms);
    setNotes(entry.notes);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this symptom entry?")) {
      return;
    }

    try {
      const res = await fetch(`${backendURL}/api/symptoms/${entryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        // Remove from local state immediately for better UX
        setEntries(prev => prev.filter(entry => entry.id !== entryId));
        // Then fetch fresh data from server
        setTimeout(() => {
          fetchEntries();
        }, 100);
      } else {
        const errorData = await res.json();
        alert(`Failed to delete symptom entry: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error("Failed to delete symptom entry:", err);
      alert("Failed to delete entry");
    }
  };

  const resetForm = () => {
    setEditingEntry(null);
    setCurrentEntry(
      Object.fromEntries(
        Object.keys(symptomList).map((key) => [
          key,
          symptomList[key].type === "severity" ? "" : 0,
        ])
      )
    );
    setNotes("");
  };

  // -------------------- Filter & Pagination --------------------
  const getFilteredEntries = () => {
    let cutoffStart: Date;
    let cutoffEnd: Date = new Date();

    if ((timeRange === "1M" || timeRange === "3M") && startDate && endDate) {
      cutoffStart = new Date(startDate);
      cutoffEnd = new Date(endDate);
    } else {
      const now = new Date();
      switch (timeRange) {
        case "1D":
          cutoffStart = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
          break;
        case "7D":
          cutoffStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "2W":
          cutoffStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          break;
        case "1M":
          cutoffStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case "3M":
          cutoffStart = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        default:
          cutoffStart = new Date(0);
      }
    }

    return entries
      .filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= cutoffStart && entryDate <= cutoffEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredEntries = getFilteredEntries();
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading symptom tracker...</div>
      </div>
    );
  }

  // -------------------- Render --------------------
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Patient Symptom Tracker
        </h1>
        <p className="text-gray-600 mt-2">
          Patient: {patientInfo?.fullName || patientInfo?.username} (ID: #{patientId}) - Track symptoms with clear visual trends
        </p>
        <div className="flex justify-center gap-2 mt-4">
          <Button
            onClick={() => navigate(`/doctor/patient/${patientId}`)}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            View Assessment
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

      <div className="grid grid-cols-1 lg:grid-cols-[25%_75%] gap-6">
        {/* Left: Form */}
        <div className="flex justify-center max-h-[80vh] overflow-y-auto">
          <div className="h-full w-full max-w-sm p-6 flex flex-col items-center">
            <div className="flex items-center justify-center text-xl font-semibold mb-6">
              <Plus className="mr-2" /> Log Symptoms
            </div>
            {editingEntry && (
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <span className="text-sm text-blue-600 font-medium">Editing Entry</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  title="Cancel editing"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(symptomList).map(([key, { label, type }]) => (
                <div key={key} className="flex flex-col gap-1">
                  <Label htmlFor={key}>{label}</Label>

                  {type === "number" ? (
                    <Input
                      id={key}
                      type="number"
                      value={currentEntry[key] as number}
                      placeholder={`Enter ${label}`}
                      aria-label={label}
                      title={label}
                      onChange={(e) => handleChange(key, Number(e.target.value))}
                      className="text-center w-56"
                    />
                  ) : (
                    <select
                      id={key}
                      value={currentEntry[key]}
                      onChange={(e) =>
                        handleChange(
                          key,
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      aria-label={label}
                      title={label}
                      className="border border-gray-300 rounded-md p-2 text-center w-56"
                    >
                      <option value="">Select {label}</option>
                      {severityOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={notes}
                  placeholder="Add any additional notes"
                  aria-label="Notes"
                  title="Notes"
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              <Button
                onClick={handleSaveEntry}
                className="w-full flex items-center justify-center text-lg"
              >
                {editingEntry ? (
                  <>
                    <Edit3 className="mr-2" /> Update Entry
                  </>
                ) : (
                  <>
                    <Plus className="mr-2" /> Add Entry
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Entries + Charts */}
        <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* Timeline Selector */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex gap-2 justify-center lg:justify-start">
              {[
                { label: "1 Day", value: "1D" },
                { label: "7 Days", value: "7D" },
                { label: "2 Weeks", value: "2W" },
                { label: "1 Month", value: "1M" },
                { label: "Custom", value: "3M" },
              ].map((option) => (
                <button
                  key={option.value}
                  className={`px-3 py-1 rounded-md font-medium border ${
                    timeRange === option.value
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                  onClick={() => {
                    setTimeRange(option.value as any);
                    setCurrentPage(1);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {(timeRange === "1M" || timeRange === "3M") && (
              <div className="flex gap-2 mt-2 justify-center lg:justify-start">
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border rounded-md p-1"
                  aria-label="Start Date"
                  title="Start Date"
                />
                <span className="px-2">to</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border rounded-md p-1"
                  aria-label="End Date"
                  title="End Date"
                />
              </div>
            )}
          </div>

          {paginatedEntries.length === 0 && (
            <p className="text-gray-500 text-center">No entries in this time range</p>
          )}

          {paginatedEntries.map((entry) => {
            const chartData = Object.entries(entry.symptoms)
              .filter(([key]) => key !== "fever")
              .map(([key, value]) => ({
                symptom: symptomList[key].label,
                value: value === "" ? 0 : value,
              }));

            return (
              <div key={entry.id} className="mb-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-gray-800 font-semibold">
                    {new Date(entry.date).toLocaleString()}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditEntry(entry);
                      }}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit entry"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteEntry(entry.id);
                      }}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Chart */}
                  <div className="flex-1 h-64 min-w-[350px]">
                    <ResponsiveContainer width="100%" height={256}>
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 20, bottom: 30, left: 60 }}
                        barCategoryGap="25%"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="symptom"
                          angle={-30}
                          textAnchor="end"
                          height={50}
                          interval={0}
                        />
                        <YAxis
                          ticks={[0, 1, 2, 3]}
                          tickFormatter={(v) =>
                            severityOptions.find((o) => o.value === v)?.label || v
                          }
                        />
                        <Tooltip
                          formatter={(value) => {
                            const num = Number(value);
                            return (
                              severityOptions.find((o) => o.value === num)?.label || value
                            );
                          }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Symptom boxes */}
                  <div className="flex-1 flex flex-wrap gap-4 items-start">
                    {Object.entries(entry.symptoms).map(([key, value]) => (
                      <div
                        key={key}
                        className={`flex gap-2 items-center p-2 rounded-md border shadow-sm
                          ${key === "fever"
                            ? "bg-yellow-100 border-yellow-500"
                            : "bg-blue-50 border-blue-300"}
                        `}
                      >
                        <span className="text-gray-700 font-medium">
                          {symptomList[key].label}:
                        </span>
                        <span className="text-gray-800 font-semibold">
                          {key === "fever"
                            ? value
                            : severityOptions.find((o) => o.value === value)?.label}
                        </span>
                      </div>
                    ))}

                    {entry.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200 w-full">
                        <span className="text-gray-700">{entry.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md border ${
                    currentPage === page
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                  aria-label={`Page ${page}`}
                  title={`Page ${page}`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientSymptomTracker;
