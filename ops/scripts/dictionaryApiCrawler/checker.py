import requests
import time
import random
import argparse

def check_word_and_write(word, output_file):
    print(f"Checking: {word} ...")
    url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
    response = requests.get(url)

    if response.status_code == 200:
        with open(output_file, 'a') as f:
            f.write(word + '\n')

def get_last_processed_word(output_file):
    try:
        with open(output_file, 'r') as f:
            return f.readlines()[-1].strip()
    except FileNotFoundError:
        return None
    except IndexError:
        return None

def main(input_file, output_file):
    last_word = get_last_processed_word(output_file)
    start_processing = False if last_word else True

    with open(input_file, 'r') as file:
        for word in file:
            word = word.strip()
            if start_processing:
                check_word_and_write(word, output_file)
                time.sleep(random.randint(1, 10))
            elif word == last_word:
                start_processing = True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Check words from a file against an online dictionary.')
    parser.add_argument('input_file', type=str, help='Path to the input file containing words.')
    parser.add_argument('--output_file', type=str, default='output.txt', help='Path to the output file. Default is output.txt.')
    
    args = parser.parse_args()

    main(args.input_file, args.output_file)
