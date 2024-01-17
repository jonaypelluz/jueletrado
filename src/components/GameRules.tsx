import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Typography } from 'antd';
import { GameRules } from '@models/types';

const { Text, Title } = Typography;

const GameRulesInfo: React.FC<GameRules> = ({
    additionalRules,
    howToPlay,
    gameGoal,
    tips,
}: GameRules) => (
    <div className="game-rules">
        <Title level={2}>
            <FormattedMessage id="gameRulesRules" />
        </Title>
        <p>
            <Text strong>
                <FormattedMessage id="gameRulesGoaloftheGame" />
            </Text>
        </p>
        <p>
            <Text>{gameGoal}</Text>
        </p>
        <p>
            <Text strong>
                <FormattedMessage id="gameRulesHowtoPlay" />
            </Text>
        </p>
        <div>
            <Text>
                <ul>
                    {howToPlay.map((rule: string, index: number) => (
                        <li key={index}>{rule}</li>
                    ))}
                </ul>
            </Text>
        </div>
        <p>
            <Text strong>
                <FormattedMessage id="gameRulesAdditionalRules" />
            </Text>
        </p>
        {additionalRules.length > 0 && (
            <p>
                <Text>
                    {additionalRules.map((rule: string, index: number) => (
                        <span key={index}>
                            {rule}
                            {index !== additionalRules.length - 1 && <br />}
                        </span>
                    ))}
                </Text>
            </p>
        )}
        <p>
            <Text strong>
                <FormattedMessage id="gameRulesTips" />
            </Text>
        </p>
        <p>
            <Text>
                {tips.map((tip: string, index: number) => (
                    <span key={index}>
                        {tip}
                        {index !== tips.length - 1 && <br />}
                    </span>
                ))}
            </Text>
        </p>
    </div>
);

export default GameRulesInfo;
