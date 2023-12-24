#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <filename> <level>"
    exit 1
fi

inputFile=$1
level=$2
chunkSize=100000
offset=1
firstElement=true

while IFS= read -r line; do
    if [ $((offset % chunkSize)) -eq 1 ]; then
        if [ "$offset" -ne 1 ]; then
            printf "]" >> "$currentOutputFile"
            echo "File has been saved as $currentOutputFile"
        fi

        startOffset=$offset
        endOffset=$(($startOffset + chunkSize - 1))
        currentOutputFile="${level}_words_from_${startOffset}_to_${endOffset}.json"
        printf "[" > "$currentOutputFile"
        firstElement=true
    fi

    if [ "$firstElement" = true ]; then
        firstElement=false
    else
        printf "," >> "$currentOutputFile"
    fi
    printf "\"%s\"" "$line" >> "$currentOutputFile"

    ((offset++))
done < "$inputFile"

if [ $(( (offset - 1) % chunkSize)) -ne 0 ]; then
    printf "]" >> "$currentOutputFile"
    echo "File has been saved as $currentOutputFile"
fi
