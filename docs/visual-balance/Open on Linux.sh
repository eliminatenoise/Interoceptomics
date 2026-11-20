#!/bin/sh
set -eu
cd -- "$(dirname -- "$0")"
exec xdg-open "$PWD/index.html"
