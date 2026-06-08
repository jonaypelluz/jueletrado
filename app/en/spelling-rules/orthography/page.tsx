import React from 'react';
import { createContentConfig } from '@hooks/useContentConfig';
import Hero from '@components/Hero';
import MainLayout from '@layouts/MainLayout';
import '@styles/SpellingRules.scss';

const Orthography: React.FC = () => {
    const ContentConfig = createContentConfig('en', 'orthography');

    return (
        <MainLayout>
            {ContentConfig && (
                <Hero
                    image={ContentConfig.imgSrc}
                    title={ContentConfig.title}
                    subtitle={ContentConfig.description}
                />
            )}
            <div className="spelling-section">
                <div className="spelling-grid">
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Capital letters</h3>
                        <p>
                            Use a capital letter at: the beginning of a piece of writing and after a
                            full stop, proper nouns, divine attributes (Almighty, Creator), titles
                            and dignities (Supreme Pontiff, Duke of Olivares),
                            nicknames/epithets (Isabel the Catholic), abbreviated forms of address,
                            and names/adjectives of institutions or corporations. Only the first
                            letter of titles of literary works and films is capitalised.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The letter B</h3>
                        <p>
                            &quot;B&quot; is used before another consonant, in verbs ending in -bir
                            (except hervir, servir, vivir), in endings -ba, -bas, -bais, -ban, in
                            words beginning with bibl-, bu-, bur-, bus-, and in words with prefixes
                            bi-, bis- (twice), bene- (well), bio- (life). It is also written in
                            compounds and derivatives of words that already contain this letter.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The letter V</h3>
                        <p>
                            &quot;V&quot; is used after the syllable -ad, in flat adjectives ending
                            in -ava, -avo, -eva, -evo, -ivo, -iva, -ave, in verb forms of verbs
                            with neither b nor v in their infinitive (except the imperfect
                            indicative), in words with prefixes vice- and villa-, in words ending in
                            -ívoro, -ívora (except víbora), and in compounds and derivatives of
                            words already containing this letter.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The letter H</h3>
                        <p>
                            Prefixes with &quot;H&quot;: words with prefixes such as hidr- (water),
                            hiper- (excess), hipo- (under), etc. carry &quot;h&quot;. Historical
                            &quot;H&quot;: some words carry &quot;h&quot; at the start by tradition,
                            even though it is silent in modern Spanish, such as &quot;hola&quot;.
                            Derivatives and compounds: if the original word has &quot;h&quot;, its
                            derivatives keep it, as in &quot;desheredar&quot;. Exceptions: some
                            derivatives may lose it, such as &quot;osamenta&quot; (from
                            &quot;hueso&quot;).
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The letter G</h3>
                        <p>
                            A diaeresis is used in &quot;gue&quot;, &quot;gui&quot; to pronounce all
                            sounds. Words beginning with geo- and verbs ending in -ger, -gir (except
                            tejer and crujir) are written with &quot;g&quot;. Nearly all words
                            beginning and ending in &quot;gen&quot; also carry &quot;g&quot;, as do
                            compounds and derivatives of words with this letter.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The letter J</h3>
                        <p>
                            &quot;J&quot; is used in words ending in -aje, -eje, -jería, except
                            &quot;ambages&quot; (without roundabout). Also in verb forms of verbs
                            that have neither &quot;g&quot; nor &quot;j&quot; in their infinitive,
                            and in compounds and derivatives of words already containing the letter
                            &quot;j&quot;.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The letters S and X</h3>
                        <p>
                            &quot;X&quot; is used in words with the prefixes &quot;ex&quot; and
                            &quot;extra&quot;.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The letters Y and LL</h3>
                        <p>
                            &quot;Y&quot; is used at the end of unstressed words ending in a
                            diphthong or triphthong; if stressed, &quot;í&quot; is written instead.
                            The conjunction &quot;y&quot; is always written this way. The endings
                            illo, illa, illos, illas are written with &quot;ll&quot;. In verb forms
                            whose infinitive does not contain &quot;ll&quot; or &quot;y&quot;,
                            &quot;y&quot; is used.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The letters R and RR</h3>
                        <p>
                            The strong &quot;r&quot; sound is written &quot;rr&quot; inside words
                            between vowels. The simple &quot;r&quot; sound is used at the beginning
                            of words or inside a word after the consonants &quot;l&quot;,
                            &quot;n&quot;, &quot;s&quot;, but not between vowels.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The letter M</h3>
                        <p>
                            The letter &quot;m&quot; is used before the consonants &quot;b&quot; and
                            &quot;p&quot;.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Final D and Z</h3>
                        <p>
                            &quot;D&quot; is used in words whose plural ends in -des, and
                            &quot;z&quot; in words whose plural ends in -ces.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The letter C</h3>
                        <p>
                            &quot;C&quot; is used before the vowels &quot;e&quot; and &quot;i&quot;
                            for the soft sound (e.g. &quot;cereza&quot;, &quot;cita&quot;). Before
                            &quot;a&quot;, &quot;o&quot;, &quot;u&quot;, &quot;c&quot; represents
                            the hard sound (e.g. &quot;casa&quot;, &quot;coco&quot;). In words from
                            the same lexical family with a soft sound before &quot;a&quot;,
                            &quot;o&quot;, &quot;u&quot;, &quot;z&quot; or &quot;ce/ci&quot; is used
                            (e.g. &quot;cazar&quot; and &quot;cacería&quot;).
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The letter Q</h3>
                        <p>
                            &quot;Q&quot; followed by &quot;u&quot; is used for the hard sound
                            before &quot;e&quot; and &quot;i&quot; (e.g. &quot;que&quot;,
                            &quot;quien&quot;). The &quot;qu&quot; combination remains constant even
                            when the sound could be represented with &quot;k&quot; (e.g.
                            &quot;química&quot;).
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The letter Z</h3>
                        <p>
                            &quot;Z&quot; is used at the end of words that change to &quot;ces&quot;
                            in the plural (e.g. &quot;luz&quot;, &quot;luces&quot;). Generally,
                            &quot;z&quot; is used before &quot;a&quot;, &quot;o&quot;,
                            &quot;u&quot; for the soft sound (e.g. &quot;zona&quot;).
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Orthography;
