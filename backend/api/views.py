import os
import threading
import json
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse, Http404
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import partial

# LangChain imports
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaLLM

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

        # LangChain PDF loading and chunking
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        content_str = "\n".join(doc.page_content for doc in docs)

        print(content_str)

        # Initialize Ollama LLM via LangChain
        llm = OllamaLLM(model=MODEL_NAME)

        # Process extra prompt if provided
        extra_prompt_flag = True
        if extra_prompt:
            prompt = (
                "You are an expert at analyzing employee bio-data documents for BHEL.\n"
                "Given a specific condition (which may include reference information such as today's date), determine if the document provides sufficient direct or strictly inferred evidence to satisfy the condition.\n"
                "If the condition requires information not explicitly present (e.g., age), calculate it only if all necessary data (such as date of birth and the reference date provided in the condition) are present within the document and/or the condition.\n\n"
                f"Condition: {extra_prompt}\n"
                f"Document:\n{content_str}\n\n"
                "Instructions:\n"
                "- Use only the information from the document and the condition. Do NOT use any external knowledge or make assumptions.\n"
                "- Answer 'YES' only if the document, using direct or strictly inferred information, satisfies the condition.\n"
                "- If any required information is missing, unclear, or cannot be inferred without assumption, answer 'NO'.\n"
                "- Respond with only 'YES' or 'NO'. Do not include any explanations or extra text."
            )

            response_text = llm.invoke(prompt).strip().upper()
            extra_prompt_flag = (response_text != 'NO')
            print(response_text)


        if not extra_prompt_flag:
            return None, file_path

        # Key-value extraction prompt
        prompt = f"""
        You are an expert at extracting structured data from employee bio-data documents for BHEL.

        <BIO-DATA EXAMPLE>
        Name: Mr Suresh Kumar
        Date of Birth: 12-05-1980
        Department: Mechanical
        Designation: Senior Engineer
        PWD status: NA
        category: SC
        employee Group: Superviser

        <REQUIRED KEYS>
        {json.dumps(list(criteria.keys()), indent=2)}

        <INSTRUCTIONS>
        - Extract only the exact values present in the document for each key.
        - Do not infer or guess any information.
        - If a key is missing, omit it from the output or set its value to null.
        - Output must be a single valid JSON object with only the required keys.
        - Do not include any explanation or extra text.

        <ACTUAL BIO-DATA>
        {content_str}
        """

        llm_response = llm.invoke(prompt).strip()
        try:
            extracted_data = json.loads(llm_response)
            extracted_data = {k.lower(): str(v).lower() for k, v in extracted_data.items()}
            criteria_lower = {k.lower(): str(v).lower() for k, v in criteria.items()}
            print(extracted_data)
            print(criteria_lower)
            match = all(
                k in extracted_data and (criteria_lower[k] in extracted_data[k] or extracted_data[k] in criteria_lower[k])
                for k in criteria_lower
            )
            if match:
                return filename, file_path
        except (json.JSONDecodeError, Exception) as e:
            print(f"Error processing {filename}: {str(e)[:200]}")
            return None, file_path

    except Exception as e:
        print(f"Error processing {filename}: {str(e)[:200]}")
        return None, file_path

    return None, file_path

class PDFProcessView(APIView):
    def post(self, request, format=None):
        files = request.FILES.getlist('files')
        description = request.data.get('description', '')
        extra_prompt = request.data.get('extra_prompt', '')

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

        MODEL_NAME = "mistral"
        matching_files = []
        file_paths = []

        # Parallel processing with ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=min(len(files), 4)) as executor:
            process_func = partial(
                process_single_pdf,
                criteria=criteria,
                extra_prompt=extra_prompt,
                MODEL_NAME=MODEL_NAME
            )
            future_to_file = {executor.submit(process_func, file): file for file in files}
            for future in as_completed(future_to_file):
                filename, file_path = future.result()
                if filename:
                    matching_files.append(filename)
                if file_path:
                    file_paths.append(file_path)

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
            ]
        }, status=status.HTTP_200_OK)

class PDFDownloadView(APIView):
    def get(self, request, filename):
        file_path = os.path.join(settings.MEDIA_ROOT, 'pdfs', filename)
        if os.path.exists(file_path):
            return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=filename)
        raise Http404("PDF not found")
