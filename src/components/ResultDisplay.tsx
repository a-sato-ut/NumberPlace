import React from 'react';
import { SudokuGrid as SudokuGridType, SudokuValidationResult, Regions } from '../types/sudoku';
import { SudokuValidator } from '../utils/sudokuValidator';

interface ResultDisplayProps {
  originalGrid: SudokuGridType;
  solvedGrid?: SudokuGridType;
  validationResult?: SudokuValidationResult;
  regions?: Regions;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  originalGrid,
  solvedGrid,
  validationResult,
  regions
}) => {
  const comparisonResult = solvedGrid ? SudokuValidator.compareGrids(originalGrid, solvedGrid, regions) : 'unknown';
  const isComplete = SudokuValidator.isComplete(originalGrid);

  const getStatusInfo = () => {
    // 編集中の場合（validationResultがundefined）
    if (!validationResult) {
      return {
        title: '✏️ 編集中...',
        message: '数字の修正が完了したら、修正完了ボタンを押してください。',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200'
      };
    }

    if (comparisonResult === 'correct' && isComplete) {
      return {
        title: '🎉 完璧です！',
        message: 'ナンプレが正しく解けています。',
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
        message: '現在入力されている数字には誤りが含まれます（読み取りエラーの可能性もあります）。',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        borderColor: 'border-red-200'
      };
    }
  };

  const statusInfo = getStatusInfo();



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





      {/* 完了メッセージ */}
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
  );
};