#!/bin/bash
set -e

echo "Building extension..."
npm run build > /dev/null 2>&1

echo "Generating checksums..."
cd dist
find . -type f ! -name "checksums.txt" | sort | xargs shasum -a 256 > checksums.txt

echo "Build checksums:"
cat checksums.txt

echo ""
echo "Overall build hash:"
shasum -a 256 checksums.txt | cut -d' ' -f1
