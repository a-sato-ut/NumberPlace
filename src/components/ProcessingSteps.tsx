import React, { useState } from 'react';
import { OCRProcessingStep } from '../types/sudoku';

interface ProcessingStepsProps {
  steps: OCRProcessingStep[];
}

export const ProcessingSteps: React.FC<ProcessingStepsProps> = ({ steps }) => {
  const [selectedStep, setSelectedStep] = useState<number>(0);

  const getStepIcon = (stepName: string) => {
    switch (stepName) {
      case 'original':
        return '📷';
      case 'cropped':
        return '✂️';
      case 'preprocessed':
        return '🔧';

      case 'cleaned_image':
        return '✨';
      case 'lines_only':
        return '📐';
      case 'cell_images':
        return '🔲';
      case 'advanced_thick_lines':
        return '🔍';
      case 'grid_detection':
        return '🔍';
      case 'thick_lines':
        return '📏';
      case 'regions_construction':
        return '🧩';
      case 'number_recognition':
        return '🔢';
      default:
        return '⚙️';
    }
  };

  const getStepColor = (stepName: string) => {
    switch (stepName) {
      case 'original':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'cropped':
        return 'bg-indigo-50 border-indigo-200 text-indigo-800';
      case 'preprocessed':
        return 'bg-purple-50 border-purple-200 text-purple-800';

      case 'cleaned_image':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'lines_only':
        return 'bg-cyan-50 border-cyan-200 text-cyan-800';
      case 'cell_images':
        return 'bg-teal-50 border-teal-200 text-teal-800';
      case 'advanced_thick_lines':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'grid_detection':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'thick_lines':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'regions_construction':
        return 'bg-indigo-50 border-indigo-200 text-indigo-800';
      case 'number_recognition':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-4 border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📊 読み取り処理の詳細
      </h3>
      
      {/* ステップナビゲーション */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => setSelectedStep(index)}
            className={`p-2 rounded-lg border transition-all text-left ${
              selectedStep === index 
                ? getStepColor(step.name) 
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStepIcon(step.name)}</span>
              <span className="text-xs font-medium">{step.description}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 選択されたステップの詳細 */}
      {steps[selectedStep] && (
        <div className="space-y-4">
          <div className={`p-3 rounded-lg border ${getStepColor(steps[selectedStep].name)}`}>
            <h4 className="font-medium mb-2">
              {getStepIcon(steps[selectedStep].name)} {steps[selectedStep].description}
            </h4>
            {steps[selectedStep].data && (
              <div className="text-sm space-y-1">
                {Object.entries(steps[selectedStep].data).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="opacity-75">{key}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 画像表示 */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <img 
              src={steps[selectedStep].imageData} 
              alt={steps[selectedStep].description}
              className="w-full h-auto max-h-96 object-contain bg-gray-50"
            />
          </div>

          {/* ステップナビゲーションボタン */}
          <div className="flex justify-between">
            <button
              onClick={() => setSelectedStep(Math.max(0, selectedStep - 1))}
              disabled={selectedStep === 0}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>←</span>
              <span>前のステップ</span>
            </button>
            
            <span className="flex items-center text-sm text-gray-500">
              {selectedStep + 1} / {steps.length}
            </span>
            
            <button
              onClick={() => setSelectedStep(Math.min(steps.length - 1, selectedStep + 1))}
              disabled={selectedStep === steps.length - 1}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>次のステップ</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}
      
      {/* 処理サマリー */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600">
          <div className="font-semibold mb-3 text-gray-700">📊 読み取り処理の詳細</div>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-blue-600">📷</span>
              <span>元の画像</span>
            </div>
            
            <div className="flex items-start space-x-2">
              <span className="text-indigo-600">✂️</span>
              <span>ナンプレ領域の精密切り取り</span>
            </div>
            
            <div className="flex items-start space-x-2">
              <span className="text-purple-600">🔧</span>
              <span>前処理済み画像（グレースケール・コントラスト強化）</span>
            </div>
            

            
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="text-xs font-medium text-cyan-700 mb-2">フローA（太線検出）</div>
              <div className="space-y-1 ml-2">
                <div className="flex items-start space-x-2">
                  <span className="text-cyan-600">📐</span>
                  <span>フローA: 全数字除去後の枠線画像（太線検出用）</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-purple-600">🔍</span>
                  <span>フローA: 高精度太線検出結果</span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="text-xs font-medium text-teal-700 mb-2">フローB（数字認識）</div>
              <div className="space-y-1 ml-2">
                <div className="flex items-start space-x-2">
                  <span className="text-teal-600">🔲</span>
                  <span>フローB: 81個のセル画像（数字認識用）</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600">🔢</span>
                  <span>フローB: 数字認識結果</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};