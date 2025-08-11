import { createWorker } from 'tesseract.js';
import { SudokuGrid, OCRResult } from '../types/sudoku';

export class ImageProcessor {
  private static worker: Tesseract.Worker | null = null;

  static async initializeOCR(): Promise<void> {
    if (this.worker) return;
    
    this.worker = await createWorker('jpn+eng');
    await this.worker.setParameters({
      tessedit_char_whitelist: '123456789',
      tessedit_pageseg_mode: 6 as any, // Uniform block of text
    });
  }

  static async processImage(imageFile: File): Promise<OCRResult> {
    await this.initializeOCR();
    
    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      // 画像を前処理
      const processedImage = await this.preprocessImage(imageFile);
      
      // OCR実行
      const { data } = await this.worker.recognize(processedImage);
      
      // OCR結果からナンプレグリッドを抽出
      const grid = this.extractSudokuGrid(data.text);
      
      return {
        grid,
        confidence: data.confidence
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error('画像の解析に失敗しました');
    }
  }

  private static async preprocessImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // キャンバスサイズを設定
        const maxSize = 800;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // グレースケール変換とコントラスト調整
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          // グレースケール変換
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          
          // コントラスト調整（二値化）
          const binary = gray > 128 ? 255 : 0;
          
          data[i] = binary;     // R
          data[i + 1] = binary; // G
          data[i + 2] = binary; // B
          // Alpha値はそのまま
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL());
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  private static extractSudokuGrid(ocrText: string): SudokuGrid {
    // OCRテキストから数字のみを抽出
    const numbers = ocrText.replace(/[^1-9]/g, '');
    
    // 9x9グリッドを作成
    const grid: SudokuGrid = Array(9).fill(null).map(() => Array(9).fill(null));
    
    // OCRで検出された数字をグリッドに配置
    // 簡単な実装：検出された数字を順番に配置
    let numIndex = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (numIndex < numbers.length) {
          const num = parseInt(numbers[numIndex]);
          if (num >= 1 && num <= 9) {
            grid[row][col] = num;
          }
          numIndex++;
        }
      }
    }
    
    return grid;
  }

  // より高度なグリッド検出（将来の改善用）
  // private static detectGridStructure(canvas: HTMLCanvasElement): { x: number; y: number; width: number; height: number }[] {
  //   // ここで画像解析を行い、9x9のセル位置を検出
  //   // 現在は簡易実装として空の配列を返す
  //   return [];
  // }

  static async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  // デモ用：手動でグリッドを作成する機能
  static createDemoGrid(): SudokuGrid {
    return [
      [5, 3, null, null, 7, null, null, null, null],
      [6, null, null, 1, 9, 5, null, null, null],
      [null, 9, 8, null, null, null, null, 6, null],
      [8, null, null, null, 6, null, null, null, 3],
      [4, null, null, 8, null, 3, null, null, 1],
      [7, null, null, null, 2, null, null, null, 6],
      [null, 6, null, null, null, null, 2, 8, null],
      [null, null, null, 4, 1, 9, null, null, 5],
      [null, null, null, null, 8, null, null, 7, 9]
    ];
  }
}