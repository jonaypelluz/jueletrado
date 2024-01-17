import { GamesRoutes, GamesTranslations } from '@config/translations/Games';
import { GamePreConfig } from '@models/interfaces';
import { GameConfig } from '@models/types';

const createAllGamesConfig = (locale: string): GameConfig[] => {
    return GamesTranslations.map((config: GamePreConfig) => ({
        id: config.id,
        link: GamesRoutes[locale][config.id],
        imgSrc: config.imgSrc,
        title: config.title[locale as keyof typeof config.title],
        description: config.description[locale as keyof typeof config.description],
        subtitle: config.subtitle[locale as keyof typeof config.subtitle],
        gameRules: config.gameRules[locale as keyof typeof config.gameRules],
    }));
};

const createGamesConfig = (locale: string, gameName: string): GameConfig | null => {
    const config = GamesTranslations.find((game: GamePreConfig) => game.id === gameName);

    return config !== undefined
        ? {
              id: config.id,
              link: GamesRoutes[locale][config.id],
              imgSrc: config.imgSrc,
              title: config.title[locale as keyof typeof config.title],
              description: config.description[locale as keyof typeof config.description],
              subtitle: config.subtitle[locale as keyof typeof config.description],
              gameRules: config.gameRules[locale as keyof typeof config.gameRules],
          }
        : null;
};

export { createGamesConfig, createAllGamesConfig };
