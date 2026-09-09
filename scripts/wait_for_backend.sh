#!/bin/bash
#
# Wait until carta_backend is accepting connections on a port.
#
# The CI actions used to take `pgrep` as proof that the backend was up, but pgrep matches as soon
# as the process has forked, which is well before it has bound the port -- and `pgrep ... | head`
# reports the exit status of head, so a backend which never started at all still looked like a
# success. The tests then opened the stage against a port nobody was listening on and reported it
# as a connection failure in the first test file, or, if the backend died part way through a
# stage, as the same failure in every file after it.
#
# Connecting is the only check which answers the question the tests actually ask, so that is what
# this does, using bash's own /dev/tcp redirection rather than a tool which may be missing from a
# container.
#
# Usage: wait_for_backend.sh PORT [TIMEOUT_SECONDS] [LOG_FILE]
#
# A timeout of 0 (the default) makes a single immediate check, which is how a stage asks whether
# the backend it started is still alive. LOG_FILE, if given, is tailed to stderr on failure, so
# that a crash is reported where the stage failed instead of only in an uploaded artifact.

set -u

port=${1:-}
timeout=${2:-0}
log_file=${3:-}

if [ -z "$port" ]; then
    echo "usage: $0 PORT [TIMEOUT_SECONDS] [LOG_FILE]" >&2
    exit 2
fi

deadline=$((SECONDS + timeout))

while :; do
    # The subshell keeps the descriptor from leaking into the caller and turns a refused
    # connection into an ordinary non-zero status rather than a message on stderr.
    if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
        exit 0
    fi
    if [ "$SECONDS" -ge "$deadline" ]; then
        break
    fi
    sleep 1
done

if [ "$timeout" -eq 0 ]; then
    echo "carta_backend is not listening on port $port" >&2
else
    echo "carta_backend did not start listening on port $port within ${timeout}s" >&2
fi

if [ -n "$log_file" ] && [ -f "$log_file" ]; then
    echo "--- last 100 lines of $log_file ---" >&2
    tail -n 100 "$log_file" >&2
fi

exit 1
