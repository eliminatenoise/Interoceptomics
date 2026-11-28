"""Build the standalone guide from the public products pinned in sources.json."""
from __future__ import annotations

import argparse
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path, PurePosixPath
import stat
import subprocess
from urllib.request import urlopen
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
NAME = 'Interoceptomics-Stage-Guide'
STAMP = (2026, 11, 22, 0, 0, 0)


def source_bytes(path, digest, commit, source_blob=None):
    local = REPO / path
    if local.is_file():
        data = local.read_bytes()
        if sha256(data).hexdigest() == digest:
            return data
    # The website may have advanced, for example by adding a link to this ZIP.
    source = source_blob or commit + ':' + path
    data = subprocess.check_output(['git', '-C', str(REPO), 'cat-file', 'blob', source])
    if sha256(data).hexdigest() != digest:
        raise ValueError('Unexpected public source bytes: ' + path)
    return data


def checked_name(name):
    path = PurePosixPath(name)
    if (not name or path.is_absolute() or '..' in path.parts or
            '\\' in name or ':' in name or str(path) != name):
        raise ValueError('Invalid archive member name: ' + name)
    return name


def offline_companions(data, archives):
    text = data.decode('utf-8')
    original = '    caption.textContent=model.reading;'
    if text.count(original) != 1:
        raise ValueError('Stage controls changed; review standalone source transformations.')
    text = text.replace(original, """    const online = new URL(model.url, location.href).origin !== location.origin;
    caption.textContent = model.reading + (online ? ' This companion needs internet access.' : '');""")
    for product in archives.values():
        if 'stage_route' not in product:
            continue
        route = product['stage_route']
        online = f"url: '{route['online']}',"
        local = route['local']
        if text.count(online) != 1 or not any(local.startswith(prefix) for prefix in product['routes']):
            raise ValueError('The bundled companion no longer matches its Stage Guide link.')
        text = text.replace(online, f"url: '{local}',")
    return text.encode('utf-8')


def companion_bytes(product, commit, override, fetch):
    url = product.get('archive_url')
    if url is None:
        return source_bytes(product['path'], product['sha256'], commit, product.get('git_blob'))
    if override is not None:
        content = override.read_bytes()
    elif fetch:
        with urlopen(url, timeout=30) as response:
            content = response.read()
    else:
        raise ValueError('Use --fetch-companions or supply a local copy of ' + product['path'])
    if sha256(content).hexdigest() != product['sha256']:
        raise ValueError('Unexpected companion archive bytes: ' + product['path'])
    return content


def main():
    inventory = json.loads((HERE / 'sources.json').read_text(encoding='utf-8'))
    archives = inventory['companion_archives']
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch-companions', action='store_true', help='Fetch pinned archives from other projects for this build.')
    parser.add_argument('--local-archive', action='append', nargs=2, metavar=('SLUG', 'FILE'), default=[],
                        help='Use an existing copy of a pinned external companion archive.')
    args = parser.parse_args()
    override = {slug: Path(file) for slug, file in args.local_archive}
    if len(override) != len(args.local_archive) or any(slug not in archives or 'archive_url' not in archives[slug] for slug in override):
        parser.error('Each local archive must identify a different external companion.')
    output = REPO / 'downloads/stage-guide' / (NAME + '.zip')
    output.parent.mkdir(parents=True, exist_ok=True)
    temp = output.with_suffix('.zip.tmp')
    entries = {}
    routes = {}
    try:
        with ZipFile(temp, 'w', compression=ZIP_DEFLATED, compresslevel=7) as bundle:
            def add(name, data, mode=0o644):
                name = checked_name(name)
                identity = name.casefold()
                if identity in entries:
                    raise ValueError('Duplicate member: ' + name)
                entries[identity] = (name, sha256(data).hexdigest())
                item = ZipInfo(NAME + '/' + name, STAMP)
                item.create_system = 3
                item.external_attr = (stat.S_IFREG | mode) << 16
                item.compress_type = ZIP_DEFLATED
                bundle.writestr(item, data, compresslevel=7)

            for path, digest in inventory['files'].items():
                data = source_bytes(path, digest, inventory['source_commit'],
                                    inventory.get('file_blobs', {}).get(path))
                if path == 'docs/stages/companions.js':
                    data = offline_companions(data, archives)
                if path.startswith('docs/'):
                    add('www/' + path.removeprefix('docs/'), data)
                else:
                    add(path, data)
                    if path == 'RIGHTS.md':
                        add('www/RIGHTS.md', data)

            for slug, product in archives.items():
                archive = companion_bytes(product, inventory['source_commit'], override.get(slug), args.fetch_companions)
                with ZipFile(BytesIO(archive)) as original:
                    for member in original.infolist():
                        if member.is_dir():
                            continue
                        name = checked_name(member.filename)
                        if stat.S_ISLNK(member.external_attr >> 16):
                            raise ValueError('Unexpected symlink in ' + product['path'])
                        data = original.read(member)
                        mode = 0o755 if member.external_attr >> 16 & 0o111 else 0o644
                        add(f'www/packages/{slug}/{name}', data, mode)
                    for prefix, folder in product['routes'].items():
                        if prefix in routes or folder + 'index.html' not in original.namelist():
                            raise ValueError('Invalid companion route: ' + prefix)
                        routes[prefix] = f'/packages/{slug}/' + folder
                    if slug == 'backslash':
                        for launcher in ('Windows.cmd', 'macOS.command', 'Linux.sh'):
                            data = original.read('Backslash-Atlas/' + launcher)
                            add(launcher, data, 0o644 if launcher.endswith('.cmd') else 0o755)

            add('launch.py', (HERE / 'launch.py').read_bytes())
            add('START-HERE.html', (HERE / 'START-HERE.html').read_bytes())
            add('www/index.html', (HERE / 'home.html').read_bytes())
            add('SOURCES.json', (HERE / 'sources.json').read_bytes())
            add('routes.json', (json.dumps(routes, indent=2, sort_keys=True) + '\n').encode())
            manifest = ''.join(digest + '  ' + name + '\n' for name, digest in sorted(entries.values()))
            add('SHA256SUMS', manifest.encode())
        temp.replace(output)
    finally:
        temp.unlink(missing_ok=True)
    digest = sha256(output.read_bytes()).hexdigest()
    output.with_suffix('.zip.sha256').write_text(digest + '  ' + output.name + '\n')
    print(f'{output.name} · {output.stat().st_size:,} bytes · {len(entries)} files · {digest}')


if __name__ == '__main__':
    main()
