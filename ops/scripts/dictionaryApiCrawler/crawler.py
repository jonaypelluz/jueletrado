import argparse
import json
from urllib.parse import quote
from urllib.request import Request, urlopen
import os

def get_json(url):
    try:
        request = Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'})
        
        with urlopen(request) as response:
            return json.loads(response.read().decode('utf-8'))

    except Exception as e:
        print(f"Failed to fetch data for URL {url}: {e}")
        return None

def format_definitions(meanings, start_number=1):
    formatted_definitions = []
    for meaning in meanings:
        for definition in meaning["definitions"]:
            formatted_def = {
                "number": start_number,
                "definition": definition["definition"],
                "type": meaning["partOfSpeech"],
                "definition_extra": [],
                "type_extra": ""
            }
            if "synonyms" in definition and definition["synonyms"]:
                formatted_def["definition_extra"].append({
                    "type": "Synonyms",
                    "content": ", ".join(definition["synonyms"])
                })
            if "antonyms" in definition and definition["antonyms"]:
                formatted_def["definition_extra"].append({
                    "type": "Antonyms",
                    "content": ", ".join(definition["antonyms"])
                })
            formatted_definitions.append(beautifier(formatted_def))
            start_number += 1
    return formatted_definitions

def is_deeply_changed(existing, new):
    if isinstance(existing, dict) and isinstance(new, dict):
        return any(is_deeply_changed(existing.get(key), new.get(key)) for key in new)
    elif isinstance(existing, list) and isinstance(new, list):
        return len(existing) != len(new) or any(is_deeply_changed(e, n) for e, n in zip(existing, new))
    else:
        return existing != new

def beautifier(word_obj):
    def format_content(content):
        content = content.strip().replace(" :", ":").replace(" ,", ",").replace(" .", ".").replace("‖ ", "").replace(" )", ")").replace(",.", ".")
        if not content.endswith("."):
            content += "."
        return content
    
    word_obj['definition'] = format_content(word_obj['definition'])

    if 'definition_extra' in word_obj:
        word_obj['definition_extra'] = [item for item in word_obj['definition_extra'] if format_content(item['content'])]
        if not word_obj['definition_extra']:
            del word_obj['definition_extra']

    if 'type_extra' in word_obj and not word_obj['type_extra']:
        del word_obj['type_extra']

    return word_obj


def save_to_file(json_content, first_letter):
    output_file = f"../../../public/definitions/en/{first_letter}_definitions.json"

    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as file:
            data = json.load(file)
    else:
        data = {}

    new_entry = {}
    for entry in json_content:
        word = entry["word"]
        if word not in new_entry:
            new_entry[word] = {"definitions": []}
        new_entry[word]["definitions"].extend(format_definitions(entry["meanings"], len(new_entry[word]["definitions"]) + 1))

    for word, entry in new_entry.items():
        if word not in data or is_deeply_changed(data.get(word), entry):
            data[word] = entry
            print(f"Updated or added definitions for '{word}'")

    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=4, ensure_ascii=False)

def main(word, beginner_words_file):
    start_processing = not word

    with open(beginner_words_file, 'r', encoding='utf-8') as file:
        for line in file:
            current_word = line.strip()
            if current_word == word:
                start_processing = True 
            if start_processing:
                print(f"Processing word: {current_word}")
                formatted_url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{quote(current_word)}"
                json_content = get_json(formatted_url)
                if json_content:
                    save_to_file(json_content, current_word[0].lower())
                    print(f"Data for '{current_word}' added")
                else:
                    print(f"No data found for '{current_word}'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch and parse HTML from the RAE dictionary.")
    parser.add_argument("beginner_words_file", help="The text file containing words to fetch from the RAE dictionary.")
    parser.add_argument("--word", help="Optional: Starting word for processing. If not provided, starts from the beginning of the file.", default="")
    args = parser.parse_args()

    main(args.word, args.beginner_words_file)
