import { Definition } from '@models/types';
import { revealsWord } from '@utils/SpellingComparer';

/** Senses a level may draw from: sense 1 for beginner, 1–3 for intermediate, all otherwise; all when none qualify. */
export const eligibleDefinitionsForLevel = (definitions: Definition[], gameLevel: string | null): Definition[] => {
    let eligible: Definition[];
    if (gameLevel === 'beginner') {
        eligible = definitions.filter(d => Number(d.number) === 1);
    } else if (gameLevel === 'intermediate') {
        eligible = definitions.filter(d => Number(d.number) <= 3);
    } else {
        eligible = definitions;
    }
    return eligible.length === 0 ? definitions : eligible;
};

/**
 * The senses of `word` a level may draw from, minus those whose text contains the headword (`revealsWord`,
 * the spellingBee check), so a clue never gives the answer away. Empty when none is left: skip the word.
 */
export const clueDefinitionsForLevel = (word: string, definitions: Definition[], gameLevel: string | null): Definition[] =>
    eligibleDefinitionsForLevel(definitions, gameLevel).filter((d) => !revealsWord(d.definition, word));

export const getDefinitionForLevel = (definitions: Definition[], gameLevel: string | null): Definition => {
    const eligible = eligibleDefinitionsForLevel(definitions, gameLevel);
    return eligible[Math.floor(Math.random() * eligible.length)];
};

export const formatDefinition = (definition: string): string => {
    const capitalizedFirstLetter = definition.charAt(0).toUpperCase();
    const withoutFirstLetter = definition.slice(1);
    const withoutPeriodAndRest = withoutFirstLetter.split('.')[0];
    return capitalizedFirstLetter + withoutPeriodAndRest;
};
