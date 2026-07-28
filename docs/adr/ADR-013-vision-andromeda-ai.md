# ADR-013 — Visión de Andrómeda AI como Motor Estratégico en AgencyOS

**Estado:** ✅ Aceptada · **Fecha:** 2026-07-11 · **Refina:** [ADR-008 Arquitectura Desacoplada](ADR-008-arquitectura-desacoplada.md), [ADR-011 Arquitectura de Identidad](ADR-011-arquitectura-identidad.md)

## Contexto

El desarrollo del módulo de Clientes y el Portal del Cliente ha demostrado que las agencias digitales y los clientes finales no requieren únicamente herramientas de gestión de tareas o programadores automáticos de publicaciones de redes sociales (MVs). FPlus se define como un **AgencyOS** integrado. Esto demanda que el asistente de Inteligencia Artificial, denominado **Andrómeda AI**, no actúe meramente como un redactor de textos o generador lineal de posts, sino como un estratega de marketing de nivel superior.

## Problema

Los programadores de contenidos tradicionales organizan calendarios de manera repetitiva e inorgánica (ej. lunes: post, martes: reel, miércoles: historia), ignorando los embudos de conversión, objetivos comerciales reales de la marca, presupuestos y el comportamiento cambiante de los algoritmos de cada red social. Esto resulta en publicaciones genéricas, desconectadas del material visual y de los objetivos comerciales del cliente de pago, limitando la efectividad comercial del software.

## Principios y Decisiones Estratégicas

Para asegurar que FPlus se consolide como un software SaaS comercial premium competitivo, se establecen las siguientes directrices arquitectónicas y funcionales para **Andrómeda AI**:

### 1. La IA como Estratega de Marketing (No Generador de Contenido Lineal)
*   Andrómeda AI diseñará campañas completas analizando variables del **Brief Maestro** (diferenciadores, perfil de cliente ideal, competencia, dolores de negocio, restricciones, temporadas).
*   Cada publicación sugerida debe tener asignada una intención clara dentro de las etapas del embudo de conversión (Reconocimiento, Consideración, Conversión, Remarketing) y un objetivo específico (Conversar, Educar, Vender, Entretener).

### 2. Dos Modos de Operación en el Calendario (Planificación)
*   **Modo 1 · Planificación Inteligente (IA):** Andrómeda genera de forma autónoma el plan estratégico de contenidos del mes, determinando formatos, canales y copies óptimos basados en los KPIs históricos.
*   **Modo 2 · Planificación Manual (Agencia):** La agencia retiene el control creativo absoluto para estructurar el calendario arrastrando y definiendo piezas directamente.

### 3. Publicaciones Asistidas de Alta Fidelidad
*   Toda pieza generada por Andrómeda AI debe incluir obligatoriamente: imagen propuesta (o descripción visual clara), plataforma, formato, copy estructurado, hashtags contextualizados, objetivo, llamada a la acción (CTA), tono de comunicación y justificación de por qué fue programada en esa fecha y hora específica.

### 4. Copies y Hashtags Coherentes con el Contexto Visual
*   Andrómeda AI analizará los metadatos y etiquetas visuales de los creativos subidos (ej. qué objeto, emoción o servicio aparece en la imagen) para asegurar que el copy redactado esté en completa armonía con la imagen, evitando textos genéricos.
*   Los hashtags se clasificarán y seleccionarán dinámicamente según la industria, la intención de la pieza y la ubicación del público objetivo.

### 5. Cierre del Bucle (Feedback Loop de Métricas)
*   Se diseñará una arquitectura de datos que unifique métricas de plataformas publicitarias (Meta, Google, TikTok, LinkedIn Ads), analítica web (Google Analytics) e interacciones conversacionales (WhatsApp, Formularios, CRM).
*   Estos resultados alimentarán de manera retrospectiva al motor de Andrómeda AI para optimizar y calibrar la precisión de las futuras campañas del cliente.

### 6. Asistente Conversacional y Seguimiento de Leads
*   La interacción con prospectos captados (leads) no se limitará a auto-respuestas lineales. Se implementará un asistente de chat conversacional natural con retención de contexto, capacidad de calificación automática y detección de intención de compra.
*   Se programarán flujos de seguimiento automatizados (follow-ups) condicionados al comportamiento del lead, notificando y escalando a un agente humano únicamente en casos complejos.

## Consecuencias Positivas

*   **Diferenciador en el Mercado:** FPlus se posiciona como una plataforma de inteligencia estratégica y operativa, atrayendo a agencias de marketing medianas y grandes que buscan eficiencia real.
*   **Calidad V1 Comercial:** Eleva la percepción de calidad del Portal del Cliente a la altura de softwares globales como Linear, Notion o ClickUp.
*   **Decisiones Basadas en Datos:** La re-alimentación de métricas asegura que el motor de IA optimice el retorno de inversión (ROI) de los clientes de manera automática.

## Riesgos y Mitigación

*   **Costo y Latencia de LLMs:** El análisis de múltiples variables y generación de copies/funnels detallados incrementará el consumo de tokens y tiempos de respuesta.
    *   *Mitigación:* Se implementarán arquitecturas asíncronas con colas de procesamiento (Edge Functions de Supabase en background) y almacenamiento de caché para plans estratégicos recurrentes.
