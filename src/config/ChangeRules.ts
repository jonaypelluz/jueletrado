import { ChangeRule } from '@models/types';

const createChangeRules = (locale: string): ChangeRule[] => {
    const rules: { [key: string]: ChangeRule[] } = {
        en: [
            { vice: 'vise' },
            { '^fur': '^far' },
            { lie: 'lay' },
            { seil$: 'sail' },
            { ant$: 'ent' },
            { ence$: 'ance' },
            { ch$: 'cht' },
            { out$: 'aut' },
            { ing$: 'in' },
            { oo: 'u' },
            { '([a-z])\\1': '$1' },
            { '([bcdfghjklmnpqrstvwxyz])y$': '$1ie' },
            { chae: 'che' },
            { '(?=i)s(?=a|e)': 'ss' },
        ],
        es: [
            { '^ha': 'a' },
            { '^he': 'e' },
            { 'j(?=e|é|i|í)': 'g' },
            { 'g(?=e|é|i|í)': 'j' },
            { '(?<!c)c(?=e|é|i|í)': 's' },
            { '(?<!m)b': 'v' },
            { v: 'b' },
            { ll: 'y' },
            { y: 'll' },
        ],
    };

    return rules[locale];
};

export default createChangeRules;
