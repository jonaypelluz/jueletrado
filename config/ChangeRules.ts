import { ChangeRule } from '@models/types';

const createChangeRules = (locale: string): ChangeRule[] => {
    const rules: { [key: string]: ChangeRule[] } = {
        en: [
            // suffix confusions
            { 'ence$': 'ance' },                        // difference→differance
            { 'ance$': 'ence' },                        // importance→importence
            { 'ant$': 'ent' },                          // important→importent
            { 'ent$': 'ant' },                          // different→differant
            { 'able$': 'ible' },                        // capable→capible
            { 'ible$': 'able' },                        // possible→possable
            // dropped/wrong letters
            { 'ie': 'ei' },                             // believe→beleive
            { 'ei': 'ie' },                             // ceiling→cieling
            { 'ph': 'f' },                              // phone→fone
            { 'ck': 'k' },                              // black→blak
            { 'qu': 'kw' },                             // queen→kween
            { 'kn': 'n' },                              // knife→nife
            { 'ough': 'uff' },                          // tough→tuff
            { 'oo': 'u' },                              // food→fud
            { 'ing$': 'in' },                           // running→runnin
            { '([a-z])\\1': '$1' },                     // running→runing
            { '([bcdfghjklmnpqrstvwxyz])y$': '$1ie' },  // happy→happie
        ],
        es: [
            // h is always silent — dropping it is a natural mistake
            { 'h': '' },                                // hotel→otel, ahora→aora
            // g/j confusion before e, i
            { 'j(?=[eéiíEÉIÍ])': 'g' },               // jefe→gefe
            { 'g(?=[eéiíEÉIÍ])': 'j' },               // gente→jente
            // c/s confusion before e, i
            { '(?<!c)c(?=[eéiíEÉIÍ])': 's' },         // cena→sena
            // b/v confusion
            { '(?<!m)b': 'v' },                        // tubo→tuvo
            { 'v': 'b' },                              // vaca→baca
            // ll/y confusion
            { 'll': 'y' },                             // pollo→poyo
            { 'y': 'll' },                             // mayo→mallo
            // z/s confusion
            { 'z': 's' },                              // zapato→sapato
            // silent u after g (guerra, guitarra)
            { 'gu(?=[eéiíEÉIÍ])': 'g' },              // guerra→gerra
            // single/double r confusion
            { 'rr': 'r' },                             // perro→pero
        ],
    };

    return rules[locale];
};

export default createChangeRules;
