#!/bin/bash
# with-low-priority.sh - run heavyweight commands at below-normal priority.
# HOUSE RULE (2026-11-08): heavy steps go through this wrapper.
# Usage: scripts/with-low-priority.sh npm run build
# Windows equivalent: (Get-Process -Id $PID).PriorityClass = 'BelowNormal'
exec nice -n 10 ionice -c3 "$@"
