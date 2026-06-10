import React from 'react';
import { createContentConfig } from '@hooks/useContentConfig';
import Hero from '@components/Hero';
import MainLayout from '@layouts/MainLayout';
import '@styles/SpellingRules.scss';

const Spelling: React.FC = () => {
    const ContentConfig = createContentConfig('es', 'spelling');

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
                        <h3>El punto</h3>
                        <p>
                            El punto (.) finaliza enunciados y oraciones, sin espacio antes pero con
                            espacio después, excepto antes de un cierre. Hay tres tipos: punto y
                            seguido, punto y aparte, y punto final. Indica entonación descendente.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Los dos puntos</h3>
                        <p>
                            El signo de puntuación dos puntos (:) indica una pausa más larga que la
                            coma pero más corta que el punto, llamando la atención sobre lo que
                            sigue, estrechamente relacionado con el texto anterior. Se usa
                            comúnmente para introducir citas textuales.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>La coma</h3>
                        <p>
                            La coma separa elementos en enumeraciones sin conjunciones (y, o, ni),
                            rodea el vocativo según su posición en la frase, delimita aclaraciones o
                            ampliaciones, y encierra expresiones como &quot;esto es&quot;, &quot;es
                            decir&quot;. Se usa también al invertir el orden habitual de la oración,
                            especialmente con expresiones largas de lugar, tiempo, causa, etc. No se
                            necesita si la expresión antepuesta es breve.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Punto y coma</h3>
                        <p>
                            El punto y coma se usa para separar partes de una oración con comas
                            internas y delante de conjunciones como pero, aunque, sin embargo, no
                            obstante, en oraciones extensas.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>La interrogación y la admiración</h3>
                        <p>
                            Los signos de interrogación encierran preguntas formuladas directamente,
                            y los de admiración, oraciones exclamativas. No se usa punto tras estos
                            signos. Preguntas indirectas no llevan signos de interrogación.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>La raya</h3>
                        <p>
                            La raya (—) se usa para incisos en enunciados y en diálogos para indicar
                            locutores o comentarios del narrador. Se escribe una al inicio y otra al
                            final del inciso, con espacio antes y pegada al texto interno. Puede
                            reemplazar comas o paréntesis para mayor énfasis.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>El paréntesis, corchetes y llaves</h3>
                        <p>
                            Los paréntesis se usan en pares para separar o aclarar textos,
                            incluyendo paréntesis propiamente dichos ( ), corchetes [ ], y llaves {}
                            . Se nombran como paréntesis que abre (izquierdo) y cierra (derecho). Si
                            se usan varios tipos juntos, el orden es {'(...[...{...}...]...)'}.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Las comillas: simples y dobles</h3>
                        <p>
                            Las comillas (« », &quot; &quot;, &apos; &apos;) enmarcan citas, palabras
                            destacadas o con uso irónico. Se prefiere « » en español, luego &quot; &quot; para
                            citas dentro de citas y &apos; &apos; como último recurso. No se deja
                            espacio entre las comillas y el texto.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Puntos suspensivos</h3>
                        <p>
                            Los puntos suspensivos (...) son tres puntos consecutivos usados al
                            final de palabras, frases o oraciones, indicando duda, continuación o
                            suspenso, y a veces omisión de palabras por razones gramaticales o
                            estilísticas.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>El guión</h3>
                        <p>
                            El guión corto se utiliza para tres propósitos principales: formar
                            palabras compuestas (ej. &quot;teórico-práctico&quot;), dividir palabras
                            en sílabas al final de una línea (ej. &quot;aero-&quot; y
                            &quot;puerto&quot;), y señalar rangos de páginas en citas bibliográficas
                            (ej. &quot;pp. 23-29&quot;).
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Spelling;
