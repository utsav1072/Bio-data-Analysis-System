import os
import threading
import json
import fitz  # PyMuPDF
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse, Http404
from concurrent.futures import ThreadPoolExecutor, as_completed
import re
import logging
from django.views.decorators.clickjacking import xframe_options_exempt

# LangChain imports
from langchain_community.document_loaders import PyPDFLoader, UnstructuredPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaLLM
from langchain.globals import set_verbose

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set verbose mode for langchain
set_verbose(False)

def extract_text_pymupdf(file_path):
    """
    Enhanced PDF text extraction using PyMuPDF (fitz)
    Better for complex layouts and preserves formatting
    """
    try:
        doc = fitz.open(file_path)
        text_content = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Extract text with layout preservation
            text = page.get_text("text")
            
            # Alternative: Extract text blocks for better structure
            blocks = page.get_text("blocks")
            structured_text = []
            
            for block in blocks:
                if len(block) >= 5 and block[4].strip():  # Check if block contains text
                    structured_text.append(block[4].strip())
            
            # Use structured text if available, otherwise fall back to simple text
            page_text = "\n".join(structured_text) if structured_text else text
            
            if page_text.strip():
                text_content.append(f"--- Page {page_num + 1} ---\n{page_text}")
        
        doc.close()
        return "\n\n".join(text_content)
        
    except Exception as e:
        logger.error(f"PyMuPDF extraction failed: {e}")
        return None

def extract_text_langchain(file_path):
    """
    Fallback extraction using LangChain loaders
    """
    try:
        # Try PyPDFLoader first
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        if documents:
            content = "\n".join([doc.page_content for doc in documents])
            if len(content.strip()) > 100:  # Ensure meaningful content
                return content
        
        # Fallback to UnstructuredPDFLoader for complex layouts
        loader = UnstructuredPDFLoader(file_path)
        documents = loader.load()
        
        if documents:
            return "\n".join([doc.page_content for doc in documents])
            
    except Exception as e:
        logger.error(f"LangChain extraction failed: {e}")
        
    return None

def clean_extracted_text(text):
    """
    Enhanced cleaning specifically for BHEL biodata documents
    Preserves staff numbers and other important numeric data
    """
    if not text:
        return ""

    # Remove page markers but preserve structure
    text = re.sub(r'--- Page \d+ ---', '\n', text)
    
    # Normalize BHEL-specific section headers
    text = re.sub(r'([A-Z][a-z]+ Particulars:)', r'\n\1\n', text)
    text = re.sub(r'(Qualification:|Experience [^:]+:)', r'\n\1\n', text)
    text = re.sub(r'(Experience in BHEL [^:]+:)', r'\n\1\n', text)
    
    # Clean up spacing around colons (important for key-value extraction)
    text = re.sub(r'\s*:\s*', ': ', text)
    
    # Normalize date formats for better LLM understanding
    text = re.sub(r'(\d{2})\.(\d{2})\.(\d{4})', r'\1.\2.\3', text)
    
    # Remove excessive whitespace and normalize line breaks
    text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Remove common PDF artifacts - BUT PRESERVE STAFF NUMBERS
    text = re.sub(r'Page \d+ of \d+', '', text)
    # REMOVED: text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)  # This was removing staff numbers!
    
    # More specific page number removal - only remove isolated single/double digits at line start
    text = re.sub(r'^\s*[1-9]\s*$', '', text, flags=re.MULTILINE)  # Only remove 1-9 (typical page numbers)
    text = re.sub(r'^\s*[1-2][0-9]\s*$', '', text, flags=re.MULTILINE)  # Only remove 10-29 (common page ranges)
    
    # Fix common encoding issues
    text = text.replace('â€™', "'")
    text = text.replace('â€œ', '"')
    text = text.replace('â€\x9d', '"')
    text = text.replace('â€"', '-')
    
    # Normalize BHEL-specific terms for consistent extraction
    text = re.sub(r'Dy\.\s*Engineer', 'Deputy Engineer', text)
    text = re.sub(r'Asst\.\s*Engineer', 'Assistant Engineer', text)
    
    # Final cleanup
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text

def evaluate_extra_prompt_response(response_text, filename):
    """
    Enhanced evaluation that looks for final decision after reasoning
    """
    if not response_text:
        logger.warning(f"Empty response for {filename}")
        return False
    
    response_clean = response_text.strip().upper()
    logger.info(f"Extra prompt response for {filename}: {response_clean}")
    
    # Look for final decision patterns (after reasoning)
    final_patterns = [
        r'FINAL ANSWER:\s*(YES|NO)',
        r'DECISION:\s*(YES|NO)',
        r'CONCLUSION:\s*(YES|NO)',
        r'ANSWER:\s*(YES|NO)'
    ]
    
    for pattern in final_patterns:
        match = re.search(pattern, response_clean)
        if match:
            return match.group(1) == 'YES'
    
    # Fallback to end-of-response YES/NO
    lines = response_clean.split('\n')
    for line in reversed(lines[-3:]):  # Check last 3 lines
        if re.search(r'\bYES\b', line) and not re.search(r'\bNO\b', line):
            return True
        if re.search(r'\bNO\b', line) and not re.search(r'\bYES\b', line):
            return False
    
    logger.warning(f"Could not determine clear decision for {filename}: {response_clean}")
    return False



def extract_pdf_content(file_path):
    """
    Multi-method PDF extraction with fallbacks
    """
    logger.info(f"Extracting content from: {os.path.basename(file_path)}")
    
    # Method 1: Try PyMuPDF (best for complex layouts)
    content = extract_text_pymupdf(file_path)
    if content and len(content.strip()) > 100:
        logger.info("Successfully extracted using PyMuPDF")
        return clean_extracted_text(content)
    
    # Method 2: Fallback to LangChain loaders
    content = extract_text_langchain(file_path)
    if content and len(content.strip()) > 100:
        logger.info("Successfully extracted using LangChain")
        return clean_extracted_text(content)
    
    # Method 3: Last resort - basic text extraction
    try:
        import PyPDF2
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text_parts = []
            for page in reader.pages:
                text_parts.append(page.extract_text())
            content = "\n".join(text_parts)
            
            if content and len(content.strip()) > 50:
                logger.info("Successfully extracted using PyPDF2")
                return clean_extracted_text(content)
                
    except Exception as e:
        logger.error(f"PyPDF2 extraction failed: {e}")
    
    logger.error("All extraction methods failed")
    return None

def delete_files(file_paths):
    import time
    time.sleep(1000)
    for path in file_paths:
        if os.path.exists(path):
            os.remove(path)

def process_single_pdf(file, criteria, extra_prompt, MODEL_NAME):
    filename = file.name
    file_path = os.path.join(settings.MEDIA_ROOT, 'pdfs', filename)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    try:
        # Save file
        with open(file_path, 'wb+') as dest:
            for chunk in file.chunks():
                dest.write(chunk)

        # Enhanced PDF content extraction
        content_str = extract_pdf_content(file_path)
        ### print(content_str)
        
        if not content_str:
            logger.error(f"Failed to extract content from {filename}")
            return None, file_path

        logger.info(f"Extracted {len(content_str)} characters from {filename}")

        # Initialize Ollama LLM with optimized settings
        llm = OllamaLLM(
            model=MODEL_NAME,
            base_url="http://localhost:11434",
            temperature=0.1,
            num_predict=2048,  # Limit response length for efficiency
            top_k=10,          # Reduce randomness
            top_p=0.9
        )

        # Process extra prompt if provided
        extra_prompt_flag = True
        if extra_prompt:
            # Enhanced prompt for better accuracy
            if MODEL_NAME in ['phi4', 'phi3']:
                prompt = f"""
                You are a strict bio-data analyzer for BHEL.

                DOCUMENT: {content_str[:3000]}
                CRITERIA: {extra_prompt}

                First, analyze the document step by step:
                1. What relevant information do you find in the document?
                2. How does this information relate to the criteria?
                3. Based on your analysis, does the document meet the criteria?

                Provide your reasoning first, then conclude with:
                FINAL ANSWER: YES or NO

                ANALYSIS:"""

            elif MODEL_NAME == 'mistral':
                prompt = f"""
                You are a strict bio-data analyzer for BHEL.

                DOCUMENT: {content_str[:3000]}
                CRITERIA: {extra_prompt}

                First, analyze the document step by step:
                1. What relevant information do you find in the document?
                2. How does this information relate to the criteria?
                3. Based on your analysis, does the document meet the criteria?

                Provide your reasoning first, then conclude with:
                FINAL ANSWER: YES or NO

                ANALYSIS:"""

            
            response_text = llm.invoke(prompt).strip()
            extra_prompt_flag = evaluate_extra_prompt_response(response_text, filename)

        # If extra_prompt check failed, return early
        if not extra_prompt_flag:
            return None, file_path

        # If criteria is empty, return filename since extra_prompt check passed
        if not criteria:
            return filename, file_path

        # Enhanced criteria processing with better prompt engineering
        prompt = f"""
        Extract structured data from this BHEL employee biodata document.

        DOCUMENT CONTENT:
        {content_str}

        REQUIRED FIELDS TO EXTRACT:
        {json.dumps(list(criteria.keys()), indent=2)}

        INSTRUCTIONS:
        - Extract ONLY the exact values present in the document
        - Use the exact field names provided above
        - Return valid JSON format only
        - If a field is missing, set its value to null
        - Do not add explanations or extra text

        EXAMPLE OUTPUT FORMAT:
        {{"name": "extracted name", "dateofbirth": "DD-MM-YYYY", "department": "department name"}}

        JSON OUTPUT:"""

        llm_response = llm.invoke(prompt).strip()
        
        # Clean response to extract JSON
        if llm_response.startswith("```"):
            llm_response = re.sub(r"```(?:json)?\n?|```", "", llm_response)
        
        # Find JSON in response
        json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)
        if json_match:
            llm_response = json_match.group()
        
        try:
            extracted_data = json.loads(llm_response)
            extracted_data = {k.lower(): str(v).lower() for k, v in extracted_data.items() if v is not None}
            criteria_lower = {k.lower(): str(v).lower() for k, v in criteria.items()}
            
            # Enhanced date format handling
            if 'dateofbirth' in extracted_data:
                date_val = extracted_data['dateofbirth']
                # Normalize various date formats
                date_val = re.sub(r'[-/\\.]', '.', date_val)
                extracted_data['dateofbirth'] = date_val
            
            # Improved matching logic
            match = all(
                k in extracted_data and (
                    criteria_lower[k] in extracted_data[k] or 
                    extracted_data[k] in criteria_lower[k] or
                    any(word in extracted_data[k] for word in criteria_lower[k].split()) or
                    any(word in criteria_lower[k] for word in extracted_data[k].split())
                )
                for k in criteria_lower
            )
            
            if match:
                logger.info(f"Match found: {filename}")
                return filename, file_path
                
        except (json.JSONDecodeError, Exception) as e:
            logger.error(f"Error processing {filename}: {str(e)[:200]}")
            return None, file_path

    except Exception as e:
        logger.error(f"Error processing {filename}: {str(e)[:200]}")
        return None, file_path

    return None, file_path


class PDFProcessView(APIView):
    def post(self, request, format=None):
        files = request.FILES.getlist('files')
        description = request.data.get('description', '')
        extra_prompt = request.data.get('extra_prompt', '')
        model_name = request.data.get('model_name', 'phi4')

        if not files:
            return Response({"error": "No files uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        if not description:
            return Response({"error": "Missing criteria description"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            criteria = json.loads(description)
            if not isinstance(criteria, dict):
                raise ValueError("Criteria must be a JSON object")
        except (json.JSONDecodeError, ValueError) as e:
            return Response({"error": f"Invalid criteria format: {str(e)}"},
                            status=status.HTTP_400_BAD_REQUEST)

        matching_files = []
        file_paths = []

        # Optimized for single instance with reduced concurrency
        with ThreadPoolExecutor(max_workers=min(len(files), 2)) as executor:
            futures = []
            for file in files:
                future = executor.submit(
                    process_single_pdf,
                    file, criteria, extra_prompt, model_name
                )
                futures.append(future)
            
            for future in as_completed(futures):
                try:
                    filename, file_path = future.result()
                    if filename:
                        matching_files.append(filename)
                    if file_path:
                        file_paths.append(file_path)
                except Exception as e:
                    logger.error(f"Error processing file: {e}")

        threading.Thread(
            target=delete_files,
            args=(file_paths,),
            daemon=True
        ).start()

        return Response({
            "matches": [
                {
                    "filename": fname,
                    "url": request.build_absolute_uri(f'/api/download/{fname}/')
                } for fname in matching_files
            ],
            "processed_files": len(files),
            "matching_files": len(matching_files),
            "extraction_method": "enhanced_multi_method"
        }, status=status.HTTP_200_OK)

# Your existing PDFDownloadView and HealthCheckView remain the same


class PDFDownloadView(APIView):
    @xframe_options_exempt
    def get(self, request, filename):
        file_path = os.path.join(settings.MEDIA_ROOT, 'pdfs', filename)
        if os.path.exists(file_path):
            # Use ?download=true for download, otherwise preview inline
            download = request.query_params.get('download', 'false').lower() == 'true'
            return FileResponse(open(file_path, 'rb'), as_attachment=download, filename=filename)
        raise Http404("PDF not found")


class HealthCheckView(APIView):
    def get(self, request):
        return Response({
            "status": "healthy",
            "message": "API is up and running"
        }, status=status.HTTP_200_OK)

