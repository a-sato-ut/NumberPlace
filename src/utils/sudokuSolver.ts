import { SudokuGrid } from '../types/sudoku';

export class SudokuSolver {
  private grid: SudokuGrid;

  constructor(grid: SudokuGrid) {
    this.grid = grid.map(row => [...row]);
  }

  solve(): SudokuGrid | null {
    if (this.solveSudoku()) {
      return this.grid;
    }
    return null;
  }

  private solveSudoku(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.grid[row][col] === null) {
          for (let num = 1; num <= 9; num++) {
            if (this.isValidMove(row, col, num)) {
              this.grid[row][col] = num;
              if (this.solveSudoku()) {
                return true;
              }
              this.grid[row][col] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  private isValidMove(row: number, col: number, num: number): boolean {
    // 行をチェック
    for (let i = 0; i < 9; i++) {
      if (this.grid[row][i] === num) {
        return false;
      }
    }

    // 列をチェック
    for (let i = 0; i < 9; i++) {
      if (this.grid[i][col] === num) {
        return false;
      }
    }

    // 3x3ボックスをチェック
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        if (this.grid[i][j] === num) {
          return false;
        }
      }
    }

    return true;
  }

  static createEmptyGrid(): SudokuGrid {
    return Array(9).fill(null).map(() => Array(9).fill(null));
  }

  static isGridValid(grid: SudokuGrid): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = grid[row][col];
        if (value !== null) {
          // 一時的にセルを空にして、同じ値が他にないかチェック
          const tempGrid = grid.map(r => [...r]);
          tempGrid[row][col] = null;
          
          // 行チェック
          for (let i = 0; i < 9; i++) {
            if (tempGrid[row][i] === value) return false;
          }
          
          // 列チェック
          for (let i = 0; i < 9; i++) {
            if (tempGrid[i][col] === value) return false;
          }
          
          // 3x3ボックスチェック
          const boxRow = Math.floor(row / 3) * 3;
          const boxCol = Math.floor(col / 3) * 3;
          for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
              if (tempGrid[i][j] === value) return false;
            }
          }
        }
      }
    }
    return true;
  }
}