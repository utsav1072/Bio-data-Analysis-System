import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, FileText, Loader2, CheckCircle2, ArrowLeft, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// PDF Preview Modal using iframe (no react-pdf)
const PDFPreviewModal = ({ fileUrl, onClose, prevDoc, nextDoc, docIndex, totalDocs }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-[95vw] w-full h-[95vh] shadow-2xl relative flex flex-col">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-2xl hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors duration-200"
        aria-label="Close"
      >
        &times;
      </button>
      <div className="mb-4 text-lg font-semibold flex items-center gap-4 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
        <button
          onClick={prevDoc}
          disabled={docIndex <= 0}
          className="p-2 bg-white dark:bg-slate-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:hover:shadow-none"
          aria-label="Previous Document"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span>
          Previewing Document {docIndex + 1} of {totalDocs}
        </span>
        <button
          onClick={nextDoc}
          disabled={docIndex >= totalDocs - 1}
          className="p-2 bg-white dark:bg-slate-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:hover:shadow-none"
          aria-label="Next Document"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 relative bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-700/30 dark:to-slate-800/30 rounded-xl p-4 shadow-inner min-h-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-200/50 dark:to-slate-700/50 pointer-events-none rounded-xl" />
        <iframe
          src={fileUrl}
          width="100%"
          height="100%"
          title="PDF Preview"
          className="rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
          style={{
            boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.05)'
          }}
        />
      </div>
      <div className="mt-4 flex justify-end">
        <a
          href={fileUrl}
          download
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-medium"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </a>
      </div>
    </div>
  </div>
);

const Results = ({ pdfUrls }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState(new Set());
  const [previewIndex, setPreviewIndex] = useState(null);

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    const zip = new JSZip();
    let filesAdded = 0;

    await Promise.all(
      pdfUrls.map(async (url, index) => {
        try {
          const response = await fetch(url + '?download=true', { mode: 'cors' });
          if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.statusText}`);
            return;
          }
          const blob = await response.blob();
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

  // Only marks as downloaded, does not change navigation
  const handleDownloadedMark = (index) => {
    setDownloadedFiles(prev => new Set([...prev, index]));
    setTimeout(() => {
      setDownloadedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }, 2000);
  };

  if (!pdfUrls || pdfUrls.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-8 px-4"
      >
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="text-center p-8 rounded-lg bg-white dark:bg-slate-800/50 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <motion.button
            onClick={() => window.location.reload()}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mb-6 inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </motion.button>
          <motion.div
            initial={{ rotate: -10, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 dark:text-slate-400 text-lg"
          >
            No matching documents found.
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 px-4"
    >
      {previewIndex !== null && (
        <PDFPreviewModal
          fileUrl={pdfUrls[previewIndex]}
          onClose={() => setPreviewIndex(null)}
          prevDoc={() => setPreviewIndex(idx => Math.max(idx - 1, 0))}
          nextDoc={() => setPreviewIndex(idx => Math.min(idx + 1, pdfUrls.length - 1))}
          docIndex={previewIndex}
          totalDocs={pdfUrls.length}
        />
      )}

      <motion.button
        onClick={() => window.location.reload()}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mb-6 inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Go Back
      </motion.button>
      <motion.h1 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="text-3xl font-bold text-center mb-8 text-slate-900 dark:text-slate-100"
      >
        Matching Employee Documents
      </motion.h1>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl mx-auto relative min-h-[calc(100vh-4rem)]"
      >
        <AnimatePresence>
          <motion.ul className="space-y-4 pb-24">
            {pdfUrls.map((url, index) => {
              const filename = url.split('/').pop();
              const isDownloaded = downloadedFiles.has(index);
              const downloadUrl = url + '?download=true';
              
              return (
                <motion.li 
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md dark:hover:shadow-slate-700/50"
                >
                  <div className="flex items-center space-x-3">
                    <motion.div
                      whileHover={{ rotate: 10 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    </motion.div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{filename}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewIndex(index)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/30"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </button>
                    <motion.a 
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleDownloadedMark(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      {isDownloaded ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                          Retrieved
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ scale: 1 }}
                          animate={{ scale: 1 }}
                          className="flex items-center"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Retrieve Document
                        </motion.div>
                      )}
                    </motion.a>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="fixed bottom-0 left-0 right-0 w-full"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700" />
            <div className="max-w-2xl mx-auto px-4 py-4">
              <motion.button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full bg-blue-600/90 dark:bg-blue-500/90 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 shadow-lg dark:shadow-blue-500/25 font-medium overflow-hidden backdrop-blur-sm"
              >
                <motion.div
                  initial={false}
                  animate={isDownloading ? { opacity: 1 } : { opacity: 0 }}
                  className="absolute inset-0 bg-blue-700/90 dark:bg-blue-600/90"
                  style={{ originX: 0 }}
                />
                <span className="relative flex items-center justify-center">
                  {isDownloading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Processing Documents...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Download All Documents
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Results;
