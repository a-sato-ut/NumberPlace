import React from 'react';
import { SudokuGrid as SudokuGridType, SudokuValidationResult } from '../types/sudoku';
import { SudokuValidator } from '../utils/sudokuValidator';

interface ResultDisplayProps {
  originalGrid: SudokuGridType;
  solvedGrid: SudokuGridType;
  validationResult: SudokuValidationResult;
  onStartOver: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  originalGrid,
  solvedGrid,
  validationResult,
  onStartOver
}) => {
  const comparisonResult = SudokuValidator.compareGrids(originalGrid, solvedGrid);
  const isComplete = SudokuValidator.isComplete(originalGrid);

  const getStatusInfo = () => {
    if (comparisonResult === 'correct' && isComplete) {
      return {
        title: '🎉 完璧です！',
        message: 'ナンプレが正しく解けています。すべてのルールに従って完成されています。',
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        borderColor: 'border-green-200'
      };
    } else if (comparisonResult === 'correct' && !isComplete) {
      return {
        title: '✅ 正解です（未完成）',
        message: '現在入力されている数字は全て正しいです。続けて残りのマスを埋めてください。',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200'
      };
    } else {
      return {
        title: '❌ エラーがあります',
        message: 'ナンプレのルールに違反している箇所があります。下記のエラーを確認してください。',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        borderColor: 'border-red-200'
      };
    }
  };

  const statusInfo = getStatusInfo();

  const getProgress = () => {
    let filledCells = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (originalGrid[row][col] !== null) {
          filledCells++;
        }
      }
    }
    return Math.round((filledCells / 81) * 100);
  };

  const progress = getProgress();

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* ステータス表示 */}
      <div className={`p-4 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
        <h2 className={`text-lg font-bold ${statusInfo.textColor} mb-2`}>
          {statusInfo.title}
        </h2>
        <p className={`${statusInfo.textColor} text-sm`}>
          {statusInfo.message}
        </p>
      </div>

      {/* 進捗表示 */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">進捗</span>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {81 - (progress * 81 / 100)} / 81 マス残り
        </p>
      </div>

      {/* エラー詳細（エラーがある場合のみ） */}
      {validationResult.errors.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-red-200">
          <h3 className="text-sm font-medium text-red-800 mb-3">エラー詳細</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {validationResult.errors.map((error, index) => (
              <div key={index} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                <span className="font-medium">
                  [{error.row + 1}, {error.col + 1}]
                </span>
                : {error.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* アクション */}
      <div className="flex flex-col space-y-3">
        <button
          onClick={onStartOver}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          新しい画像をアップロード
        </button>
        
        {comparisonResult === 'correct' && isComplete && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">お疲れ様でした！</p>
            <div className="flex justify-center space-x-4">
              <span className="text-2xl">🎯</span>
              <span className="text-2xl">🧩</span>
              <span className="text-2xl">✨</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};