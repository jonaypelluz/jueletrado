import { ChangeRule } from 'src/models/types';

const AccentRulesChanges: ChangeRule[] = [
    { a: ['á', 'a'] },
    { á: ['a', 'á'] },
    { e: ['é', 'e'] },
    { é: ['e', 'é'] },
    { i: ['í', 'i'] },
    { í: ['i', 'í'] },
    { o: ['ó', 'o'] },
    { ó: ['o', 'ó'] },
    { u: ['ú', 'u'] },
    { ú: ['u', 'ú'] },
];

export default AccentRulesChanges;
