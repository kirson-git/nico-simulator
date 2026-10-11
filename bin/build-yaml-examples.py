#!/usr/bin/env python3
"""Bundle the prepared training YAMLs without access to a live lab checkout."""
import hashlib
import json
from pathlib import Path

simulator = Path(__file__).resolve().parents[1]
source = simulator / 'examples/dpf'
manifest = json.loads((source / 'manifest.json').read_text())
result = {}
for key, entry in manifest.items():
    path = source / entry['file']
    raw = path.read_bytes()
    result[key] = {
        'source': entry['originalSource'],
        'sha256': entry['originalSha256'],
        'trainingSource': path.relative_to(simulator).as_posix(),
        'trainingSha256': hashlib.sha256(raw).hexdigest(),
        'yaml': raw.decode(),
    }
(simulator / 'web/yaml-examples.json').write_text(json.dumps(result, indent=2) + '\n')
print(f'Bundled {len(result)} prepared YAML examples from examples/dpf/.')
