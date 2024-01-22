#!/bin/bash
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 file1.txt file2.txt"
    exit 1
fi

file1="$1"
file2="$2"

if [ ! -f "$file1" ] || [ ! -f "$file2" ]; then
    echo "Both files must exist."
    exit 1
fi

while IFS= read -r line; do
    if ! grep -qFx "$line" "$file2"; then
        echo "$line" >> "$file2"
    fi
done < "$file1"
