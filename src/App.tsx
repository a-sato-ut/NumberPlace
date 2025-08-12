import { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { SudokuGrid } from './components/SudokuGrid';
import { ResultDisplay } from './components/ResultDisplay';
import { ProcessingSteps } from './components/ProcessingSteps';
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
        
        // 領域の重複チェック（ジグソーナンプレ統一方式）
        const region = regions?.find(r => r.some(([r, c]: [number, number]) => r === row && c === col));
        if (region) {
          for (const [r, c] of region) {
            if ((r !== row || c !== col) && grid[r][c] === value) {
              errors.push(`位置(${row+1}, ${col+1})の数字${value}が領域で重複しています`);
              break;
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
    currentStep: 'upload',
    validationErrors: undefined
  });

  // 編集可能なグリッドの状態管理
  const [editableGrid, setEditableGrid] = useState<SudokuGridType | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleImageUpload = useCallback(async (_file: File) => {
    setAppState(prev => ({
      ...prev,
      isLoading: true,
      currentStep: 'processing'
    }));

    try {
      let originalGrid: SudokuGridType;
      let regions = null;
      let ocrResult: any;
      
      // ファイル名でデモかどうかを判定
      if (_file.name === 'demo') {
        // デモの場合はsample.jsonからジグソーナンプレを読み込み
        ocrResult = await ImageProcessor.processImage(_file);
        originalGrid = ocrResult.grid;
        regions = ocrResult.regions;
        console.log('Loaded jigsaw sudoku from sample.json (demo mode):', originalGrid, regions);
      } else {
        // 実際のOCR処理（S__9568259.jpgも含む）
        ocrResult = await ImageProcessor.processImage(_file);
        originalGrid = ocrResult.grid;
        regions = ocrResult.regions;
        
        // 通常のナンプレの場合は標準3×3領域を自動作成
        if (!regions) {
          regions = ImageProcessor.createStandardRegions();
          console.log('Created standard 3x3 regions for regular sudoku');
        }
        
        console.log('Processed image:', _file.name, 'with confidence:', ocrResult.confidence, '%, grid:', originalGrid);
      }
      
      // 初期グリッドの有効性をチェック
      const validationErrors = validateInitialGrid(originalGrid, regions || null);
      if (validationErrors.length > 0) {
        console.error('Initial grid validation errors:', validationErrors);
        // ルール違反がある場合でも読み取り結果を表示する
        setAppState({
          originalGrid,
          solvedGrid: null,
          regions: regions || null,
          validationResult: null,
          isLoading: false,
          currentStep: 'invalid',
          validationErrors,
          processingSteps: ocrResult.processingSteps || []
        });
        return;
      }

      // ナンプレを解く
      const solver = new SudokuSolver(originalGrid, regions);
      const solvedGrid = solver.solve();
      
      if (!solvedGrid) {
        // 解けない場合でも読み取り結果と処理ステップは表示する
        console.log('Sudoku could not be solved, but showing OCR results');
        setAppState({
          originalGrid,
          solvedGrid: null,
          regions: regions || null,
          validationResult: null,
          isLoading: false,
          currentStep: 'unsolvable',
          processingSteps: ocrResult.processingSteps || [],
          solverError: 'このナンプレは解けませんでした。読み取り結果に誤りがある可能性があります。'
        });
        return;
      }

      // 解答の検証
      const validationResult = SudokuValidator.validate(originalGrid, solvedGrid, regions);

      setAppState({
        originalGrid,
        solvedGrid,
        regions: regions || null,
        validationResult,
        isLoading: false,
        currentStep: 'result',
        processingSteps: ocrResult.processingSteps || []
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

  const       handleStartOver = useCallback(() => {
    setAppState({
      originalGrid: null,
      solvedGrid: null,
      regions: null,
      validationResult: null,
      isLoading: false,
      currentStep: 'upload',
      validationErrors: undefined,
      processingSteps: undefined,
      solverError: undefined
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

  // グリッド編集開始
  const handleStartEdit = useCallback(() => {
    if (appState.originalGrid) {
      setEditableGrid(appState.originalGrid.map(row => [...row])); // ディープコピー
      setIsEditing(true);
    }
  }, [appState.originalGrid]);

  // セル値の変更
  const handleCellEdit = useCallback((row: number, col: number, value: number | null) => {
    if (!editableGrid) return;
    
    const newGrid = editableGrid.map(r => [...r]);
    newGrid[row][col] = value;
    setEditableGrid(newGrid);

    // 変更後即座に検証
    const validationErrors = validateInitialGrid(newGrid, appState.regions);
    const validationResult = SudokuValidator.validate(newGrid, newGrid, appState.regions ?? undefined);
    
    // アプリ状態を更新
    setAppState(prev => ({
      ...prev,
      originalGrid: newGrid,
      validationResult,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
      currentStep: validationErrors.length > 0 ? 'invalid' : prev.currentStep
    }));

    console.log(`セル (${row + 1}, ${col + 1}) を ${value} に変更`);
    console.log('検証エラー:', validationErrors);
  }, [editableGrid, appState.regions]);

  // 編集完了（解答を試行）
  const handleFinishEdit = useCallback(() => {
    if (!editableGrid) return;

    const validationErrors = validateInitialGrid(editableGrid, appState.regions);
    if (validationErrors.length > 0) {
      console.log('解答できません - 検証エラーがあります:', validationErrors);
      return;
    }

    // ナンプレを解く
    try {
      if (!appState.regions) {
        console.error('領域情報がありません');
        return;
      }
      const solver = new SudokuSolver(editableGrid, appState.regions);
      const solvedGrid = solver.solve();
      
      if (solvedGrid) {
        const validationResult = SudokuValidator.validate(editableGrid, solvedGrid, appState.regions ?? undefined);
        setAppState(prev => ({
          ...prev,
          originalGrid: editableGrid,
          solvedGrid,
          validationResult,
          currentStep: 'result',
          validationErrors: undefined
        }));
        setIsEditing(false);
        console.log('解答完了');
      } else {
        setAppState(prev => ({
          ...prev,
          originalGrid: editableGrid,
          solvedGrid: null,
          currentStep: 'unsolvable',
          solverError: 'このナンプレは解けませんでした。入力された数字を確認してください。'
        }));
        console.log('解答できませんでした');
      }
    } catch (error) {
      console.error('解答中にエラーが発生:', error);
    }
  }, [editableGrid, appState.regions]);

  // 編集キャンセル
  const handleCancelEdit = useCallback(() => {
    setEditableGrid(null);
    setIsEditing(false);
    // 元の状態に戻す
    if (appState.originalGrid) {
      const validationErrors = validateInitialGrid(appState.originalGrid, appState.regions);
      setAppState(prev => ({
        ...prev,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        currentStep: validationErrors.length > 0 ? 'invalid' : prev.currentStep
      }));
    }
  }, [appState.originalGrid, appState.regions]);

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
                    const response = await fetch('/NumberPlace/S__9568259.jpg');
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

        {appState.currentStep === 'invalid' && appState.originalGrid && appState.validationErrors && (
          <div className="space-y-6">
            {/* データソース表示 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h3 className="text-sm font-medium text-red-800 mb-1">読み取り結果</h3>
              <p className="text-xs text-red-700">
                画像から数字を読み取りましたが、ナンプレのルールに違反している箇所があります
              </p>
              <p className="text-xs text-red-600 mt-1">
                空欄数: {appState.originalGrid.flat().filter(cell => cell === null).length}/81
              </p>
            </div>

            {/* ナンプレグリッド表示 */}
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                {isEditing ? '数字を修正中...' : '読み取った数字'}
              </h2>
              <SudokuGrid 
                originalGrid={editableGrid || appState.originalGrid}
                regions={appState.regions || undefined}
                showComparison={false}
                showOriginalOnly={true}
                editable={isEditing}
                onCellEdit={handleCellEdit}
                validationResult={appState.validationResult || undefined}
              />
            </div>

            {/* エラー詳細 */}
            <div className="bg-white p-4 rounded-lg border border-red-200">
              <h3 className="text-sm font-medium text-red-800 mb-3">ルール違反の詳細</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {appState.validationErrors.map((error, index) => (
                  <div key={index} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                    {error}
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  💡 <strong>ヒント:</strong> 読み取りエラーの可能性があります。画像の品質を確認するか、手動で正しい数字に修正してからもう一度お試しください。
                </p>
              </div>
            </div>

            {/* 処理ステップの表示 */}
            {appState.processingSteps && appState.processingSteps.length > 0 && (
              <ProcessingSteps steps={appState.processingSteps} />
            )}

            {/* アクション */}
            <div className="flex flex-col space-y-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleStartEdit}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    ✏️ 数字を修正する
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    別の画像をアップロード
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFinishEdit}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    disabled={appState.validationErrors && appState.validationErrors.length > 0}
                  >
                    ✅ 修正完了（解答する）
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    ❌ 修正をキャンセル
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* 解けないナンプレの場合 */}
        {appState.currentStep === 'unsolvable' && appState.originalGrid && (
          <div className="space-y-6">
            {/* データソース表示 */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <h3 className="text-sm font-medium text-orange-800 mb-1">🤔 ナンプレが解けませんでした</h3>
              <p className="text-xs text-orange-700">
                {appState.solverError}
              </p>
              <p className="text-xs text-orange-600 mt-1">
                読み取り結果: {appState.originalGrid.flat().filter(cell => cell !== null).length}/81 セル認識済み
              </p>
            </div>

            {/* ナンプレグリッド表示 */}
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                {isEditing ? '数字を修正中...' : '読み取り結果（解けませんでした）'}
              </h2>
              <p className="text-sm text-gray-600 text-center mb-4">
                以下の数字認識結果をご確認ください。誤認識や欠落がある可能性があります。
              </p>
              <SudokuGrid 
                originalGrid={editableGrid || appState.originalGrid}
                regions={appState.regions || undefined}
                showComparison={false}
                showOriginalOnly={true}
                editable={isEditing}
                onCellEdit={handleCellEdit}
                validationResult={appState.validationResult || undefined}
              />
            </div>

            {/* エラー詳細説明 */}
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h3 className="text-sm font-medium text-orange-800 mb-2">考えられる原因:</h3>
              <div className="space-y-2 text-xs text-orange-700">
                <div className="flex items-start space-x-2">
                  <span>•</span>
                  <span>数字の誤認識（8を6と認識、9を6と認識など）</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span>•</span>
                  <span>読み取れなかった数字がある（薄い文字、汚れなど）</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span>•</span>
                  <span>元の問題に複数解がある、または解が存在しない</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span>•</span>
                  <span>画像の向きやトリミングが不適切</span>
                </div>
              </div>
            </div>

            {/* 処理ステップの表示 */}
            {appState.processingSteps && appState.processingSteps.length > 0 && (
              <ProcessingSteps steps={appState.processingSteps} />
            )}

            {/* アクション */}
            <div className="flex flex-col space-y-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={handleStartEdit}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    ✏️ 数字を修正する
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    別の画像をアップロード
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFinishEdit}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    disabled={appState.validationErrors && appState.validationErrors.length > 0}
                  >
                    ✅ 修正完了（解答する）
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    ❌ 修正をキャンセル
                  </button>
                </>
              )}
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

            {/* 処理ステップの表示 */}
            {appState.processingSteps && appState.processingSteps.length > 0 && (
              <ProcessingSteps steps={appState.processingSteps} />
            )}

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