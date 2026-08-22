#!/bin/bash
#
# Run one ICD test stage against a running carta_backend, restarting the backend if it dies.
#
# Both CI actions used to carry their own copy of this loop. Keeping them in step meant editing the
# same logic twice, once as ordinary shell and once as a backslash-escaped string inside
# `apptainer exec ... /bin/bash -c "..."`, where every quote and every `$` has to be escaped by hand
# and a mistake is a runtime error on a self-hosted runner rather than something a reviewer can see.
#
# Usage: run_test_stage.sh SRC_DIR BUILD_DIR PORT STAGE_NAME LOG_FILE [MAX_RESTARTS]
#
# Runs every file listed in ICD_test_stages/STAGE_NAME.tests, one `npm test` each, and exits
# non-zero if any file failed twice or the backend crashed at any point. SRC_DIR and BUILD_DIR are
# needed only to restart the backend with the invocation it was started with.
#
# Deliberately no `set -u`, unlike its sibling scripts: bash 3.2 -- which is what macOS runs `run:`
# blocks with -- treats "${empty_array[@]}" as an unbound variable, and this script cannot avoid
# expanding arrays which are empty on a clean run. `set -e` is left out for the same reason it is
# left out of the actions: every command whose failure matters is already tested by hand, and the
# ones whose failure does not matter (a test file failing, a liveness probe) are the normal path.

# A stage tolerates this many crashes and keeps testing. Past it the backend is not coming back in
# any useful sense, and the remaining files would each report the same connection failure.
DEFAULT_MAX_RESTARTS=3
# A restart gets a shorter budget than the 120s cold start. The binary is warm by now, and the job
# itself is capped: three restarts at the full budget would spend the cap on waiting and get the
# stage cancelled before it could report anything, which is exactly how this showed up -- an
# exit 143 in the middle of a restart. 90s still leaves 30s an attempt, which is what the old
# harness allowed a restart.
RESTART_TIMEOUT=90

src_dir=${1:-}
build_dir=${2:-}
port=${3:-}
stage_name=${4:-}
log_file=${5:-}
max_restarts=${6:-$DEFAULT_MAX_RESTARTS}

if [ -z "$src_dir" ] || [ -z "$build_dir" ] || [ -z "$port" ] || [ -z "$stage_name" ] || [ -z "$log_file" ]; then
    echo "usage: $0 SRC_DIR BUILD_DIR PORT STAGE_NAME LOG_FILE [MAX_RESTARTS]" >&2
    exit 2
fi

# This script lives in ICD-RxJS/scripts/, so the checkout it belongs to is its own grandparent.
# Derived rather than passed in: the two actions put the checkout in different places, and a path
# which disagreed with the script actually running would be the kind of mistake that only shows up
# on a runner.
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
icd_dir=$(dirname "$script_dir")

stage_file="$icd_dir/ICD_test_stages/$stage_name.tests"
if [ ! -f "$stage_file" ]; then
    echo "no such test stage: $stage_file" >&2
    exit 2
fi

if ! cd "$icd_dir"; then
    echo "no such ICD-RxJS directory: $icd_dir" >&2
    exit 2
fi

cat "$stage_file"

# Read with a loop rather than mapfile: macOS ships bash 3.2, which does not have it. The
# `|| [ -n "$line" ]` keeps the last entry of a file with no trailing newline.
test_files=()
while IFS= read -r line || [ -n "$line" ]; do
    test_files+=("$line")
done < "$stage_file"

failed_tests=()
retried_tests=()
crash_sites=()
skipped_tests=()
restarts=0

for test_index in "${!test_files[@]}"; do
    test_file="${test_files[$test_index]}"
    [ -n "$test_file" ] || continue  # Skip empty lines

    first_attempt_failed=''
    if ! CI=true npm test -- "$test_file"; then
        first_attempt_failed=yes
    fi

    # A backend which has died takes every remaining file in the stage with it, each reporting a
    # connection failure instead of the crash which actually caused it. The tests hold no state in
    # the backend -- every file connects and loads for itself -- so a fresh backend lets the rest of
    # the stage run for real.
    if ! bash "$script_dir/wait_for_backend.sh" "$port" 0 "$log_file"; then
        crash_sites+=("$test_file")
        if [ "$restarts" -ge "$max_restarts" ]; then
            echo "carta_backend crashed after $test_file and has already been restarted $restarts times; abandoning the rest of the stage"
            skipped_tests=("${test_files[@]:$((test_index + 1))}")
            break
        fi
        restarts=$((restarts + 1))
        echo "carta_backend crashed after $test_file; restarting ($restarts of $max_restarts)"
        if ! bash "$script_dir/start_backend.sh" "$src_dir" "$build_dir" "$port" "$log_file" "$RESTART_TIMEOUT"; then
            echo "carta_backend could not be restarted; abandoning the rest of the stage"
            skipped_tests=("${test_files[@]:$((test_index + 1))}")
            break
        fi
    fi

    # The retry comes after the liveness check so that a file which failed because the backend died
    # underneath it is retried against the replacement rather than against nothing. One retry,
    # reported either way: the harness this replaces retried silently, which made a file that failed
    # once and passed once look exactly like a clean one.
    if [ -n "$first_attempt_failed" ]; then
        echo "$test_file failed; retrying once"
        if CI=true npm test -- "$test_file"; then
            retried_tests+=("$test_file")
        else
            failed_tests+=("$test_file")
        fi
    fi
done

if [ ${#crash_sites[@]} -ne 0 ]; then
    echo "carta_backend crashed after:"
    printf '  %s\n' "${crash_sites[@]}"
fi

if [ ${#retried_tests[@]} -ne 0 ]; then
    echo "The following tests failed once and passed on a retry:"
    printf '  %s\n' "${retried_tests[@]}"
fi

# Filtered rather than printed directly: slicing a bash 3.2 array past its last element yields one
# empty string rather than nothing, which would otherwise be reported as a test that did not run.
remaining_tests=()
for skipped_test in "${skipped_tests[@]}"; do
    if [ -n "$skipped_test" ]; then
        remaining_tests+=("$skipped_test")
    fi
done
if [ ${#remaining_tests[@]} -ne 0 ]; then
    echo "The following tests did not run:"
    printf '  %s\n' "${remaining_tests[@]}"
fi

if [ ${#failed_tests[@]} -ne 0 ]; then
    echo "The following tests failed:"
    printf '%s\n' "${failed_tests[@]}"
fi

# A crash fails the stage even when every test which managed to run passed: the point of this
# harness is that a backend dying is itself the result worth reporting.
if [ ${#failed_tests[@]} -ne 0 ] || [ ${#crash_sites[@]} -ne 0 ]; then
    exit 1
fi
exit 0
