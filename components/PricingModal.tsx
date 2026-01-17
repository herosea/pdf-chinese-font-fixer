
import React, { useState } from 'react';
import { X, Check, Zap, Coins, TrendingUp, Gem } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCredits: (amount: number) => void;
  currentCredits: number;
  requiredCredits?: number;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onAddCredits, currentCredits, requiredCredits = 0 }) => {
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  if (!isOpen) return null;

  const handlePurchase = (amount: number) => {
    setIsProcessing(amount);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(null);
      onAddCredits(amount);
      onClose(); // Auto close on success
    }, 1500);
  };

  const creditDeficit = Math.max(0, requiredCredits - currentCredits);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2 flex items-center justify-center gap-2">
              <Gem className="w-6 h-6 text-blue-400" /> 算力充值中心
            </h2>
            <p className="text-gray-400 text-sm">
              按量付费，用多少充多少。当前余额：<span className="text-yellow-400 font-bold text-lg">{currentCredits}</span> 点
            </p>
            {creditDeficit > 0 && (
               <div className="mt-4 inline-block bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-1.5 text-xs text-red-200 font-bold animate-pulse">
                 ⚠️ 您的任务需要 {requiredCredits} 点，还差 {creditDeficit} 点
               </div>
            )}
          </div>
        </div>

        {/* Packages */}
        <div className="p-8 bg-gray-50 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Option 1: Small */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col relative group">
            <div className="mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3 text-gray-600">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">体验包</h3>
              <p className="text-xs text-gray-500">适合临时小文件修复</p>
            </div>
            <div className="mb-6">
               <div className="text-3xl font-black text-gray-900">¥ 9.9</div>
               <div className="text-sm text-blue-600 font-bold mt-1">10 点算力</div>
               <div className="text-xs text-gray-400 mt-1">¥ 0.99 / 页</div>
            </div>
            <button
              onClick={() => handlePurchase(10)}
              disabled={isProcessing !== null}
              className="mt-auto w-full py-3 bg-white border-2 border-gray-200 hover:border-gray-900 text-gray-900 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing === 10 ? <span className="animate-pulse">处理中...</span> : '充值 10 点'}
            </button>
          </div>

          {/* Option 2: Medium (Popular) */}
          <div className="bg-white rounded-2xl p-6 border-2 border-blue-600 shadow-xl relative transform md:-translate-y-4 flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
              Most Popular
            </div>
            <div className="mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 text-blue-600">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">标准包</h3>
              <p className="text-xs text-gray-500">大多数用户的首选</p>
            </div>
            <div className="mb-6">
               <div className="text-3xl font-black text-blue-600">¥ 39.9</div>
               <div className="text-sm text-gray-800 font-bold mt-1">50 点算力</div>
               <div className="text-xs text-green-600 font-bold mt-1 bg-green-50 inline-block px-1.5 rounded">¥ 0.80 / 页 (省 20%)</div>
            </div>
            <button
              onClick={() => handlePurchase(50)}
              disabled={isProcessing !== null}
              className="mt-auto w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200 active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing === 50 ? <span className="animate-pulse">处理中...</span> : '充值 50 点'}
            </button>
          </div>

          {/* Option 3: Large */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col">
            <div className="mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 text-purple-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">专业包</h3>
              <p className="text-xs text-gray-500">批量文档处理专用</p>
            </div>
            <div className="mb-6">
               <div className="text-3xl font-black text-gray-900">¥ 99.0</div>
               <div className="text-sm text-purple-600 font-bold mt-1">200 点算力</div>
               <div className="text-xs text-green-600 font-bold mt-1 bg-green-50 inline-block px-1.5 rounded">¥ 0.49 / 页 (省 50%)</div>
            </div>
            <button
              onClick={() => handlePurchase(200)}
              disabled={isProcessing !== null}
              className="mt-auto w-full py-3 bg-white border-2 border-gray-200 hover:border-purple-600 hover:text-purple-600 text-gray-900 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing === 200 ? <span className="animate-pulse">处理中...</span> : '充值 200 点'}
            </button>
          </div>

        </div>
        
        <div className="bg-gray-50 px-8 pb-8 text-center">
            <p className="text-[10px] text-gray-400">
              * 演示模式：点击充值按钮将模拟支付成功并直接增加点数。每次 AI 修复（4K模式）消耗 1 点算力。
            </p>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
