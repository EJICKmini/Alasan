import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const DocumentUpload = ({ onDocumentProcessed, onProcessingStart, onError, isProcessing }) => {
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    onProcessingStart();

    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onDocumentProcessed(response.data);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to process document';
      onError(errorMessage);
    }
  }, [onDocumentProcessed, onProcessingStart, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: false,
    disabled: isProcessing
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Your Document
        </h2>
        <p className="text-lg text-gray-600">
          Upload a PDF or image file to extract text and get AI-powered analysis
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Processing Document</h3>
              <p className="text-gray-600">Extracting text and analyzing with AI...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
              </h3>
              <p className="text-gray-600">or click to browse</p>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Supported formats: PDF, PNG, JPG, JPEG</p>
              <p>Maximum file size: 10MB</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• OCR extracts text from your document</li>
          <li>• AI analyzes the content for important sections</li>
          <li>• Highlights legal terms, dates, financial info, and more</li>
          <li>• Provides explanations for each highlighted section</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentUpload;
