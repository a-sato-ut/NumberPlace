const fs = require('fs');

// sample.jsonを読み込み
const sampleData = JSON.parse(fs.readFileSync('./fig/sample.json', 'utf8'));

// TypeScript Solverと同じロジックを実装
class TypeScriptStyleSolver {
  constructor(grid, regions) {
    this.grid = grid.map(row => [...row]);
    this.regions = regions || this.createStandardRegions();
    this.iterations = 0;
    this.maxIterations = 1000000;
  }

  solve() {
    console.log('TypeScriptStyleSolver.solve() started');
    console.log('Regions count:', this.regions.length);
    console.log('First region example:', this.regions[0]);
    
    this.iterations = 0;
    
    if (this.solveSudoku()) {
      console.log('TypeScriptStyleSolver.solve() completed successfully');
      return this.grid;
    }
    console.log('TypeScriptStyleSolver.solve() failed');
    return null;
  }

  solveSudoku() {
    this.iterations++;
    if (this.iterations > this.maxIterations) {
      console.log('Maximum iterations reached:', this.maxIterations);
      return false;
    }

    if (this.iterations % 10000 === 0) {
      console.log('Iterations:', this.iterations);
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
    console.log('Solution found after', this.iterations, 'iterations');
    return true;
  }

  isValidMove(row, col, num) {
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

  findRegionContaining(row, col) {
    for (const region of this.regions) {
      for (const [r, c] of region) {
        if (r === row && c === col) {
          return region;
        }
      }
    }
    return null;
  }

  createStandardRegions() {
    const regions = [];
    
    for (let blockRow = 0; blockRow < 3; blockRow++) {
      for (let blockCol = 0; blockCol < 3; blockCol++) {
        const region = [];
        for (let row = blockRow * 3; row < (blockRow + 1) * 3; row++) {
          for (let col = blockCol * 3; col < (blockCol + 1) * 3; col++) {
            region.push([row, col]);
          }
        }
        regions.push(region);
      }
    }
    
    return regions;
  }
}

console.log('=== TypeScript Style Solver Test ===');
console.log('Original grid:');
console.log(sampleData.cells.map(row => row.map(cell => cell || '.').join(' ')).join('\n'));

const solver = new TypeScriptStyleSolver(sampleData.cells, sampleData.regions);
const solution = solver.solve();

if (solution) {
  console.log('\nSolution:');
  console.log(solution.map(row => row.join(' ')).join('\n'));
  
  // 解答の検証
  console.log('\n=== Validation ===');
  let isValid = true;
  
  // 各領域に1-9がすべて含まれているかチェック
  for (let i = 0; i < sampleData.regions.length; i++) {
    const region = sampleData.regions[i];
    const values = [];
    for (const [r, c] of region) {
      values.push(solution[r][c]);
    }
    values.sort();
    const expected = [1,2,3,4,5,6,7,8,9];
    if (JSON.stringify(values) !== JSON.stringify(expected)) {
      console.log(`Region ${i} is invalid:`, values);
      isValid = false;
    }
  }
  
  // 行のチェック
  for (let row = 0; row < 9; row++) {
    const values = [...solution[row]].sort();
    const expected = [1,2,3,4,5,6,7,8,9];
    if (JSON.stringify(values) !== JSON.stringify(expected)) {
      console.log(`Row ${row} is invalid:`, values);
      isValid = false;
    }
  }
  
  // 列のチェック
  for (let col = 0; col < 9; col++) {
    const values = [];
    for (let row = 0; row < 9; row++) {
      values.push(solution[row][col]);
    }
    values.sort();
    const expected = [1,2,3,4,5,6,7,8,9];
    if (JSON.stringify(values) !== JSON.stringify(expected)) {
      console.log(`Column ${col} is invalid:`, values);
      isValid = false;
    }
  }
  
  console.log('Solution is', isValid ? 'VALID' : 'INVALID');
} else {
  console.log('\nFailed to solve');
}