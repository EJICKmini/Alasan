import React, { useState } from 'react';
import DocumentUpload from './components/DocumentUpload';
import DocumentViewer from './components/DocumentViewer';
import AnalysisSidebar from './components/AnalysisSidebar';
import Header from './components/Header';

function App() {
  const [documentData, setDocumentData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleDocumentProcessed = (data) => {
    setDocumentData(data);
    setIsProcessing(false);
    setError(null);
  };

  const handleProcessingStart = () => {
    setIsProcessing(true);
    setError(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setIsProcessing(false);
  };

  const resetApp = () => {
    setDocumentData(null);
    setIsProcessing(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onReset={resetApp} />
      
      <main className="container mx-auto px-4 py-8">
        {!documentData ? (
          <div className="max-w-4xl mx-auto">
            <DocumentUpload 
              onDocumentProcessed={handleDocumentProcessed}
              onProcessingStart={handleProcessingStart}
              onError={handleError}
              isProcessing={isProcessing}
            />
            {error && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DocumentViewer 
                documentData={documentData}
                highlights={documentData.analysis}
              />
            </div>
            <div className="lg:col-span-1">
              <AnalysisSidebar 
                analysis={documentData.analysis}
                extractedText={documentData.extractedText}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
