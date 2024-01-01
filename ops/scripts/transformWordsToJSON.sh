#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 FILENAME"
    exit 1
fi

FILE=$1

if [ ! -f "$FILE" ]; then
    echo "File not found: $FILE"
    exit 1
fi

TMP_FILE=$(mktemp)

LC_COLLATE=es_ES.UTF-8 sort "$FILE" > "$TMP_FILE"

mv "$TMP_FILE" "$FILE"

FILE=$1
FILENAME=$(basename "$FILE")
LEVEL=${FILENAME%%_*}
CHUNK_SIZE=100000
OFFSET=1
FIRST_ELEMENT=true

declare -a GENERATED_FILES

while IFS= read -r line; do
    if [ $((OFFSET % CHUNK_SIZE)) -eq 1 ]; then
        if [ "$OFFSET" -ne 1 ]; then
            printf "]" >> "$CURRENT_OUTPUT_FILE"
            echo "File has been saved as $CURRENT_OUTPUT_FILE"
            GENERATED_FILES+=("$CURRENT_OUTPUT_FILE")
        fi

        START_OFFSET=$OFFSET
        END_OFFSET=$(($START_OFFSET + CHUNK_SIZE - 1))
        CURRENT_OUTPUT_FILE="${LEVEL}_words_from_${START_OFFSET}_to_${END_OFFSET}.json"
        printf "[" > "$CURRENT_OUTPUT_FILE"
        FIRST_ELEMENT=true
    fi

    if [ "$FIRST_ELEMENT" = true ]; then
        FIRST_ELEMENT=false
    else
        printf "," >> "$CURRENT_OUTPUT_FILE"
    fi
    printf "\"%s\"" "$line" >> "$CURRENT_OUTPUT_FILE"

    OFFSET=$(($OFFSET + 1))
done < "$FILE"

if [ $(( (OFFSET - 1) % CHUNK_SIZE)) -ne 0 ]; then
    printf "]" >> "$CURRENT_OUTPUT_FILE"
    echo "File has been saved as $CURRENT_OUTPUT_FILE"
    GENERATED_FILES+=("$CURRENT_OUTPUT_FILE")
fi

for file in "${GENERATED_FILES[@]}"; do
    mv "$file" "../../public/words/"
done

echo "All files have been moved to ../public/words"
