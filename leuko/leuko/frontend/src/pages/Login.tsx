import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import logo from "../assets/logo.jpg";
import RoleSelectionModal from "@/components/RoleSelectionModal";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const navigate = useNavigate();
  const { login, loading, user } = useAuth();

  const handleRoleSelect = (role: "user" | "doctor") => {
    setShowRoleModal(false);
    if (role === "user") {
      navigate("/signup");
    } else {
      navigate("/signup/doctor");
    }
  };

  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setShowError(false);
    
    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      setShowError(true);
      return;
    }
    
    const result = await login(username, password);
    
    if (result.ok) {
      console.log('Login successful, waiting for state update...');
      // Navigation will be handled by useEffect when user state updates
    } else {
      // Display the actual error message from backend
      let errorMessage = "Invalid username or password. Please try again.";
      
      if (result.message) {
        if (result.message.includes("not found")) {
          errorMessage = "Username or email not found. Please check your credentials or sign up.";
        } else if (result.message.includes("Incorrect password")) {
          errorMessage = "Incorrect password. Please try again.";
        } else {
          errorMessage = result.message;
        }
      }
      
      setError(errorMessage);
      setShowError(true);
      console.log('Error set:', { error: errorMessage, showError: true });
      
      // Create a temporary toast notification
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 15%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #dc2626;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 300px;
        text-align: center;
      `;
      toast.textContent = `⚠️ ${errorMessage}`;
      document.body.appendChild(toast);
      
      // Auto-remove after 8 seconds
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 8000);
      
      // Clear error after 10 seconds
      setTimeout(() => {
        setShowError(false);
        console.log('Error cleared');
      }, 10000);
    }
  };

  return (
    <div className="w-screen h-screen grid place-items-center bg-gradient-to-br from-blue-50 via-white to-indigo-200 p-4">
      <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-md">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Logo" className="w-28 h-28 object-contain" />
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Welcome 👋</h2>
        <p className="text-center text-gray-600 mb-6">Login with your username or email and password</p>
        
        {/* Error Message - Simple and Direct */}
        {showError && (
          <div className="text-center text-red-600 font-medium mb-6 p-3 bg-red-50 border border-red-300 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
            <input 
              id="username" 
              type="text" 
              value={username} 
              onChange={e => {
                setUsername(e.target.value);
                if (showError) setShowError(false);
              }} 
              required 
              placeholder="Enter your username or email" 
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              id="password" 
              type="password" 
              value={password} 
              onChange={e => {
                setPassword(e.target.value);
                if (showError) setShowError(false);
              }} 
              required 
              placeholder="Enter your password" 
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>
          <button type="submit" disabled={loading} className={`w-full py-3 rounded-xl font-semibold text-white transition ${loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="text-center text-sm text-gray-600 mt-6 space-y-2">
          <div>
            Don't have an account? <button type="button" onClick={() => setShowRoleModal(true)} className="text-indigo-600 hover:underline font-medium">Sign up</button>
          </div>
          <div>
            <button type="button" onClick={() => navigate("/forgot-password")} className="text-indigo-600 hover:underline font-medium">Forgot Password?</button>
          </div>
        </div>
      </div>
      
      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSelectRole={handleRoleSelect}
      />
    </div>
  );
};

export default Login;
