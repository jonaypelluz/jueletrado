import React from 'react';
import { createContentConfig } from '@hooks/useContentConfig';
import Hero from '@components/Hero';
import MainLayout from '@layouts/MainLayout';
import '@styles/SpellingRules.scss';

const Accentuation: React.FC = () => {
    const ContentConfig = createContentConfig('en', 'accentuation');

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
                        <h3>Oxytone and paroxytone words</h3>
                        <p>
                            Words stressed on the last syllable (oxytone) carry an accent mark if
                            they end in a vowel, &quot;n&quot;, or &quot;s&quot;. Words stressed on
                            the second-to-last syllable (paroxytone) carry an accent mark if they
                            end in a consonant other than &quot;n&quot; or &quot;s&quot;.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Proparoxytone and superproparoxytone words</h3>
                        <p>
                            All words stressed on the third-to-last syllable (proparoxytone) and
                            beyond (superproparoxytone) always carry a written accent mark,
                            regardless of the letter they end in.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Diphthongs, triphthongs and hiatus</h3>
                        <p>
                            In diphthongs and triphthongs, the accent mark is placed on the open
                            vowel (a, e, o). Hiatus formed by two open vowels follow the general
                            rule. However, in hiatus formed by a stressed &quot;i&quot; or
                            &quot;u&quot; next to an open vowel, the accent mark is placed on the
                            &quot;i&quot; or &quot;u&quot; (as in &quot;país&quot; or
                            &quot;día&quot;).
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Compound words</h3>
                        <p>
                            In fused compounds (decimoctavo, veintidós), the general accentuation
                            rule applies. In hyphenated compounds (reloj-despertador,
                            teórico-práctico), each part retains its own accent. Adverbs ending in
                            -mente carry an accent if the base adjective requires one (buenamente,
                            tímidamente). In verb compounds with unstressed pronouns (me, te, se),
                            the verb&apos;s accent is preserved if it has one (propón-propónle) or
                            the general rule applies (dile, díselo).
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Diacritical accent marks</h3>
                        <p>
                            Most monosyllables do not carry an accent mark, except él, mí, tú, sí,
                            dé, sé, té, más, aún when stressed. In questions and exclamations, qué,
                            quién, cuál, cómo, dónde, cuándo, cuánto carry accents. Demonstratives
                            (este, ese, aquel) carry accents when used as pronouns. &quot;Solo&quot;
                            carries an accent as an adverb. Accent marks also apply to capital
                            letters.
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Accentuation;
