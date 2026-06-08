import { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Progress from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileImage, Brain, Download, CheckCircle, Info, AlertTriangle, Clock, HelpCircle, X, Microscope, TestTube, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

interface DiagnosisResult {
  prediction: string;
  confidence: number;
  probabilities?: Array<{
    class: string;
    probability: string;
  }>;
  ensembleDetails?: {
    votes: {
      [key: string]: number;
    };
    models: Array<{
      model: string;
      prediction: string;
      confidence: number;
    }>;
  };
  heatmapData?: {
    gradCamUrl?: string;
    shapValues?: Array<{
      feature: string;
      importance: number;
    }>;
    shapImageUrl?: string;
  };
  id?: number;
  created_at?: string;
}

// Function to validate if image is likely a blood sample/microscopic image
const validateBloodSampleImage = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Basic validation for blood sample characteristics
      const { width, height } = img;
      
      // Check if image dimensions are reasonable for microscopy
      // Blood smear images are typically not extremely high resolution
      // but should have sufficient detail
      const minDimension = 100;
      const maxDimension = 4000;
      
      // Check aspect ratio - blood smears are typically rectangular
      const aspectRatio = width / height;
      const reasonableAspectRatio = aspectRatio >= 0.5 && aspectRatio <= 2.0;
      
      // Check file size - blood sample images are usually moderate size
      const fileSizeMB = file.size / (1024 * 1024);
      const reasonableFileSize = fileSizeMB >= 0.01 && fileSizeMB <= 15;
      
      const isValid = 
        width >= minDimension && 
        height >= minDimension && 
        width <= maxDimension && 
        height <= maxDimension &&
        reasonableAspectRatio &&
        reasonableFileSize;
      
      resolve(isValid);
    };
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
};

const AIDiagnosis = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previousResults, setPreviousResults] = useState<DiagnosisResult[]>([]);
  const [showPrevious, setShowPrevious] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load persisted results on component mount
  useEffect(() => {
    const persistedResult = localStorage.getItem('diagnosisResult');
    const persistedPreviewUrl = localStorage.getItem('previewUrl');
    
    if (persistedResult) {
      try {
        setResult(JSON.parse(persistedResult));
      } catch (error) {
        console.error('Error parsing persisted result:', error);
      }
    }
    
    if (persistedPreviewUrl) {
      setPreviewUrl(persistedPreviewUrl);
    }
  }, []);

  // Persist results to localStorage when they change
  useEffect(() => {
    if (result) {
      localStorage.setItem('diagnosisResult', JSON.stringify(result));
    }
  }, [result]);

  useEffect(() => {
    if (previewUrl) {
      localStorage.setItem('previewUrl', previewUrl);
    }
  }, [previewUrl]);

  // Clear persisted data on logout
  useEffect(() => {
    if (!user) {
      setResult(null);
      setPreviewUrl("");
      setSelectedFile(null);
      setPreviousResults([]);
      setShowPrevious(false);
      localStorage.removeItem('diagnosisResult');
      localStorage.removeItem('previewUrl');
    }
  }, [user]);

  const getResultColor = (prediction: string) => {
    switch (prediction) {
      case "Healthy": return "text-success";
      case "ALL": return "text-warning";
      case "AML": return "text-destructive";
      case "CLL": return "text-primary";
      case "CML": return "text-secondary-foreground";
      default: return "text-foreground";
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        // Validate that the image is likely a blood sample/microscopic image
        const isValidBloodSample = await validateBloodSampleImage(file);
        
        if (!isValidBloodSample) {
          toast({
            title: "Invalid Image Type",
            description: "Please upload a blood sample or microscopic image. The image should be a clear blood smear with reasonable dimensions and file size.",
            variant: "destructive",
          });
          return;
        }
        
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setResult(null);
        setShowPrevious(false);
        // Clear persisted data when new file is selected
        localStorage.removeItem('diagnosisResult');
        localStorage.removeItem('previewUrl');
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, BMP)",
          variant: "destructive",
        });
      }
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a blood smear image first",
        variant: "destructive",
      });
      return;
    }

    startAnalysis();
  };

  const startAnalysis = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a blood smear image first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('http://localhost:4000/api/integration/predict', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const backendResult = await response.json();
      
      const result: DiagnosisResult = {
        prediction: backendResult.prediction,
        confidence: parseFloat(backendResult.confidence),
        probabilities: backendResult.probabilities,
        ensembleDetails: backendResult.ensembleDetails,
        heatmapData: backendResult.heatmapData
      };

      setResult(result);

      toast({
        title: "Analysis Complete",
        description: "AI diagnosis has been completed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Analysis Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setShowInstructionsModal(false);
    }
  };

  const loadPreviousResults = async () => {
    if (!user) {
      console.log('User not authenticated, skipping results load');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/integration/results', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.results.length > 0) {
          const transformedResults = data.results.map((dbResult: any) => ({
            prediction: dbResult.prediction,
            confidence: dbResult.confidence,
            ensembleDetails: dbResult.ensemble_details,
            heatmapData: dbResult.heatmap_data,
            created_at: dbResult.created_at,
            id: dbResult.id
          }));
          
          setPreviousResults(transformedResults);
          setShowPrevious(true);
          
          toast({
            title: "History Loaded",
            description: `Found ${transformedResults.length} diagnosis results in your account`,
          });
        } else {
          toast({
            title: "No History Found",
            description: "You don't have any previous diagnosis results",
            variant: "destructive",
          });
        }
      } else if (response.status === 401) {
        setSelectedFile(null);
        setPreviewUrl("");
        setResult(null);
        setPreviousResults([]);
        setShowPrevious(false);
      }
    } catch (error) {
      console.error('Error loading previous results:', error);
      toast({
        title: "Error",
        description: "Failed to load diagnosis history",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Analysis Progress Modal */}
        {isAnalyzing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary">
                    <Brain className="h-12 w-12 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">AI Analysis in Progress</h3>
                    <p className="text-sm text-muted-foreground">Processing your blood smear image</p>
                  </div>
              </div>
              
              <div className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Estimated time: 2-3 minutes</span>
                  </div>
                
                <Progress value={undefined} className="w-full h-2" />
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 mb-1">Important Notice</p>
                      <p className="text-amber-700">
                        Please do not close this window or navigate away while the analysis is in progress. 
                        Interrupting the process may result in loss of your analysis results.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground text-center">
                  <p>Our AI models are analyzing your image for accurate leukemia detection</p>
                  <p className="mt-1">This includes ensemble voting and heatmap generation</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions Modal */}
        {showInstructionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">How to Use AI Diagnosis</h3>
                  <button
                    onClick={() => setShowInstructionsModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Image Requirements */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <FileImage className="h-5 w-5 mr-2" />
                      Blood Sample Image Requirements
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>• Only blood smear or microscopic blood sample images</li>
                      <li>• High-quality images (JPG, PNG, BMP, TIFF)</li>
                      <li>• Clear focus on blood cells with proper staining</li>
                      <li>• Reasonable dimensions (100x100 to 4000x4000 pixels)</li>
                      <li>• File size: 10KB to 15MB</li>
                      <li>• Rectangular aspect ratio (0.5:1 to 2:1)</li>
                      <li>• No blurry, distorted, or non-medical images</li>
                    </ul>
                  </div>

                  {/* Analysis Process */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      Analysis Process
                    </h4>
                    <ol className="space-y-2 text-sm text-green-800">
                      <li>1. Upload your blood smear image</li>
                      <li>2. Preview the selected image</li>
                      <li>3. Click "Analyze Image" to start AI analysis</li>
                      <li>4. Wait 2-3 minutes for processing</li>
                      <li>5. Review comprehensive diagnosis results</li>
                    </ol>
                  </div>

                  {/* Important Warnings */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Important Warnings
                    </h4>
                    <ul className="space-y-2 text-sm text-red-800">
                      <li>• <strong>Medical Disclaimer:</strong> This AI tool is for assistance only, not a substitute for professional medical diagnosis</li>
                      <li>• Always consult with healthcare professionals for medical decisions</li>
                      <li>• Do not use for emergency medical situations</li>
                      <li>• Results may vary based on image quality</li>
                      <li>• Keep window open during analysis to prevent interruption</li>
                    </ul>
                  </div>
                  </div>
              </div>
            </div>
          </div>
        )}
        {/* History Modal */}
        {showPrevious && previousResults.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Diagnosis History</h3>
                  <button
                    onClick={() => setShowPrevious(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {previousResults.map((result, index) => (
                    <Card key={result.id || index} className="medical-card">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className={`text-lg ${getResultColor(result.prediction)}`}>
                              {result.prediction}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              Confidence: {result.confidence.toFixed(1)}%
                            </CardDescription>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {result.created_at && new Date(result.created_at).toLocaleString()}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        {/* Ensemble Voting Details */}
                        {result.ensembleDetails && result.ensembleDetails.votes && (
                          <div className="space-y-3">
                            <h5 className="font-medium text-sm">Model Breakdown:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {result.ensembleDetails?.models?.map((model, modelIndex) => (
                                <div key={modelIndex} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                                  <span>{model.model}</span>
                                  <span className="font-medium">{model.prediction} ({model.confidence.toFixed(1)}%)</span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="space-y-2">
                              <h6 className="font-medium text-sm">Diagnosis Confidence:</h6>
                              {result.probabilities?.map((prob: { class: string; probability: string }) => (
                                <div key={prob.class} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                  <span className="font-medium">{prob.class}</span>
                                  <span className="text-muted-foreground">{prob.probability}% confidence</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons for each result */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => {
                              const resultsBlob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(resultsBlob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `leukemia-diagnosis-${result.id || Date.now()}.json`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                          <Button
                            onClick={() => {
                              setShowPrevious(false);
                              navigate('/explainability', { state: { diagnosisResult: result } });
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Info className="mr-2 h-4 w-4" />
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => setShowPrevious(false)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
            AI Leukemia Diagnosis
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Upload a blood smear image for instant AI-powered leukemia detection and analysis
          </p>
        </div>

        {/* Upload & Result Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Upload Section */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg md:text-xl font-semibold">
                <div className="flex items-center">
                  <Upload className="mr-2 h-5 w-5" />
                  <button 
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl("");
                      setResult(null);
                      setShowPrevious(false);
                    }}
                    className="hover:text-blue-600 transition-colors underline-offset-4 hover:underline"
                  >
                    Image Upload
                  </button>
                </div>
                <Button
                  onClick={() => setShowInstructionsModal(true)}
                  variant="outline"
                  size="sm"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {previewUrl ? (
                /* Image Preview with Analyze Button */
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex justify-center">
                      <img 
                        src={previewUrl} 
                        alt="Selected blood smear" 
                        className="max-h-48 max-w-full rounded-lg shadow-sm"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      {selectedFile?.name}
                    </p>
                  </div>

                  {/* Analyze Button */}
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="default"
                  >
                    {isAnalyzing ? (
                      <>
                        <Brain className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Microscope className="mr-2 h-4 w-4" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                /* File Upload Area */
                <div className="border-2 border-dashed border-muted rounded-lg p-6">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileImage className="mx-auto h-14 w-14 text-muted-foreground mb-4" />
                    <div className="text-center">
                      <p className="text-base text-muted-foreground mb-2">
                        Click to select a blood sample image or drag and drop
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Blood smear/microscopic images only (JPG, PNG, BMP, TIFF)
                      </p>
                    </div>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </CardContent>
          </Card>

        {/* Results Section */}
        {result && (
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-xl font-semibold">
                <CheckCircle className="mr-2 h-5 w-5" />
                Diagnosis Results
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                {result ? "AI analysis complete" : "Results will appear here after analysis"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <h3 className={`text-2xl font-bold mb-2 ${getResultColor(result.prediction)}`}>
                  {result.prediction}
                </h3>
                <p className="text-muted-foreground">
                  Confidence: {result.confidence.toFixed(1)}%
                </p>
              </div>

              {/* Ensemble Voting Details */}
              {result.ensembleDetails && result.ensembleDetails.votes && (
                <div className="space-y-4">
                  {/* Individual Model Predictions */}
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">Individual Model Results:</h5>
                      {result.ensembleDetails?.models?.map((model, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded mb-1">
                          <span className="text-sm">{model.model}</span>
                          <span className="text-sm font-medium">{model.prediction} ({model.confidence.toFixed(1)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Breakdown */}
              {result.probabilities && (
                <div className="mb-4">
                  <h5 className="font-medium mb-2">Diagnosis Confidence:</h5>
                  {result.probabilities.map((prob: { class: string; probability: string }) => (
                    <div key={prob.class} className="flex items-center justify-between p-3 bg-muted rounded">
                      <span className="text-sm font-medium">{prob.class}</span>
                      <span className="text-sm text-muted-foreground">{prob.probability}% confidence</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <Button
                  onClick={loadPreviousResults}
                  variant="outline"
                  size="sm"
                >
                  View History
                </Button>
                <Button
                  onClick={() => {
                    const resultsBlob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(resultsBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `leukemia-diagnosis-${Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
                <Button
                  onClick={() => navigate('/explainability', { state: { diagnosisResult: result, originalImage: previewUrl } })}
                  variant="outline"
                  size="sm"
                >
                  <Info className="mr-2 h-4 w-4" />
                  Explanation
                </Button>
              </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDiagnosis;
