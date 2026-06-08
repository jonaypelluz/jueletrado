#!/bin/bash
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 input.txt output.txt word_position"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="$2"
WORD_POSITION="$3"

awk -v col="$WORD_POSITION" '{print $col}' "$INPUT_FILE" > "$OUTPUT_FILE"
