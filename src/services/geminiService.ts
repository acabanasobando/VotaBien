import { GoogleGenAI, Type } from "@google/genai";
import { GovernmentEvaluation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function evaluateGovernment(state: string, administration: string, duration?: number): Promise<GovernmentEvaluation> {
  const durationText = duration ? `Toma en cuenta que este es un periodo de gestión de ${duration} años. Evalúa los resultados acumulados o proyectados para este ciclo específico.` : '';
  const prompt = `Actúa como un analista experto en políticas públicas y desarrollo socioeconómico especializado en México. 
Tu tarea es evaluar el desempeño del gobierno del estado de ${state}, México (administración/periodo: ${administration}) utilizando una escala de 0 a 10.
${durationText}

La evaluación debe basarse ESTRICTAMENTE en estos 7 pilares con estos nombres exactos:
1. "Economía"
2. "Educación"
3. "Salud"
4. "Seguridad"
5. "Gobierno"
6. "Infraestructura"
7. "Medio Ambiente"

REGLA ESPECIAL PARA SUB-INDICADORES:
- Para el pilar "Economía", DEBES incluir: PIB (Crecimiento estatal), Inflación (Impacto local), Desempleo, Tasa de interés (Impacto en crédito local), Inversión (Extranjera y nacional en el estado), Tipo de cambio (Impacto en remesas o exportaciones estatales).
- Para el pilar "Educación", DEBES incluir: Acceso y cobertura, Nivel educativo, Infraestructura educativa, Opciones educativas nivel superior.
- Para el pilar "Salud", DEBES incluir: Indicadores de mortalidad, Indicadores de morbilidad y nutrición, Indicadores de servicio y sistema de salud (vacunación), Gasto en salud.
- Para el pilar "Seguridad", DEBES incluir: Tasa de homicidios, Desaparecidos, Índice de criminalidad, Conflictos armados, Gasto en policías municipales y estatales, Eficiencia en el sistema de justicia.
- Para el pilar "Gobierno", DEBES incluir: Corrupción, Rendición de cuentas, Transparencia, Participación ciudadana, Capacidad de respuesta, Innovación.
- Para el pilar "Infraestructura", DEBES incluir: Transporte y logística (caminos y carreteras, trenes, barcos, aduanas), Servicios públicos y básicos (agua, energía, vivienda), Telecomunicaciones y conectividad.
- Para el pilar "Medio Ambiente", DEBES incluir: Calidad del aire, Calidad del agua, Áreas protegidas, Especies en peligro, Energías renovables, Huella ecológica.

Para cada pilar principal:
- Asigna una calificación de 0 a 10.
- Proporciona una breve justificación técnica (2–3 líneas).

Luego:
- Calcula un promedio general.
- Da una evaluación final sintética del gobierno estatal.
- Clasifica el desempeño como: "Malo" (0-4.5), "Regular" (4.6-7.4), "Bueno" (7.5-10).

IMPORTANTE: Basa el análisis en datos oficiales (INEGI, CONEVAL, etc.) y criterios comparables. Evita opiniones personales o ideológicas. Responde SIEMPRE en español.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            country: { type: Type.STRING },
            state: { type: Type.STRING },
            administration: { type: Type.STRING },
            pillars: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pillar: { 
                    type: Type.STRING,
                    enum: ["Economía", "Educación", "Salud", "Seguridad", "Gobierno", "Infraestructura", "Medio Ambiente"]
                  },
                  score: { type: Type.NUMBER },
                  justification: { type: Type.STRING },
                  subIndicators: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        description: { type: Type.STRING }
                      },
                      required: ["name", "score", "description"]
                    }
                  }
                },
                required: ["pillar", "score", "justification"]
              }
            },
            averageScore: { type: Type.NUMBER },
            finalEvaluation: { type: Type.STRING },
            classification: { 
              type: Type.STRING,
              enum: ["Malo", "Regular", "Bueno"]
            }
          },
          required: ["country", "state", "administration", "pillars", "averageScore", "finalEvaluation", "classification"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No se recibió respuesta del analista.");
    
    const result = JSON.parse(text) as GovernmentEvaluation;
    return { ...result, periodDuration: duration };
  } catch (error) {
    console.error("Error en la evaluación del gobierno:", error);
    throw new Error("El servicio de análisis no está disponible en este momento. Por favor, intenta más tarde.");
  }
}
