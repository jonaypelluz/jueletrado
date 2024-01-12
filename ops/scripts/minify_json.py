import json
import sys
import glob

def convert_unicode_escape(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        def _convert_unicode(obj):
            if isinstance(obj, str):
                return obj.encode('latin-1').decode('utf-8')
            elif isinstance(obj, dict):
                return {_convert_unicode(key): _convert_unicode(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [_convert_unicode(item) for item in obj]
            else:
                return obj

        data = _convert_unicode(data)

        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, separators=(',', ':'), ensure_ascii=False)


        print(f"JSON file '{file_path}' has been converted successfully.")
    except Exception as e:
        print(f"An error occurred with file '{file_path}': {e}")

def minify_json(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, separators=(',', ':'))
        print(f"JSON file '{file_path}' has been minified successfully.")
    except Exception as e:
        print(f"An error occurred with file '{file_path}': {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 minify_json.py 'path_to_your_files/*.json'")
    else:
        for file_path in glob.glob(sys.argv[1]):
            minify_json(file_path)
            convert_unicode_escape(file_path)


