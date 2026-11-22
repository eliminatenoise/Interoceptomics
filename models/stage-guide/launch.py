"""Open the extracted Interoceptomics experiment guide on this computer."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
from threading import Thread
from urllib.parse import quote, urlsplit
import webbrowser


class GuideHandler(SimpleHTTPRequestHandler):
    """Keep the published guide paths pointing to the companion editions included here."""

    def __init__(self, *args, aliases, **kwargs):
        self.aliases = aliases
        super().__init__(*args, **kwargs)

    def send_head(self):
        request = urlsplit(self.path)
        for prefix, target in self.aliases:
            if request.path == prefix.rstrip('/') or request.path.startswith(prefix):
                suffix = request.path[len(prefix):]
                location = quote(target, safe='/') + suffix
                if request.query:
                    location += '?' + request.query
                self.send_response(302)
                self.send_header('Location', location)
                self.send_header('Content-Length', '0')
                self.end_headers()
                return None
        return super().send_head()


def open_browser(url):
    try:
        opened = webbrowser.open(url)
    except (OSError, webbrowser.Error):
        opened = False
    if not opened:
        print('Open the printed address in your browser.', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--no-browser', action='store_true', help='Print the local address without opening a browser.')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    website = root / 'www'
    if not (website / 'stages' / 'index.html').is_file() or not (root / 'routes.json').is_file():
        print('Extract the entire stage guide ZIP into one folder and open the launcher again.', file=sys.stderr)
        return 1
    routes = json.loads((root / 'routes.json').read_text(encoding='utf-8'))
    aliases = sorted(routes.items(), key=lambda item: len(item[0]), reverse=True)
    handler = partial(GuideHandler, directory=str(website), aliases=aliases)
    try:
        server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    except OSError as exc:
        print(f'The local guide could not start: {exc}', file=sys.stderr)
        return 1
    try:
        url = f'http://127.0.0.1:{server.server_port}/stages/'
        print('Open', url, flush=True)
        if not args.no_browser:
            # Some browser openers wait for the page to load before returning.
            Thread(target=open_browser, args=(url,), daemon=True).start()
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
