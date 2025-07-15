#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if content is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Error: No title provided${NC}"
    echo ""
    echo "Usage: $0 <title-or-content>"
    echo ""
    echo "Examples:"
    echo "  $0 'Just deployed a new feature'"
    echo "  $0 'quick-thought-about-terraform'"
    echo "  $0 'Interesting article about AWS'"
    exit 1
fi

# Check if we're in a Hugo project
if [ ! -f "config/_default/config.yaml" ] && [ ! -f "config.yaml" ] && [ ! -f "config.toml" ]; then
    echo -e "${RED}❌ Error: Not in a Hugo project directory${NC}"
    echo "Please run this script from your Hugo site root."
    exit 1
fi

# Generate a timestamp-based filename
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
TITLE_SLUG=$(echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')

# Limit slug length to avoid overly long filenames
if [ ${#TITLE_SLUG} -gt 50 ]; then
    TITLE_SLUG=$(echo "$TITLE_SLUG" | cut -c1-50 | sed 's/-$//')
fi

FILENAME="${TIMESTAMP}-${TITLE_SLUG}"
FILEPATH="content/micros/${FILENAME}"

# Create directory structure if it doesn't exist
mkdir -p "content/micros"

# Check if Hugo is available for content creation
if command -v hugo >/dev/null 2>&1; then
    # Use Hugo's content creation
    hugo new --kind micro "micros/${FILENAME}" 
else
    # Manual creation if Hugo not available
    mkdir -p "${FILEPATH}"
    cat > "${FILEPATH}/index.md" << EOF
---
title: "$(echo "$1" | sed 's/"/\\"/g')"
date: $(date -Iseconds)
type: "micro"
draft: true
tags: []
---

EOF
fi

echo -e "${GREEN}✅ Created micro post: ${FILEPATH}/index.md${NC}"
echo ""
echo -e "${BLUE}📝 Edit the file to add your content:${NC}"
echo -e "   ${YELLOW}code ${FILEPATH}/index.md${NC}"
echo ""
echo -e "${BLUE}🚀 When ready, set draft: false and commit!${NC}"
echo ""
echo -e "${BLUE}💡 Tip: View your micro posts at /micros/ when the site is running${NC}"