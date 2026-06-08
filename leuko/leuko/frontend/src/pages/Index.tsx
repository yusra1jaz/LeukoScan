import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { Upload, MessageCircle, MapPin, Activity, Brain, Stethoscope } from "lucide-react";

const Index = () => {
  const quickActions = [
    {
      title: "AI Diagnosis",
      description: "Upload blood smear images for instant leukemia detection",
      icon: Brain,
      href: "/ai-diagnosis",
      color: "bg-primary text-primary-foreground",
    },
    {
      title: "Medical Chatbot",
      description: "Get instant answers to your leukemia questions",
      icon: MessageCircle,
      href: "/chatbot",
      color: "bg-success text-success-foreground",
    },
    {
      title: "Hospital Locator",
      description: "Find nearby hematologists and medical centers",
      icon: MapPin,
      href: "/hospital-locator",
      color: "bg-warning text-warning-foreground",
    },
    {
      title: "Symptom Tracker",
      description: "Monitor and track your symptoms over time",
      icon: Activity,
      href: "/symptom-tracker",
      color: "bg-destructive text-destructive-foreground",
    },
  ];

  return (
    <div className="w-full bg-background text-foreground">
      {/* Hero Section */}
      <section className="w-full bg-primary/5 py-12">
        <div className="w-full px-4 text-center">
          <div className="flex flex-col items-center justify-center mb-4">
            <Stethoscope className="h-12 w-12 text-primary mb-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Automated Leukemia Detection
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Advanced AI-powered analysis using digital image processing and computer graphics to detect leukemia from blood smear images with high accuracy and speed.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Button asChild size="default" className="medical-button px-6 py-2">
              <Link to="/ai-diagnosis">
                <Upload className="mr-2 h-4 w-4" />
                Start Diagnosis
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="px-6 py-2">
              <Link to="/faqs">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="w-full py-12 bg-background">
        <div className="w-full px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Quick Access Tools
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Access our comprehensive leukemia detection and support tools
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {quickActions.map((action, index) => {
              const bgColors = [
                'bg-primary/10',
                'bg-success/10', 
                'bg-destructive/10',
                'bg-warning/10'
              ];
              const iconColors = [
                'text-primary',
                'text-success',
                'text-destructive',
                'text-warning'
              ];
              const hoverBorders = [
                'hover:border-primary/30',
                'hover:border-success/30',
                'hover:border-destructive/30', 
                'hover:border-warning/30'
              ];
              const textColors = [
                'group-hover:text-primary',
                'group-hover:text-success',
                'group-hover:text-destructive',
                'group-hover:text-warning'
              ];
              const callToActions = [
                'text-primary',
                'text-success',
                'text-destructive',
                'text-warning'
              ];
              
              return (
                <Link key={action.title} to={action.href} className="block">
                  <div className="flex flex-col items-center text-center space-y-4 p-5 group-hover:scale-105 transition-transform">
                    <div className={`w-14 h-14 ${bgColors[index]} rounded-full flex items-center justify-center`}>
                      <action.icon className={`w-7 h-7 ${iconColors[index]}`} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold text-gray-900 ${textColors[index]} transition-colors`}>
                        {action.title}
                      </h3>
                      <p className="text-base text-gray-600 mt-1">{action.description}</p>
                    </div>
                    <div className={`text-base ${callToActions[index]} font-medium`}>
                      Get Started &rarr;
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 bg-secondary/30">
        <div className="w-full px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Advanced AI Technology
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our system uses state-of-the-art computer vision and machine learning algorithms to provide accurate leukemia detection and comprehensive patient support.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-muted-foreground">
                Advanced machine learning models trained on thousands of blood smear images
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Results</h3>
              <p className="text-muted-foreground">
                Get instant analysis results with confidence scores and detailed explanations
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Medical Support</h3>
              <p className="text-muted-foreground">
                Comprehensive tools for symptom tracking, medication guidance, and hospital location
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
