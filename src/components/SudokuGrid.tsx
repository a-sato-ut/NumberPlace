import React from 'react';
import { SudokuGrid as SudokuGridType, SudokuValidationResult, Regions } from '../types/sudoku';

interface SudokuGridProps {
  originalGrid?: SudokuGridType;
  solvedGrid?: SudokuGridType;
  regions?: Regions;
  validationResult?: SudokuValidationResult;
  showComparison?: boolean;
  showOriginalOnly?: boolean;
}

export const SudokuGrid: React.FC<SudokuGridProps> = ({ 
  originalGrid, 
  solvedGrid, 
  regions,
  validationResult,
  showComparison = false,
  showOriginalOnly = false
}) => {
  const gridToShow = showOriginalOnly ? originalGrid : (solvedGrid || originalGrid);

  if (!gridToShow) {
    return (
      <div className="w-full max-w-sm mx-auto aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">ナンプレグリッドが読み込まれていません</p>
      </div>
    );
  }

  const getRegionId = (row: number, col: number): number => {
    if (!regions) return Math.floor(row / 3) * 3 + Math.floor(col / 3);
    
    for (let regionIndex = 0; regionIndex < regions.length; regionIndex++) {
      const region = regions[regionIndex];
      for (const [r, c] of region) {
        if (r === row && c === col) {
          return regionIndex;
        }
      }
    }
    return 0;
  };

  const getRegionColor = (regionId: number): string => {
    const colors = [
      'bg-red-100', 'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-purple-100',
      'bg-pink-100', 'bg-indigo-100', 'bg-gray-100', 'bg-orange-100'
    ];
    return colors[regionId % colors.length];
  };

  const getCellClassName = (row: number, col: number): string => {
    let baseClasses = "aspect-square flex items-center justify-center text-lg font-semibold ";
    
    // 現在のセルのregionId
    const currentRegionId = getRegionId(row, col);
    
    // 境界線の決定（異なるregion間のみ太線）
    const topRegionId = row > 0 ? getRegionId(row - 1, col) : currentRegionId;
    const rightRegionId = col < 8 ? getRegionId(row, col + 1) : currentRegionId;
    const bottomRegionId = row < 8 ? getRegionId(row + 1, col) : currentRegionId;
    const leftRegionId = col > 0 ? getRegionId(row, col - 1) : currentRegionId;
    
    // 境界線のクラス
    let borderClasses = "";
    if (topRegionId !== currentRegionId) {
      borderClasses += "border-t-2 border-t-gray-800 ";
    } else {
      borderClasses += "border-t border-t-gray-400 ";
    }
    
    if (rightRegionId !== currentRegionId) {
      borderClasses += "border-r-2 border-r-gray-800 ";
    } else {
      borderClasses += "border-r border-r-gray-400 ";
    }
    
    if (bottomRegionId !== currentRegionId) {
      borderClasses += "border-b-2 border-b-gray-800 ";
    } else {
      borderClasses += "border-b border-b-gray-400 ";
    }
    
    if (leftRegionId !== currentRegionId) {
      borderClasses += "border-l-2 border-l-gray-800 ";
    } else {
      borderClasses += "border-l border-l-gray-400 ";
    }
    
    baseClasses += borderClasses;

    // ジグソー領域の背景色
    const regionColor = getRegionColor(currentRegionId);
    
    // セルの背景色
    if (showComparison && originalGrid && solvedGrid) {
      const originalValue = originalGrid[row][col];
      const solvedValue = solvedGrid[row][col];
      
      if (originalValue !== null) {
        // 元々入っていた数字
        baseClasses += `${regionColor} text-gray-800 `;
      } else if (solvedValue !== null) {
        // 解答で追加された数字
        baseClasses += `${regionColor} text-primary-800 `;
      } else {
        // 空のセル
        baseClasses += `${regionColor} `;
      }
    } else {
      // 通常表示
      const value = gridToShow[row][col];
      if (value !== null) {
        baseClasses += `${regionColor} text-gray-900 `;
      } else {
        baseClasses += `${regionColor} text-gray-400 `;
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
              title={regions ? `領域 ${getRegionId(rowIndex, colIndex) + 1}` : ''}
            >
              {showComparison && originalGrid && solvedGrid ? (
                // 比較表示時：読み取り結果はnullを空白、正解表示は数字を表示
                originalGrid[rowIndex][colIndex] !== null 
                  ? originalGrid[rowIndex][colIndex] // 読み取り結果の数字
                  : (solvedGrid[rowIndex][colIndex] || '') // 正解の数字（nullなら空白）
              ) : (
                // 通常表示時：nullは空白
                cell || ''
              )}
            </div>
          ))
        )}
      </div>
      
      {regions && (
        <div className="mt-2 text-xs text-gray-600 text-center">
          ジグソー型ナンプレ（9つの不規則な領域）
        </div>
      )}
      
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