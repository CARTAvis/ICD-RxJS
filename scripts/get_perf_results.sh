#!/bin/bash
set -euo pipefail

FILE="${1:-}"
if [[ -z "$FILE" || ! -f "$FILE" ]]; then
  echo "Usage: $0 <logfile>"
  exit 2
fi

get_time_by_key() {
  local key="$1"
  local ms
  ms="$(grep -F -- "$key" "$FILE" | head -n 1 | sed -E 's/.*-> ([0-9]+) ms/\1/')"
  printf '%s %s ms\n' "$key" "$ms"
}

get_time_by_key "PERF_ANIMATOR_CONTOUR_CASA.test.ts"
get_time_by_key "PERF_ANIMATOR_CONTOUR_HDF5.test.ts"
get_time_by_key "PERF_ANIMATOR_CONTOUR_FITS.test.ts"
get_time_by_key "PERF_MOMENTS_CASA.test.ts"
get_time_by_key "PERF_MOMENTS_FITS.test.ts"
get_time_by_key "PERF_MOMENTS_HDF5.test.ts"
get_time_by_key "PERF_PV_CASA.test.ts"
get_time_by_key "PERF_PV_HDF5.test.ts"
get_time_by_key "PERF_PV_FITS.test.ts"
get_time_by_key "PERF_REGION_SPECTRAL_PROFILE_CASA.test.ts"
get_time_by_key "PERF_REGION_SPECTRAL_PROFILE_HDF5.test.ts"
get_time_by_key "PERF_REGION_SPECTRAL_PROFILE_FITS.test.ts"
get_time_by_key "PERF_CONTOUR_DATA_Mode2.test.ts"
get_time_by_key "PERF_CONTOUR_DATA_Mode0.test.ts"
get_time_by_key "PERF_CONTOUR_DATA_Mode1.test.ts"
get_time_by_key "PERF_CUBE_HISTOGRAM_CASA.test.ts"
get_time_by_key "PERF_CUBE_HISTOGRAM_FITS.test.ts"
get_time_by_key "PERF_CUBE_HISTOGRAM_HDF5.test.ts"
get_time_by_key "PERF_RASTER_TILE_DATA_CASA.test.ts"
get_time_by_key "PERF_RASTER_TILE_DATA_FITS.test.ts"
get_time_by_key "PERF_RASTER_TILE_DATA_HDF5.test.ts"
get_time_by_key "PERF_LOAD_IMAGE_CASA.test.ts"
get_time_by_key "PERF_LOAD_IMAGE_HDF5.test.ts"
get_time_by_key "PERF_LOAD_IMAGE_FITS.test.ts"
