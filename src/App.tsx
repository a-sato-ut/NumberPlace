import { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { SudokuGrid } from './components/SudokuGrid';
import { ResultDisplay } from './components/ResultDisplay';
import { ImageProcessor } from './utils/imageProcessor';
import { SudokuSolver } from './utils/sudokuSolver';
import { SudokuValidator } from './utils/sudokuValidator';
import { AppState, SudokuGrid as SudokuGridType, Regions } from './types/sudoku';

// 初期グリッドのバリデーション関数
const validateInitialGrid = (grid: SudokuGridType, regions: Regions | null): string[] => {
  const errors: string[] = [];
  
  // 各セルをチェック
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = grid[row][col];
      if (value !== null) {
        // 行の重複チェック
        for (let i = 0; i < 9; i++) {
          if (i !== col && grid[row][i] === value) {
            errors.push(`位置(${row+1}, ${col+1})の数字${value}が行で重複しています`);
            break;
          }
        }
        
        // 列の重複チェック
        for (let i = 0; i < 9; i++) {
          if (i !== row && grid[i][col] === value) {
            errors.push(`位置(${row+1}, ${col+1})の数字${value}が列で重複しています`);
            break;
          }
        }
        
        // ジグソー領域の重複チェック
        if (regions) {
          const region = regions.find(r => r.some(([r, c]: [number, number]) => r === row && c === col));
          if (region) {
            for (const [r, c] of region) {
              if ((r !== row || c !== col) && grid[r][c] === value) {
                errors.push(`位置(${row+1}, ${col+1})の数字${value}がジグソー領域で重複しています`);
                break;
              }
            }
          }
        }
      }
    }
  }
  
  return errors;
};

function App() {
  const [appState, setAppState] = useState<AppState>({
    originalGrid: null,
    solvedGrid: null,
    regions: null,
    validationResult: null,
    isLoading: false,
    currentStep: 'upload'
  });

  const handleImageUpload = useCallback(async (_file: File) => {
    setAppState(prev => ({
      ...prev,
      isLoading: true,
      currentStep: 'processing'
    }));

    try {
      let originalGrid: SudokuGridType;
      
      let regions = null;
      
      // ファイル名でデモかどうかを判定
      if (_file.name === 'demo') {
        // デモの場合はsample.jsonからジグソーナンプレを読み込み
        const jigsawData = await ImageProcessor.loadJigsawSudokuFromJson();
        originalGrid = jigsawData.grid;
        regions = jigsawData.regions;
        console.log('Loaded jigsaw sudoku from sample.json (demo mode):', originalGrid, regions);
      } else {
        // 実際のOCR処理（S__9568259.jpgも含む）
        const ocrResult = await ImageProcessor.processImage(_file);
        originalGrid = ocrResult.grid;
        regions = ocrResult.regions;
        console.log('Processed image:', _file.name, 'with confidence:', ocrResult.confidence, '%, grid:', originalGrid);
      }
      
      // 初期グリッドの有効性をチェック
      const validationErrors = validateInitialGrid(originalGrid, regions || null);
      if (validationErrors.length > 0) {
        console.error('Initial grid validation errors:', validationErrors);
        throw new Error(`ナンプレのルールに違反している箇所があります。\n${validationErrors.join('\n')}`);
      }

      // ナンプレを解く
      const solver = new SudokuSolver(originalGrid, regions);
      const solvedGrid = solver.solve();
      
      if (!solvedGrid) {
        throw new Error('この ナンプレは解けませんでした');
      }

      // 解答の検証
      const validationResult = SudokuValidator.validate(originalGrid, solvedGrid, regions);

      setAppState({
        originalGrid,
        solvedGrid,
        regions: regions || null,
        validationResult,
        isLoading: false,
        currentStep: 'result'
      });
    } catch (error) {
      console.error('Processing failed:', error);
      setAppState(prev => ({
        ...prev,
        isLoading: false,
        currentStep: 'upload'
      }));
      alert(error instanceof Error ? error.message : '画像の処理中にエラーが発生しました');
    }
  }, []);

  const handleStartOver = useCallback(() => {
    setAppState({
      originalGrid: null,
      solvedGrid: null,
      regions: null,
      validationResult: null,
      isLoading: false,
      currentStep: 'upload'
    });
  }, []);

  const handleDemoSolved = useCallback(() => {
    if (appState.solvedGrid) {
      const validationResult = SudokuValidator.validate(appState.solvedGrid, appState.solvedGrid, appState.regions ?? undefined);
      setAppState(prev => ({
        ...prev,
        originalGrid: prev.solvedGrid,
        validationResult
      }));
    }
  }, [appState.solvedGrid, appState.regions]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">
            📱 ナンプレ解析アプリ
          </h1>
          <p className="text-sm text-gray-600 text-center mt-1">
            画像をアップロードして自動解析・検証
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-md mx-auto px-4 py-6">
        {appState.currentStep === 'upload' && (
          <div className="space-y-6">
            <ImageUploader 
              onImageUpload={handleImageUpload}
              isLoading={appState.isLoading}
            />
            
            {/* デモボタン */}
            <div className="text-center space-y-3">
              <button
                onClick={() => handleImageUpload(new File([], 'demo'))}
                className="block w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                🧩 ジグソーナンプレを読み込んで解析
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/NamPure/S__9568259.jpg');
                    const blob = await response.blob();
                    const file = new File([blob], 'S__9568259.jpg', { type: 'image/jpeg' });
                    handleImageUpload(file);
                  } catch (error) {
                    console.error('Failed to load test image:', error);
                    alert('テスト画像の読み込みに失敗しました');
                  }
                }}
                className="block w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                📱 S__9568259.jpg でテスト
              </button>
              
              <p className="text-xs text-gray-500">
                上: ジグソーナンプレJSONデータ読み込み / 下: 画像ファイル処理
              </p>
            </div>
          </div>
        )}

        {appState.currentStep === 'processing' && (
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">画像を解析中...</h2>
              <p className="text-gray-600 text-sm">
                ナンプレの数字を認識して問題を解いています
              </p>
            </div>
          </div>
        )}

        {appState.currentStep === 'result' && appState.originalGrid && appState.validationResult && (
          <div className="space-y-6">
            {/* データソース表示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h3 className="text-sm font-medium text-blue-800 mb-1">データソース</h3>
              <p className="text-xs text-blue-700">
                {appState.originalGrid ? '画像解析完了' : 'numbers.json から読み込み完了'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                空欄数: {appState.originalGrid.flat().filter(cell => cell === null).length}/81
              </p>
            </div>

            {/* ナンプレグリッド表示 */}
            <div className="bg-white rounded-lg p-4 border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                検出されたナンプレ
              </h2>
              <SudokuGrid 
                originalGrid={appState.originalGrid}
                solvedGrid={appState.solvedGrid || undefined}
                regions={appState.regions || undefined}
                validationResult={appState.validationResult}
                showComparison={false}
                showOriginalOnly={true}
              />
            </div>

            {/* 結果表示 */}
            <ResultDisplay
              originalGrid={appState.originalGrid}
              solvedGrid={appState.solvedGrid!}
              validationResult={appState.validationResult}
              regions={appState.regions ?? undefined}
              onStartOver={handleStartOver}
            />

            {/* デモ用：解答を表示するボタン */}
            {appState.solvedGrid && (
              <div className="bg-white rounded-lg p-4 border border-primary-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">解答と比較</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleDemoSolved}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    ✅ 完全解答版で検証
                  </button>
                  <SudokuGrid 
                    originalGrid={appState.originalGrid}
                    solvedGrid={appState.solvedGrid || undefined}
                    regions={appState.regions || undefined}
                    showComparison={true}
                  />
                  <p className="text-xs text-gray-500">
                    グレー: 元の数字、青: 解答で追加された数字
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="mt-8 pb-6 text-center text-xs text-gray-500">
        <p>Made with React + TypeScript + Tailwind CSS</p>
      </footer>
    </div>
  );
}

export default App;