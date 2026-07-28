# ADR-015 — Andrómeda Cognitive Architecture & Campaign Brain

## Estatus
Propuesto / En Revisión (Visión V2 de FPlus)

---

## Contexto y Desafíos de Negocio

El motor estratégico actual de Andrómeda AI opera bajo un conjunto de reglas algorítmicas y heurísticas de calendarización. Aunque esto previene la secuencialidad estática y optimiza los formatos por plataforma e industria, carece de un modelo estratégico unificado y de un bucle de retroalimentación de rendimiento.

Para consolidar FPlus como el verdadero **AgencyOS impulsado por IA**, debemos evolucionar Andrómeda de ser un mero "generador de calendarios" a un **motor cognitivo unificado**. Esta evolución se apoya en tres cambios paradigmáticos:
1.  **Campaign Brain (El Post como consecuencia):** La unidad fundamental del sistema no es el post aislado; es la **Campaña**. Las publicaciones se generan y optimizan de forma cruzada como piezas tácticas de un embudo unificado.
2.  **Brief Maestro como Memoria Permanente:** El Brief se convierte en la memoria de largo plazo e identidad de la marca.
3.  **Bucle de Aprendizaje Humano-Cerrado (Closed-loop):** Registrar y procesar el aprendizaje no solo a partir de KPIs de Meta, sino de cambios humanos (copies modificados, rechazos, comentarios del cliente).

---

## Decisiones de Arquitectura Cognitiva (V2)

Proponemos la división del procesamiento de Andrómeda en cinco capas estructuradas y un ecosistema de agentes especializados:

```
                  +-----------------------------------+
                  |        Andrómeda AI Orchestrator  |
                  +-----------------------------------+
                                    ↓
+---------------------------------------------------------------------------+
| 1. BRAND MEMORY LAYER (Brief Maestro, Tono, Pilares, Historial Humano)    |
+---------------------------------------------------------------------------+
| 2. MARKETING STRATEGY LAYER (Campaign Blueprint, Embudo TOFU/MOFU/BOFU)   |
+---------------------------------------------------------------------------+
| 3. PERFORMANCE MEMORY LAYER (Métricas de Meta, KPIs de Conversión)         |
+---------------------------------------------------------------------------+
| 4. CREATIVE MEMORY LAYER (Hooks, Plantillas de Copy, CTAs, Formatos)      |
+---------------------------------------------------------------------------+
| 5. OPTIMIZATION LAYER (Andrómeda Score, Pre-flight Checks, Refinamiento)  |
+---------------------------------------------------------------------------+
```

### 1. Las Cinco Capas Cognitivas

1.  **Brand Memory Layer (Memoria de Marca):**
    *   Almacena el perfil del cliente, Brief Maestro, pilares temáticos y tono de comunicación.
    *   **Human Learning Log:** Registra modificaciones manuales hechas por directores de arte o clientes (ej: si el cliente borra hashtags o prefiere copys más cortos en LinkedIn, la memoria se actualiza para no repetir el patrón en la siguiente generación).
2.  **Marketing Strategy Layer (Estrategia de Campaña):**
    *   Toma como base el **Campaign Blueprint**: Objetivo comercial, Buyer Persona específico, Dolor principal, Mensajes clave, Canales y KPIs de éxito.
    *   Diseña el embudo de conversión y calcula la densidad y distribución óptima de publicaciones.
3.  **Performance Memory Layer (Memoria de Desempeño):**
    *   Consume las métricas diarias de Meta Graph API.
    *   Compara el rendimiento orgánico e invertido para favorecer temas y formatos exitosos en las propuestas futuras.
4.  **Creative Memory Layer (Memoria Creativa):**
    *   Estructura la redacción mediante plantillas persuasivas, ganchos (hooks) sectoriales y llamados a la acción (CTAs) de conversión directa.
5.  **Optimization Layer (Capa de Puntuación):**
    *   Calcula el **Andrómeda Score** (escala de 1 a 100).
    *   Si una propuesta tiene un score bajo (ej: copy monótono, sin CTA explícito, incompatibilidad de formato), el sistema la refina de forma interna antes de presentarla en AgencyOS.

---

## Ecosistema de Agentes Cognitivos Especializados

En lugar de construir un único modelo de lenguaje monolítico y sobrecargado de contexto, la V2 de Andrómeda implementará un ecosistema de subagentes con roles delimitados:

1.  **Brand & Tone Agent (Guardián de Marca):** Especializado en la Brand Memory; analiza la ortografía, modismos, tono de voz y restricciones de la marca.
2.  **Media Layout Agent (Estratega Visual):** Evalúa la idoneidad técnica y estética de las imágenes/videos frente a la plataforma de destino.
3.  **SEO & Hashtag Optimizer:** Encargado de indexación semántica, selección de tags locales y palabras clave.
4.  **Strategic Funnel Planner:** Encargado de calendarizar y asegurar que el viaje del usuario (TOFU -> MOFU -> BOFU) se cubra uniformemente.
5.  **Andrómeda Evaluator Agent:** Ejecuta las validaciones cruzadas y emite el *Andrómeda Score*.
