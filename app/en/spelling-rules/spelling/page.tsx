import React from 'react';
import { createContentConfig } from '@hooks/useContentConfig';
import Hero from '@components/Hero';
import MainLayout from '@layouts/MainLayout';
import '@styles/SpellingRules.scss';

const Spelling: React.FC = () => {
    const ContentConfig = createContentConfig('en', 'spelling');

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
                        <h3>The full stop</h3>
                        <p>
                            The full stop (.) ends statements and sentences, with no space before it
                            but a space after, except before a closing bracket. There are three
                            types: mid-paragraph stop, end-of-paragraph stop, and final stop. It
                            indicates a falling intonation.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The colon</h3>
                        <p>
                            The colon (:) indicates a pause longer than a comma but shorter than a
                            full stop, drawing attention to what follows, which is closely linked to
                            the preceding text. It is commonly used to introduce direct quotations.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The comma</h3>
                        <p>
                            The comma separates items in lists without conjunctions (and, or, nor),
                            frames a vocative depending on its position, delimits clarifications or
                            expansions, and encloses expressions such as &quot;that is&quot; or
                            &quot;in other words&quot;. It is also used when the normal word order
                            is inverted, especially with long phrases of place, time, cause, etc. No
                            comma is needed if the fronted phrase is brief.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The semicolon</h3>
                        <p>
                            The semicolon is used to separate parts of a sentence that already
                            contain commas, and before conjunctions such as but, although, however,
                            nevertheless, in long sentences.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Question and exclamation marks</h3>
                        <p>
                            Question marks frame direct questions, and exclamation marks frame
                            exclamatory sentences. No full stop follows these marks. Indirect
                            questions do not take question marks.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The dash</h3>
                        <p>
                            The dash (—) is used for parenthetical insertions in statements and in
                            dialogue to indicate speakers or narrator comments. One dash is written
                            at the start and another at the end of the insertion, with a space
                            before and flush against the internal text. It can replace commas or
                            parentheses for added emphasis.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Parentheses, brackets and braces</h3>
                        <p>
                            Parentheses are used in pairs to separate or clarify text, including
                            round brackets ( ), square brackets [ ], and braces {}. They are named
                            as opening (left) and closing (right). When several types are used
                            together, the order is {'(...[...{...}...]...)'}.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Quotation marks: single and double</h3>
                        <p>
                            Quotation marks (« », &ldquo; &rdquo;, &lsquo; &rsquo;) frame
                            quotations, highlighted words, or words used ironically. Spanish prefers
                            « », then &ldquo; &rdquo; for quotes within quotes, and &lsquo;
                            &rsquo; as a last resort. No space is left between the quotation marks
                            and the text.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>Ellipsis</h3>
                        <p>
                            The ellipsis (...) consists of three consecutive dots used at the end of
                            words, phrases, or sentences to indicate doubt, continuation, or
                            suspense, and sometimes to mark an omission for grammatical or stylistic
                            reasons.
                        </p>
                    </div>
                    <div className="spelling-item">
                        <span className="check-icon">✓</span>
                        <h3>The hyphen</h3>
                        <p>
                            The short hyphen is used for three main purposes: forming compound words
                            (e.g. &quot;teórico-práctico&quot;), dividing words into syllables at
                            the end of a line (e.g. &quot;aero-&quot; and &quot;puerto&quot;), and
                            indicating page ranges in bibliographic citations (e.g. &quot;pp.
                            23-29&quot;).
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Spelling;
