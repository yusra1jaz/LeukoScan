import React, { useState, useEffect } from "react";
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
import axios from "axios";

// -------------------- Types --------------------
interface SymptomEntry {
  id: string;
  date: string;
  symptoms: Record<string, number | "">;
  notes: string;
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
const SymptomTracker: React.FC = () => {
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
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
  const [timeRange, setTimeRange] = useState<"custom" | "1D" | "7D" | "2W">("1D");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [userRegistrationDate, setUserRegistrationDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 7;

  // -------------------- Backend URL --------------------
  const backendURL = "http://localhost:4000";

  // -------------------- Fetch User Registration Date --------------------
  const fetchUserRegistrationDate = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/user/profile`, { withCredentials: true });
      const userData = res.data as any;
      if (userData && userData.createdAt) {
        const regDate = new Date(userData.createdAt).toISOString().split('T')[0];
        setUserRegistrationDate(regDate);
        // Set default date range from registration to today
        setStartDate(regDate);
        setEndDate(new Date().toISOString().split('T')[0]);
      } else {
        // Fallback to 6 months ago if no registration date found
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const fallbackDate = sixMonthsAgo.toISOString().split('T')[0];
        setUserRegistrationDate(fallbackDate);
        setStartDate(fallbackDate);
        setEndDate(new Date().toISOString().split('T')[0]);
      }
    } catch (err) {
      console.error("Failed to fetch user registration date:", err);
      // Fallback to 6 months ago
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const fallbackDate = sixMonthsAgo.toISOString().split('T')[0];
      setUserRegistrationDate(fallbackDate);
      setStartDate(fallbackDate);
      setEndDate(new Date().toISOString().split('T')[0]);
    }
  };

  // -------------------- Fetch Entries --------------------
  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/symptoms`, { 
        withCredentials: true, 
        timeout: 5000 
      });
      if (Array.isArray(res.data)) {
        const mappedEntries: SymptomEntry[] = res.data.map((e: any) => ({
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
    } catch (err) {
      console.error("Failed to fetch symptom entries:", err);
      setEntries([]);
    }
  };

  useEffect(() => {
    fetchUserRegistrationDate();
    fetchEntries();
  }, []);

  // -------------------- Handle Form Changes --------------------
  const handleChange = (key: string, value: number | "") => {
    setCurrentEntry((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveEntry = async () => {
    try {
      if (editingEntry) {
        // Update existing entry
        await axios.put(
          `${backendURL}/api/symptoms/${editingEntry.id}`,
          { symptoms: currentEntry, notes },
          { withCredentials: true, timeout: 5000 }
        );
        
        // Update entry locally for instant UI update
        setEntries(prev => prev.map(entry => 
          entry.id === editingEntry.id 
            ? { ...entry, symptoms: currentEntry, notes }
            : entry
        ));
        setEditingEntry(null);
      } else {
        // Create new entry - optimistic update
        const newEntry: SymptomEntry = {
          id: Date.now().toString(), // Temporary ID
          date: new Date().toISOString(),
          symptoms: currentEntry,
          notes
        };
        
        // Add to local state immediately for instant feedback
        setEntries(prev => [newEntry, ...prev]);
        
        // Then save to backend
        try {
          const response = await axios.post(
            `${backendURL}/api/symptoms`,
            { symptoms: currentEntry, notes },
            { withCredentials: true, timeout: 5000 }
          );
          
          // Update with real ID from backend
          setEntries(prev => prev.map(entry => 
            entry.id === newEntry.id 
              ? { ...entry, id: (response.data as any).id.toString() }
              : entry
          ));
        } catch (error) {
          // If save fails, remove the optimistic entry
          setEntries(prev => prev.filter(entry => entry.id !== newEntry.id));
          throw error;
        }
      }
      resetForm();
    } catch (err: any) {
      console.error("Failed to save symptom entry:", err);
      alert(err.response?.data?.message || "Failed to save entry");
    }
  };

  const resetForm = () => {
    setCurrentEntry(
      Object.fromEntries(
        Object.keys(symptomList).map((key) => [
          key,
          symptomList[key].type === "severity" ? "" : 0,
        ])
      )
    );
    setNotes("");
    setEditingEntry(null);
  };

  const handleEditEntry = (entry: SymptomEntry) => {
    setEditingEntry(entry);
    setCurrentEntry(entry.symptoms);
    setNotes(entry.notes);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (window.confirm("Are you sure you want to delete this symptom entry?")) {
      // Optimistic update - remove from UI immediately
      const originalEntries = [...entries];
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      try {
        await axios.delete(`${backendURL}/api/symptoms/${entryId}`, { 
          withCredentials: true, 
          timeout: 5000 
        });
      } catch (err: any) {
        // If delete fails, restore the original entries
        setEntries(originalEntries);
        console.error("Failed to delete symptom entry:", err);
        alert(err.response?.data?.message || "Failed to delete entry");
      }
    }
  };

  // -------------------- Filter & Pagination --------------------
  const getFilteredEntries = () => {
    let cutoffStart: Date;
    let cutoffEnd: Date;

    if (timeRange === "custom" && startDate && endDate) {
      cutoffStart = new Date(startDate);
      // Set cutoffEnd to the end of the selected day (23:59:59)
      cutoffEnd = new Date(endDate);
      cutoffEnd.setHours(23, 59, 59, 999);
    } else if (timeRange !== "custom") {
      const now = new Date();
      switch (timeRange) {
        case "1D":
          cutoffStart = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
          cutoffEnd = new Date();
          cutoffEnd.setHours(23, 59, 59, 999);
          break;
        case "7D":
          cutoffStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          cutoffEnd = new Date();
          cutoffEnd.setHours(23, 59, 59, 999);
          break;
        case "2W":
          cutoffStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          cutoffEnd = new Date();
          cutoffEnd.setHours(23, 59, 59, 999);
          break;
        default:
          cutoffStart = new Date(0);
          cutoffEnd = new Date();
          cutoffEnd.setHours(23, 59, 59, 999);
      }
    } else {
      // Fallback to registration date if custom range is not set
      cutoffStart = userRegistrationDate ? new Date(userRegistrationDate) : new Date(0);
      cutoffEnd = new Date();
      cutoffEnd.setHours(23, 59, 59, 999);
    }

    console.log('Date range:', { cutoffStart, cutoffEnd, timeRange, startDate, endDate });

    return entries
      .filter((entry) => {
        const entryDate = new Date(entry.date);
        const isInRange = entryDate >= cutoffStart && entryDate <= cutoffEnd;
        console.log('Entry:', entry.date, 'isInRange:', isInRange);
        return isInRange;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // -------------------- Group Entries by Date --------------------
  const getGroupedEntries = () => {
    const grouped: Record<string, SymptomEntry[]> = {};
    
    getFilteredEntries().forEach(entry => {
      const entryDate = new Date(entry.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateLabel: string;
      if (entryDate.toDateString() === today.toDateString()) {
        dateLabel = "Today";
      } else if (entryDate.toDateString() === yesterday.toDateString()) {
        dateLabel = "Yesterday";
      } else {
        dateLabel = entryDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      if (!grouped[dateLabel]) {
        grouped[dateLabel] = [];
      }
      grouped[dateLabel].push(entry);
    });
    
    return grouped;
  };

  const groupedEntries = getGroupedEntries();

  // -------------------- Render --------------------
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Leukemia Symptom Tracker
        </h1>
        <p className="text-gray-600 mt-2">
          Track your symptoms daily with clear visual trends
        </p>
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
            <div className="flex gap-2 justify-center lg:justify-start flex-wrap">
              {[
                { label: "1 Day", value: "1D" },
                { label: "7 Days", value: "7D" },
                { label: "2 Weeks", value: "2W" },
                { label: "Custom Range", value: "custom" },
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

            {timeRange === "custom" && (
              <div className="flex flex-col gap-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Select Date Range (from registration to today)
                </div>
                <div className="flex gap-2 items-center justify-center lg:justify-start flex-wrap">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="start-date" className="text-xs text-gray-600">From:</label>
                    <input
                      id="start-date"
                      type="date"
                      value={startDate}
                      min={userRegistrationDate}
                      max={endDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="border rounded-md p-2 text-sm"
                      aria-label="Start Date"
                      title="Start Date"
                    />
                  </div>
                  <span className="px-2 py-6 text-gray-500">to</span>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="end-date" className="text-xs text-gray-600">To:</label>
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      min={startDate || userRegistrationDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="border rounded-md p-2 text-sm"
                      aria-label="End Date"
                      title="End Date"
                    />
                  </div>
                </div>
                {userRegistrationDate && (
                  <div className="text-xs text-gray-500 mt-2">
                    Registration Date: {new Date(userRegistrationDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {Object.keys(groupedEntries).length === 0 && (
            <p className="text-gray-500 text-center">No entries in this time range</p>
          )}

          {Object.entries(groupedEntries).map(([dateLabel, entries]) => (
            <div key={dateLabel} className="mb-6">
              {/* Date Header */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <h3 className="text-lg font-semibold text-blue-800">
                  {dateLabel}
                </h3>
                <p className="text-sm text-blue-600">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>

              {/* Entries for this date */}
              {entries.map((entry) => {
                const chartData = Object.entries(entry.symptoms)
                  .filter(([key]) => key !== "fever")
                  .map(([key, value]) => ({
                    symptom: symptomList[key].label,
                    value: value === "" ? 0 : value,
                  }));

                return (
                  <div key={entry.id} className="mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-gray-600 text-sm">
                        {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        <ResponsiveContainer width="100%" height="100%">
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
            </div>
          ))}

          </div>
      </div>
    </div>
  );
};

export default SymptomTracker;
