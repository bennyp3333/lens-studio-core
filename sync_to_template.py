#!/usr/bin/env python3
"""
Syncs JS files from source folders to Core Template/Assets/Core/
Run this before exporting Core.lspkg to ensure all changes are included.

Usage:
    python sync_to_template.py
"""

import shutil
from pathlib import Path

# Define paths relative to script location
SCRIPT_DIR = Path(__file__).parent
SOURCE_FOLDERS = ["Classes", "Components", "Managers", "Utilities"]
DEST_BASE = SCRIPT_DIR / "Core Template" / "Assets" / "Core"

def sync_files():
    total_copied = 0

    for folder in SOURCE_FOLDERS:
        source_dir = SCRIPT_DIR / folder
        dest_dir = DEST_BASE / folder

        if not source_dir.exists():
            print(f"Warning: Source folder '{folder}' not found, skipping...")
            continue

        # Ensure destination exists
        dest_dir.mkdir(parents=True, exist_ok=True)

        # Copy all .js files (recursive, but skip Example/Cache dirs)
        js_files = [
            f for f in source_dir.glob("**/*.js")
            if not any(part in ("Example", "Cache") for part in f.relative_to(source_dir).parts)
        ]

        if not js_files:
            print(f"  {folder}: No JS files found")
            continue

        for js_file in js_files:
            rel_path = js_file.relative_to(source_dir)
            dest_file = dest_dir / rel_path
            dest_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(js_file, dest_file)
            total_copied += 1

        print(f"  {folder}: Copied {len(js_files)} file(s)")

    print(f"\nDone! Copied {total_copied} file(s) total.")

if __name__ == "__main__":
    print("Syncing JS files to Core Template...\n")
    sync_files()
