#!/bin/bash

inputFile="words.txt" # Replace with your input file path
chunkSize=100000 # Number of words per file
offset=1 # Starting offset
firstElement=true

# Read each line from the input file
while IFS= read -r line; do
    if [ $((offset % chunkSize)) -eq 1 ]; then
        if [ "$offset" -ne 1 ]; then
            # Close the previous JSON array if it's not the first chunk
            printf "]" >> "$currentOutputFile"
            echo "File has been saved as $currentOutputFile"
        fi
        # Start a new JSON file
        startOffset=$offset
        endOffset=$(($startOffset + chunkSize - 1))
        currentOutputFile="words_from_${startOffset}_to_${endOffset}.json"
        printf "[" > "$currentOutputFile"
        firstElement=true
    fi

    # Add the word to the current JSON file
    if [ "$firstElement" = true ]; then
        firstElement=false
    else
        printf "," >> "$currentOutputFile"
    fi
    printf "\"%s\"" "$line" >> "$currentOutputFile"

    ((offset++))
done < "$inputFile"

# Close the last JSON array and output file name if the last line was not a perfect chunk boundary
if [ $(( (offset - 1) % chunkSize)) -ne 0 ]; then
    printf "]" >> "$currentOutputFile"
    echo "File has been saved as $currentOutputFile"
fi
