#!/bin/bash
echo "--- Activating Virtual Environment ---"
source .venv/bin/activate

echo "--- Launching Flask Server (Press Ctrl+C to stop) ---"
python3 app.py

echo ""
echo "--- Server Stopped. Starting Build Process ---"

if [ -f "build.py" ]; then
    python3 build.py
    echo "--- Build Complete: index.html has been updated ---"
else
    echo "Error: build.py not found in this directory."
fi

deactivate