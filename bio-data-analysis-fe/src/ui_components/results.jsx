import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, FileText, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Results = ({ pdfUrls }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState(new Set());

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

  const handleSingleDownload = (url, index) => {
    setDownloadedFiles(prev => new Set([...prev, index]));
    // Reset the downloaded state after 2 seconds
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
            No PDFs available to download.
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
        Download Shorlisted Bio-data
      </motion.h1>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl mx-auto"
      >
        <AnimatePresence>
          <motion.ul className="space-y-4">
            {pdfUrls.map((url, index) => {
              const filename = url.split('/').pop();
              const isDownloaded = downloadedFiles.has(index);
              
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
                  <motion.a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => handleSingleDownload(url, index)}
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
                        Downloaded
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 1 }}
                        animate={{ scale: 1 }}
                        className="flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </motion.div>
                    )}
                  </motion.a>
                </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <motion.button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 shadow-lg dark:shadow-blue-500/25 font-medium relative overflow-hidden"
          >
            <motion.div
              initial={false}
              animate={isDownloading ? { opacity: 1 } : { opacity: 0 }}
              className="absolute inset-0 bg-blue-700 dark:bg-blue-600"
              style={{ originX: 0 }}
            />
            <span className="relative flex items-center justify-center">
              {isDownloading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download All as ZIP
                </>
              )}
            </span>
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Results;
