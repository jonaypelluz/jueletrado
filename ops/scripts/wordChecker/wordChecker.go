package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: wordChecker <locale>")
		return
	}

	locale := os.Args[1]

	advancedWordsFilePath := fmt.Sprintf("../words/%s/advanced_words.txt", locale)
	beginnerWordsFilePath := fmt.Sprintf("../words/%s/beginner_words.txt", locale)

	scanner := bufio.NewScanner(os.Stdin)
	advancedWords := loadWordsFromFile(advancedWordsFilePath)
	beginnerWords := loadWordsFromFile(beginnerWordsFilePath)

	beginnerFile, err := os.OpenFile(beginnerWordsFilePath, os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("Error opening beginner words file:", err)
		return
	}
	defer beginnerFile.Close()

	fmt.Println("Enter words (type 'exit' to finish):")
	for scanner.Scan() {
		word := scanner.Text()
		if word == "exit" {
			break
		}

		if _, found := advancedWords[word]; found {
			if _, found := beginnerWords[word]; !found {
				beginnerFile.WriteString(word + "\n")
				beginnerWords[word] = struct{}{}
			}
		}
	}
}

func loadWordsFromFile(filePath string) map[string]struct{} {
	file, err := os.Open(filePath)
	if err != nil {
		fmt.Println("Error opening file:", err)
		return nil
	}
	defer file.Close()

	words := make(map[string]struct{})
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		words[scanner.Text()] = struct{}{}
	}

	if err := scanner.Err(); err != nil {
		fmt.Println("Error reading file:", err)
	}
	return words
}
