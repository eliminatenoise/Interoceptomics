#!/bin/sh
cd -- "$(dirname -- "$0")" || exit 1
if ! python3 -c 'import numpy' >/dev/null 2>&1; then
    echo 'This example needs Python 3 and NumPy. See README.md for setup.'
    exit 1
fi
python3 predict.py
status=$?
if [ -t 0 ]; then
    printf 'Press Enter to close. '
    read -r reply
fi
exit "$status"
