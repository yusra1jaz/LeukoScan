import { Link } from "react-router-dom";
import { Activity, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-secondary/50 border-t border-border">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">LeukoScan</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Advanced AI-powered leukemia detection using digital image processing and computer graphics.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/ai-diagnosis" className="block text-muted-foreground hover:text-primary text-sm">AI Diagnosis</Link>
              <Link to="/chatbot" className="block text-muted-foreground hover:text-primary text-sm">Chatbot</Link>
              <Link to="/hospital-locator" className="block text-muted-foreground hover:text-primary text-sm">Hospital Locator</Link>
              <Link to="/symptom-tracker" className="block text-muted-foreground hover:text-primary text-sm">Symptom Tracker</Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <div className="space-y-2">
              <Link to="/medication-guide" className="block text-muted-foreground hover:text-primary text-sm">Medication Guide</Link>
              <Link to="/explainability" className="block text-muted-foreground hover:text-primary text-sm">Explainability</Link>
              <Link to="/faqs" className="block text-muted-foreground hover:text-primary text-sm">FAQs</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                <Mail className="h-4 w-4" />
                <span>support@leukoScan.com</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                <Phone className="h-4 w-4" />
                <span>(92) 51 9270076</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4" />
                <span>Medical Research Center</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © 2025 LeukoScan. Final Year Project - Automated Leukemia Detection.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
