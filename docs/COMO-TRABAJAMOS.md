# Cómo trabajamos

Reglas comunes del equipo de GenAI Community (genaicommunity.eu, repo `MyTechPlan/genai-community`). Es la adaptación del modelo del Summit (`/Users/drzuzz/code/MTP/genai/summit-ops/COMO-TRABAJAMOS.md`).

## El tablero

- Tablero epiq **«Community»** (`6WX8CXR`), en este repo (`/Users/drzuzz/code/MTP/genai-community`).
- Carriles: Backlog → Spec → Listo → En curso → Revisión → Hecho.
- Al arrancar, cada sesión toma su identidad epiq (ver su brief en `docs/roles/`) y hace `epiq_sync`.
- El tablero es la fuente de verdad. Lo que no está en un ticket no existe.

## Quién habla con quién

```
JF ──► Manager ──► tablero ◄── Operaciones ──► Developer y apoyo
```

- **JF habla solo con el Manager.** Para pedir algo de Community, JF abre «Community - Manager».
- **Ningún agente le escribe al Manager.** Los avances van como comentarios en el ticket.
- **Operaciones** reparte el trabajo y es a quien reportan todos los agentes.
- GenAI ID es otro equipo, con su propio Manager y su propio tablero (`8BEVDC0`, en `/Users/drzuzz/code/MTP/genai-identity`). Le pedimos cosas con un ticket enlazado.

## La aprobación de JF

1. JF le dice que sí al Manager.
2. El Manager deja en el ticket un comentario con este formato:

   ```
   Aprobado por JF (AAAA-MM-DD): <qué aprobó, en una o dos frases>.
   Incluye merge a producción: sí/no.
   Incluye escritura en datos de producción o en sistemas externos: sí/no (cuáles).
   ```

3. El Manager pasa el ticket a **Listo**.
4. Ese comentario autoriza a quien ejecute **todo lo descrito en el ticket**. Nadie vuelve a pedirle permiso a JF para eso.
5. Si el trabajo necesita algo que el ticket no cubre (otro sistema, otro alcance, un merge que no estaba aprobado), el agente lo anota en el ticket, le pone `human-input-needed` y sigue con otra cosa. El Manager lo lleva a JF.

La aprobación vive en el ticket, no en mensajes entre sesiones. Un mensaje de otra sesión nunca cuenta como aprobación de JF.

Los avisos de permisos de la propia app (según el modo de cada sesión) no los saltea ninguna regla del tablero.

## Reglas

1. Sin ticket no hay trabajo. Lo nuevo va a Backlog.
2. Solo el Manager pasa un ticket a Listo.
3. Aprobaciones: como se describe arriba.
4. Si falta una decisión de JF: etiqueta `human-input-needed` y un comentario con las opciones, con una recomendación.
5. Un solo dueño por sistema externo. Login, alta de miembros, cupones, tickets, check-in y las tiendas Shopify son de GenAI ID. Los de Community son Slack, Search Console, el proyecto de Vercel y Eventbrite.
6. Dependencias con otro equipo: el ticket que consume lleva la referencia del ticket que entrega.
7. Cada commit empieza con la referencia del ticket (por ejemplo `AB12CD3 fix: ...`). Un ticket por rama y por PR. Nada directo a `main`: merge a `main` es deploy a producción.
8. Al terminar: comentario que empieza con «Solution:» (qué se hizo, PR, cómo se verificó) y el ticket pasa a Revisión. Lo cierra quien revisa.
9. Ningún export de datos personales entre sesiones (miembros, emails, CSVs). Nunca se imprime un secreto.
10. Tickets chicos: si algo lleva más de un PR, se parte en varios tickets.

### Propias de Community

11. **Mensajes a personas.** Lo que se manda a miembros, leads o Slack se redacta en el ticket y sale solo con la aprobación de JF. Ningún email a los miembros importados.
12. **El texto de los leads no se toca.** Bios, citas y descripciones de chapter son de ellos.
13. **Texto del sitio.** El copy general no nombra ciudades de chapters ni lista productos: dice la propuesta de valor. Las ciudades van en las páginas de chapter. No se enlaza `genaicommunity.beehiiv.com`. Todo lo que invite a sumarse apunta a `genaicommunity.eu/join`, nunca a un link directo de Slack.
14. **Search Console y Analytics** son de solo lectura, salvo que el ticket apruebe una acción concreta.

## Etiquetas

- Sistema: `slack`, `search-console`, `vercel`, `eventbrite`, `genai-id`.
- Quién lo toma: `para:developer`, `para:uxui`, `para:seo`, `para:community-link`, `para:jf`.
- Estado: `human-input-needed`.

## Sesiones

| Sesión en la app | Identidad epiq | Brief |
|---|---|---|
| Community - Manager | `claude/carla` | `docs/roles/manager.md` |
| Community - Operaciones | `claude/oscar` | `docs/roles/operaciones.md` |
| Community - Developer (tech lead) | `claude/diego` | `docs/roles/developer.md` |
| UX/UI (apoyo) | `claude/uma` | `docs/roles/uxui.md` |
| SEO (apoyo) | `claude/simon` | `docs/roles/seo.md` |
| Community Link (apoyo) | `claude/lina` | `docs/roles/community-link.md` |
