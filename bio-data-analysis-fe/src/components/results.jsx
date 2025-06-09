import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, FileText, Loader2, CheckCircle2, ArrowLeft, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

// PDF Preview Modal
const PDFPreviewModal = ({ fileUrl, onClose, prevDoc, nextDoc, docIndex, totalDocs }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30">
    <div className="backdrop-blur-lg bg-white/20 rounded-3xl shadow-2xl p-6 w-full max-w-5xl border border-white/30 flex flex-col relative h-[95vh]">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl hover:bg-white/30 p-2 rounded-full transition-colors duration-200"
        aria-label="Close"
      >
        &times;
      </button>
      <div className="mb-4 text-lg font-semibold flex items-center gap-4 bg-white/30 p-3 rounded-lg">
        <button
          onClick={prevDoc}
          disabled={docIndex <= 0}
          className="p-2 bg-white/60 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:hover:shadow-none"
          aria-label="Previous Document"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white">
          Previewing Document {docIndex + 1} of {totalDocs}
        </span>
        <button
          onClick={nextDoc}
          disabled={docIndex >= totalDocs - 1}
          className="p-2 bg-white/60 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:hover:shadow-none"
          aria-label="Next Document"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 relative bg-gradient-to-b from-white/40 to-white/10 rounded-xl p-4 shadow-inner min-h-0">
        <iframe
          src={fileUrl}
          width="100%"
          height="100%"
          title="PDF Preview"
          className="rounded-lg shadow-xl border border-white/30 bg-white/60"
        />
      </div>
      <div className="mt-4 flex justify-end">
        <a
          href={fileUrl}
          download
          className="px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-xl hover:scale-105 shadow-xl transition-transform duration-200 font-medium flex items-center gap-2"
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
  const [showConfirm, setShowConfirm] = useState(false);

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

  // Confirm dialog handler
  const handleGoBack = () => {
    window.location.reload();
  };

  if (!pdfUrls || pdfUrls.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-lg bg-white/20 rounded-3xl shadow-2xl p-10 w-full max-w-5xl border border-white/30 flex flex-col items-center"
        >
          <motion.button
            onClick={() => setShowConfirm(true)}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mb-6 flex items-center px-6 py-3 text-white font-bold rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-xl hover:scale-105 transition-transform duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </motion.button>
          <FileText className="w-16 h-16 mx-auto mb-4 text-white/70" />
          <p className="text-white/80 text-lg text-center">
            No matching documents found.
          </p>
        </motion.div>
        {/* Confirm Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full flex flex-col items-center border border-pink-200">
              <div className="text-2xl font-bold text-pink-600 mb-2">Are you sure?</div>
              <div className="text-gray-700 text-center mb-6">
                Are you sure you want to go back? <br />
                <span className="font-semibold text-red-500">All the matched documents will be lost.</span>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGoBack}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold shadow hover:scale-105 transition"
                >
                  Yes, Go Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full flex flex-col items-center border border-pink-200">
            <div className="text-2xl font-bold text-pink-600 mb-2">Are you sure?</div>
            <div className="text-gray-700 text-center mb-6">
              Are you sure you want to go back? <br />
              <span className="font-semibold text-red-500">All the matched documents will be lost.</span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleGoBack}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold shadow hover:scale-105 transition"
              >
                Yes, Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative backdrop-blur-lg bg-white/20 rounded-3xl shadow-2xl p-10 w-full max-w-5xl border border-white/30 flex flex-col"
        style={{ minHeight: '70vh', maxHeight: '90vh' }}
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
          onClick={() => setShowConfirm(true)}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mb-6 flex items-center px-6 py-3 text-white font-bold rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-xl hover:scale-105 transition-transform duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </motion.button>

        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="text-3xl font-extrabold text-center mb-8 text-white drop-shadow-lg"
        >
          Matching Employee Documents
        </motion.h1>
        {/* Scrollable Document List */}
        <motion.ul
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 overflow-y-auto space-y-4 pb-32"
          style={{ minHeight: 0, maxHeight: '50vh' }}
        >
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
                className="flex items-center justify-between p-4 bg-white/60 rounded-xl shadow-md border border-white/30 hover:shadow-xl"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="text-gray-800 font-medium">{filename}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewIndex(index)}
                    className="inline-flex items-center px-4 py-2 text-sm font-bold text-purple-700 rounded-xl bg-white/80 hover:bg-purple-100 shadow transition"
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
                    className="inline-flex items-center px-4 py-2 text-sm font-bold text-indigo-700 rounded-xl bg-white/80 hover:bg-indigo-100 shadow transition"
                  >
                    {isDownloaded ? (
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {isDownloaded ? 'Retrieved' : 'Retrieve Document'}
                  </motion.a>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>

        {/* Sticky Download All Documents Button */}
        <div className="absolute bottom-0 left-0 w-full px-4 pb-4 pointer-events-none">
          <div className="max-w-5xl mx-auto pointer-events-auto">
            <div className="backdrop-blur-lg bg-white/80 border-t border-white/30 rounded-b-3xl shadow-xl p-4">
              <motion.button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white py-3 rounded-xl hover:scale-105 shadow-xl font-bold transition-transform duration-200"
              >
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
        </div>
      </motion.div>
    </div>
  );
};

export default Results;
