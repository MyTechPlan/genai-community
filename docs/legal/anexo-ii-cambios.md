# Anexo II — qué cambió respecto al texto de Julieta (26 oct 2026)

Revisado por GNI Manager (GenAI-ID) el 28 oct 2026: coherente con la Información de privacidad de GenAI-ID. Se conservó su estructura y su redacción. Todo lo nuevo describe cómo funciona hoy genaicommunity.eu (verificado en el código y en producción el 28 oct 2026) o alinea el texto con la Información de privacidad de GenAI-ID, aprobada el 20 oct. Las versiones ES y EN son espejo sección por sección.

## Cambios

| Apartado | Cambio | Por qué |
|---|---|---|
| Intro | El anexo cubre también a quien visita o usa genaicommunity.eu | El sitio trata datos propios (formularios, reCAPTCHA, analítica) |
| 1 | Bloque del responsable copiado de GenAI-ID (añade datos registrales) | Que los textos de MTP coincidan |
| 2 | Corregido: los años de experiencia se declaran en el formulario /join, no en Slack. Añadidos: datos de la solicitud /join, formularios de contacto, perfiles públicos de Chapter Leads, datos técnicos | El formulario /join recoge presentación, motivos, participación, experiencia en GenAI y consentimientos, y el anexo no los mencionaba |
| 3.1 | Correo de bienvenida con el enlace a Slack | Se envía a cada solicitante |
| 3.5 | El consentimiento se da con casilla propia en /join | Decisión de Fran: se añade la casilla |
| 3.7 (nuevo) | Presentación automática en #new-members, con opción de no ser presentado; aclara que no activa el directorio de GenAI-ID | El asistente publica nombre, cargo, empresa, ciudad, presentación y LinkedIn, visibles para todo el Slack. Decisión de Fran: informar y permitir oponerse |
| 3.8 (nuevo) | Perfiles públicos de Chapter Leads (consentimiento) | El apartado 13 solo cubría fotos de eventos |
| 3.9 – 3.11 (nuevos) | Consultas por formulario, seguridad con reCAPTCHA, medición de uso | Tratamientos reales del sitio sin base jurídica declarada |
| 4.2 | Las imágenes del carrusel de eventos se cargan desde Eventbrite, que recibe la IP | Decisión de Fran: declararlo en vez de servirlas desde el sitio |
| 4.4 (nuevo) | Tabla de servicios del sitio, con ubicación | Solo se nombraban Slack, Eventbrite y beehiiv |
| 5 | Añadidos Google Workspace y GenAI-ID; unificación en GenAI-ID con el texto de su aviso, aclarando que no activa newsletter, directorio ni comunicaciones de otros proyectos | Decisión de Fran del 19 oct: la pertenencia se registra en GenAI-ID. Sin prometer correos a miembros existentes |
| 6 | A dónde van las consultas del formulario de cada chapter | Existe lisbon@ y el resto va a hello@ |
| 8 | Lista completa de destinatarios, incluidos miembros de Slack y visitantes de la web | Consecuencia de 3.7 y 3.8 |
| 9 | Redacción de transferencias de GenAI-ID, nombrando a los proveedores de EE. UU. (Slack, beehiiv, Eventbrite, Google, Vercel y Resend) | Coherencia con GenAI-ID |
| 10 | Plazos para solicitudes, consultas y perfiles de Chapter Leads. Consentimientos: «hasta cinco años después de que termine la relación» | Los primeros no estaban; el de consentimientos iguala el plazo de GenAI-ID |
| 12 | Redacción de derechos de GenAI-ID (plazo de un mes, www.aepd.es) | Coherencia con GenAI-ID |
| 15 | La información "necesaria" se da junto al botón de envío y no se "acepta"; casilla para oponerse a 3.7 | Recomendación de GNI Manager: la información se notifica, no se acepta |
| 16 – 17 (nuevos) | Cookies del sitio; menores de 14 y decisiones automatizadas | Coherencia con GenAI-ID y con el banner real del sitio |

## ⚠️ Decisiones pendientes antes de publicar

1. **Google Analytics 4 (3.11, 4.4 y 16).** Fran quiere activarlo, pero no existe una propiedad de GA4 para el Community. Hasta que se cree y se active, esos tres puntos deben retirarse o decir que no está en uso.
2. **Plazo de conservación de las consultas por formulario (10).** El texto propone el criterio de 24 meses de la política general; confirmar.
3. **Google Workspace.** Confirmar que la hoja de cálculo de solicitudes está en la cuenta de Google Workspace de My Tech Plan y no en una cuenta personal.

## Cambios en el sitio de los que depende este texto

- **Funciones en Frankfurt (4.4).** PR #33 de genai-community. Hasta su despliegue, los formularios se procesan en Washington (EE. UU.).
- **Tipografías propias (4.4).** También en el PR #33.
- **Formularios (3.5, 3.7 y 15).** Todavía pendiente: sustituir las casillas «He leído y acepto la Política de Privacidad» por un aviso junto al botón; añadir la casilla de comunicaciones de otros proyectos de MTP; añadir la casilla «No quiero que me presenten en #new-members», desmarcada y junto a la información sobre esa presentación, y que el asistente la respete. Las dos casillas nuevas obligan a añadir columnas a la hoja de solicitudes y a publicar una nueva versión del Apps Script, cosa que solo puede hacer quien tenga acceso a la cuenta de Google.
