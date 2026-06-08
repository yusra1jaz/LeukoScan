import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SymptomEntry {
  id: number;
  date: string;
  symptoms: object; // Changed from string to object
  notes: string;
  created_at: string;
}

interface PersonalInfo {
  id: number;
  username: string;
  fullName?: string;
  email: string;
}

const DoctorPatientSymptoms: React.FC = () => {
  const params = useParams();
  const patientId = params.id;
  const navigate = useNavigate();
  
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>([]);
  const [patientInfo, setPatientInfo] = useState<PersonalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<SymptomEntry | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [editForm, setEditForm] = useState({
    symptoms: '',
    notes: ''
  });
  const [newForm, setNewForm] = useState({
    symptoms: '',
    notes: ''
  });

  useEffect(() => {
    if (patientId) {
      fetchPatientInfo();
      fetchSymptomEntries();
    }
  }, [patientId]);

  const fetchPatientInfo = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/patients/${patientId}`, {
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

  const fetchSymptomEntries = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/patients/${patientId}/symptoms`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setSymptomEntries(data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching symptom entries:", error);
      setLoading(false);
    }
  };

  // Convert symptoms object to readable string
  const formatSymptoms = (symptoms: object): string => {
    if (!symptoms || typeof symptoms !== 'object') return 'No symptoms recorded';
    
    const symptomList = [];
    for (const [key, value] of Object.entries(symptoms)) {
      if (value !== '' && value !== null && value !== undefined && value !== 0) {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const formattedValue = typeof value === 'number' ? `${value}/3` : value;
        symptomList.push(`${formattedKey}: ${formattedValue}`);
      }
    }
    
    return symptomList.length > 0 ? symptomList.join('\n') : 'No significant symptoms';
  };

  const handleEditEntry = (entry: SymptomEntry) => {
    setEditingEntry(entry);
    setEditForm({
      symptoms: formatSymptoms(entry.symptoms),
      notes: entry.notes
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    // Convert symptoms string back to object format
    const symptomsObject: any = {};
    editForm.symptoms.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        const formattedKey = key.replace(/\s+/g, '').toLowerCase();
        symptomsObject[formattedKey] = value;
      }
    });

    try {
      const res = await fetch(`http://localhost:4000/api/symptoms/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ symptoms: symptomsObject, notes: editForm.notes })
      });

      if (res.ok) {
        // Update the entry in the local state
        setSymptomEntries(entries => 
          entries.map(entry => 
            entry.id === editingEntry.id 
              ? { ...entry, symptoms: symptomsObject, notes: editForm.notes }
              : entry
          )
        );
        setEditingEntry(null);
        setEditForm({ symptoms: '', notes: '' });
      } else {
        alert("Failed to update symptom entry");
      }
    } catch (error) {
      console.error("Error updating symptom entry:", error);
      alert("Failed to update symptom entry");
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditForm({ symptoms: '', notes: '' });
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm("Are you sure you want to delete this symptom entry?")) return;

    try {
      const res = await fetch(`http://localhost:4000/api/symptoms/${entryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setSymptomEntries(entries => entries.filter(entry => entry.id !== entryId));
      } else {
        alert("Failed to delete symptom entry");
      }
    } catch (error) {
      console.error("Error deleting symptom entry:", error);
      alert("Failed to delete symptom entry");
    }
  };

  const handleAddNewSymptom = async () => {
    if (!newForm.symptoms.trim()) return;

    // Convert symptoms string to object format
    const symptomsObject: any = {};
    newForm.symptoms.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        const formattedKey = key.replace(/\s+/g, '').toLowerCase();
        symptomsObject[formattedKey] = value;
      }
    });

    try {
      const res = await fetch(`http://localhost:4000/api/symptoms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          symptoms: symptomsObject, 
          notes: newForm.notes,
          userId: patientId // Add patient ID
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSymptomEntries([data, ...symptomEntries]);
        setNewForm({ symptoms: '', notes: '' });
        setAddingNew(false);
      } else {
        alert("Failed to add symptom entry");
      }
    } catch (error) {
      console.error("Error adding symptom entry:", error);
      alert("Failed to add symptom entry");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading symptom entries...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Symptom Tracker</h1>
          <p className="text-gray-600 mt-1">
            Patient: {patientInfo?.fullName || patientInfo?.username} (ID: #{patientId})
          </p>
        </div>
        <div className="flex space-x-2">
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

      {/* Add New Symptom Button */}
      <div className="mb-6">
        <Button
          onClick={() => setAddingNew(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          Add New Symptom Entry
        </Button>
      </div>

      {/* Add New Symptom Form */}
      {addingNew && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Symptom Entry</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms (one per line, format: Symptom: Severity)</label>
              <textarea
                value={newForm.symptoms}
                onChange={(e) => setNewForm({...newForm, symptoms: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={4}
                placeholder="Example:
Fatigue: 2/3
Nausea: 1/3
Headache: Mild"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={newForm.notes}
                onChange={(e) => setNewForm({...newForm, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                placeholder="Additional notes about the symptoms..."
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddNewSymptom}>
                Add Entry
              </Button>
              <Button onClick={() => setAddingNew(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Symptom Entries */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Symptom History</h2>
          <p className="text-gray-600 mt-1">View and manage patient symptom entries</p>
        </div>
        <div className="p-6">
          {symptomEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">No symptom entries found for this patient</div>
            </div>
          ) : (
            <div className="space-y-6">
              {symptomEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 bg-gray-50">
                  {editingEntry?.id === entry.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                        <textarea
                          value={editForm.symptoms}
                          onChange={(e) => setEditForm({...editForm, symptoms: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                          placeholder="Enter symptoms..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Enter additional notes..."
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleSaveEdit} size="sm">
                          Save Changes
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline" size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {new Date(entry.date).toLocaleDateString()}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Recorded: {new Date(entry.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleEditEntry(entry)}
                            variant="outline"
                            size="sm"
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteEntry(entry.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Symptoms:</h4>
                          <p className="text-gray-900 whitespace-pre-wrap font-mono text-sm bg-white p-2 rounded border">
                            {formatSymptoms(entry.symptoms)}
                          </p>
                        </div>
                        
                        {entry.notes && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Notes:</h4>
                            <p className="text-gray-900 whitespace-pre-wrap">{entry.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-sm font-medium text-gray-700">Total Entries</h3>
          <p className="text-2xl font-bold text-gray-900">{symptomEntries.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-sm font-medium text-gray-700">Last Entry</h3>
          <p className="text-lg font-semibold text-gray-900">
            {symptomEntries.length > 0 
              ? new Date(symptomEntries[0].date).toLocaleDateString()
              : 'No entries'
            }
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-sm font-medium text-gray-700">Tracking Period</h3>
          <p className="text-lg font-semibold text-gray-900">
            {symptomEntries.length > 1 
              ? `${Math.ceil((new Date(symptomEntries[0].date).getTime() - new Date(symptomEntries[symptomEntries.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))} days`
              : symptomEntries.length === 1 
                ? '1 day'
                : 'N/A'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientSymptoms;
