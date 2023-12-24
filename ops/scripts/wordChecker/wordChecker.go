package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	hardWords := loadWordsFromFile("../hard_words.txt")
	basicWords := loadWordsFromFile("../basic_words.txt")

	basicFile, err := os.OpenFile("../basic_words.txt", os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("Error opening basic words file:", err)
		return
	}
	defer basicFile.Close()

	outputFile, err := os.OpenFile("output.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("Error opening output file:", err)
		return
	}
	defer outputFile.Close()

	fmt.Println("Enter words (type 'exit' to finish):")
	for scanner.Scan() {
		word := scanner.Text()
		if word == "exit" {
			break
		}

		if _, found := hardWords[word]; found {
			if _, found := basicWords[word]; !found {
				basicFile.WriteString(word + "\n")
				basicWords[word] = struct{}{}
			}
		} else {
			outputFile.WriteString(word + "\n")
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
