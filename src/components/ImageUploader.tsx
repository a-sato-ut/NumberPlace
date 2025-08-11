import React, { useCallback } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isLoading: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isLoading }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isLoading 
            ? 'border-gray-300 bg-gray-50' 
            : 'border-primary-300 hover:border-primary-400 bg-primary-50 hover:bg-primary-100'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600">画像を解析中...</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-primary-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="mb-4">
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors inline-block"
              >
                ナンプレ画像を選択
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-sm text-gray-600">
              または画像をここにドラッグ&ドロップ
            </p>
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG, GIF 形式対応
            </p>
          </>
        )}
      </div>
    </div>
  );
};