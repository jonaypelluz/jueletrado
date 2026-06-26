import { Translations } from '@models/interfaces';

const LegalContent: Translations = {
    es: {
        privacyContent: `
<p>En cumplimiento del Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), le informamos sobre el tratamiento de sus datos personales en este sitio web.</p>

<h2>Responsable del tratamiento</h2>
<p>Jonay Pelluz — contacto: jonaypelluz&#64;gmail&#46;com</p>

<h2>Finalidad</h2>
<p>Este sitio web recoge datos de uso de forma anónima y agregada mediante cookies de analítica (Google Analytics) únicamente para medir el tráfico y mejorar el contenido. No se recogen datos personales identificables.</p>

<h2>Base legal</h2>
<p>Consentimiento del usuario (art. 6.1.a RGPD). Puede retirar su consentimiento en cualquier momento desde la configuración de cookies.</p>

<h2>Conservación</h2>
<p>Los datos analíticos se conservan durante el período definido por Google Analytics (26 meses por defecto).</p>

<h2>Derechos</h2>
<p>Puede ejercer sus derechos de acceso, rectificación, supresión, oposición y portabilidad escribiendo a jonaypelluz&#64;gmail&#46;com.</p>

<h2>Destinatarios</h2>
<p>Google LLC, como proveedor de Google Analytics, actúa como encargado del tratamiento. Los datos pueden transferirse fuera del EEE bajo las garantías adecuadas (cláusulas contractuales estándar).</p>
        `.trim(),
        cookiesContent: `
<p>Este sitio web utiliza cookies propias y de terceros para analizar el tráfico.</p>

<h2>¿Qué son las cookies?</h2>
<p>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web. Se usan para recordar preferencias y recopilar información estadística.</p>

<h2>Cookies utilizadas</h2>
<table>
    <thead>
        <tr><th>Cookie</th><th>Origen</th><th>Finalidad</th><th>Duración</th></tr>
    </thead>
    <tbody>
        <tr><td>_ga</td><td>Google Analytics</td><td>Distinguir usuarios únicos</td><td>2 años</td></tr>
        <tr><td>_ga_*</td><td>Google Analytics</td><td>Mantener estado de sesión</td><td>2 años</td></tr>
        <tr><td>jueletrado-analytics</td><td>Propio</td><td>Guardar preferencia de cookies</td><td>Sesión</td></tr>
    </tbody>
</table>

<h2>Gestión de cookies</h2>
<p>Puede aceptar o rechazar las cookies analíticas desde el banner de cookies o desde el enlace «Configuración de cookies» en el pie de página. También puede eliminar las cookies desde la configuración de su navegador.</p>

<h2>Más información</h2>
<p>Para más información sobre el tratamiento de sus datos, consulte nuestra <a href="/politica-de-privacidad/">Política de privacidad</a>.</p>
        `.trim(),
    },
    en: {
        privacyContent: `
<p>In compliance with Regulation (EU) 2016/679 (GDPR) and Spanish Organic Law 3/2018 (LOPDGDD), we inform you about the processing of your personal data on this website.</p>

<h2>Data controller</h2>
<p>Jonay Pelluz — contact: jonaypelluz&#64;gmail&#46;com</p>

<h2>Purpose</h2>
<p>This website collects usage data anonymously and in aggregate form through analytics cookies (Google Analytics) solely to measure traffic and improve content. No personally identifiable data is collected.</p>

<h2>Legal basis</h2>
<p>User consent (art. 6.1.a GDPR). You may withdraw your consent at any time from the cookie settings.</p>

<h2>Retention</h2>
<p>Analytics data is retained for the period defined by Google Analytics (26 months by default).</p>

<h2>Rights</h2>
<p>You may exercise your rights of access, rectification, erasure, objection and portability by writing to jonaypelluz&#64;gmail&#46;com.</p>

<h2>Recipients</h2>
<p>Google LLC, as the provider of Google Analytics, acts as data processor. Data may be transferred outside the EEA under appropriate safeguards (standard contractual clauses).</p>
        `.trim(),
        cookiesContent: `
<p>This website uses first-party and third-party cookies to analyze traffic.</p>

<h2>What are cookies?</h2>
<p>Cookies are small text files stored on your device when you visit a website. They are used to remember preferences and collect statistical information.</p>

<h2>Cookies used</h2>
<table>
    <thead>
        <tr><th>Cookie</th><th>Origin</th><th>Purpose</th><th>Duration</th></tr>
    </thead>
    <tbody>
        <tr><td>_ga</td><td>Google Analytics</td><td>Distinguish unique users</td><td>2 years</td></tr>
        <tr><td>_ga_*</td><td>Google Analytics</td><td>Maintain session state</td><td>2 years</td></tr>
        <tr><td>jueletrado-analytics</td><td>Own</td><td>Store cookie preference</td><td>Session</td></tr>
    </tbody>
</table>

<h2>Managing cookies</h2>
<p>You can accept or reject analytics cookies from the cookie banner or from the «Cookie settings» link in the footer. You can also delete cookies from your browser settings.</p>

<h2>More information</h2>
<p>For more information about the processing of your data, please see our <a href="/en/privacy/">Privacy Policy</a>.</p>
        `.trim(),
    },
};

export { LegalContent };
