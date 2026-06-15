'use client';

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { GameRules } from '@models/types';

const GameRulesInfo: React.FC<GameRules> = ({ additionalRules, howToPlay, gameGoal, tips }) => (
    <div className="game-rules">
        <h2>
            <FormattedMessage id="gameRulesRules" />
        </h2>
        <p>
            <strong>
                <FormattedMessage id="gameRulesGoaloftheGame" />
            </strong>
        </p>
        <p>{gameGoal}</p>
        <p>
            <strong>
                <FormattedMessage id="gameRulesHowtoPlay" />
            </strong>
        </p>
        <ul>
            {howToPlay.map((rule: string, index: number) => (
                <li key={index}>{rule}</li>
            ))}
        </ul>
        {additionalRules.length > 0 && (
            <>
                <p>
                    <strong>
                        <FormattedMessage id="gameRulesAdditionalRules" />
                    </strong>
                </p>
                <p>
                    {additionalRules.map((rule: string, index: number) => (
                        <span key={index}>
                            {rule}
                            {index !== additionalRules.length - 1 && <br />}
                        </span>
                    ))}
                </p>
            </>
        )}
        {tips.length > 0 && (
            <>
                <p>
                    <strong>
                        <FormattedMessage id="gameRulesTips" />
                    </strong>
                </p>
                <p>
                    {tips.map((tip: string, index: number) => (
                        <span key={index}>
                            {tip}
                            {index !== tips.length - 1 && <br />}
                        </span>
                    ))}
                </p>
            </>
        )}
    </div>
);

export default GameRulesInfo;
