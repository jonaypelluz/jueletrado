#!/bin/bash
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 filename"
    exit 1
fi

FILE=$1

if [ ! -f "$FILE" ]; then
    echo "File not found: $FILE"
    exit 1
fi

LC_COLLATE=es_ES.UTF-8 sort "$FILE"
