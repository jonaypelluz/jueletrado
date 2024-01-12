import argparse
import json
import re
from urllib.parse import quote
from urllib.request import Request, urlopen
from bs4 import BeautifulSoup

def get_html(url):
    try:
        print(f"Fetching data for URL: {url}")

        request = Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'})
        
        with urlopen(request) as response:
            html_content = response.read().decode('utf-8')
        return html_content

    except Exception as e:
        print(f"Failed to fetch data for URL {url}: {e}")
        return None

def get_the_definition_extra(title, definition_extra):
    for item in definition_extra:
        if "Sinónimo" in title and "Sinónimos o afines" in item["type"]:
            return item
        elif "Antónimo" in title and "Antónimos u opuestos" in item["type"]:
            return item

def parse_html(html_content, word):
    if html_content is None:
        return []

    soup = BeautifulSoup(html_content, 'html.parser')
    paragraphs = soup.find_all('p')
    outer_div = soup.find('div', id='resultados')
    results = []
    duplicates = []
    max_number = 0 

    for p in paragraphs:
        number_span = p.find('span', class_='n_acep')
        if number_span:
            number = number_span.get_text().strip().rstrip('.')
            max_number = max(max_number, int(number))

            active_definition_extra = None
            definition_extra = [
                {"type": "Sinónimos o afines", "content": ""},
                {"type": "Antónimos u opuestos", "content": ""}
            ]

            for div in p.find_all('div'):
                if div.find('tr'):
                    for tr in div.find_all('tr'):
                        abbr = tr.find('abbr')
                        if abbr and abbr.has_attr('title'):
                            title = abbr['title']
                            potential_definition_extra = get_the_definition_extra(title, definition_extra)

                            if potential_definition_extra:
                                abbr.decompose()
                                rest_of_text = ' '.join(tr.stripped_strings)
                                potential_definition_extra["content"] += " " + rest_of_text if potential_definition_extra["content"] else rest_of_text
                                active_definition_extra = potential_definition_extra
                            elif active_definition_extra is not None:
                                rest_of_text = ' '.join(tr.stripped_strings)
                                active_definition_extra["content"] += " " + rest_of_text
                div.decompose()

            if outer_div:
                for div in outer_div.find_all('div'):
                    ul_active = 0
                    for header in div.find_all('span', class_='sin-header-inline'):
                        title = header.text.strip()
                        ul_list = div.find_all('ul')
                        if len(ul_list) >= ul_active+1:
                            ul = ul_list[ul_active]
                            rest_of_text = ' '.join(ul.stripped_strings)
                            definition = get_the_definition_extra(title, definition_extra)
                            if definition:
                                definition["content"] += " " + rest_of_text if definition["content"] else rest_of_text
                                ul_active = 1
                    div.decompose()

            definition_extra = [item for item in definition_extra if item["content"]]
            definition_extra = clean_definition_extra(definition_extra)

            abbr_elements = p.find_all('abbr')
            def_type = ''
            def_type_extra = ''

            if len(abbr_elements) >= 1:
                def_type = abbr_elements[0].get('title', '').strip()

            if len(abbr_elements) >= 2:
                def_type_extra = ', '.join(abbr.get('title', '').strip() for abbr in abbr_elements[1:])

            for abbr in abbr_elements:
                abbr.decompose()

            definition_text = ' '.join(p.stripped_strings).replace(number_span.get_text(), '').strip()

            word_object = {
                "word": word,
                "number": number,
                "type": def_type,
                "type_extra": def_type_extra,
                "definition": definition_text,
                "definition_extra": definition_extra
            }
            if any(defn['number'] == str(number) for defn in results):
                duplicates.append(word_object)
            else:
                results.append(word_object)

    for duplicate in duplicates:
        max_number += 1
        duplicate['number'] = str(max_number)
        results.append(duplicate)

    if not results:
        print(f"No matching definitions found for word: {word}")

    return results

def clean_definition_extra(definition_extra):
    for item in definition_extra:
        cleaned_content = re.sub(r'\[.*?\]', '', item['content'])

        phrases = re.split(r'[.,]\s*', cleaned_content)
        
        cleaned_phrases = []
        seen_phrases = set()
        for phrase in phrases:
            trimmed_phrase = phrase.strip()
            if trimmed_phrase and trimmed_phrase not in seen_phrases:
                seen_phrases.add(trimmed_phrase)
                cleaned_phrases.append(trimmed_phrase)

        if cleaned_phrases:
            item['content'] = ', '.join(cleaned_phrases[:-1]) + (', ' if len(cleaned_phrases) > 1 else '') + cleaned_phrases[-1] + '.'

    return definition_extra

def beautifier(word_obj):
    def format_content(content):
        content = content.strip().replace(" :", ":").replace(" ,", ",").replace(" .", ".").replace("‖ ", "")
        if not content.endswith("."):
            content += "."
        return content
    
    if word_obj['definition'].endswith(" ."):
        word_obj['definition'] = word_obj['definition'][:-2] + "."
    elif not word_obj['definition'].endswith("."):
        word_obj['definition'] += "."

    word_obj['definition'] = format_content(word_obj['definition'])

    if not word_obj.get('definition_extra'):
        word_obj.pop('definition_extra', None)
    else:
        for item in word_obj['definition_extra']:
            item['content'] = format_content(item['content'])

    if not word_obj['type_extra']:
        del word_obj['type_extra']

    return word_obj


def is_deeply_changed(existing, new):
    if isinstance(existing, dict) and isinstance(new, dict):
        return any(is_deeply_changed(existing.get(key), new.get(key)) for key in new)
    elif isinstance(existing, list) and isinstance(new, list):
        return len(existing) != len(new) or any(is_deeply_changed(e, n) for e, n in zip(existing, new))
    else:
        return existing != new

def update_json_file(word_object):
    vowel_mapping = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'ñ': 'n'
    }

    word = word_object.pop('word', None)

    first_letter = vowel_mapping.get(word[0], word[0])
    output_file = f"../../../public/definitions/{first_letter}_definitions.json"

    word_object = beautifier(word_object)

    try:
        with open(output_file, 'r+', encoding='utf-8') as file:
            data = json.load(file)
            if word not in data:
                data[word] = {"definitions": []}
            
            is_duplicate = False
            for existing_def in data[word]['definitions']:
                if existing_def['number'] == word_object['number']:
                    is_duplicate = True
                    fields_changed = is_deeply_changed(existing_def, word_object)
                    if fields_changed:
                        existing_def.update(word_object)
                    break

            if not is_duplicate:
                data[word]['definitions'].append(word_object)

            file.seek(0)
            json.dump(data, file, ensure_ascii=False, indent=4)
            file.truncate()

    except FileNotFoundError:
        with open(output_file, 'w', encoding='utf-8') as file:
            data = {word: {"definitions": [word_object]}}
            json.dump(data, file, ensure_ascii=False, indent=4)

def extract_definition_details(definition):
    regex = r"([0-9]+)\. ([a-z]+)\. (.+)"
    match = re.match(regex, definition)
    if match:
        return match.group(1), match.group(2), match.group(3)
    else:
        return None, None, None

def main(word, basic_words_file):
    start_processing = not word

    with open(basic_words_file, 'r', encoding='utf-8') as file:
        for line in file:
            current_word = line.strip()
            if current_word == word:
                start_processing = True 
            if start_processing:
                print(f"Processing word: {current_word}")
                formatted_url = f"https://dle.rae.es/{quote(current_word)}"
                html_content = get_html(formatted_url)
                results = parse_html(html_content, current_word)

                for word_object in results:
                    update_json_file(word_object)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch and parse HTML from the RAE dictionary.")
    parser.add_argument("basic_words_file", help="The text file containing words to fetch from the RAE dictionary.")
    parser.add_argument("--word", help="Optional: Starting word for processing. If not provided, starts from the beginning of the file.", default="")
    args = parser.parse_args()

    main(args.word, args.basic_words_file)
