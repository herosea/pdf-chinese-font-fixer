import React, { useEffect, useState } from 'react';
import { Key, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';

interface ApiKeySelectorProps {
  onReady: () => void;
  forceShow?: boolean;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onReady, forceShow = false }) => {
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
        // RACE CONDITION MITIGATION: Assume the key selection was successful 
        // after triggering openSelectKey() and proceed to the app.
        setHasKey(true);
        onReady();
      } catch (e) {
        console.error("Error opening key selector:", e);
      }
    }
  };

  if (loading && !forceShow) {
    return <div className="p-4 text-center text-gray-500">正在检查 API 密钥配置...</div>;
  }

  if (hasKey && !forceShow) {
    return null; // Invisible if key is ready
  }

  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8 text-center max-w-2xl mx-auto shadow-sm ${forceShow ? 'ring-2 ring-orange-500' : ''}`}>
      <div className="flex justify-center mb-4">
        <div className="bg-orange-100 p-3 rounded-full">
          <Key className="w-8 h-8 text-orange-600" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {forceShow ? 'API 密钥权限问题' : '需要 API 密钥'}
      </h3>
      
      {isAiStudio ? (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {forceShow 
            ? '当前 API 密钥没有使用 Gemini 3 Pro 模型的权限。请选择一个启用了计费的项目中的付费 API 密钥。'
            : '要使用 Gemini 3 Pro 模型，您必须从 Google Cloud 项目中选择一个付费 API 密钥。'}
        </p>
      ) : (
        <div className="mb-6 max-w-lg mx-auto">
          <p className="text-gray-600 mb-4">
             <b>Gemini 3 Pro</b> 模型需要付费 API 密钥。
          </p>
          <div className="bg-white border border-orange-200 rounded p-4 text-left flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
             <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">环境配置问题</p>
                <p>
                  {forceShow 
                    ? '提供的 API_KEY 返回了“权限被拒绝”错误。请确保您的密钥属于已启用 Gemini API 的付费项目。'
                    : '由于您未在 Google AI Studio 中运行，“选择 API 密钥”功能不可用。请配置 API_KEY 环境变量。'}
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
            {forceShow ? '选择其他 API 密钥' : '选择 API 密钥'}
          </button>
        )}
        
        <button 
          onClick={checkKey}
          className="inline-flex items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          再次检查
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-500 flex justify-center items-center gap-1">
        需要帮助？ 
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 underline"
        >
          查看计费文档 <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

export default ApiKeySelector;