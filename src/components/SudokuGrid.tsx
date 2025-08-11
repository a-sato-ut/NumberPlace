import React from 'react';
import { SudokuGrid as SudokuGridType, SudokuValidationResult } from '../types/sudoku';

interface SudokuGridProps {
  originalGrid?: SudokuGridType;
  solvedGrid?: SudokuGridType;
  validationResult?: SudokuValidationResult;
  showComparison?: boolean;
}

export const SudokuGrid: React.FC<SudokuGridProps> = ({ 
  originalGrid, 
  solvedGrid, 
  validationResult,
  showComparison = false 
}) => {
  const gridToShow = solvedGrid || originalGrid;

  if (!gridToShow) {
    return (
      <div className="w-full max-w-sm mx-auto aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">ナンプレグリッドが読み込まれていません</p>
      </div>
    );
  }

  const getCellClassName = (row: number, col: number): string => {
    let baseClasses = "aspect-square flex items-center justify-center text-lg font-semibold border ";
    
    // グリッドの境界線
    const borderClasses = [
      row % 3 === 0 ? "border-t-2" : "border-t",
      row === 8 ? "border-b-2" : "border-b",
      col % 3 === 0 ? "border-l-2" : "border-l", 
      col === 8 ? "border-r-2" : "border-r"
    ].join(" ");
    
    baseClasses += borderClasses + " border-gray-800 ";

    // セルの背景色
    if (showComparison && originalGrid && solvedGrid) {
      const originalValue = originalGrid[row][col];
      const solvedValue = solvedGrid[row][col];
      
      if (originalValue !== null) {
        // 元々入っていた数字
        baseClasses += "bg-gray-200 text-gray-800 ";
      } else if (solvedValue !== null) {
        // 解答で追加された数字
        baseClasses += "bg-primary-100 text-primary-800 ";
      } else {
        // 空のセル
        baseClasses += "bg-white ";
      }
    } else {
      // 通常表示
      const value = gridToShow[row][col];
      if (value !== null) {
        baseClasses += "bg-white text-gray-900 ";
      } else {
        baseClasses += "bg-gray-50 text-gray-400 ";
      }
    }

    // バリデーションエラーのハイライト
    if (validationResult?.errors.some(error => error.row === row && error.col === col)) {
      baseClasses += "!bg-red-100 !text-red-800 ";
    }

    return baseClasses;
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="grid grid-cols-9 gap-0 border-2 border-gray-800 rounded-lg overflow-hidden bg-white">
        {gridToShow.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={getCellClassName(rowIndex, colIndex)}
            >
              {cell || ''}
            </div>
          ))
        )}
      </div>
      
      {validationResult && validationResult.errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-2">エラーが見つかりました:</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {validationResult.errors.slice(0, 3).map((error, index) => (
              <li key={index}>
                行{error.row + 1}, 列{error.col + 1}: {error.message}
              </li>
            ))}
            {validationResult.errors.length > 3 && (
              <li className="text-red-600">
                他に {validationResult.errors.length - 3} 個のエラーがあります
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};