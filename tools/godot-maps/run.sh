#!/usr/bin/env bash
# Bangun ulang scene lalu ekspor PNG + tata letak.
set -e
cd "$(dirname "$0")"
GD="${GODOT:-/c/Program Files/Godot_v4.7.2-stable_win64_console.exe}"
"$GD" --headless --path . --script res://scripts/build_lembah_sunnyside.gd 2>&1 | grep -v "^$" | grep -vE "^[#.a-z@]{64}$"
"$GD" --path . --script res://scripts/export_map.gd -- res://maps/lembah_sunnyside.tscn 2>&1 | grep -E "gambar|tata|ERROR|WARNING|error" || true
