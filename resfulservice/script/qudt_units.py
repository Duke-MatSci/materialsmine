"""Generate config/qudt-units.json from a pinned QUDT unit vocabulary.

The pinned file is bundled, byte-identical, at
services/app/ontology/data/qudt-units-v3.5.3.ttl; the managed service
loads the same copy into Fuseki. Rerun from resfulservice/:

    python -I script/qudt_units.py \
../services/app/ontology/data/qudt-units-v3.5.3.ttl

It is upstream's VOCAB_QUDT-UNITS-ALL.ttl at the tag and commit pinned
below (QUDT_URL), and the script refuses a file whose SHA-256 is not
QUDT_SHA256.

The output maps each current QUDT unit's local name to its spellings,
the strings the lookup matches exactly and case-sensitively: its
qudt:symbol, qudt:altSymbol, qudt:ucumCode and qudt:udunitsCode values
and its English rdfs:label and skos:altLabel values. Spellings are kept
exactly as QUDT writes them: no generated names and no superscript, caret
or dot variants. Deprecated units and currency units get no spellings.
Deprecated units are listed apart, each with its dcterms:isReplacedBy unit when QUDT names one.

When several units share a spelling and are all qudt:exactMatch to one another,
the spelling is kept for one of them only: the one whose own symbol it is, else
the first by local name. A spelling still shared by several units is a
collision. Collisions are printed for review and are not errors; the
lookup leaves such a spelling unlinked unless config/qudt-unit-overrides.json
gives it a tie-break.

The overrides file holds one table, tieBreaks, which
src/utils/unit-lookup.js applies: for a colliding spelling, the one of its
owners the spelling links. The script exits non-zero, naming offenders, when a
tie-break targets something that is not a current QUDT unit or one of the
spelling's owners, or names a spelling that is not a collision.
"""
import hashlib
import json
import os
import sys
from collections import defaultdict

from rdflib import Graph, Literal, Namespace, RDF, RDFS
from rdflib.namespace import DCTERMS, SKOS

QUDT_REPOSITORY = 'qudt/qudt-public-repo'
QUDT_TAG = 'v3.5.3'
QUDT_COMMIT = '07acd3f9ee2c7189341f322c85154ca63c9198f2'
QUDT_FILE = 'src/main/rdf/vocab/unit/VOCAB_QUDT-UNITS-ALL.ttl'
QUDT_URL = ('https://raw.githubusercontent.com/' + QUDT_REPOSITORY + '/'
            + QUDT_COMMIT + '/' + QUDT_FILE)
QUDT_SHA256 = ('5e84f3e10ae6a3c535e2e7616dc2affee09dd52b'
               'ea5229822188730493fd4418')
QUDT_LICENSE = ('CC BY 4.0 (QUDT.org). UCUM codes are from the UCUM '
                'specification, (c) Regenstrief Institute, under the UCUM '
                'licence.')

QUDT = Namespace('http://qudt.org/schema/qudt/')
UNIT = Namespace('http://qudt.org/vocab/unit/')
CURRENCY_TYPES = (QUDT.CurrencyUnit, QUDT.DigitalCurrencyUnit)
ENGLISH = (None, 'en', 'en-us')

CONFIG = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      '..', 'config')
OUT_PATH = os.path.join(CONFIG, 'qudt-units.json')
OVERRIDES_PATH = os.path.join(CONFIG, 'qudt-unit-overrides.json')


def local_name(node):
    return str(node)[len(str(UNIT)):]


def is_english(literal):
    language = getattr(literal, 'language', None)
    return (language.lower() if language else None) in ENGLISH


def read_units(graph):
    """Return (current units, {deprecated unit: replacement or None})."""
    current, deprecated = set(), {}
    for node in graph.subjects(RDF.type, QUDT.Unit):
        if not str(node).startswith(str(UNIT)):
            continue
        if (node, QUDT.deprecated, Literal(True)) in graph:
            replacements = sorted(local_name(r) for r in
                                  graph.objects(node, DCTERMS.isReplacedBy))
            deprecated[local_name(node)] = replacements
        else:
            current.add(node)
    live = {local_name(n) for n in current}
    for name, replacements in deprecated.items():
        found = [r for r in replacements if r in live]
        deprecated[name] = found[0] if found else None
    return current, deprecated


def unit_spellings(graph, units):
    """Return {spelling: {unit: kinds}} over the non-currency units.

    A kind is 'symbol', 'altSymbol', 'name' or 'code'.
    """
    spellings = defaultdict(lambda: defaultdict(set))
    for node in units:
        if any((node, RDF.type, t) in graph for t in CURRENCY_TYPES):
            continue
        name = local_name(node)
        for kind, pred in (('symbol', QUDT.symbol),
                           ('altSymbol', QUDT.altSymbol),
                           ('code', QUDT.ucumCode),
                           ('code', QUDT.udunitsCode)):
            for value in graph.objects(node, pred):
                spellings[str(value)][name].add(kind)
        for pred in (RDFS.label, SKOS.altLabel):
            for value in graph.objects(node, pred):
                if is_english(value):
                    spellings[str(value)][name].add('name')
    return spellings


def exact_match_groups(graph, units):
    """Return {unit: group id} joining units linked by qudt:exactMatch."""
    parent = {local_name(n): local_name(n) for n in units}

    def find(name):
        while parent[name] != name:
            parent[name] = parent[parent[name]]
            name = parent[name]
        return name
    for subject, other in graph.subject_objects(QUDT.exactMatch):
        a, b = local_name(subject), local_name(other)
        if a in parent and b in parent:
            parent[find(a)] = find(b)
    return {name: find(name) for name in parent}


def unit_table(graph):
    """Return (units {name: [spelling]}, deprecated, owners)."""
    current, deprecated = read_units(graph)
    spellings = unit_spellings(graph, current)
    group = exact_match_groups(graph, current)
    units = {local_name(n): [] for n in current}
    owners = {}
    for spelling, holders in spellings.items():
        if len(holders) > 1 and len({group[n] for n in holders}) == 1:
            own = sorted(n for n, kinds in holders.items()
                         if 'symbol' in kinds)
            keep = (own or sorted(holders))[0]
            holders = {keep: holders[keep]}
        owners[spelling] = set(holders)
        for name in holders:
            units[name].append(spelling)
    for entry in units.values():
        entry.sort()
    return units, deprecated, owners


def check_overrides(units, owners, overrides):
    """Return (collisions without a tie-break, problem lines)."""
    tie_breaks = overrides.get('tieBreaks', {})
    collisions = sorted(k for k, o in owners.items()
                        if len(o) > 1 and k not in tie_breaks)
    problems = []
    for key, target in sorted(tie_breaks.items()):
        if target not in units:
            problems.append('tieBreaks[%r] -> %r is not a current QUDT unit'
                            % (key, target))
        if len(owners.get(key, ())) < 2:
            problems.append('tieBreaks[%r] is not a collision; drop it'
                            % key)
        elif target not in owners[key]:
            problems.append('tieBreaks[%r] -> %r is not one of its owners'
                            % (key, target))
    return collisions, problems


def main(argv):
    if len(argv) != 2:
        sys.exit('usage: qudt_units.py PATH/TO/VOCAB_QUDT-UNITS-ALL.ttl')
    with open(argv[1], 'rb') as f:
        data = f.read()
    digest = hashlib.sha256(data).hexdigest()
    if digest != QUDT_SHA256:
        sys.exit('refusing %s: SHA-256 %s, expected %s'
                 % (argv[1], digest, QUDT_SHA256))
    graph = Graph()
    graph.parse(data=data, format='turtle')
    units, deprecated, owners = unit_table(graph)

    with open(OVERRIDES_PATH, encoding='utf-8') as f:
        overrides = json.load(f)
    collisions, problems = check_overrides(units, owners, overrides)

    source = {'repository': QUDT_REPOSITORY, 'tag': QUDT_TAG,
              'commit': QUDT_COMMIT, 'file': QUDT_FILE, 'url': QUDT_URL,
              'sha256': QUDT_SHA256, 'license': QUDT_LICENSE}
    lines = ['{',
             '  "source": ' + json.dumps(source, sort_keys=True) + ',',
             '  "deprecated": ' + json.dumps(deprecated, sort_keys=True)
             + ',',
             '  "units": {',
             ',\n'.join('    %s: %s' % (
                 json.dumps(name, ensure_ascii=False),
                 json.dumps(units[name], ensure_ascii=False, sort_keys=True))
                 for name in sorted(units)),
             '  }', '}']
    with open(OUT_PATH, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines) + '\n')
    print('%d units (%d deprecated), %d colliding spellings without a'
          ' tie-break -> %s' % (len(units), len(deprecated), len(collisions),
                      os.path.normpath(OUT_PATH)))
    for key in collisions:
        print('  collision %r: %s' % (key, ', '.join(sorted(owners[key]))))

    if problems:
        for line in problems:
            print('error: ' + line, file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main(sys.argv)
