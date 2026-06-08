import React from 'react';
import { createContentConfig } from '@hooks/useContentConfig';
import Hero from '@components/Hero';
import MainLayout from '@layouts/MainLayout';
import '@styles/SpellingRules.scss';

const Accentuation: React.FC = () => {
    const ContentConfig = createContentConfig('es', 'accentuation');

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
                        <h3>Agudas y llanas</h3>
                        <p>
                            Las palabras agudas llevan tilde si terminan en vocal, &quot;n&quot; o
                            &quot;s&quot;. Las llanas llevan tilde si acaban en una consonante
                            distinta de &quot;n&quot; o &quot;s&quot;.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Esdrújulas y sobresdrújulas.</h3>
                        <p>
                            Todas las palabras esdrújulas y sobresdrújulas en español llevan tilde,
                            independientemente de la letra en la que terminen.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Los diptongos, triptongos e hiatos</h3>
                        <p>
                            En los diptongos y triptongos, la tilde se coloca en la vocal abierta
                            (a, e, o). En los hiatos formados por vocales abiertas (a, e, o) se
                            sigue la regla general. Sin embargo, en hiatos formados por
                            &quot;i&quot; o &quot;u&quot; tónicas (acentuadas) y una vocal abierta,
                            la tilde se coloca sobre la &quot;i&quot; o &quot;u&quot; (como en
                            &quot;país&quot; o &quot;día&quot;).
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Palabras compuestas</h3>
                        <p>
                            En compuestos perfectos (decimoctavo, veintidós), se sigue la regla
                            general de acentuación. En compuestos imperfectos (reloj-despertador,
                            teórico-práctico), cada parte conserva su acento propio. Adverbios en
                            -mente llevan tilde si el adjetivo base lo necesita (buenamente,
                            tímidamente). En verbos compuestos con pronombres átonos (me, te, se),
                            se mantiene la tilde del verbo si la tiene (propón-propónle) o se sigue
                            la regla general (dile, díselo).
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>La tilde diacrítica</h3>
                        <p>
                            La mayoría de monosílabos no llevan tilde, excepto él, mí, tú, sí, dé,
                            sé, té, más, aún como tónicas. En interrogativas y exclamativas, qué,
                            quién, cuál, cómo, dónde, cuándo, cuánto llevan tilde. Demostrativos
                            (este, ese, aquel) llevan tilde como pronombres. &quot;Solo&quot; lleva
                            tilde como adverbio. Tildes se aplican también en mayúsculas.
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Accentuation;
