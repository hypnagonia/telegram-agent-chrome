#!/bin/bash
set -e

if [ ! -f "dist/checksums.txt" ]; then
    echo "Error: dist/checksums.txt not found. Run build-hash.sh first."
    exit 1
fi

echo "Verifying build checksums..."
cd dist
if shasum -a 256 -c checksums.txt > /dev/null 2>&1; then
    echo "✓ All checksums match!"
    exit 0
else
    echo "✗ Checksum verification failed!"
    shasum -a 256 -c checksums.txt 2>&1 | grep FAILED
    exit 1
fi
