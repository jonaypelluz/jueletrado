import { ChangeRule } from '@models/types';

const ChangeRules: ChangeRule[] = [
    { '^ha': 'a' },
    { '^he': 'e' },
    { 'j(?=e|é|i|í)': 'g' },
    { 'g(?=e|é|i|í)': 'j' },
    { '(?<!c)c(?=e|é|i|í)': 's' },
    { '(?<!m)b': 'v' },
    { v: 'b' },
    { ll: 'y' },
    { y: 'll' },
];

export default ChangeRules;
