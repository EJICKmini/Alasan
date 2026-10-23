import React, { useState } from 'react';

const AnalysisSidebar = ({ analysis, extractedText }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Debug logging
  console.log('AnalysisSidebar received analysis:', analysis);
  console.log('Analysis type:', typeof analysis);
  console.log('Analysis length:', analysis?.length);

  const categories = [
    { key: 'all', label: 'All Highlights', icon: '📄' },
    { key: 'legal_terms', label: 'Legal Terms', icon: '⚖️' },
    { key: 'dates', label: 'Dates & Deadlines', icon: '📅' },
    { key: 'names', label: 'Names & Parties', icon: '👤' },
    { key: 'financial', label: 'Financial Terms', icon: '💰' },
    { key: 'confidentiality', label: 'Confidentiality', icon: '🔒' },
    { key: 'termination', label: 'Termination', icon: '⚠️' },
    { key: 'signatures', label: 'Signatures', icon: '✍️' },
    { key: 'jurisdiction', label: 'Jurisdiction', icon: '🏛️' },
    { key: 'formatted_text', label: 'Formatted Text', icon: '📝' }
  ];

  const filteredAnalysis = analysis?.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      item.highlighted_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  const getCategoryColor = (category) => {
    const colors = {
      legal_terms: 'bg-red-50 border-red-200 text-red-800',
      dates: 'bg-blue-50 border-blue-200 text-blue-800',
      names: 'bg-green-50 border-green-200 text-green-800',
      financial: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      confidentiality: 'bg-purple-50 border-purple-200 text-purple-800',
      termination: 'bg-orange-50 border-orange-200 text-orange-800',
      signatures: 'bg-pink-50 border-pink-200 text-pink-800',
      jurisdiction: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      formatted_text: 'bg-gray-50 border-gray-200 text-gray-800',
      general: 'bg-primary-50 border-primary-200 text-primary-800'
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Analysis</h2>
        
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search highlights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.key} value={category.key}>
                {category.icon} {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600">
          {filteredAnalysis.length} of {analysis?.length || 0} highlights
        </div>
      </div>

      {/* Highlights List */}
      <div className="space-y-4">
        {filteredAnalysis.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-gray-400 text-4xl mb-2">🔍</div>
            <p className="text-gray-600">No highlights found</p>
            {searchTerm && (
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your search or category filter
              </p>
            )}
          </div>
        ) : (
          filteredAnalysis.map((item, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow p-4 border-l-4 ${getCategoryColor(item.category)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(item.category)}</span>
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {item.category.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(item.highlighted_text)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy text"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              <div className="mb-3">
                <div className="bg-gray-100 rounded p-2 text-sm font-mono">
                  "{item.highlighted_text}"
                </div>
              </div>

              <div className="text-sm text-gray-700">
                <strong>Analysis:</strong> {item.reason}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {analysis && analysis.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          
          <div className="space-y-3">
            {categories.slice(1).map(category => {
              const count = analysis.filter(item => item.category === category.key).length;
              if (count === 0) return null;
              
              return (
                <div key={category.key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>{category.icon}</span>
                    <span className="text-sm text-gray-700">{category.label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Highlights</span>
              <span className="text-sm font-bold text-primary-600">{analysis.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Debug Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <details>
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            Debug: Raw Analysis Data
          </summary>
          <div className="mt-3 p-3 bg-gray-50 rounded border max-h-64 overflow-y-auto">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
              {JSON.stringify(analysis, null, 2)}
            </pre>
          </div>
        </details>
      </div>

      {/* Raw Text Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <details>
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            View Raw Extracted Text
          </summary>
          <div className="mt-3 p-3 bg-gray-50 rounded border max-h-64 overflow-y-auto">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
              {extractedText}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
};

export default AnalysisSidebar;
