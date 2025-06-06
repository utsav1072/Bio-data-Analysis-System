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
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = []
        for doc in docs:
            chunks.extend(text_splitter.split_text(doc.page_content))
        content_str = "\n".join(chunks)

        print(content_str)

        # Initialize Ollama LLM via LangChain
        llm = OllamaLLM(model=MODEL_NAME)

        # Process extra prompt if provided
        extra_prompt_flag = True
        if extra_prompt:
            prompt = (
                f"You are given a document and a condition to check.\n"
                f"First, analyze the document and extract or infer any information required to evaluate the condition. "
                f"For example, if the condition is about 'age' but the document only contains 'date of birth', "
                f"calculate the age based on the date of birth and the current date.\n\n"
                f"Condition: {extra_prompt}\n"
                f"Document: {content_str}\n\n"
                "Only answer 'YES' if the document, using direct or inferred information, satisfies the condition. "
                "Otherwise, answer 'NO'. Do not provide explanations or any other text—only reply with 'YES' or 'NO'."
            )
            response_text = llm.invoke(prompt).strip().upper()
            extra_prompt_flag = (response_text != 'NO')
            print(response_text)


        if not extra_prompt_flag:
            return None, file_path

        # Key-value extraction prompt
        prompt = f"""
        KEY-VALUE EXTRACTION PROTOCOL

        REQUIRED KEYS:
        {json.dumps(list(criteria.keys()), indent=2)}

        DOCUMENT CONTENT:
        {content_str}

        INSTRUCTIONS:
        1. Find EXACT matches for required keys (case-insensitive)
        2. Extract ONLY values explicitly associated with keys
        3. Output JSON with format:
        {{
        "key1": "exact_value_from_doc",
        "key2": "exact_value_from_doc"
        }}
        4. Include ONLY keys found in document
        5. NO INFERENCE - exact matches only
        6. NO COMMENTS - output ONLY valid JSON
        7. Respond with only and only json, no other sentence or word other than the json itself
        """
        llm_response = llm.invoke(prompt).strip()
        #print(llm_response)
        try:
            extracted_data = json.loads(llm_response)
            extracted_data = {k.lower(): str(v).lower() for k, v in extracted_data.items()}
            criteria_lower = {k.lower(): str(v).lower() for k, v in criteria.items()}
            match = all(
                k in extracted_data and criteria_lower[k] in extracted_data[k]
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

        MODEL_NAME = "llama3"
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
