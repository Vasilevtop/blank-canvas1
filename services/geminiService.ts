
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, HealthMetrics } from "../types";

// Always use the recommended initialization with named parameter and direct process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getHealthAdvice = async (profile: UserProfile, metrics: HealthMetrics) => {
  const prompt = `
    Я пользователь со следующими параметрами:
    Возраст: ${profile.age} лет
    Рост: ${profile.height} см
    Вес: ${profile.weight} кг
    Пол: ${profile.gender === 'male' ? 'Мужской' : 'Женский'}
    Уровень активности: ${profile.activity} (множитель TDEE)
    Цель: ${profile.goal}
    
    Мои рассчитанные показатели:
    Норма калорий для цели: ${metrics.targetCalories} ккал
    Норма воды: ${metrics.waterIntake} л
    БЖУ: Белки ${metrics.protein}г, Жиры ${metrics.fat}г, Углеводы ${metrics.carbs}г.

    Дай мне короткий, вдохновляющий план действий на русском языке. 
    Включи 3 конкретных совета по питанию и 1 совет по активности. 
    Сгенерируй ответ в формате JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            nutritionTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            activityTip: { type: Type.STRING },
            motivationalQuote: { type: Type.STRING }
          },
          required: ["title", "summary", "nutritionTips", "activityTip", "motivationalQuote"]
        }
      }
    });

    // Directly access the text property as per guidelines
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
