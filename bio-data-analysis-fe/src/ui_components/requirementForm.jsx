import React, { useState } from 'react';
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
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');
  const [pdfUrls, setPdfUrls] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

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

    setSelectedFiles(files);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
            Employee Bio Data Form
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Staff No. Field */}
              <div className="space-y-2">
                <Label htmlFor="staffNo" className="text-gray-700 dark:text-gray-300">Staff No.</Label>
                <Input
                  id="staffNo"
                  name="staffNo"
                  value={formData.staffNo}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Designation Field */}
              <div className="space-y-2">
                <Label htmlFor="designation" className="text-gray-700 dark:text-gray-300">Designation</Label>
                <Input
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Present Grade Field */}
              <div className="space-y-2">
                <Label htmlFor="presentGrade" className="text-gray-700 dark:text-gray-300">Present Grade</Label>
                <Input
                  id="presentGrade"
                  name="presentGrade"
                  value={formData.presentGrade}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Date of Grade Field */}
              <div className="space-y-2">
                <Label htmlFor="dateOfGrade" className="text-gray-700 dark:text-gray-300">Date of Grade</Label>
                <Input
                  id="dateOfGrade"
                  name="dateOfGrade"
                  type="date"
                  value={formData.dateOfGrade ? formData.dateOfGrade.split('.').reverse().join('-') : ''}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Category Field */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-700 dark:text-gray-300">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
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
              </div>

              {/* PWD Status Field */}
              <div className="space-y-2">
                <Label htmlFor="pwdStatus" className="text-gray-700 dark:text-gray-300">PWD Status</Label>
                <Select
                  value={formData.pwdStatus}
                  onValueChange={(value) => handleSelectChange('pwdStatus', value)}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select PWD status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">YES</SelectItem>
                    <SelectItem value="na">NA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Birth Field */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-gray-700 dark:text-gray-300">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth ? formData.dateOfBirth.split('.').reverse().join('-') : ''}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Division Field */}
              <div className="space-y-2">
                <Label htmlFor="division" className="text-gray-700 dark:text-gray-300">Division</Label>
                <Input
                  id="division"
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Employee Group Field */}
              <div className="space-y-2">
                <Label htmlFor="employeeGroup" className="text-gray-700 dark:text-gray-300">Employee Group</Label>
                <Input
                  id="employeeGroup"
                  name="employeeGroup"
                  value={formData.employeeGroup}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Place of Posting Field */}
              <div className="space-y-2">
                <Label htmlFor="placeOfPosting" className="text-gray-700 dark:text-gray-300">Place of Posting</Label>
                <Input
                  id="placeOfPosting"
                  name="placeOfPosting"
                  value={formData.placeOfPosting}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Posting w.e.f. Field */}
              <div className="space-y-2">
                <Label htmlFor="postingWeF" className="text-gray-700 dark:text-gray-300">Posting w.e.f.</Label>
                <Input
                  id="postingWeF"
                  name="postingWeF"
                  type="date"
                  value={formData.postingWeF ? formData.postingWeF.split('.').reverse().join('-') : ''}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              {/* Qualification Level Field */}
              <div className="space-y-2">
                <Label htmlFor="qualificationLevel" className="text-gray-700 dark:text-gray-300">Qualification Level</Label>
                <Select
                  value={formData.qualificationLevel}
                  onValueChange={(value) => handleSelectChange('qualificationLevel', value)}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select qualification level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_school">High School</SelectItem>
                    <SelectItem value="diploma">Diploma</SelectItem>
                    <SelectItem value="graduation">Graduation</SelectItem>
                    <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                    <SelectItem value="masters">Master's Degree</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              
              {/* Department Field */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-gray-700 dark:text-gray-300">Department</Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              
            </div>
            {/* Custom Prompt Field */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="customPrompt" className="text-gray-700 dark:text-gray-300">Custom Prompt</Label>
              <textarea
                id="customPrompt"
                name="customPrompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter any additional criteria or conditions to check in the documents..."
                className="w-full min-h-[100px] p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-center pt-6">
              <Button 
                type="submit" 
                className="w-full md:w-auto bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-blue-500/25"
              >
                Submit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* File Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Upload Supporting Documents</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Please upload your PDF documents (max 1MB each)
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="files" className="text-gray-700 dark:text-gray-300">Select PDF Files</Label>
              <Input
                id="files"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
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
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Selected files:</p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  {selectedFiles.map((file, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
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
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequirementForm;
