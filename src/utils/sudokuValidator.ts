import { SudokuGrid, SudokuValidationResult } from '../types/sudoku';

export class SudokuValidator {
  static validate(originalGrid: SudokuGrid, currentGrid: SudokuGrid): SudokuValidationResult {
    const errors: { row: number; col: number; message: string }[] = [];

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const originalValue = originalGrid[row][col];
        const currentValue = currentGrid[row][col];

        // 元々埋まっていたセルは変更不可
        if (originalValue !== null && currentValue !== originalValue) {
          errors.push({
            row,
            col,
            message: '元の数字は変更できません'
          });
          continue;
        }

        // 現在のセルに値がある場合、ルール違反をチェック
        if (currentValue !== null) {
          const ruleErrors = this.checkSudokuRules(currentGrid, row, col, currentValue);
          errors.push(...ruleErrors);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static checkSudokuRules(grid: SudokuGrid, row: number, col: number, value: number): { row: number; col: number; message: string }[] {
    const errors: { row: number; col: number; message: string }[] = [];

    // 行の重複チェック
    for (let i = 0; i < 9; i++) {
      if (i !== col && grid[row][i] === value) {
        errors.push({
          row,
          col,
          message: `行に同じ数字${value}があります`
        });
        break;
      }
    }

    // 列の重複チェック
    for (let i = 0; i < 9; i++) {
      if (i !== row && grid[i][col] === value) {
        errors.push({
          row,
          col,
          message: `列に同じ数字${value}があります`
        });
        break;
      }
    }

    // 3x3ボックスの重複チェック
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        if ((i !== row || j !== col) && grid[i][j] === value) {
          errors.push({
            row,
            col,
            message: `3×3ボックス内に同じ数字${value}があります`
          });
          return errors; // ボックス内の重複は1つ見つかれば十分
        }
      }
    }

    return errors;
  }

  static isComplete(grid: SudokuGrid): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === null) {
          return false;
        }
      }
    }
    return true;
  }

  static compareGrids(originalGrid: SudokuGrid, solvedGrid: SudokuGrid): 'correct' | 'incorrect' | 'incomplete' {
    let hasEmpty = false;
    let hasError = false;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const originalValue = originalGrid[row][col];
        const solvedValue = solvedGrid[row][col];

        if (solvedValue === null) {
          hasEmpty = true;
        } else if (originalValue !== null && originalValue !== solvedValue) {
          hasError = true;
        }
      }
    }

    if (hasError) return 'incorrect';
    if (hasEmpty) return 'incomplete';
    
    const validation = this.validate(originalGrid, solvedGrid);
    return validation.isValid ? 'correct' : 'incorrect';
  }
}