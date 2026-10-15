"""Generate config/om2-units.json from a pinned OM-2 snapshot.

Fetch the pinned file outside the repository (never commit it, it is
2 MB) and rerun from resfulservice/:

    rdf="$(mktemp -d)/om-2.0.rdf"
    curl -L -o "$rdf" https://raw.githubusercontent.com/HajoRijgersberg/OM/\
dceffeccdcfae55af2738ec92c0a66c976e68059/om-2.0.rdf
    python -I script/om2_units.py "$rdf"

The output maps each OM-2 unit local name to its om:symbol and
om:alternativeSymbol values. The script also checks the hand-kept
config/om2-unit-overrides.json and exits non-zero, naming offenders, when
an exact key belongs to several units without a tie-break, or when an
override targets something that is not an OM-2 unit.
"""
import hashlib
import json
import os
import sys
from collections import defaultdict

from rdflib import Graph, Namespace, RDF, RDFS

OM_COMMIT = 'dceffeccdcfae55af2738ec92c0a66c976e68059'
OM_VERSION = '2.0.59'
OM_URL = ('https://raw.githubusercontent.com/HajoRijgersberg/OM/'
          + OM_COMMIT + '/om-2.0.rdf')
OM_SHA256 = '74b1d65d502852de80be6d71ce1603de686c8807228d5319fadc15e71d040b6e'

OM = Namespace('http://www.ontology-of-units-of-measure.org/resource/om-2/')
CONFIG = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      '..', 'config')
OUT_PATH = os.path.join(CONFIG, 'om2-units.json')
OVERRIDES_PATH = os.path.join(CONFIG, 'om2-unit-overrides.json')


def unit_keys(graph):
    """Return {local name: sorted keys} for every OM-2 unit."""
    classes = set(graph.transitive_subjects(RDFS.subClassOf, OM.Unit))
    units = set()
    for cls in classes:
        units.update(graph.subjects(RDF.type, cls))
    keys = {}
    for unit in units:
        if not str(unit).startswith(str(OM)):
            continue
        found = set()
        for pred in (OM.symbol, OM.alternativeSymbol):
            found.update(str(v) for v in graph.objects(unit, pred))
        keys[str(unit)[len(str(OM)):]] = sorted(found)
    return keys


def check_overrides(keys, overrides):
    """Return (keys owned by several units, problem lines for overrides)."""
    owners = defaultdict(set)
    for name, unit_codes in keys.items():
        for code in unit_codes:
            owners[code].add(name)
    tie_breaks = overrides.get('tieBreaks', {})
    problems = []
    collisions = sorted(c for c, o in owners.items() if len(o) > 1)
    for code in collisions:
        if code not in tie_breaks:
            problems.append('no tie-break for %r (units: %s)'
                            % (code, ', '.join(sorted(owners[code]))))
    for table in ('tieBreaks', 'aliases'):
        for code, target in sorted(overrides.get(table, {}).items()):
            if target not in keys:
                problems.append('%s[%r] -> %r is not an OM-2 unit'
                                % (table, code, target))
    return collisions, problems


def main(argv):
    if len(argv) != 2:
        sys.exit('usage: om2_units.py PATH/TO/om-2.0.rdf')
    with open(argv[1], 'rb') as f:
        data = f.read()
    digest = hashlib.sha256(data).hexdigest()
    if digest != OM_SHA256:
        sys.exit('refusing %s: SHA-256 %s, expected %s'
                 % (argv[1], digest, OM_SHA256))
    graph = Graph()
    graph.parse(data=data, format='xml')
    keys = unit_keys(graph)

    with open(OVERRIDES_PATH, encoding='utf-8') as f:
        overrides = json.load(f)
    collisions, problems = check_overrides(keys, overrides)

    lines = ['{',
             '  "source": ' + json.dumps({
                 'repository': 'HajoRijgersberg/OM', 'commit': OM_COMMIT,
                 'file': 'om-2.0.rdf', 'version': OM_VERSION,
                 'url': OM_URL, 'sha256': OM_SHA256}, sort_keys=True) + ',',
             '  "units": {',
             ',\n'.join('    %s: %s' % (
                 json.dumps(name, ensure_ascii=False),
                 json.dumps(keys[name], ensure_ascii=False))
                 for name in sorted(keys)),
             '  }', '}']
    with open(OUT_PATH, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines) + '\n')
    print('%d units, %d colliding keys -> %s'
          % (len(keys), len(collisions), os.path.normpath(OUT_PATH)))

    if problems:
        for line in problems:
            print('error: ' + line, file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main(sys.argv)
