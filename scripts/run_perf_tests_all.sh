#!/bin/bash
set -e  # stop on first failure

CI=true npm test -- src/performance > perf-test.log 2>&1
