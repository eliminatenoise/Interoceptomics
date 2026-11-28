"""Serve the optional, release-verified NeuroSurge Lite ZIP on its own loopback origin."""

from contextlib import contextmanager
from functools import partial
from hashlib import sha256
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import PurePosixPath
from shutil import copyfileobj
from threading import Thread
from urllib.parse import quote, unquote, urlsplit
from zipfile import ZipFile


PREFIX = 'NeuroSurge Lite/'
ENTRY = 'scene/example/preview.html'
SETUP = '/stages/simple.html#neurosurge-offline'
MIME = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.obj': 'text/plain; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.wasm': 'application/wasm',
    '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream',
}
CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; "
       "base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
WORKER_CSP = ("default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; "
              "object-src 'none'; base-uri 'none'; frame-ancestors 'none'")


class GameHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, archive, **kwargs):
        self.archive = archive
        super().__init__(*args, **kwargs)

    def do_GET(self):
        self.send_file(body=True)

    def do_HEAD(self):
        self.send_file(body=False)

    def send_file(self, body):
        port = self.server.server_port
        if self.headers.get('Host') not in (f'127.0.0.1:{port}', f'localhost:{port}'):
            self.send_error(403)
            return
        request = urlsplit(self.path)
        path = unquote(request.path)
        if request.netloc or not path.startswith('/') or '\\' in path or any(
                p.startswith('.') for p in path.split('/')):
            self.send_error(404)
            return
        member = path[1:] + ('index.html' if path.endswith('/') else '')
        try:
            entry = self.archive.getinfo(PREFIX + member)
        except KeyError:
            if PREFIX + member + '/index.html' in self.archive.NameToInfo:
                self.send_response(301)
                self.send_header('Location', quote(path, safe='/') + '/' + (('?' + request.query) if request.query else ''))
                self.send_header('Content-Length', '0')
                self.end_headers()
            else:
                self.send_error(404)
            return
        playable = member in (ENTRY, 'movement-mirror.html')
        policy = WORKER_CSP if member == 'scene/src/camera/pose-worker.js' else CSP
        if playable:
            policy += "; media-src 'self' blob:"
        allowed = '(self)' if playable else '()'
        tag = f'"{entry.CRC:08x}-{entry.file_size:x}"'
        fresh = tag in [value.strip() for value in self.headers.get('If-None-Match', '').split(',')]
        self.send_response(304 if fresh else 200)
        self.send_header('Content-Security-Policy', policy)
        self.send_header('Permissions-Policy', f'camera={allowed}, microphone={allowed}, geolocation=(), usb=(), serial=()')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('ETag', tag)
        if not fresh:
            name = PurePosixPath(member)
            mime = ('text/plain; charset=utf-8' if name.name in ('LICENSE', 'SHA256SUMS', 'NOTICE', 'README')
                    else MIME.get(name.suffix.lower(), 'application/octet-stream'))
            self.send_header('Content-Type', mime)
            self.send_header('Content-Length', str(entry.file_size))
        self.end_headers()
        if body and not fresh:
            with self.archive.open(entry) as stream:
                try:
                    copyfileobj(stream, self.wfile, length=128 * 1024)
                except (BrokenPipeError, ConnectionResetError):
                    pass


@contextmanager
def optional_game(root, config):
    """Use the exact game beside the launcher or beside its folder, if supplied."""
    fallback = SETUP
    for directory in (root, root.parent):
        path = directory / config['filename']
        try:
            if path.stat().st_size != config['bytes']:
                fallback = '/stages/simple.html#game-edition'
                continue
            with path.open('rb') as stream:
                data = stream.read(config['bytes'] + 1)
        except FileNotFoundError:
            continue
        except OSError:
            fallback = '/stages/simple.html#game-edition'
            continue
        if sha256(data).hexdigest() != config['sha256']:
            fallback = '/stages/simple.html#game-edition'
            continue
        with ZipFile(BytesIO(data)) as archive:
            archive.getinfo(PREFIX + ENTRY)
            try:
                server = ThreadingHTTPServer(('127.0.0.1', 0), partial(GameHandler, archive=archive))
            except OSError:
                yield '/stages/simple.html#game-launch'
                return
            with server:
                thread = Thread(target=server.serve_forever, daemon=True)
                thread.start()
                try:
                    yield f'http://127.0.0.1:{server.server_port}/{ENTRY}?edition=lite'
                finally:
                    server.shutdown()
                    thread.join()
        return
    yield fallback
