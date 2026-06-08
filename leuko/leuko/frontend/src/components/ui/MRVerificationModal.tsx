import React, { useState } from 'react';
import Button from './button';
import { Input } from './input';
import { X, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface MRVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientId: number;
  onSuccess: () => void;
}

const MRVerificationModal: React.FC<MRVerificationModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientId,
  onSuccess
}) => {
  const [mrNumber, setMrNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mrNumber.trim()) {
      setError('Please enter the MR number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:4000/api/patients/${patientId}/verify-mr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ mrNumber: mrNumber.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        resetForm();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to verify MR number');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMrNumber('');
    setError('');
    setSuccess(false);
    setLoading(false);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">MR Number Verification</h2>
              <p className="text-sm text-gray-500">Patient: {patientName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Successful</h3>
              <p className="text-gray-600">Access granted to patient records</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Security Verification</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Enter the patient's MR (Medical Record) number to access their confidential medical information.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="mrNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  MR Number
                </label>
                <Input
                  id="mrNumber"
                  type="text"
                  value={mrNumber}
                  onChange={(e) => setMrNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., A12345"
                  className="w-full"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: 1 letter followed by 5 numbers (e.g., A12345)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !mrNumber.trim()}
                  className="flex-1"
                >
                  {loading ? 'Verifying...' : 'Verify & Access'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MRVerificationModal;
