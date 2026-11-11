#!/usr/bin/env bash
# Bangun ulang scene lalu ekspor PNG + tata letak.
#   bash run.sh                  -> semua peta
#   bash run.sh pesisir_karang   -> satu peta (nama scene tanpa .tscn)
set -e
cd "$(dirname "$0")"
GD="${GODOT:-/c/Program Files/Godot_v4.7.2-stable_win64_console.exe}"
MAPS=("$@")
if [ ${#MAPS[@]} -eq 0 ]; then
	MAPS=(lembah_sunnyside pesisir_karang dataran_angin kota_pasar)
fi
for map in "${MAPS[@]}"; do
	echo "== $map"
	"$GD" --headless --path . --script "res://scripts/build_${map}.gd" 2>&1 | grep -v "^$" | grep -vE "^[#.a-z@]{64}$"
	"$GD" --path . --script res://scripts/export_map.gd -- "res://maps/${map}.tscn" 2>&1 | grep -E "gambar|tata|ERROR|WARNING|error" || true
done
