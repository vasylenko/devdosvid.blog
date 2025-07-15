#!/bin/bash
set -e

# Check if content is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <title-or-content>"
    echo "Example: $0 'Just deployed a new feature'"
    echo "         $0 'quick-thought-about-terraform'"
    exit 1
fi

# Generate a timestamp-based filename
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
TITLE_SLUG=$(echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
FILENAME="${TIMESTAMP}-${TITLE_SLUG}"

# Create the micro post
hugo new --kind micro "micros/${FILENAME}" 

echo "✅ Created micro post: content/micros/${FILENAME}/index.md"
echo ""
echo "📝 Edit the file to add your content:"
echo "   code content/micros/${FILENAME}/index.md"
echo ""
echo "🚀 When ready, set draft: false and commit!"