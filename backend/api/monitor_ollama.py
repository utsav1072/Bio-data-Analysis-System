# monitor_ollama.py
import requests
import json
from concurrent.futures import ThreadPoolExecutor

def check_ollama_instance(url):
    try:
        response = requests.get(f"{url}/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get('models', [])
            return {
                'url': url,
                'status': 'healthy',
                'models': [model['name'] for model in models]
            }
    except Exception as e:
        return {
            'url': url,
            'status': 'unhealthy',
            'error': str(e)
        }

def monitor_all_instances():
    instances = [
        "http://localhost:11434",
        "http://localhost:11435", 
        "http://localhost:11436"
    ]
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        results = list(executor.map(check_ollama_instance, instances))
    
    return results

if __name__ == "__main__":
    results = monitor_all_instances()
    print(json.dumps(results, indent=2))
