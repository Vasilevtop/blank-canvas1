import { supabase } from "../src/integrations/supabase/client";
import { UserProfile, HealthMetrics } from "../types";

export const getHealthAdvice = async (profile: UserProfile, metrics: HealthMetrics) => {
  try {
    const { data, error } = await supabase.functions.invoke('health-advice', {
      body: { profile, metrics }
    });

    if (error) {
      console.error("Health advice error:", error);
      return null;
    }

    if (data?.error) {
      console.error("Health advice API error:", data.error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Health advice fetch error:", error);
    return null;
  }
};
