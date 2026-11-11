#!/usr/bin/env bash
# Bangun ulang scene lalu ekspor PNG + tata letak.
#   bash run.sh                  -> semua peta
#   bash run.sh pesisir_karang   -> satu peta (nama scene tanpa .tscn)
#
# Peta acak dari generator (scripts/generate_map.gd):
#   bash run.sh --gen slug=desa-sungai seed=42 tema=sungai nama="Desa Sungai"
#   tema: desa | sungai | danau   (opsional: lebar=64 tinggi=48)
set -e
cd "$(dirname "$0")"
GD="${GODOT:-/c/Program Files/Godot_v4.7.2-stable_win64_console.exe}"

if [ "${1:-}" = "--gen" ]; then
	shift
	slug=""
	for arg in "$@"; do
		case "$arg" in slug=*) slug="${arg#slug=}" ;; esac
	done
	if [ -z "$slug" ]; then
		echo "Sebutkan slug=..., contoh: bash run.sh --gen slug=desa-sungai seed=42 tema=sungai" >&2
		exit 1
	fi
	scene="gen_${slug//-/_}"
	echo "== generator: $slug"
	"$GD" --headless --path . --script res://scripts/generate_map.gd -- "$@" 2>&1 | grep -v "^$"
	"$GD" --path . --script res://scripts/export_map.gd -- "res://maps/${scene}.tscn" 2>&1 | grep -E "gambar|tata|ERROR|WARNING|error" || true
	const_name="$(echo "$slug" | tr 'a-z-' 'A-Z_')_LAYOUT"
	cat <<EOF

Daftarkan di packages/shared/src/maps.ts:
  import { ${const_name} } from './generated/map-${slug}'
  godotMap({ id: 'map-${slug}', slug: '${slug}', name: '...', description: '...', defaultMode: 'free', palette: { ... } }, ${const_name}),
EOF
	exit 0
fi

MAPS=("$@")
if [ ${#MAPS[@]} -eq 0 ]; then
	MAPS=(lembah_sunnyside pesisir_karang dataran_angin kota_pasar)
fi
for map in "${MAPS[@]}"; do
	echo "== $map"
	"$GD" --headless --path . --script "res://scripts/build_${map}.gd" 2>&1 | grep -v "^$" | grep -vE "^[#.a-z@]{64}$"
	"$GD" --path . --script res://scripts/export_map.gd -- "res://maps/${map}.tscn" 2>&1 | grep -E "gambar|tata|ERROR|WARNING|error" || true
done
