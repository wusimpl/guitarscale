import { GoogleGenAI } from "@google/genai";
import { ScaleType, NoteName } from "../types";

// Safety check for API key availability without exposing it in the client code directly if using a proxy, 
// but for this implementation we assume process.env.API_KEY is available as per instructions.
const apiKey = process.env.API_KEY;

export const generateMusicAdvice = async (
  rootNote: NoteName, 
  scaleType: ScaleType, 
  userQuery: string
): Promise<string> => {
  if (!apiKey) {
    return "错误：未检测到 API Key。请确保在环境中配置了 process.env.API_KEY。";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Using a faster model for text interaction
    const modelId = 'gemini-3-flash-preview';
    
    const context = `
      You are an expert guitar teacher and music theorist.
      The user is currently looking at a fretboard visualization of the ${rootNote} ${scaleType} scale.
      
      Please answer the user's question briefly and helpfully. 
      If the user asks for exercises, provide a simple tab or pattern.
      If the user asks about theory, explain the intervals and how they function in this scale.
      
      Keep the tone encouraging and professional.
      Format the response with clear paragraphs or bullet points.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: 'user',
          parts: [{ text: `Context: ${context}\n\nUser Question: ${userQuery}` }]
        }
      ],
      config: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    return response.text || "抱歉，我无法生成回复。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "连接 AI 服务时出错，请稍后重试。";
  }
};