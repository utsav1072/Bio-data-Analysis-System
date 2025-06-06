import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, FileText, Loader2 } from 'lucide-react';

const Results = ({ pdfUrls }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    const zip = new JSZip();
    let filesAdded = 0;

    await Promise.all(
      pdfUrls.map(async (url, index) => {
        try {
          const response = await fetch(url, { mode: 'cors' });
          if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.statusText}`);
            return;
          }
          const blob = await response.blob();
          // Ensure unique filenames
          const filename = url.split('/').pop() || `file_${index + 1}.pdf`;
          zip.file(filename, blob);
          filesAdded++;
        } catch (error) {
          console.error(`Error fetching ${url}:`, error);
        }
      })
    );

    if (filesAdded === 0) {
      alert('No files could be fetched. Please check the URLs or CORS settings.');
      setIsDownloading(false);
      return;
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'all_documents.zip');
    setIsDownloading(false);
  };

  if (!pdfUrls || pdfUrls.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 animate-fade-in">
        <div className="text-center p-8 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <p className="text-gray-500 dark:text-gray-400">No PDFs available to download.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-center mb-8 animate-slide-down text-gray-900 dark:text-gray-100">
        Download Generated Documents
      </h1>
      <div className="max-w-2xl mx-auto">
        <ul className="space-y-4">
          {pdfUrls.map((url, index) => {
            const filename = url.split('/').pop();
            return (
              <li 
                key={index} 
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md dark:hover:shadow-gray-700/50 animate-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-200 font-medium">{filename}</span>
                </div>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </a>
              </li>
            );
          })}
        </ul>
        <button
          onClick={handleDownloadAll}
          disabled={isDownloading}
          className="mt-8 w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-blue-500/25 animate-slide-up font-medium"
        >
          {isDownloading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
              Downloading...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Download className="w-5 h-5 mr-2" />
              Download All as ZIP
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Results;
