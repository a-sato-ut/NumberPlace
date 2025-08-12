import { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { OverlayGrid } from './components/OverlayGrid';
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
  
  // 編集前の状態を保存（キャンセル時の復元用）
  const [preEditState, setPreEditState] = useState<{
    step: AppState['currentStep'];
    validationResult: AppState['validationResult'];
    validationErrors: AppState['validationErrors'];
  } | null>(null);

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
      
      // 画像処理を実行
      ocrResult = await ImageProcessor.processImage(_file);
      originalGrid = ocrResult.grid;
      regions = ocrResult.regions;
      
      // 通常のナンプレの場合は標準3×3領域を自動作成
      if (!regions) {
        regions = ImageProcessor.createStandardRegions();
        console.log('Created standard 3x3 regions for regular sudoku');
      }
      
      console.log('Processed image:', _file.name, 'with confidence:', ocrResult.confidence, '%, grid:', originalGrid);
      
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



  // グリッド編集開始
  const handleStartEdit = useCallback(() => {
    console.log('Starting edit mode:', {
      hasOriginalGrid: !!appState.originalGrid,
      currentStep: appState.currentStep
    });
    
    if (!appState.originalGrid) {
      console.error('No original grid available for editing');
      return;
    }

    // 編集前の状態を保存
    setPreEditState({
      step: appState.currentStep,
      validationResult: appState.validationResult,
      validationErrors: appState.validationErrors
    });

    // 編集可能なグリッドをセット
    setEditableGrid(appState.originalGrid.map(row => [...row]));
    setIsEditing(true);
    
    // 編集中は'result'状態で表示し、検証結果をクリア
    setAppState(prev => ({
      ...prev,
      currentStep: 'result', // 常にresult状態で編集
      validationErrors: undefined,
      validationResult: prev.validationResult // 既存の結果は保持
    }));
    
    console.log('Edit mode started');
  }, [appState.originalGrid, appState.currentStep, appState.validationResult, appState.validationErrors]);

  // セル値の変更（リアルタイム検証なし）
  const handleCellEdit = useCallback((row: number, col: number, value: number | null) => {
    if (!editableGrid) return;
    
    const newGrid = editableGrid.map(r => [...r]);
    newGrid[row][col] = value;
    setEditableGrid(newGrid);

    console.log(`セル (${row + 1}, ${col + 1}) を ${value} に変更`);
  }, [editableGrid]);

  // 編集完了（解答を試行）
  const handleFinishEdit = useCallback(() => {
    if (!editableGrid) return;

    // まず編集内容をアプリ状態に保存
    setAppState(prev => ({
      ...prev,
      originalGrid: editableGrid
    }));

    const validationErrors = validateInitialGrid(editableGrid, appState.regions);
    if (validationErrors.length > 0) {
      console.log('検証エラーがあります:', validationErrors);
      // 検証エラーがある場合はinvalidページに移動
      setAppState(prev => ({
        ...prev,
        originalGrid: editableGrid,
        validationErrors,
        currentStep: 'invalid',
        validationResult: null,
        solvedGrid: null
      }));
      setIsEditing(false);
      setEditableGrid(null);
      setPreEditState(null); // 編集前状態をクリア
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
        setEditableGrid(null);
        setPreEditState(null); // 編集前状態をクリア
        console.log('解答完了');
      } else {
        setAppState(prev => ({
          ...prev,
          originalGrid: editableGrid,
          solvedGrid: null,
          currentStep: 'unsolvable',
          solverError: 'このナンプレは解けませんでした。入力された数字を確認してください。',
          validationErrors: undefined
        }));
        setIsEditing(false);
        setEditableGrid(null);
        setPreEditState(null); // 編集前状態をクリア
        console.log('解答できませんでした');
      }
    } catch (error) {
      console.error('解答中にエラーが発生:', error);
      setIsEditing(false);
      setEditableGrid(null);
      setPreEditState(null); // 編集前状態をクリア
    }
  }, [editableGrid, appState.regions]);

  // 編集キャンセル
  const handleCancelEdit = useCallback(() => {
    console.log('Canceling edit mode');
    
    // 編集状態をクリア
    setEditableGrid(null);
    setIsEditing(false);
    
    // 編集前の状態を復元
    if (preEditState) {
      setAppState(prev => ({
        ...prev,
        currentStep: preEditState.step,
        validationResult: preEditState.validationResult,
        validationErrors: preEditState.validationErrors
      }));
      setPreEditState(null);
    } else {
      // フォールバック: 編集前の状態が不明な場合
      console.warn('No pre-edit state saved, falling back to validation');
      if (appState.originalGrid) {
        const validationErrors = validateInitialGrid(appState.originalGrid, appState.regions);
        setAppState(prev => ({
          ...prev,
          validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
          currentStep: validationErrors.length > 0 ? 'invalid' : 'result'
        }));
      }
    }
    
    console.log('Edit mode canceled');
  }, [preEditState, appState.originalGrid, appState.regions]);

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


            {/* ナンプレオーバーレイ表示 */}
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                {isEditing ? '数字を修正中...' : '読み取った数字'}
              </h2>
              <OverlayGrid 
                originalGrid={editableGrid || appState.originalGrid}
                regions={appState.regions || undefined}
                processingSteps={appState.processingSteps}
                editable={isEditing}
                onCellEdit={handleCellEdit}
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


            {/* ナンプレオーバーレイ表示 */}
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                {isEditing ? '数字を修正中...' : '読み取り結果（解けませんでした）'}
              </h2>
              <p className="text-sm text-gray-600 text-center mb-4">
                以下の数字認識結果をご確認ください。誤認識や欠落がある可能性があります。
              </p>
              <OverlayGrid 
                originalGrid={editableGrid || appState.originalGrid}
                regions={appState.regions || undefined}
                processingSteps={appState.processingSteps}
                editable={isEditing}
                onCellEdit={handleCellEdit}
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

        {appState.currentStep === 'result' && appState.originalGrid && (
          <div className="space-y-6">
            {/* 結果表示を最上部に配置 */}
            <ResultDisplay
              originalGrid={appState.originalGrid}
              solvedGrid={appState.solvedGrid ?? undefined}
              validationResult={appState.validationResult ?? undefined}
              regions={appState.regions ?? undefined}
              onStartOver={handleStartOver}
            />

            {/* 編集ボタン */}
            <div className="flex flex-col space-y-3">
              {!isEditing ? (
                <button
                  onClick={handleStartEdit}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  ✏️ 数字を修正する
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFinishEdit}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"

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

            {/* ナンプレオーバーレイ表示 */}
            <div className="bg-white rounded-lg p-4 border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                {isEditing ? '数字を修正中...' : '検出されたナンプレ'}
              </h2>
              <OverlayGrid 
                originalGrid={editableGrid || appState.originalGrid}
                regions={appState.regions || undefined}
                processingSteps={appState.processingSteps}
                editable={isEditing}
                onCellEdit={handleCellEdit}
              />
            </div>






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