import React, { useState, useEffect, useRef } from 'react';

const DocumentViewer = ({ documentData, highlights }) => {
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [highlightPositions, setHighlightPositions] = useState([]);
  const textRef = useRef(null);

  // Function to find text positions in the extracted text
  const findTextPositions = (text, highlights) => {
    const positions = [];
    
    console.log('Finding text positions for highlights:', highlights);
    console.log('Extracted text length:', text.length);
    
    highlights.forEach((highlight, index) => {
      let searchText = highlight.highlighted_text;
      let startIndex = text.indexOf(searchText);
      
      // If exact match not found, try normalized versions
      if (startIndex === -1) {
        // Try removing extra whitespace
        const normalizedSearch = searchText.replace(/\s+/g, ' ').trim();
        const normalizedText = text.replace(/\s+/g, ' ').trim();
        startIndex = normalizedText.indexOf(normalizedSearch);
        
        if (startIndex !== -1) {
          // Find the actual position in original text
          const beforeMatch = normalizedText.substring(0, startIndex);
          const actualStartIndex = text.indexOf(beforeMatch);
          startIndex = actualStartIndex;
        }
      }
      
      // If still not found, try case-insensitive search
      if (startIndex === -1) {
        startIndex = text.toLowerCase().indexOf(searchText.toLowerCase());
      }
      
      // If still not found, try partial matching (first 10 characters)
      if (startIndex === -1 && searchText.length > 10) {
        const partialSearch = searchText.substring(0, 10);
        startIndex = text.toLowerCase().indexOf(partialSearch.toLowerCase());
        if (startIndex !== -1) {
          // Adjust the end index to match the partial text
          searchText = text.substring(startIndex, startIndex + 10);
        }
      }
      
      if (startIndex !== -1) {
        positions.push({
          ...highlight,
          id: index,
          startIndex,
          endIndex: startIndex + searchText.length,
          category: highlight.category || 'general',
          matchedText: searchText
        });
        console.log(`Found highlight ${index}: "${searchText}" at position ${startIndex}`);
      } else {
        console.log(`Could not find highlight ${index}: "${searchText}"`);
      }
    });
    
    console.log('Total positions found:', positions.length);
    return positions.sort((a, b) => a.startIndex - b.startIndex);
  };

  useEffect(() => {
    if (documentData?.extractedText && highlights) {
      const positions = findTextPositions(documentData.extractedText, highlights);
      setHighlightPositions(positions);
    }
  }, [documentData, highlights]);

  const getCategoryColor = (category) => {
    const colors = {
      legal_terms: 'bg-red-200 border-red-400',
      dates: 'bg-blue-200 border-blue-400',
      names: 'bg-green-200 border-green-400',
      financial: 'bg-yellow-200 border-yellow-400',
      confidentiality: 'bg-purple-200 border-purple-400',
      termination: 'bg-orange-200 border-orange-400',
      signatures: 'bg-pink-200 border-pink-400',
      jurisdiction: 'bg-indigo-200 border-indigo-400',
      formatted_text: 'bg-gray-200 border-gray-400',
      general: 'bg-primary-200 border-primary-400'
    };
    return colors[category] || colors.general;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      legal_terms: '⚖️',
      dates: '📅',
      names: '👤',
      financial: '💰',
      confidentiality: '🔒',
      termination: '⚠️',
      signatures: '✍️',
      jurisdiction: '🏛️',
      formatted_text: '📝',
      general: '📄'
    };
    return icons[category] || icons.general;
  };

  const renderHighlightedText = () => {
    console.log('Rendering highlighted text...');
    console.log('Document data:', documentData);
    console.log('Highlights:', highlights);
    console.log('Highlight positions:', highlightPositions);
    
    if (!documentData?.extractedText || highlightPositions.length === 0) {
      console.log('No highlights to render, showing plain text');
      return (
        <div className="p-6 bg-white rounded-lg shadow">
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-sm">
            <strong>Debug Info:</strong> No highlights found. 
            {!documentData?.extractedText && ' No extracted text. '}
            {!highlights && ' No highlights data. '}
            {highlights && highlights.length === 0 && ' Highlights array is empty. '}
            {highlightPositions.length === 0 && ' No highlight positions calculated. '}
          </div>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
            {documentData?.extractedText}
          </pre>
        </div>
      );
    }

    const text = documentData.extractedText;
    const elements = [];
    let lastIndex = 0;

    highlightPositions.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {text.slice(lastIndex, highlight.startIndex)}
          </span>
        );
      }

      // Add highlighted text
      elements.push(
        <span
          key={`highlight-${index}`}
          className={`
            ${getCategoryColor(highlight.category)}
            px-1 py-0.5 rounded cursor-pointer transition-all hover:opacity-80
            ${selectedHighlight?.id === highlight.id ? 'ring-2 ring-primary-500' : ''}
          `}
          onClick={() => setSelectedHighlight(highlight)}
          title={`${getCategoryIcon(highlight.category)} ${highlight.reason}`}
        >
          {highlight.matchedText || highlight.highlighted_text}
        </span>
      );

      lastIndex = highlight.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Extracted Text with Highlights</h3>
          <div className="text-sm text-gray-600">
            {highlightPositions.length} highlights found
          </div>
        </div>
        
        <div className="relative">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
            {elements}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Document Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">File:</span>
            <p className="text-gray-900">{documentData?.fileName}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Text Length:</span>
            <p className="text-gray-900">{documentData?.extractedText?.length || 0} characters</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Highlights:</span>
            <p className="text-gray-900">{highlights?.length || 0} important sections</p>
          </div>
        </div>
      </div>

      {/* Highlighted Text */}
      {renderHighlightedText()}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Highlight Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {[
            { category: 'legal_terms', label: 'Legal Terms' },
            { category: 'dates', label: 'Dates & Deadlines' },
            { category: 'names', label: 'Names & Parties' },
            { category: 'financial', label: 'Financial Terms' },
            { category: 'confidentiality', label: 'Confidentiality' },
            { category: 'termination', label: 'Termination' },
            { category: 'signatures', label: 'Signatures' },
            { category: 'jurisdiction', label: 'Jurisdiction' },
            { category: 'formatted_text', label: 'Formatted Text' }
          ].map(({ category, label }) => (
            <div key={category} className="flex items-center space-x-2">
              <span className={`w-4 h-4 rounded ${getCategoryColor(category)}`}></span>
              <span className="text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
