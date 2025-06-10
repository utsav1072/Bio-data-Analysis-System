import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Results from './Results'

const AnalyzeForm = () => {
  const [form, setForm] = useState({
    name: '',
    staffNo: '',
    education: '',
    designation: '',
    presentGrade: '',
    dateOfGrade: '',
    category: '',
    pwdStatus: '',
    dateOfBirth: '',
    division: '',
    employeeGroup: '',
    placeOfPosting: '',
    postingWeF: '',
    department: '',
  })

  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState('mistral')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [error, setError] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [pdfUrls, setPdfUrls] = useState([])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (['dateOfBirth', 'dateOfGrade', 'postingWeF'].includes(name)) {
      const [year, month, day] = value.split('-')
      if (year && month && day) {
        setForm(prev => ({ ...prev, [name]: `${day}.${month}.${year}` }))
        return
      }
    }
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setError('')
    const invalidFiles = files.filter(file =>
      file.type !== 'application/pdf' || file.size > 1024 * 1024
    )
    if (invalidFiles.length > 0) {
      setError('Please select only PDF files under 1MB')
      return
    }
    setSelectedFiles(prev => [...prev, ...files])
  }

  const handleRemoveFile = (idx) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const hasAtLeastOneField = Object.values(form).some(value => value !== '')
    const hasCustomPrompt = customPrompt.trim() !== ''
    if (!hasAtLeastOneField && !hasCustomPrompt) {
      setError('Please fill at least one field in the form or provide a custom prompt')
      setIsErrorDialogOpen(true)
      return
    }
    setIsDialogOpen(true)
  }

  const handleUpload = async () => {
    setIsUploading(true)
    const formDataObj = new FormData()
    const filteredData = Object.fromEntries(
      Object.entries(form).filter(([_, value]) => value !== '')
    )
    formDataObj.append('description', JSON.stringify(filteredData))
    if (customPrompt) formDataObj.append('extra_prompt', customPrompt)
    formDataObj.append('model_name', selectedModel)
    for (let i = 0; i < selectedFiles.length; i++) {
      formDataObj.append('files', selectedFiles[i])
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/process/', {
        method: 'POST',
        body: formDataObj,
      })
      const data = await response.json()
      if (data.matches && Array.isArray(data.matches)) {
        const urls = data.matches.map(match => match.url)
        setPdfUrls(urls)
        setShowResults(true)
        setIsDialogOpen(false)
      }
    } catch (err) {
      setError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Full Name' },
    { name: 'staffNo', label: 'Staff No.', type: 'text', placeholder: 'Staff Number' },
    { name: 'education', label: 'Education', type: 'text', placeholder: 'Education' },
    { name: 'designation', label: 'Designation', type: 'text', placeholder: 'Designation' },
    { name: 'presentGrade', label: 'Present Grade', type: 'text', placeholder: 'Present Grade' },
    { name: 'dateOfGrade', label: 'Date of Grade', type: 'date' },
    { name: 'category', label: 'Category', type: 'select', options: ['', 'GEN', 'SC', 'ST', 'OBC', 'EWS'] },
    { name: 'pwdStatus', label: 'PWD Status', type: 'select', options: ['', 'YES', 'NA'] },
    { name: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { name: 'division', label: 'Division', type: 'text', placeholder: 'Division' },
    { name: 'employeeGroup', label: 'Employee Group', type: 'text', placeholder: 'Employee Group' },
    { name: 'placeOfPosting', label: 'Place of Posting', type: 'text', placeholder: 'Place of Posting' },
    { name: 'postingWeF', label: 'Posting W.E.F.', type: 'date' },
    { name: 'department', label: 'Department', type: 'text', placeholder: 'Department' },
  ]

  if (showResults) {
    return <Results pdfUrls={pdfUrls} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Dialogs */}
      {isDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-black/60 z-50">
          <div className="backdrop-blur-lg bg-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-white/30">
            <h3 className="text-2xl font-bold text-white mb-4 text-center drop-shadow-lg">Upload PDF Documents</h3>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              className="block w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-pink-500 file:to-indigo-500 file:text-white hover:file:bg-indigo-600 bg-white/60 rounded-xl shadow-sm mb-4"
            />
            {error && <div className="text-red-600 bg-white/80 rounded p-2 mb-2">{error}</div>}
            <div className="mb-4 max-h-40 overflow-y-auto">
              <ul>
                {selectedFiles.map((file, idx) => (
                  <li key={idx} className="flex justify-between items-center text-white/90 bg-white/10 rounded p-2 mb-1">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-red-400 hover:text-red-600 ml-2 font-bold"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="px-6 py-2 rounded-xl bg-white/40 text-gray-800 font-semibold hover:bg-white/80 transition"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold shadow-xl hover:scale-105 transition-transform duration-200 flex items-center justify-center"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Analyze Documents'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isErrorDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-black/60 z-50">
          <div className="backdrop-blur-lg bg-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/30">
            <div className="text-2xl font-bold text-red-500 mb-4 text-center drop-shadow-lg">Error</div>
            <div className="text-white/90 mb-6">{error}</div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsErrorDialogOpen(false)}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold shadow-xl hover:scale-105 transition-transform duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-lg bg-white/20 rounded-3xl shadow-2xl p-10 w-full max-w-5xl border border-white/30"
      >
        <h2 className="text-3xl font-extrabold text-white mb-6 text-center drop-shadow-lg">
          Employee Bio-Data Analysis
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {fields.map(field => (
              <motion.div variants={itemVariants} key={field.name}>
                <label className="block text-white font-semibold mb-1 text-sm" htmlFor={field.name}>{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    className="w-full px-3 py-2 text-sm rounded-lg border border-white/30 bg-white/60 text-gray-800 shadow focus:ring-2 focus:ring-pink-400 focus:border-pink-500 transition"
                    name={field.name}
                    id={field.name}
                    value={form[field.name]}
                    onChange={handleSelectChange}
                  >
                    {field.options.map(opt =>
                      <option key={opt} value={opt}>{opt ? opt : `Select ${field.label}`}</option>
                    )}
                  </select>
                ) : field.type === 'date' ? (
                  <input
                    className="w-full px-3 py-2 text-sm rounded-lg border border-white/30 bg-white/60 text-gray-800 shadow focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition"
                    type="date"
                    name={field.name}
                    id={field.name}
                    value={
                      form[field.name]
                        ? form[field.name].split('.').reverse().join('-')
                        : ''
                    }
                    onChange={handleChange}
                  />
                ) : (
                  <input
                    className="w-full px-3 py-2 text-sm rounded-lg border border-white/30 bg-white/60 text-gray-800 placeholder-gray-500 shadow focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 transition"
                    type={field.type}
                    name={field.name}
                    id={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                  />
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Custom prompt */}
          <div>
            <label className="block text-white font-semibold mb-1 text-sm" htmlFor="customPrompt">
              Additional Search Criteria
            </label>
            <textarea
              id="customPrompt"
              name="customPrompt"
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="Specify any additional criteria or conditions for document analysis..."
              className="w-full min-h-[80px] px-3 py-2 text-sm rounded-lg border border-white/30 bg-white/60 text-gray-800 placeholder-gray-500 shadow focus:ring-2 focus:ring-pink-400 focus:border-pink-500 transition"
            />
          </div>

          {/* Model selection */}
          <div>
            <label className="block text-white font-semibold mb-1 text-sm" htmlFor="model">
              Analysis Model Selection
            </label>
            <select
              id="model"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-white/30 bg-white/60 text-gray-800 shadow focus:ring-2 focus:ring-pink-400 focus:border-pink-500 transition"
            >
              <option value="mistral">Mistral - High-speed analysis with balanced accuracy</option>
              <option value="phi4">Phi-4 - Comprehensive analysis with enhanced precision</option>
            </select>
          </div>

          {/* Submit button */}
          <div className="flex justify-center mt-6">
            <motion.button
              type="submit"
              className="w-full md:w-auto py-2 px-6 text-sm rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-bold shadow-xl hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-white/40"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Submit
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default AnalyzeForm
