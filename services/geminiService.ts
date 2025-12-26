
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getRideInsight = async (origin: string, destination: string, price: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a very short, witty explanation of why a ride from ${origin} to ${destination} costs $${price.toFixed(2)}. Mention one imaginary local landmark or traffic condition in Brazil context. Keep it under 20 words.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "Traffic is light, enjoy the ride!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Route optimized for safety and speed.";
  }
};

export const getAdminBriefing = async (activeRides: number, totalRevenue: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a logistics consultant. Briefly summarize performance: ${activeRides} active rides and $${totalRevenue} revenue. Suggest one growth tip.`,
      config: {
        temperature: 0.8,
      }
    });
    return response.text || "Operations are stable. Consider peak hour incentives.";
  } catch (error) {
    return "Operations running smoothly.";
  }
};
