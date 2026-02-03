import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, metrics } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
Ответ должен быть в формате JSON с полями:
- title (строка)
- summary (строка)
- nutritionTips (массив из 3 строк)
- activityTip (строка)
- motivationalQuote (строка)
`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "Ты - персональный ИИ-тренер по здоровью. Отвечай только валидным JSON без markdown-разметки." 
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Превышен лимит запросов, попробуйте позже." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Требуется пополнение баланса." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Ошибка AI сервиса" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response from AI");
    }

    // Parse the JSON from the AI response
    let advice;
    try {
      // Remove potential markdown code blocks
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      advice = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid JSON from AI");
    }

    return new Response(JSON.stringify(advice), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("health-advice error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
