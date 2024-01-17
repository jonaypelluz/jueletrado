import { ContentRoutes, ContentTranslations } from '@config/translations/Content';
import { ContentItemPreConfig } from '@models/interfaces';
import { CardInfo } from '@models/types';

const createAllContentConfig = (locale: string): CardInfo[] | false => {
    if (ContentTranslations[locale] && ContentTranslations[locale].length === 0) {
        return false;
    }

    return ContentTranslations[locale].map((config: ContentItemPreConfig) => ({
        id: config.id,
        link: ContentRoutes[locale][config.id],
        imgSrc: config.imgSrc,
        title: config.title,
        description: config.description,
        subtitle: config.subtitle,
    }));
};

const createContentConfig = (locale: string, configName: string): CardInfo | false => {
    const config = ContentTranslations[locale].find(
        (config: ContentItemPreConfig) => config.id === configName,
    );

    return config !== undefined
        ? {
              id: config.id,
              link: ContentRoutes[locale][config.id],
              imgSrc: config.imgSrc,
              title: config.title,
              description: config.description,
              subtitle: config.subtitle,
          }
        : false;
};

export { createAllContentConfig, createContentConfig };
