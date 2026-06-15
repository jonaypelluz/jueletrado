import { ChangeRule } from '@models/types';

export type LetterChallenge = {
    word: string; // full correct word, e.g. 'botella'
    prefix: string; // part before the gap
    gapAnswer: string; // correct segment that fills the gap
    suffix: string; // part after the gap
    options: string[]; // shuffled [gapAnswer, wrongSegment(s)], 2–3 items
};

const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

/**
 * Builds a fill-the-gap challenge from a word and the locale's confusion rules
 * (`config/ChangeRules.ts`). One matched segment becomes the gap; the player
 * must pick it over the rule's wrong replacement.
 *
 * Returns `null` when the word matches no rule, or when every applicable rule
 * is ambiguous (the wrong fill is itself a real word) or idempotent.
 */
export function buildLetterChallenge(
    word: string,
    rules: ChangeRule[],
    fullWordSet: Set<string>,
): LetterChallenge | null {
    const applicable = rules.filter((rule) => new RegExp(Object.keys(rule)[0]).test(word));
    if (applicable.length === 0) return null;

    for (const rule of shuffle(applicable)) {
        const [search, replace] = Object.entries(rule)[0];
        const regex = new RegExp(search);
        const match = regex.exec(word);
        if (!match) continue;

        const gapAnswer = match[0];
        const prefix = word.slice(0, match.index);
        const suffix = word.slice(match.index + gapAnswer.length);

        // Replace only the first match — prefix/suffix stay intact, so the wrong
        // segment is exactly what sits between them in the resulting word.
        const wrongWord = word.replace(regex, replace);
        if (wrongWord === word) continue; // rule is idempotent on this word
        if (fullWordSet.has(wrongWord.toLowerCase())) continue; // both fills are real → ambiguous

        const wrongSegment = wrongWord.slice(prefix.length, wrongWord.length - suffix.length);
        if (wrongSegment === gapAnswer) continue;

        return { word, prefix, gapAnswer, suffix, options: shuffle([gapAnswer, wrongSegment]) };
    }

    return null;
}
