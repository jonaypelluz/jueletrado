import { dividerPositions, syllabify } from '@utils/SyllableSplitter';

// Canonical table (JUE-0004 spec, normative): [word, expected syllabification joined by '-'].
// Monosyllables are listed as [word, word].
const TABLE: [string, string][] = [
    // Simple / one consonant between vowels
    ['casa', 'ca-sa'],
    ['kilo', 'ki-lo'],
    ['examen', 'e-xa-men'],
    ['chocolate', 'cho-co-la-te'],
    // Digraphs ch / ll / rr
    ['coche', 'co-che'],
    ['muchacho', 'mu-cha-cho'],
    ['ancho', 'an-cho'],
    ['colchón', 'col-chón'],
    ['flecha', 'fle-cha'],
    ['llave', 'lla-ve'],
    ['calle', 'ca-lle'],
    ['caballo', 'ca-ba-llo'],
    ['perro', 'pe-rro'],
    ['ferrocarril', 'fe-rro-ca-rril'],
    // Onset clusters
    ['plato', 'pla-to'],
    ['aplauso', 'a-plau-so'],
    ['blanco', 'blan-co'],
    ['biblioteca', 'bi-blio-te-ca'],
    ['clase', 'cla-se'],
    ['iglesia', 'i-gle-sia'],
    ['regla', 're-gla'],
    ['prado', 'pra-do'],
    ['abrazo', 'a-bra-zo'],
    ['otro', 'o-tro'],
    ['madre', 'ma-dre'],
    ['secreto', 'se-cre-to'],
    ['tigre', 'ti-gre'],
    ['cofre', 'co-fre'],
    ['atleta', 'a-tle-ta'],
    ['atlántico', 'a-tlán-ti-co'],
    // Two consonants, not a cluster
    ['carta', 'car-ta'],
    ['isla', 'is-la'],
    ['ritmo', 'rit-mo'],
    ['atmósfera', 'at-mós-fe-ra'],
    ['obtener', 'ob-te-ner'],
    ['texto', 'tex-to'],
    ['alrededor', 'al-re-de-dor'],
    ['honra', 'hon-ra'],
    ['lección', 'lec-ción'],
    ['innato', 'in-na-to'],
    // Three consonants
    ['hombre', 'hom-bre'],
    ['contra', 'con-tra'],
    ['empleo', 'em-ple-o'],
    ['explicar', 'ex-pli-car'],
    ['inflar', 'in-flar'],
    ['instante', 'ins-tan-te'],
    ['constante', 'cons-tan-te'],
    ['obstáculo', 'obs-tá-cu-lo'],
    ['perspectiva', 'pers-pec-ti-va'],
    ['istmo', 'ist-mo'],
    ['solsticio', 'sols-ti-cio'],
    ['transporte', 'trans-por-te'],
    // Four consonants
    ['monstruo', 'mons-truo'],
    ['abstracto', 'abs-trac-to'],
    ['instrucción', 'ins-truc-ción'],
    ['construcción', 'cons-truc-ción'],
    ['inscribir', 'ins-cri-bir'],
    ['transcribir', 'trans-cri-bir'],
    // qu / gu / gü
    ['queso', 'que-so'],
    ['aquí', 'a-quí'],
    ['quiosco', 'quios-co'],
    ['guitarra', 'gui-ta-rra'],
    ['guerra', 'gue-rra'],
    ['seguir', 'se-guir'],
    ['agua', 'a-gua'],
    ['guante', 'guan-te'],
    ['ángulo', 'án-gu-lo'],
    ['pingüino', 'pin-güi-no'],
    ['cigüeña', 'ci-güe-ña'],
    ['vergüenza', 'ver-güen-za'],
    ['lingüística', 'lin-güís-ti-ca'],
    // Diphthongs
    ['aire', 'ai-re'],
    ['causa', 'cau-sa'],
    ['peine', 'pei-ne'],
    ['deuda', 'deu-da'],
    ['boina', 'boi-na'],
    ['piano', 'pia-no'],
    ['tierra', 'tie-rra'],
    ['huevo', 'hue-vo'],
    ['historia', 'his-to-ria'],
    ['canción', 'can-ción'],
    ['murciélago', 'mur-cié-la-go'],
    ['huésped', 'hués-ped'],
    ['náutico', 'náu-ti-co'],
    ['después', 'des-pués'],
    // Weak + weak (different letters always join)
    ['ciudad', 'ciu-dad'],
    ['cuidado', 'cui-da-do'],
    ['ruido', 'rui-do'],
    ['viuda', 'viu-da'],
    ['jesuita', 'je-sui-ta'],
    ['construí', 'cons-truí'],
    // Hiatus
    ['poeta', 'po-e-ta'],
    ['leer', 'le-er'],
    ['creer', 'cre-er'],
    ['zoológico', 'zo-o-ló-gi-co'],
    ['héroe', 'hé-ro-e'],
    ['aéreo', 'a-é-re-o'],
    ['océano', 'o-cé-a-no'],
    ['teatro', 'te-a-tro'],
    ['chiita', 'chi-i-ta'],
    ['maíz', 'ma-íz'],
    ['país', 'pa-ís'],
    ['baúl', 'ba-úl'],
    ['río', 'rí-o'],
    ['día', 'dí-a'],
    ['oído', 'o-í-do'],
    ['reír', 're-ír'],
    ['reúne', 're-ú-ne'],
    ['ataúd', 'a-ta-úd'],
    ['leía', 'le-í-a'],
    ['transeúnte', 'tran-se-ún-te'],
    ['psicología', 'psi-co-lo-gí-a'],
    // Same weak letter splits, accented or not (R2)
    ['tiíto', 'ti-í-to'],
    ['chií', 'chi-í'],
    // Triphthongs
    ['estudiáis', 'es-tu-diáis'],
    ['averiguáis', 'a-ve-ri-guáis'],
    ['limpiéis', 'lim-piéis'],
    ['decíais', 'de-cí-ais'],
    ['temíais', 'te-mí-ais'],
    ['paranoia', 'pa-ra-noi-a'],
    // y
    ['estoy', 'es-toy'],
    ['virrey', 'vi-rrey'],
    ['convoy', 'con-voy'],
    ['jersey', 'jer-sey'],
    ['maguey', 'ma-guey'],
    ['carey', 'ca-rey'],
    ['mayo', 'ma-yo'],
    ['reyes', 're-yes'],
    ['ayer', 'a-yer'],
    ['ayuda', 'a-yu-da'],
    // h
    ['ahumar', 'ahu-mar'],
    ['rehusar', 'rehu-sar'],
    ['prohibir', 'prohi-bir'],
    ['prohíbo', 'pro-hí-bo'],
    ['rehúso', 're-hú-so'],
    ['búho', 'bú-ho'],
    ['ahora', 'a-ho-ra'],
    ['alcohol', 'al-co-hol'],
    ['zanahoria', 'za-na-ho-ria'],
    ['almohada', 'al-mo-ha-da'],
    ['cohete', 'co-he-te'],
    ['ahí', 'a-hí'],
    ['deshacer', 'des-ha-cer'],
    ['inhumano', 'in-hu-ma-no'],
    ['anhelo', 'an-he-lo'],
    ['exhalar', 'ex-ha-lar'],
    ['hielo', 'hie-lo'],
    // h as onset of a following diphthong (hue/hua)
    ['cacahuete', 'ca-ca-hue-te'],
    ['aldehuela', 'al-de-hue-la'],
    ['ahuecar', 'a-hue-car'],
    ['acahual', 'a-ca-hual'],
    ['vihuela', 'vi-hue-la'],
    // Edges
    ['gnomo', 'gno-mo'],
    ['bíceps', 'bí-ceps'],
    ['tórax', 'tó-rax'],
    // Monosyllables
    ['sol', 'sol'],
    ['pie', 'pie'],
    ['flor', 'flor'],
    ['tren', 'tren'],
    ['rey', 'rey'],
    ['hoy', 'hoy'],
    ['muy', 'muy'],
    ['buey', 'buey'],
];

/** Divider index i sits between word[i-1] and word[i]: cumulative syllable lengths minus the last. */
const cumulativeDividers = (syllables: string[]): number[] =>
    syllables.slice(0, -1).reduce<number[]>((acc, s) => [...acc, (acc[acc.length - 1] ?? 0) + s.length], []);

describe('syllabify', () => {
    test.each(TABLE)('%s → %s', (word, hyphenated) => {
        expect(syllabify(word)).toEqual(hyphenated.split('-'));
    });

    test('returns an empty array for an empty string', () => {
        expect(syllabify('')).toEqual([]);
    });

    test('returns the whole word as one syllable when it has no vowels', () => {
        expect(syllabify('bcd')).toEqual(['bcd']);
    });

    // Out-of-scope inputs (prefix morphology, loanword y, non-letters, uppercase): any split is
    // accepted, but the call must not throw and must keep every character.
    test.each(['subrayar', 'desamparar', 'cyclocross', 'co-che', 'Madrid'])(
        'does not throw and keeps every character for off-table input %s',
        (word) => {
            expect(syllabify(word).join('')).toBe(word);
        },
    );
});

describe('dividerPositions', () => {
    test.each<[string, number[]]>([
        ['casa', [2]],
        ['instrucción', [3, 7]],
        ['ahumar', [3]],
        ['aéreo', [1, 2, 4]],
        ['perro', [2]],
        ['sol', []],
        ['', []],
    ])('%s → %j', (word, expected) => {
        expect(dividerPositions(word)).toEqual(expected);
    });
});

describe('syllabify / dividerPositions properties over the canonical table', () => {
    test.each(TABLE)('%s: rejoins to the word, dividers match syllable lengths, deterministic', (word, hyphenated) => {
        const syllables = syllabify(word);

        expect(syllables.join('')).toBe(word);
        expect(dividerPositions(word)).toEqual(cumulativeDividers(hyphenated.split('-')));
        expect(syllabify(word)).toEqual(syllables);
        expect(dividerPositions(word)).toEqual(dividerPositions(word));
    });
});
