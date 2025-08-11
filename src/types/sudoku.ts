export type SudokuCell = number | null;
export type SudokuGrid = SudokuCell[][];

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
  confidence: number;
}

export interface AppState {
  originalGrid: SudokuGrid | null;
  solvedGrid: SudokuGrid | null;
  validationResult: SudokuValidationResult | null;
  isLoading: boolean;
  currentStep: 'upload' | 'processing' | 'result';
}