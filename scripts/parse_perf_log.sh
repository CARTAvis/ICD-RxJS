#!/bin/bash
set -euo pipefail

FILE="${1:-}"

if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "Usage: $0 <logfile>"
  exit 1
fi

awk '
BEGIN {
    # ------------------------------------------
    # Define target texts (edit freely)
    # ------------------------------------------
    targets[1] = "Image should return one after one and the last channel is correct:"
    targets[2] = "Receive a series of moment progress within"
    targets[3] = "PV Response should arrived within"
    targets[4] = "SPECTRAL_PROFILE_DATA stream should arrive within"
    targets[5] = "ContourImageData responses should arrive within"
    targets[6] = "REGION_HISTOGRAM_DATA should arrive completely within"
    targets[7] = "RasterTileData responses should arrive within"
    targets[8] = "OPEN_FILE_ACK and REGION_HISTOGRAM_DATA should arrive within"

    # ------------------------------------------
    # Automatically count targets
    # ------------------------------------------
    ntargets = 0
    for (i in targets) {
        ntargets++
    }
}

/^PASS / {
    pass_line = $0
    next
}

{
    for (i = 1; i <= ntargets; i++) {
        t = targets[i]
        if (index($0, t)) {

            if (match($0, /\([0-9]+ ms\)/)) {
                s = substr($0, RSTART, RLENGTH)
                gsub(/[()]/, "", s)
                gsub(/ ms/, "", s)
                print pass_line " -> " t " -> " s " ms"
            } else {
                print pass_line " -> " t " -> (no time found)"
            }
        }
    }
}
' "$FILE"
