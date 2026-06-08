import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Pill, AlertTriangle, Plus, Minus, ExternalLink } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  genericName?: string;
  brandNames?: string[];
  type: string[];
  dosage: string;
  sideEffects: string[];
  alternatives: string[];
  description: string;
  contraindications: string[];
  monitoring: string[];
  administration: string;
  storage: string;
  drugClass: string;
  fdaApproved: boolean;
  pregnancyCategory: string;
}

const MedicationGuide = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [expandedMeds, setExpandedMeds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 9;

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          try {
            response = await fetch(`${API_URL}/api/medications/leukemia`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });

            if (response.ok) break;

            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch {
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (!response || !response.ok) {
          throw new Error(`Failed to connect to backend after ${maxAttempts} attempts`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          setMedications(data.data);
          console.log("✅ Successfully loaded medications:", data.data.length);
        } else {
          throw new Error("Invalid data format received");
        }
      } catch (error) {
        console.error("Error fetching medications:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        setError(
          `Failed to load medications: ${errorMessage}. Please ensure the backend server is running on port 4000.`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, []);

  const filteredMedications = useMemo(() => {
    return medications.filter((med) => {
      const matchesSearch =
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.brandNames?.some((brand) =>
          brand.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesType = selectedType === "All" || med.type.includes(selectedType);

      return matchesSearch && matchesType;
    });
  }, [searchTerm, selectedType, medications]);

  const totalPages = Math.ceil(filteredMedications.length / itemsPerPage);

  const paginatedMeds = filteredMedications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleExpanded = (medId: string) => {
    setExpandedMeds((prev) =>
      prev.includes(medId) ? prev.filter((id) => id !== medId) : [...prev, medId]
    );
  };

  const handleGoogleSearch = () => {
    if (searchTerm.trim()) {
      const searchQuery = encodeURIComponent(`${searchTerm} medication leukemia treatment`);
      window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank");
    }
  };

  const handleMedicationNotFound = () => {
    if (searchTerm.trim()) {
      const searchQuery = encodeURIComponent(`${searchTerm} medication leukemia treatment`);
      window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const uniqueTypes = ["All", "CML", "AML", "ALL", "CLL"];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Leukemia Medications
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive guide to {medications.length} FDA-approved leukemia medications with detailed alternatives
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              Search Leukemia Medications
            </CardTitle>
            <CardDescription className="text-xs">
               Search by medication name, generic name, or brand name.
             </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <Input
                placeholder="Search leukemia medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm"
              />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "All" ? "All Leukemia Types" : type}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleGoogleSearch}
                className="px-6 py-3 text-sm min-h-[44px] flex items-center justify-center"
              >
                <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                Google Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <Card>
            <CardContent className="text-left py-8">
              <Search className="h-10 w-10 animate-pulse" />
              <p className="text-sm">Loading FDA-approved leukemia medications...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-left py-8">
              <AlertTriangle className="h-10 w-10" />
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        ) : filteredMedications.length > 0 ? (
          <>
            <div className="mb-4 text-left">
              <p className="text-sm font-semibold text-foreground">
                Found {filteredMedications.length} medications
                {searchTerm && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    matching "{searchTerm}"
                  </span>
                )}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedMeds.map((med) => (
                <Card key={med.id}>
                  <CardHeader>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          // Use generic name if available, otherwise extract the base name from the full name
                          const searchName = med.genericName || med.name.split(' (')[0];
                          const searchQuery = encodeURIComponent(searchName);
                          window.open(`https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${searchQuery}`, "_blank");
                        }}
                        className="text-lg font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer transition-colors text-left"
                      >
                        {med.name}
                      </button>

                      {/* Generic Name */}
                      {med.genericName && (
                        <button
                          onClick={() => {
                            const searchQuery = encodeURIComponent(`${med.genericName} medication information side effects uses`);
                            window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank");
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors text-lg text-left"
                        >
                          Generic: {med.genericName}
                        </button>
                      )}

                      {/* Brand Names with commas */}
                      {med.brandNames && med.brandNames.length > 0 && (
                         <p className="text-base text-muted-foreground break-words text-left">
                             Brands:{" "}
                             {med.brandNames
                             .filter(Boolean)
                             .map((brand, index, arr) => (
                             <span key={brand}>
                                <button
                                onClick={() => {
              const searchQuery = encodeURIComponent(brand);
              window.open(`https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${searchQuery}`, "_blank");
            }}
            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
          >
            {brand}
          </button>
          {index < arr.length - 1 && ", "}
        </span>
      ))}
  </p>
)}

                      {/* Type Badges */}
                      <div className="flex flex-wrap gap-1 mt-1 justify-start">
                        {med.type.map((type) => (
                          <Badge key={type} variant="secondary" className="text-xxs">
                            {type}
                          </Badge>
                        ))}
                        {med.fdaApproved && (
                          <button
                            onClick={() => {
                              // Use generic name if available, otherwise extract the base name from the full name
                              const searchName = med.genericName || med.name.split(' (')[0];
                              const searchQuery = encodeURIComponent(searchName);
                              // Try FDA's newer search API that might auto-execute search
                              window.open(`https://www.fda.gov/search?s=${searchQuery}&type=drug`, "_blank");
                            }}
                            className="text-xxs bg-green-100 text-green-800 border-green-200 hover:bg-green-200 ml-2 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                          >
                            FDA Approved
                          </button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2 text-left">{med.description}</p>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpanded(med.id)}
                      className="w-full flex items-center justify-between text-sm"
                    >
                      <span>
                        {expandedMeds.includes(med.id) ? (
                          <>
                            <Minus className="h-4 w-4 mr-1" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Show Full Details & Alternatives
                          </>
                        )}
                      </span>
                    </Button>

                    {expandedMeds.includes(med.id) && (
                      <div className="space-y-2 border-t pt-2 text-left">
                        <div>
                          <h4 className="font-semibold text-sm mb-1 flex items-center gap-1">
                            <Pill className="h-4 w-4" />
                            Dosage Information
                          </h4>
                          <p className="text-xxs text-muted-foreground">{med.dosage}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Side Effects
                          </h4>
                          <ul className="text-xxs text-muted-foreground list-disc list-inside">
                            {med.sideEffects.slice(0, 5).map((effect, index) => (
                              <li key={index}>{effect}</li>
                            ))}
                            {med.sideEffects.length > 5 && (
                              <li className="text-xxs">...and {med.sideEffects.length - 5} more</li>
                            )}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-1">Drug Class & Mechanism</h4>
                          <p className="text-xxs text-muted-foreground">{med.drugClass}</p>
                          <p className="text-xxs text-muted-foreground mt-0.5">
                            Pregnancy Category: {med.pregnancyCategory}
                          </p>
                        </div>

                        {med.alternatives.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1">FDA-Approved Alternatives</h4>
                            <div className="flex flex-wrap gap-1">
                              {med.alternatives.map((alt) => (
                                <button
                                  key={alt}
                                  onClick={() => {
                                    setSearchTerm(alt);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className="text-xxs bg-blue-50 text-blue-800 hover:bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 cursor-pointer transition-colors"
                                >
                                  {alt}
                                </button>
                              ))}
                            </div>
                            <p className="text-xxs text-muted-foreground mt-0.5">
                              Click on any alternative to search for details
                            </p>
                          </div>
                        )}

                        <div>
                          <h4 className="font-semibold text-sm mb-1">Administration Instructions</h4>
                          <p className="text-xxs text-muted-foreground">{med.administration}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-1">Storage Requirements</h4>
                          <p className="text-xxs text-muted-foreground">{med.storage}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="text-xs"
                >
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="text-xs"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="text-xs"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="text-left py-8">
              {searchTerm ? (
                <>
                  <Pill className="h-10 w-10 mb-2" />
                  <p className="text-sm">No leukemia medications found for "{searchTerm}"</p>
                  <Button onClick={handleMedicationNotFound} className="text-sm">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Search Google
                  </Button>
                </>
              ) : (
                <>
                  <Search className="h-10 w-10 mb-2" />
                  <p className="text-sm">Enter a medication name to search from {medications.length} medications</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MedicationGuide;