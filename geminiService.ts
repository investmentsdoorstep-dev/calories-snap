import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, NutritionData, Recipe } from "./types";

const NUTRITION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    calories: { type: Type.NUMBER, description: "Estimated total calories in kcal" },
    protein: { type: Type.NUMBER, description: "Grams of protein" },
    carbs: { type: Type.NUMBER, description: "Grams of carbohydrates" },
    fats: { type: Type.NUMBER, description: "Grams of fats" },
    fiber: { type: Type.NUMBER, description: "Grams of dietary fiber" },
    sugar: { type: Type.NUMBER, description: "Grams of sugar" },
    sodium: { type: Type.NUMBER, description: "Milligrams of sodium" },
    healthScore: { type: Type.NUMBER, description: "Healthiness score from 0 to 100" },
    verdict: { 
      type: Type.STRING, 
      enum: ["Great Choice", "Okay, But Improve", "Not Ideal"]
    },
    fixTip: { type: Type.STRING },
    portions: { type: Type.STRING },
    itemsDetected: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }
    }
  },
  required: ["calories", "protein", "carbs", "fats", "healthScore", "verdict", "fixTip", "itemsDetected"]
};

export const analyzeMealImage = async (base64Image: string, user: UserProfile): Promise<NutritionData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Act as a senior metabolic analyst. Analyze this meal image with extreme precision for a user with the following profile:
  - Goal: ${user.goal}
  - Weight: ${user.weight}kg
  - Daily Target: ${user.dailyCalorieTarget}kcal
  
  Provide exact macros based on visual portion estimation. Be honest and scientific.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: NUTRITION_SCHEMA,
    }
  });

  return JSON.parse(response.text || '{}') as NutritionData;
};

export const getCoachResponse = async (history: {role: string, text: string}[], user: UserProfile) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use Gemini 3 Pro for higher reasoning capability
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })),
    config: {
      thinkingConfig: { thinkingBudget: 4000 },
      systemInstruction: `You are Cal AI, a world-class Metabolic Scientist, Nutritionist, and Elite Performance Coach. 
      Your purpose is to provide the most scientifically accurate, empathetic, and actionable health advice possible.
      
      User Profile:
      - Name: ${user.name}
      - Age: ${user.age}
      - Goal: ${user.goal === 'loss' ? 'Fat Loss' : user.goal === 'gain' ? 'Muscle Gain' : 'Maintenance'}
      - Metrics: ${user.height}cm, ${user.weight}kg (Target: ${user.targetWeight}kg)
      - Diet Preference: ${user.dietPreference}
      
      Operational Protocols:
      1. CRITICAL: Never provide vague advice. Use specific data, portions, and physiological explanations.
      2. If asked about supplements, suggest evidence-based options (like Creatine, Vitamin D) with caveats.
      3. If asked about workouts, provide a structured routine (sets/reps/duration) aligned with ${user.goal}.
      4. Maintain an "Elite Human" persona: confident, professional, data-driven, and supportive.
      5. End every response with a concise "Metabolic Power Tip" unique to the conversation context.
      6. Use high-quality markdown for readability.`
    }
  });
  
  return response.text;
};

export const generateRecipes = async (user: UserProfile): Promise<Recipe[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Generate 3 elite-level gourmet recipes optimized for:
  User: ${user.name}
  Preference: ${user.dietPreference}
  Primary Goal: ${user.goal}
  Current Metrics: ${user.weight}kg
  Focus on high-satiety, nutrient-dense ingredients.`;
  
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        time: { type: Type.STRING },
        cals: { type: Type.NUMBER },
        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["name", "time", "cals", "ingredients", "instructions"]
    }
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || '[]') as Recipe[];
};