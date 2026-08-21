#!/bin/bash
#
# Start carta_backend and wait until it is accepting connections.
#
# Both CI actions used to carry their own copy of this command line, which made it easy for the
# two to drift and impossible to bring the backend back up from inside a test loop. With one
# script a stage can restart a crashed backend using exactly the invocation it was started with,
# so the files after the crash still run against a real backend instead of all reporting the same
# connection failure.
#
# Usage: start_backend.sh SRC_DIR BUILD_DIR PORT LOG_FILE [TIMEOUT_SECONDS]
#
# The backend's output is appended to LOG_FILE, so a restart leaves the previous crash report in
# place rather than overwriting the very thing we started the backend again to explain. Exits
# non-zero, with the tail of the log, if the backend does not start listening within
# TIMEOUT_SECONDS (default 120).

set -u

src_dir=${1:-}
build_dir=${2:-}
port=${3:-}
log_file=${4:-}
timeout=${5:-120}

if [ -z "$src_dir" ] || [ -z "$build_dir" ] || [ -z "$port" ] || [ -z "$log_file" ]; then
    echo "usage: $0 SRC_DIR BUILD_DIR PORT LOG_FILE [TIMEOUT_SECONDS]" >&2
    exit 2
fi

# Resolved before the cd below, so that wait_for_backend.sh is found next to this script whatever
# directory the caller happens to be in.
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

if ! cd "$build_dir"; then
    echo "no such build directory: $build_dir" >&2
    exit 1
fi

ASAN_OPTIONS=suppressions=$src_dir/debug/asan/myasan.supp \
LSAN_OPTIONS=suppressions=$src_dir/debug/asan/myasan-leaks.supp \
ASAN_SYMBOLIZER_PATH=llvm-symbolizer \
./carta_backend /images \
    --top_level_folder /images \
    --port "$port" \
    --omp_threads=4 \
    --debug_no_auth \
    --no_frontend \
    --no_database \
    --no_log \
    --verbosity=5 >> "$log_file" 2>&1 &

backend_pid=$!

# A PID only says the backend forked; the tests need the port to be bound.
if ! bash "$script_dir/wait_for_backend.sh" "$port" "$timeout" "$log_file"; then
    exit 1
fi

echo "carta_backend is listening on port $port with PID $backend_pid"
