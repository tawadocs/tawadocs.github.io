#!/bin/bash
#!/bin/bash

# --- Configuration ---
PORT=3000

# Colours for pretty output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Colour, boo hoo

echo -e "${BLUE} Ganáán no Tawa Komuni Twana${NC}"

# 3. Ask user for action
echo "Zua subų fu fuyu hyo?"
echo "1) Naŝita"
echo "2) Kiwi lǫppu tahete ribu"
read -p "Atoru [1-2]: " choice

case $choice in
    1)
        echo -e "${GREEN} Kiwienų naŝita...${NC}"
        node bake.js
        ;;
    2)
        echo -e "${GREEN} Kiwien ilppu tahete ribu on port $PORT...${NC}"
        npm start
        ;;
    *)
        echo -e "${RED} Iinq atoĉ. Faugien...${NC}"
        exit 1
        ;;
esac
