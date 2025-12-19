import React, { useEffect, useState } from 'react';
import { Key, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';

interface ApiKeySelectorProps {
  onReady: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onReady }) => {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAiStudio, setIsAiStudio] = useState(false);

  const checkKey = async () => {
    setLoading(true);
    let keyReady = false;
    let aiStudioAvailable = false;

    // 1. Check AI Studio environment bridge
    if ((window as any).aistudio) {
      aiStudioAvailable = true;
      try {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        if (selected) {
          keyReady = true;
        }
      } catch (e) {
        console.error("Error checking AI Studio key:", e);
      }
    }

    // 2. Fallback: Check standard environment variable
    // We safely check process.env to avoid reference errors in some browser environments
    try {
      if (!keyReady && typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        keyReady = true;
      }
    } catch (e) {
      // Ignore process access errors
    }

    setIsAiStudio(aiStudioAvailable);
    setHasKey(keyReady);
    
    if (keyReady) {
      onReady();
    }
    setLoading(false);
  };

  useEffect(() => {
    checkKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        checkKey();
      } catch (e) {
        console.error("Error opening key selector:", e);
      }
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Checking API Key configuration...</div>;
  }

  if (hasKey) {
    return null; // Invisible if key is ready
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8 text-center max-w-2xl mx-auto shadow-sm">
      <div className="flex justify-center mb-4">
        <div className="bg-orange-100 p-3 rounded-full">
          <Key className="w-8 h-8 text-orange-600" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        API Key Required
      </h3>
      
      {isAiStudio ? (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          To use the <b>Gemini 3 Pro</b> model, you must select a paid API key from your Google Cloud Project.
        </p>
      ) : (
        <div className="mb-6 max-w-lg mx-auto">
          <p className="text-gray-600 mb-4">
             The <b>Gemini 3 Pro</b> model requires a paid API key.
          </p>
          <div className="bg-white border border-orange-200 rounded p-4 text-left flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
             <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Environment Configuration Missing</p>
                <p>
                  Since you are not running in Google AI Studio, the "Select API Key" feature is unavailable. 
                  Please configure the <code>API_KEY</code> environment variable in your deployment settings (e.g., Google Cloud Run, Vercel, etc.).
                </p>
             </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {isAiStudio && (
          <button
            onClick={handleSelectKey}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Select API Key
          </button>
        )}
        
        <button 
          onClick={checkKey}
          className="inline-flex items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Check Again
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-500 flex justify-center items-center gap-1">
        Need help? 
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 underline"
        >
          View Billing Documentation <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

export default ApiKeySelector;