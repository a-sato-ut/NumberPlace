import { SudokuGrid, SudokuValidationResult, Regions } from '../types/sudoku';

export class SudokuValidator {
  static validate(originalGrid: SudokuGrid, currentGrid: SudokuGrid, regions?: Regions): SudokuValidationResult {
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
          const ruleErrors = this.checkSudokuRules(currentGrid, row, col, currentValue, regions);
          errors.push(...ruleErrors);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static checkSudokuRules(grid: SudokuGrid, row: number, col: number, value: number, regions?: Regions): { row: number; col: number; message: string }[] {
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

    // 領域の重複チェック（ジグソーナンプレ統一方式）
    if (regions) {
      const region = this.findRegionContaining(row, col, regions);
      if (region) {
        for (const [r, c] of region) {
          if ((r !== row || c !== col) && grid[r][c] === value) {
            errors.push({
              row,
              col,
              message: `領域内に同じ数字${value}があります`
            });
            return errors; // 領域内の重複は1つ見つかれば十分
          }
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

  private static findRegionContaining(row: number, col: number, regions: Regions) {
    for (const region of regions) {
      for (const [r, c] of region) {
        if (r === row && c === col) {
          return region;
        }
      }
    }
    return null;
  }

  static compareGrids(originalGrid: SudokuGrid, solvedGrid: SudokuGrid, regions?: Regions): 'correct' | 'incorrect' | 'incomplete' {
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
    
    const validation = this.validate(originalGrid, solvedGrid, regions);
    return validation.isValid ? 'correct' : 'incorrect';
  }
}