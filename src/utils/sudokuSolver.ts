import { SudokuGrid, Regions } from '../types/sudoku';

export class SudokuSolver {
  private grid: SudokuGrid;
  private regions: Regions;
  private iterations: number = 0;
  private maxIterations: number = 1000000; // 100万回で停止

  constructor(grid: SudokuGrid, regions: Regions) {
    this.grid = grid.map(row => [...row]);
    this.regions = regions;
  }

  solve(): SudokuGrid | null {
    // 反復回数をリセット
    this.iterations = 0;
    
    if (this.solveSudoku()) {
      return this.grid;
    }
    return null;
  }

  private solveSudoku(): boolean {
    this.iterations++;
    if (this.iterations > this.maxIterations) {
      console.warn('Sudoku solver reached maximum iterations limit:', this.maxIterations);
      return false;
    }

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

    // ジグソー領域をチェック
    const region = this.findRegionContaining(row, col);
    if (region) {
      for (const [r, c] of region) {
        if (this.grid[r][c] === num) {
          return false;
        }
      }
    }

    return true;
  }

  private findRegionContaining(row: number, col: number) {
    for (const region of this.regions) {
      for (const [r, c] of region) {
        if (r === row && c === col) {
          return region;
        }
      }
    }
    return null;
  }

  static createEmptyGrid(): SudokuGrid {
    return Array(9).fill(null).map(() => Array(9).fill(null));
  }

  static isGridValid(grid: SudokuGrid, regions?: Regions): boolean {
    if (!regions) {
      throw new Error('領域情報が必要です。通常のナンプレの場合は標準3x3領域を事前に作成してください。');
    }
    const regionData = regions;
    
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
          
          // ジグソー領域チェック
          const region = SudokuSolver.findRegionContainingStatic(row, col, regionData);
          if (region) {
            for (const [r, c] of region) {
              if (tempGrid[r][c] === value) return false;
            }
          }
        }
      }
    }
    return true;
  }

  static findRegionContainingStatic(row: number, col: number, regions: Regions) {
    for (const region of regions) {
      for (const [r, c] of region) {
        if (r === row && c === col) {
          return region;
        }
      }
    }
    return null;
  }

  // 標準領域作成機能はImageProcessorに統一
}