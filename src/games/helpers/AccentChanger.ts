class AccentChanger {
    private accentsMap: { [key: string]: string[] };

    constructor() {
        this.accentsMap = {
            a: ['á', 'a'],
            e: ['é', 'e'],
            i: ['í', 'i'],
            o: ['ó', 'o'],
            u: ['ú', 'u'],
        };
    }

    countVersions(word: string): number {
        return Math.pow(2, this.countAccentuableVowels(word));
    }

    private countAccentuableVowels(word: string): number {
        return Array.from(word).reduce((count, char) => count + (this.accentsMap[char] ? 1 : 0), 0);
    }

    generateRandomAccentVersion(word: string): string {
        return Array.from(word)
            .map((char) => {
                if (this.accentsMap[char]) {
                    return this.accentsMap[char][
                        Math.floor(Math.random() * this.accentsMap[char].length)
                    ];
                }
                return char;
            })
            .join('');
    }

    generateVersions(word: string, numberOfVersions: number): string[] {
        const versions = new Set<string>();
        while (versions.size < numberOfVersions) {
            versions.add(this.generateRandomAccentVersion(word));
        }
        return Array.from(versions);
    }
}

export default AccentChanger;
