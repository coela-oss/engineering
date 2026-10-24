"""Exercise admission failures without running a native binary."""
import hashlib
import importlib.util
import io
from pathlib import Path
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('runtime', Path(__file__).resolve().parents[1] / 'scripts/prepare-hat-runtime.py')
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)


class Admission(unittest.TestCase):
    def check(self, kind):
        with tempfile.TemporaryDirectory() as temp:
            archive = Path(temp) / 'bundle.gz'
            binary = b'fixture-only'
            with tarfile.open(archive, 'w:gz') as tar:
                info = tarfile.TarInfo('bin/hat-software-architect-worker')
                info.size = len(binary)
                tar.addfile(info, io.BytesIO(binary))
                if kind in ('link', 'traversal', 'duplicate'):
                    other = tarfile.TarInfo({'link': 'source/link', 'traversal': '../escape', 'duplicate': info.name}[kind])
                    if kind == 'link':
                        other.type = tarfile.SYMTYPE
                        other.linkname = '/etc/passwd'
                    tar.addfile(other)
            plan = {'archiveSha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
                    'binaryPath': info.name, 'binarySha256': hashlib.sha256(binary).hexdigest()}
            if kind == 'archive_hash':
                plan['archiveSha256'] = '0' * 64
            if kind == 'binary_hash':
                plan['binarySha256'] = '0' * 64
            target = Path(temp) / 'runtime'
            if kind == 'valid':
                runtime.admit(archive, target, plan)
                self.assertEqual((target / 'hat-software-architect-worker').read_bytes(), binary)
                self.assertEqual((target / 'hat-software-architect-worker').stat().st_mode & 0o777, 0o700)
                with self.assertRaises(FileExistsError):
                    runtime.admit(archive, target, plan)
            else:
                with self.assertRaises(ValueError):
                    runtime.admit(archive, target, plan)
                self.assertFalse(target.exists())

    def test_admission(self):
        for kind in ('valid', 'archive_hash', 'binary_hash', 'link', 'traversal', 'duplicate'):
            with self.subTest(kind=kind):
                self.check(kind)
