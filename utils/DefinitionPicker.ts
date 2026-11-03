import { Definition } from '@models/types';

export const getDefinitionForLevel = (definitions: Definition[], gameLevel: string | null): Definition => {
    let eligible: Definition[];
    if (gameLevel === 'beginner') {
        eligible = definitions.filter(d => Number(d.number) === 1);
    } else if (gameLevel === 'intermediate') {
        eligible = definitions.filter(d => Number(d.number) <= 3);
    } else {
        eligible = definitions;
    }
    if (eligible.length === 0) eligible = definitions;
    return eligible[Math.floor(Math.random() * eligible.length)];
};

export const formatDefinition = (definition: string): string => {
    const capitalizedFirstLetter = definition.charAt(0).toUpperCase();
    const withoutFirstLetter = definition.slice(1);
    const withoutPeriodAndRest = withoutFirstLetter.split('.')[0];
    return capitalizedFirstLetter + withoutPeriodAndRest;
};
