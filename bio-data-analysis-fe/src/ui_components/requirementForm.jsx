import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileText, Loader2 } from "lucide-react";
import Results from './results';

const RequirementForm = () => {
  const [formData, setFormData] = useState({
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
    qualificationSubject: '',
    qualificationYear: '',
    qualificationDuration: '',
    qualificationInstitute: '',
    qualificationLevel: '',
    experienceBeforeJoining: '',
    experienceInCompany: '',
    positionInOtherOrg: '',
    department: '',
    location: '',
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');
  const [pdfUrls, setPdfUrls] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('mistral');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['dateOfBirth', 'dateOfGrade', 'postingWeF'].includes(name)) {
      const [year, month, day] = value.split('-');
      if (year && month && day) {
        setFormData((prev) => ({
          ...prev,
          [name]: `${day}.${month}.${year}`,
        }));
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setError('');
    
    // Check file types and sizes
    const invalidFiles = files.filter(file => {
      return file.type !== 'application/pdf' || file.size > 1024 * 1024; 
    });

    if (invalidFiles.length > 0) {
      setError('Please select only PDF files under 1MB');
      return;
    }

    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  };

  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if at least one field is filled or custom prompt exists
    const hasAtLeastOneField = Object.values(formData).some(value => value !== '');
    const hasCustomPrompt = customPrompt.trim() !== '';
    
    if (!hasAtLeastOneField && !hasCustomPrompt) {
      setError('Please fill at least one field in the form or provide a custom prompt');
      setIsErrorDialogOpen(true);
      return;
    }
    
    setIsDialogOpen(true);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    const formDataObj = new FormData();
  
    // Filter out empty values from formData
    const filteredData = Object.fromEntries(
      Object.entries(formData).filter(([key, value]) => value !== '')
    );
  
    // Append the filtered description as JSON
    formDataObj.append('description', JSON.stringify(filteredData));
    
    // Append custom prompt if it exists
    if (customPrompt) {
      formDataObj.append('extra_prompt', customPrompt);
    }

    // Append selected model
    formDataObj.append('model_name', selectedModel);
  
    // Append each selected file
    for (let i = 0; i < selectedFiles.length; i++) {
      formDataObj.append('files', selectedFiles[i]);
    }
  
    try {
      const response = await fetch('http://127.0.0.1:8000/api/process/', {
        method: 'POST',
        body: formDataObj,
      });
      const data = await response.json();
      console.log('Backend response:', data);
      
      // Handle the matches array from the response
      if (data.matches && Array.isArray(data.matches)) {
        const urls = data.matches.map(match => match.url);
        setPdfUrls(urls);
        setShowResults(true);
        setIsDialogOpen(false);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (showResults) {
    return <Results pdfUrls={pdfUrls} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 px-4 relative overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating circles */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl animate-float-delayed"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Accent lines */}
        <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-blue-500/0 via-blue-500/50 to-blue-500/0"></div>
        <div className="absolute bottom-0 right-1/4 w-px h-32 bg-gradient-to-t from-purple-500/0 via-purple-500/50 to-purple-500/0"></div>
      </div>

      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <Card className="max-w-6xl mx-auto bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-slate-900/50 relative">
          {/* Card accent elements */}
          <div className="absolute -top-1 -left-1 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-tl-lg"></div>
          <div className="absolute -bottom-1 -right-1 w-20 h-20 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-br-lg"></div>
          
          <CardHeader className="border-b border-gray-200 dark:border-slate-700 px-8 py-6 relative">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <CardTitle className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 tracking-tight">
                Employee Bio-Data Analysis
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent className="pt-8 px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Name Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 dark:text-slate-300">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  />
                </motion.div>

                {/* Staff No. Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="staffNo" className="text-gray-700 dark:text-slate-300">Staff No.</Label>
                  <Input
                    id="staffNo"
                    name="staffNo"
                    value={formData.staffNo}
                    onChange={handleChange}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  />
                </motion.div>

                {/* Designation Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="designation" className="text-gray-700 dark:text-slate-300">Designation</Label>
                  <Input
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  />
                </motion.div>

                {/* Present Grade Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="presentGrade" className="text-gray-700 dark:text-slate-300">Present Grade</Label>
                  <Input
                    id="presentGrade"
                    name="presentGrade"
                    value={formData.presentGrade}
                    onChange={handleChange}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  />
                </motion.div>

                {/* Date of Grade Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="dateOfGrade" className="text-gray-700 dark:text-slate-300">Date of Grade</Label>
                  <Input
                    id="dateOfGrade"
                    name="dateOfGrade"
                    type="date"
                    value={formData.dateOfGrade ? formData.dateOfGrade.split('.').reverse().join('-') : ''}
                    onChange={handleChange}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  />
                </motion.div>

                {/* Category Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="category" className="text-gray-700 dark:text-slate-300">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gen">GEN</SelectItem>
                      <SelectItem value="sc">SC</SelectItem>
                      <SelectItem value="st">ST</SelectItem>
                      <SelectItem value="obc">OBC</SelectItem>
                      <SelectItem value="ews">EWS</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* PWD Status Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="pwdStatus" className="text-gray-700 dark:text-slate-300">PWD Status</Label>
                  <Select
                    value={formData.pwdStatus}
                    onValueChange={(value) => handleSelectChange('pwdStatus', value)}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select PWD status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">YES</SelectItem>
                      <SelectItem value="na">NA</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* Date of Birth Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-gray-700 dark:text-slate-300">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth ? formData.dateOfBirth.split('.').reverse().join('-') : ''}
                    onChange={handleChange}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  />
                </motion.div>

                {/* Division Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="division" className="text-gray-700 dark:text-slate-300">Division</Label>
                  <Input
                    id="division"
                    name="division"
                    value={formData.division}
                    onChange={handleChange}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  />
                </motion.div>

                {/* Employee Group Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="employeeGroup" className="text-gray-700 dark:text-slate-300">Employee Group</Label>
                  <Input
                    id="employeeGroup"
                    name="employeeGroup"
                    value={formData.employeeGroup}
                    onChange={handleChange}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  />
                </motion.div>

                {/* Place of Posting Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="placeOfPosting" className="text-gray-700 dark:text-slate-300">Place of Posting</Label>
                  <Input
                    id="placeOfPosting"
                    name="placeOfPosting"
                    value={formData.placeOfPosting}
                    onChange={handleChange}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  />
                </motion.div>

                {/* Posting w.e.f. Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="postingWeF" className="text-gray-700 dark:text-slate-300">Posting w.e.f.</Label>
                  <Input
                    id="postingWeF"
                    name="postingWeF"
                    type="date"
                    value={formData.postingWeF ? formData.postingWeF.split('.').reverse().join('-') : ''}
                    onChange={handleChange}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  />
                </motion.div>

                {/* Qualification Level Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="qualificationLevel" className="text-gray-700 dark:text-slate-300">Qualification Level</Label>
                  <Select
                    value={formData.qualificationLevel}
                    onValueChange={(value) => handleSelectChange('qualificationLevel', value)}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select qualification level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="graduate">Graduation</SelectItem>
                      <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                      <SelectItem value="masters">Master's Degree</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>

                {/* Department Field */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="department" className="text-gray-700 dark:text-slate-300">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                  />
                </motion.div>
              </motion.div>

              {/* Custom Prompt Field */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2 col-span-2"
              >
                <Label htmlFor="customPrompt" className="text-gray-700 dark:text-slate-300">Additional Search Criteria</Label>
                <textarea
                  id="customPrompt"
                  name="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Specify any additional criteria or conditions for document analysis..."
                  className="w-full min-h-[100px] p-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
                />
              </motion.div>

              {/* Model Selection Field */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-2 col-span-2"
              >
                <Label htmlFor="model" className="text-gray-700 dark:text-slate-300">Analysis Model Selection</Label>
                <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select analysis model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mistral">Mistral - High-speed analysis with balanced accuracy</SelectItem>
                    <SelectItem value="phi4">Phi-4 - Comprehensive analysis with enhanced precision</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex justify-center mt-8"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-2 rounded-lg transition-colors duration-200 shadow-lg dark:shadow-blue-500/25"
                  >
                    Submit
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* File Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-slate-100">Document Upload</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-slate-400">
              Please upload the relevant PDF documents for analysis.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="files" className="text-gray-700 dark:text-slate-300">Select Documents</Label>
              <Input
                id="files"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-slate-100"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-600 dark:text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Selected documents:</p>
                <ul className="text-sm text-gray-500 dark:text-slate-400 space-y-1">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Analyze Documents'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-slate-100">Error</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-slate-400">
              {error}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button 
              onClick={() => setIsErrorDialogOpen(false)}
              className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite;
          animation-delay: -3s;
        }
      `}</style>
    </motion.div>
  );
};

export default RequirementForm;
