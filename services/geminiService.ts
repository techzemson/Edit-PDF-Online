import { GoogleGenAI, Type } from "@google/genai";
import { PdfAnalysis, ToolAction, ChartDataItem } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize client
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzePdf = async (base64Data: string): Promise<PdfAnalysis> => {
  if (!API_KEY) throw new Error("API Key is missing");

  // We use gemini-2.5-flash for fast, multimodal processing
  const modelId = "gemini-2.5-flash";

  const prompt = `
    Analyze the attached PDF document. 
    1. Extract the full text content nicely formatted.
    2. Create a concise summary.
    3. Analyze the sentiment (0-100 score).
    4. Extract top 5 keywords with their frequency count.
    5. Extract top 4 main topics with an estimated relevance percentage (total 100).
    6. Count total named entities (people, orgs, places).
    7. Estimate reading time in minutes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullText: { type: Type.STRING },
            summary: { type: Type.STRING },
            sentimentScore: { type: Type.NUMBER },
            sentimentLabel: { type: Type.STRING },
            keywords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER }
                }
              }
            },
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER }
                }
              }
            },
            entityCount: { type: Type.NUMBER },
            readingTimeMin: { type: Type.NUMBER }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as PdfAnalysis;
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const transformText = async (text: string, action: ToolAction): Promise<string> => {
  if (!API_KEY) throw new Error("API Key is missing");

  const modelId = "gemini-2.5-flash";
  let promptText = "";

  switch (action) {
    case ToolAction.SUMMARIZE: promptText = "Summarize this text in 3 key bullet points."; break;
    case ToolAction.FIX_GRAMMAR: promptText = "Fix all grammar, spelling, and punctuation errors. Maintain original formatting."; break;
    case ToolAction.SIMPLIFY: promptText = "Rewrite this text so it is easy for a 5th grader to understand."; break;
    
    // Translations
    case ToolAction.TRANSLATE_ES: promptText = "Translate this text to Spanish."; break;
    case ToolAction.TRANSLATE_FR: promptText = "Translate this text to French."; break;
    case ToolAction.TRANSLATE_DE: promptText = "Translate this text to German."; break;
    case ToolAction.TRANSLATE_ZH: promptText = "Translate this text to Chinese (Simplified)."; break;

    // Styles
    case ToolAction.EXPAND: promptText = "Expand on the ideas in this text with more detail and context."; break;
    case ToolAction.SHORTEN: promptText = "Condense this text significantly without losing key information."; break;
    case ToolAction.MAKE_PROFESSIONAL: promptText = "Rewrite this in a strictly professional, corporate business tone."; break;
    case ToolAction.MAKE_CASUAL: promptText = "Rewrite this in a friendly, casual, and conversational tone."; break;
    case ToolAction.MAKE_ACADEMIC: promptText = "Rewrite this in a formal academic tone suitable for a research paper."; break;
    case ToolAction.MAKE_PERSUASIVE: promptText = "Rewrite this to be more persuasive and compelling."; break;

    // Extraction
    case ToolAction.EXTRACT_EMAILS: promptText = "Extract all email addresses found in the text as a list. If none, say 'No emails found'."; break;
    case ToolAction.EXTRACT_DATES: promptText = "Extract all dates and time references found in the text as a list."; break;
    case ToolAction.EXTRACT_URLS: promptText = "Extract all website URLs found in the text as a list."; break;
    case ToolAction.EXTRACT_PHONE: promptText = "Extract all phone numbers found in the text as a list."; break;

    // Formatting & Logic
    case ToolAction.ACTION_ITEMS: promptText = "Create a checklist of clear action items based on this text."; break;
    case ToolAction.RISK_ASSESSMENT: promptText = "Analyze potential risks, liabilities, or warnings mentioned or implied in this text."; break;
    case ToolAction.GENERATE_QUIZ: promptText = "Generate 3 multiple choice questions (with answers) based on this text."; break;
    case ToolAction.BULLET_POINTS: promptText = "Convert the main points of this text into a bulleted list."; break;
    case ToolAction.FIX_PUNCTUATION: promptText = "Fix only the punctuation in this text, keeping words the same."; break;
    case ToolAction.FORMAT_HTML: promptText = "Format this text as clean HTML code (using p, h1, ul, etc tags) inside a div."; break;

    // Clean Up & Security
    case ToolAction.REMOVE_WATERMARK: promptText = "Remove repetitive watermark phrases (like 'Confidential', 'Draft', 'Sample') or artifact text that appears to be a watermark. Keep the core content intact."; break;
    case ToolAction.REDACT_PII: promptText = "Replace all Personally Identifiable Information (Names, Phone Numbers, Emails, Addresses, SSNs) with '[REDACTED]'. Maintain the rest of the text exactly."; break;

    default: promptText = "Improve this text.";
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Context text: ${text}\n\nTask: ${promptText}\n\nOutput only the result.`
    });
    return response.text || text;
  } catch (error) {
    console.error("Transform Error:", error);
    throw error;
  }
};