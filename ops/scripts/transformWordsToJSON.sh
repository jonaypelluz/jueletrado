#!/bin/bash

WORDS_DIR="words"
for LOCALE in en es; do
    for FILE in "$WORDS_DIR"/"$LOCALE"/*; do
        if [ ! -f "$FILE" ]; then
            echo "Skipping non-file: $FILE"
            continue
        fi

        echo "Processing $FILE for locale $LOCALE..."

        TMP_FILE=$(mktemp)

        if [ "$LOCALE" = "en" ]; then
            LC_COLLATE="en_GB.UTF-8"
        else
            LC_COLLATE="es_ES.UTF-8"
        fi

        LC_COLLATE=$LC_COLLATE sort -u "$FILE" > "$TMP_FILE"
        mv "$TMP_FILE" "$FILE"

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

        for gen_file in "${GENERATED_FILES[@]}"; do
            mv "$gen_file" "../../public/words/$LOCALE/"
        done

        echo "All files have been moved to ../public/words/$LOCALE"

        # Update LevelsConfig.js
        WORD_COUNT=$(($(wc -w < "$FILE") - 1))
        LEVELS_CONFIG="../../src/config/LevelConfig.ts"

        awk -v level="$LEVEL" -v lang="$LOCALE" -v newcount="$WORD_COUNT" '
        BEGIN { inMinPopulated = 0; levelFound = 0 }
        {
            if ($0 ~ "level: \x27" level "\x27,") {
                levelFound = 1
            }
            if (levelFound && $0 ~ "minimumPopulatedCount: {") {
                inMinPopulated = 1
            }
            if (inMinPopulated && $0 ~ lang ": [0-9]+") {
                sub(lang ": [0-9]+", lang ": " newcount)
            }
            if (inMinPopulated && $0 ~ "},") {
                inMinPopulated = 0; levelFound = 0
            }
            if ($0 ~ /^export default LevelsConfig;/) {
                print $0
                next
            }
            print
        }
        ' "$LEVELS_CONFIG" > temp_file && mv temp_file "$LEVELS_CONFIG"

        echo "Word count for $LEVEL in $LOCALE updated to $WORD_COUNT in LevelsConfig.js"
    done
done
