
import { ActivityLevel, GoalType } from './types';

export const ACTIVITY_LABELS: Record<string, string> = {
  [ActivityLevel.SEDENTARY]: 'Сидячий образ жизни (минимум нагрузок)',
  [ActivityLevel.LIGHTLY_ACTIVE]: 'Легкая активность (тренировки 1-3 раза в неделю)',
  [ActivityLevel.MODERATELY_ACTIVE]: 'Умеренная активность (тренировки 3-5 раз в неделю)',
  [ActivityLevel.VERY_ACTIVE]: 'Высокая активность (тренировки 6-7 раз в неделю)',
  [ActivityLevel.EXTRA_ACTIVE]: 'Экстремальная активность (тяжелая работа / профи спорт)',
};

export const GOAL_LABELS: Record<string, string> = {
  [GoalType.LOSE_WEIGHT]: 'Похудение (-20% калорий)',
  [GoalType.MAINTAIN]: 'Поддержание веса',
  [GoalType.GAIN_WEIGHT]: 'Набор массы (+15% калорий)',
};

// Mifflin-St Jeor Equation
export const calculateBMR = (weight: number, height: number, age: number, gender: string) => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
};

export const calculateWater = (weight: number) => {
  // Базовая формула: 33мл на 1кг веса
  return Math.round((weight * 0.033) * 10) / 10;
};
