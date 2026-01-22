
import { GoogleGenAI, Type } from "@google/genai";
import { SigtapProcedure } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchSigtapExams = async (query: string): Promise<SigtapProcedure[]> => {
  if (!query || query.length < 2) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Liste exames laboratoriais da tabela SIGTAP que correspondam a "${query}". 
      Retorne apenas um array JSON com objetos contendo: code (8 dígitos), name, referenceRange (ex: "70-99"), unit (ex: "mg/dL").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              name: { type: Type.STRING },
              referenceRange: { type: Type.STRING },
              unit: { type: Type.STRING }
            },
            required: ["code", "name", "referenceRange", "unit"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro ao buscar no SIGTAP:", error);
    return [];
  }
};

export const parseExamPDF = async (base64Pdf: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: base64Pdf
          }
        },
        {
          text: `Analise este laudo laboratorial e extraia os exames encontrados. 
          Para cada exame, retorne um objeto JSON com: 
          examName, value (apenas número), referenceRange (texto da referência), sigtapCode (se conseguir identificar), laboratory, requestingDoctor, date (YYYY-MM-DD).
          Retorne apenas um array JSON.`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              examName: { type: Type.STRING },
              value: { type: Type.NUMBER },
              referenceRange: { type: Type.STRING },
              sigtapCode: { type: Type.STRING },
              laboratory: { type: Type.STRING },
              requestingDoctor: { type: Type.STRING },
              date: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Erro ao processar PDF:", error);
    throw new Error("Não foi possível processar este arquivo PDF.");
  }
};

export const analyzeHealthEvolution = async (exams: any[], conditions: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise o histórico de exames: ${JSON.stringify(exams)}. 
      Condições preexistentes do paciente: ${conditions}. 
      Forneça um resumo executivo da evolução clínica em português, destacando tendências preocupantes ou melhorias.`,
    });
    return response.text;
  } catch (error) {
    return "Não foi possível gerar a análise clínica automática no momento.";
  }
};
