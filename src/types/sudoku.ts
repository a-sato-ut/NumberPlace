export type SudokuCell = number | null;
export type SudokuGrid = SudokuCell[][];

// ジグソーナンプレの領域定義
export type Position = [number, number]; // [row, col]
export type Region = Position[]; // 9個のセルの位置配列
export type Regions = Region[]; // 9個の領域の配列

export interface JigsawSudokuData {
  size: number;
  cells: SudokuGrid;
  regions: Regions;
  meta?: {
    board_bbox_in_original_image?: number[];
  };
}

export interface SudokuValidationResult {
  isValid: boolean;
  errors: {
    row: number;
    col: number;
    message: string;
  }[];
}

export interface OCRResult {
  grid: SudokuGrid;
  regions?: Regions;
  confidence: number;
}

export interface AppState {
  originalGrid: SudokuGrid | null;
  solvedGrid: SudokuGrid | null;
  regions: Regions | null;
  validationResult: SudokuValidationResult | null;
  isLoading: boolean;
  currentStep: 'upload' | 'processing' | 'result';
}