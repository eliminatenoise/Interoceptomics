#!/bin/sh
set -eu
cd -- "$(dirname -- "$0")"
page=index.html
if [ -f docs/stride-signals/index.html ]; then
    page=docs/stride-signals/index.html
fi
exec open "$PWD/$page"
