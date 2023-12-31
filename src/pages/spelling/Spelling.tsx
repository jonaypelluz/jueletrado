import React from 'react';
import { Col, Row, Typography } from 'antd';
import { CheckCircleTwoTone } from '@ant-design/icons';
import ContentConfig from '@config/ContentConfig';
import { CardInfo } from '@models/types';
import Hero from 'src/components/Hero';
import MainLayout from 'src/layouts/MainLayout';
import './Spelling.scss';

const { Text, Title } = Typography;

const Spelling: React.FC = () => {
    const contentConfig = ContentConfig.find((content: CardInfo) => content.id === 'Spelling');

    return (
        <MainLayout>
            {contentConfig && (
                <Hero
                    image={contentConfig.imgSrc}
                    title={contentConfig.title}
                    subtitle={contentConfig.description}
                />
            )}
            <div className="spelling-rules-wrapper">
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>El punto</Title>
                        <Text>
                            El punto (.) finaliza enunciados y oraciones, sin espacio antes pero con
                            espacio después, excepto antes de un cierre. Hay tres tipos: punto y
                            seguido, punto y aparte, y punto final. Indica entonación descendente.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>Los dos puntos</Title>
                        <Text>
                            El signo de puntuación dos puntos (:) indica una pausa más larga que la
                            coma pero más corta que el punto, llamando la atención sobre lo que
                            sigue, estrechamente relacionado con el texto anterior. Se usa
                            comúnmente para introducir citas textuales.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La coma</Title>
                        <Text>
                            La coma separa elementos en enumeraciones sin conjunciones (y, o, ni),
                            rodea el vocativo según su posición en la frase, delimita aclaraciones o
                            ampliaciones, y encierra expresiones como &quot;esto es&quot;, &quot;es
                            decir&quot;. Se usa también al invertir el orden habitual de la oración,
                            especialmente con expresiones largas de lugar, tiempo, causa, etc. No se
                            necesita si la expresión antepuesta es breve.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>Punto y coma</Title>
                        <Text>
                            El punto y coma se usa para separar partes de una oración con comas
                            internas y delante de conjunciones como pero, aunque, sin embargo, no
                            obstante, en oraciones extensas.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La interrogación y la admiración</Title>
                        <Text>
                            Los signos de interrogación encierran preguntas formuladas directamente,
                            y los de admiración, oraciones exclamativas. No se usa punto tras estos
                            signos. Preguntas indirectas no llevan signos de interrogación.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>La raya</Title>
                        <Text>
                            La raya (—) se usa para incisos en enunciados y en diálogos para indicar
                            locutores o comentarios del narrador. Se escribe una al inicio y otra al
                            final del inciso, con espacio antes y pegada al texto interno. Puede
                            reemplazar comas o paréntesis para mayor énfasis.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>El paréntesis, corchetes y llaves</Title>
                        <Text>
                            Los paréntesis se usan en pares para separar o aclarar textos,
                            incluyendo paréntesis propiamente dichos ( ), corchetes [ ], y llaves {}
                            . Se nombran como paréntesis que abre (izquierdo) y cierra (derecho). Si
                            se usan varios tipos juntos, el orden es {'(...[...{...}...]...)'}.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>Las comillas: simples y dobles</Title>
                        <Text>
                            Las comillas (« », “ ”, &apos; &apos;) enmarcan citas, palabras
                            destacadas o con uso irónico. Se prefiere « » en español, luego “ ” para
                            citas dentro de citas y &apos; &apos; como último recurso. No se deja
                            espacio entre las comillas y el texto.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>Puntos suspensivos</Title>
                        <Text>
                            Los puntos suspensivos (...) son tres puntos consecutivos usados al
                            final de palabras, frases o oraciones, indicando duda, continuación o
                            suspenso, y a veces omisión de palabras por razones gramaticales o
                            estilísticas.
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <CheckCircleTwoTone twoToneColor="#8ebc79" style={{ fontSize: '36px' }} />
                        <Title level={3}>El guión</Title>
                        <Text>
                            El guión corto se utiliza para tres propósitos principales: formar
                            palabras compuestas (ej. &quot;teórico-práctico&quot;), dividir palabras
                            en sílabas al final de una línea (ej. &quot;aero-&quot; y
                            &quot;puerto&quot;), y señalar rangos de páginas en citas bibliográficas
                            (ej. &quot;pp. 23-29&quot;).
                        </Text>
                    </Col>
                </Row>
            </div>
        </MainLayout>
    );
};

export default Spelling;
