import React, { useState } from 'react';
import { SudokuGrid as SudokuGridType, Regions, OCRProcessingStep } from '../types/sudoku';

interface OverlayGridProps {
  originalGrid?: SudokuGridType;
  regions?: Regions;
  processingSteps?: OCRProcessingStep[];
  editable?: boolean;
  onCellEdit?: (row: number, col: number, value: number | null) => void;
}

export const OverlayGrid: React.FC<OverlayGridProps> = ({ 
  originalGrid, 
  regions,
  processingSteps,
  editable = false,
  onCellEdit
}) => {
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);

  // メモ数字除去後のクリーンな画像を取得
  const cleanedImage = processingSteps?.find(step => 
    step.name === 'memo_removed' || step.description.includes('メモ数字除去')
  )?.imageData;

  if (!originalGrid || !cleanedImage) {
    return (
      <div className="w-full max-w-sm mx-auto aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">画像が読み込まれていません</p>
      </div>
    );
  }

  const handleCellClick = (row: number, col: number) => {
    console.log('Overlay cell clicked:', {row, col, editable});
    if (!editable) {
      console.log('Not editable, returning');
      return;
    }
    console.log('Setting selected cell:', {row, col});
    setSelectedCell({row, col});
  };

  const handleNumberInput = (number: number | null) => {
    if (!selectedCell || !onCellEdit) return;
    onCellEdit(selectedCell.row, selectedCell.col, number);
    setSelectedCell(null);
  };

  const getRegionId = (row: number, col: number): number => {
    if (!regions) return 0;
    
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
      'rgba(239, 68, 68, 0.3)',   // red-500 with opacity
      'rgba(59, 130, 246, 0.3)',  // blue-500 with opacity
      'rgba(34, 197, 94, 0.3)',   // green-500 with opacity
      'rgba(251, 191, 36, 0.3)',  // yellow-500 with opacity
      'rgba(168, 85, 247, 0.3)',  // purple-500 with opacity
      'rgba(236, 72, 153, 0.3)',  // pink-500 with opacity
      'rgba(99, 102, 241, 0.3)',  // indigo-500 with opacity
      'rgba(107, 114, 128, 0.3)', // gray-500 with opacity
      'rgba(249, 115, 22, 0.3)'   // orange-500 with opacity
    ];
    return colors[regionId % colors.length];
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative border-2 border-gray-800 rounded-lg overflow-hidden bg-white">
        {/* 背景画像 */}
        <img 
          src={cleanedImage} 
          alt="処理済み画像"
          className="w-full h-auto block"
        />
        
        {/* 9x9グリッドのオーバーレイ */}
        <div className="absolute inset-0 grid grid-cols-9 gap-0">
          {Array.from({ length: 9 }, (_, row) => 
            Array.from({ length: 9 }, (_, col) => {
              const regionId = getRegionId(row, col);
              const regionColor = getRegionColor(regionId);
              const value = originalGrid[row][col];
              const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
              
              return (
                <div
                  key={`${row}-${col}`}
                  className={`relative border border-gray-300 ${editable ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ backgroundColor: regionColor }}
                  onClick={() => handleCellClick(row, col)}
                  title={regions ? `領域 ${regionId + 1}` : ''}
                >
                  {/* 数字表示 */}
                  {value && (
                    <div className="absolute bottom-0 right-0 text-red-600 font-bold text-base leading-none p-0.5">
                      {value}
                    </div>
                  )}
                  
                  {/* 選択時のハイライト */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20"></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {regions && (
        <div className="mt-2 text-xs text-gray-600 text-center">
          ジグソー型ナンプレ（9つの不規則な領域）
        </div>
      )}
      
      {/* 数字入力ダイアログ */}
      {selectedCell && editable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4 text-center">
              数字を選択 (行{selectedCell.row + 1}, 列{selectedCell.col + 1})
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleNumberInput(num)}
                  className="w-12 h-12 bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleNumberInput(null)}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                空にする
              </button>
              <button
                onClick={() => setSelectedCell(null)}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};