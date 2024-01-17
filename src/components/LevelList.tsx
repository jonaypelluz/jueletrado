import React from 'react';
import { useIntl } from 'react-intl';
import { Collapse, Typography } from 'antd';
import LevelsConfig from '@config/LevelConfig';
import { LevelConfig } from '@models/types';

const { Text } = Typography;

interface LevelListProps {
    handlePopulateDBClick: (level: string) => void;
    gameLevel: string | null;
}

const LevelList: React.FC<LevelListProps> = ({
    handlePopulateDBClick,
    gameLevel,
}: LevelListProps) => {
    const intl = useIntl();

    const levelTranslations: { [key: string]: string } = {
        beginner: intl.formatMessage({ id: 'levelBeginner' }),
        intermediate: intl.formatMessage({ id: 'levelIntermediate' }),
        advanced: intl.formatMessage({ id: 'levelAdvanced' }),
    };

    return (
        <div className="level-wrapper">
            <Collapse
                collapsible="header"
                defaultActiveKey={gameLevel === null ? ['1'] : []}
                ghost={true}
                items={[
                    {
                        key: '1',
                        label: gameLevel
                            ? `${intl.formatMessage({ id: 'homeLevel' })} ${
                                  levelTranslations[gameLevel]
                              }`
                            : `${intl.formatMessage({ id: 'homeChoseLevel' })}`,
                        children: (
                            <>
                                {LevelsConfig.map((level: LevelConfig, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() => handlePopulateDBClick(level.level)}
                                        className={`btn-${level.level} btn-levels ${
                                            gameLevel && gameLevel === level.level ? 'selected' : ''
                                        }`}
                                    >
                                        <img
                                            src={`/images/levels/${level.level}Bg.png`}
                                            alt={level.level}
                                        />
                                        <Text strong>{levelTranslations[level.level]}</Text>
                                    </div>
                                ))}
                            </>
                        ),
                    },
                ]}
            />
        </div>
    );
};

export default LevelList;
