import { ChangeRule } from 'src/models/types';

const WordRules: ChangeRule[] = [
    { ge: ['je', 'ge'] },
    { gé: ['jé', 'gé'] },
    { gi: ['ji', 'gi'] },
    { gí: ['jí', 'gí'] },
    { je: ['ge', 'je'] },
    { jé: ['gé', 'jé'] },
    { ji: ['gi', 'ji'] },
    { jí: ['gí', 'jí'] },
    { ce: ['se', 'ce'] },
    { cé: ['sé', 'cé'] },
    { se: ['ce', 'se'] },
    { sé: ['cé', 'sé'] },
    { ci: ['si', 'ci'] },
    { cí: ['sí', 'cí'] },
    { si: ['ci', 'si'] },
    { sí: ['cí', 'sí'] },
    { b: ['v', 'b'] },
    { v: ['b', 'v'] },
    { ll: ['y', 'll'] },
    { y: ['ll', 'y'] },
];

export default WordRules;
