"""Admit the fixed public offline-review binary; never extract release source."""
import gzip
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import sys
import tarfile

LIMIT = 8 * 1024 * 1024


def admit(archive, destination, plan):
    with open(archive, 'rb') as stream:
        compressed = stream.read(LIMIT + 1)
    if len(compressed) > LIMIT or hashlib.sha256(compressed).hexdigest() != plan['archiveSha256']:
        raise ValueError('Archive size/hash mismatch')
    with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as stream:
        expanded = stream.read(2 * LIMIT + 1)
    if len(expanded) > 2 * LIMIT:
        raise ValueError('Expanded archive exceeds limit')
    with tarfile.open(fileobj=io.BytesIO(expanded), mode='r:') as tar:
        members = tar.getmembers()
        if len(members) > 512:
            raise ValueError('Too many archive entries')
        names = set()
        binary = None
        for member in members:
            path = PurePosixPath(member.name)
            if (path.is_absolute() or '..' in path.parts or member.name in names
                    or not (member.isfile() or member.isdir())):
                raise ValueError('Unsafe or duplicate archive member')
            names.add(member.name)
            if member.name == plan['binaryPath']:
                if not member.isfile() or member.size > LIMIT:
                    raise ValueError('Invalid binary member')
                binary = tar.extractfile(member).read(LIMIT + 1)
        if binary is None or hashlib.sha256(binary).hexdigest() != plan['binarySha256']:
            raise ValueError('Binary missing/hash mismatch')
    destination = Path(destination)
    destination.mkdir(mode=0o700)  # An existing target is never overwritten.
    output = destination / 'hat-software-architect-worker'
    with output.open('xb') as stream:
        stream.write(binary)
    output.chmod(0o700)


if __name__ == '__main__':
    plan_path = Path(__file__).resolve().parent.parent / 'integrations/hat/review-runtime.json'
    admit(sys.argv[1], sys.argv[2], json.loads(plan_path.read_text()))
