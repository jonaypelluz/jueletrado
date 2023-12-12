import AccentChanger from 'src/games/helpers/AccentChanger';

const GenerateWrongWords = (
    words: string[],
    numberOfFakeVersions: number,
): { [key: string]: string[] } => {
    const wordMap: { [key: string]: string[] } = {};
    const accentChanger = new AccentChanger();

    words.forEach((word) => {
        const versions = new Set<string>();

        while (versions.size < numberOfFakeVersions) {
            const newVersion = accentChanger.generateRandomAccentVersion(word);
            if (newVersion !== word) {
                versions.add(newVersion);
            }
        }

        wordMap[word] = Array.from(versions);
    });

    return wordMap;
};

export default GenerateWrongWords;
