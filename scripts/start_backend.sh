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
#
# The port is cleared before launching. A backend which has crashed can still hold the bind while
# it is being torn down, and a replacement which cannot bind would sit out the whole start-up
# timeout and then be reported as a backend that failed to start, hiding the real reason.

set -u

# How long to wait for a dying backend to let go of the port before giving up on it.
PORT_FREE_TIMEOUT=30
# How long to wait after SIGTERM before resorting to SIGKILL.
PORT_FREE_GRACE=5

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

# Matched on the executable and its --port argument rather than on "carta_backend" and the port
# number appearing anywhere in a command line. Apptainer shares the host PID space, so this scan
# also sees `apptainer exec ... /bin/bash -c "<the whole stage loop>"` -- and that script mentions
# carta_backend in one line and the port in another, which `carta_backend.*$port` matches, since a
# POSIX regex crosses newlines. The loose pattern therefore matched the very process running this
# script, and clear_port killed the stage it was restarting the backend for. The stage loop has no
# --port in it, and no shell is named carta_backend, so requiring both makes only a real backend
# match. (macOS never showed this: its pgrep does not match across the newlines.)
backend_pattern="(^|[/[:space:]])carta_backend[[:space:]].*--port[[:space:]=]+$port([[:space:]]|\$)"

# pgrep is not guaranteed to be in a container image, so fall back to plain ps.
backend_pids() {
    if command -v pgrep >/dev/null 2>&1; then
        pgrep -f "$backend_pattern"
    else
        # By field rather than by a regex over the whole line: the pattern would otherwise appear
        # in awk's own command line, and awk would report the process doing the matching.
        ps -eo pid=,args= 2>/dev/null | awk -v port="$port" '
            {
                argv0 = 0
                for (i = 2; i <= NF; i++)
                    if ($i ~ /(^|\/)carta_backend$/) { argv0 = i; break }
                if (argv0)
                    for (i = argv0 + 1; i <= NF; i++)
                        if (($i == "--port" && $(i + 1) == port) || $i == "--port=" port) {
                            print $1
                            break
                        }
            }'
    fi
}

port_is_busy() {
    (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null
}

clear_port() {
    local pids waited=0 signalled=''

    pids=$(backend_pids)
    if [ -n "$pids" ]; then
        echo "stopping carta_backend still holding port $port (PID $(echo $pids | tr '\n' ' '))"
        kill $pids 2>/dev/null
        signalled=yes
    fi

    while [ "$waited" -lt "$PORT_FREE_TIMEOUT" ]; do
        if ! port_is_busy; then
            return 0
        fi
        # Something is still listening. Give a signalled backend a few seconds to exit on its own
        # terms -- it may be writing the sanitizer report we want -- and only then force it.
        if [ -n "$signalled" ] && [ "$waited" -eq "$PORT_FREE_GRACE" ]; then
            pids=$(backend_pids)
            if [ -n "$pids" ]; then
                kill -9 $pids 2>/dev/null
            fi
        fi
        sleep 1
        waited=$((waited + 1))
    done

    return 1
}

if ! clear_port; then
    echo "port $port is still in use after ${PORT_FREE_TIMEOUT}s; not starting carta_backend" >&2
    exit 1
fi

if ! cd "$build_dir"; then
    echo "no such build directory: $build_dir" >&2
    exit 1
fi

launch_backend() {
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
}

max_attempts=3
attempt=1
attempt_timeout=$((timeout / max_attempts))
if [ "$attempt_timeout" -lt 10 ]; then
    max_attempts=1
    attempt_timeout=$timeout
fi

while :; do
    launch_backend

    # A PID only says the backend forked; the tests need the port to be bound. The log is left out
    # here so that a retried attempt does not tail it once per try.
    if bash "$script_dir/wait_for_backend.sh" "$port" "$attempt_timeout"; then
        echo "carta_backend is listening on port $port with PID $backend_pid"
        exit 0
    fi

    # Still running, just not listening yet: it is slow or wedged, and launching a second copy
    # would only fight the first one for the port.
    if kill -0 "$backend_pid" 2>/dev/null; then
        break
    fi

    # Gone already, so it never got as far as listening. The usual reason after a crash is that it
    # could not bind: connections from the previous backend can sit in TIME_WAIT for a while after
    # it has stopped accepting, which is invisible to a connect-based check. That clears by itself,
    # so try again instead of spending the rest of the budget waiting on a process which has exited.
    if [ "$attempt" -ge "$max_attempts" ]; then
        break
    fi
    attempt=$((attempt + 1))
    echo "carta_backend exited before it started listening; retrying ($attempt of $max_attempts)"
done

# Report the failure the same way every other check does, with the tail of the log attached.
bash "$script_dir/wait_for_backend.sh" "$port" 0 "$log_file"
exit 1
