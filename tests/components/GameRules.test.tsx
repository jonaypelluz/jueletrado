import React from 'react';
import { IntlProvider } from 'react-intl';
import { render, screen } from '@testing-library/react';
import { GeneralTranslations } from '@config/translations/General';
import { GameRules as GameRulesType } from '@models/types';
import GameRules from '@components/GameRules';

const renderRules = (rules: GameRulesType) =>
    render(
        <IntlProvider locale="es" messages={GeneralTranslations.es as Record<string, string>} onError={() => {}}>
            <GameRules {...rules} />
        </IntlProvider>,
    );

const baseRules: GameRulesType = {
    gameGoal: 'Objetivo de prueba',
    howToPlay: ['Paso uno'],
    additionalRules: [],
    tips: [],
};

describe('GameRules', () => {
    test('always shows goal and how-to-play', () => {
        renderRules(baseRules);
        expect(screen.getByText(GeneralTranslations.es.gameRulesGoaloftheGame)).toBeInTheDocument();
        expect(screen.getByText(GeneralTranslations.es.gameRulesHowtoPlay)).toBeInTheDocument();
        expect(screen.getByText('Paso uno')).toBeInTheDocument();
    });

    test('hides the Additional rules section when the list is empty', () => {
        renderRules(baseRules);
        expect(
            screen.queryByText(GeneralTranslations.es.gameRulesAdditionalRules),
        ).not.toBeInTheDocument();
    });

    test('hides the Tips section when the list is empty', () => {
        renderRules(baseRules);
        expect(screen.queryByText(GeneralTranslations.es.gameRulesTips)).not.toBeInTheDocument();
    });

    test('shows the Additional rules section when the list is non-empty', () => {
        renderRules({ ...baseRules, additionalRules: ['Regla extra'] });
        expect(
            screen.getByText(GeneralTranslations.es.gameRulesAdditionalRules),
        ).toBeInTheDocument();
        expect(screen.getByText('Regla extra')).toBeInTheDocument();
    });

    test('shows the Tips section when the list is non-empty', () => {
        renderRules({ ...baseRules, tips: ['Un consejo'] });
        expect(screen.getByText(GeneralTranslations.es.gameRulesTips)).toBeInTheDocument();
        expect(screen.getByText('Un consejo')).toBeInTheDocument();
    });
});
