export enum Gender {
  MALE = 'male',
  FEMALE = 'female'
}

export enum ActivityLevel {
  SEDENTARY = '1.2', // Сидячий образ жизни
  LIGHTLY_ACTIVE = '1.375', // Легкая активность
  MODERATELY_ACTIVE = '1.55', // Умеренная активность
  VERY_ACTIVE = '1.725', // Высокая активность
  EXTRA_ACTIVE = '1.9' // Экстремальная активность
}

export enum GoalType {
  LOSE_WEIGHT = 'lose',
  MAINTAIN = 'maintain',
  GAIN_WEIGHT = 'gain'
}

export interface UserProfile {
  age: number;
  height: number;
  weight: number;
  startingWeight: number;
  targetWeight: number;
  targetMonths: number;
  gender: Gender;
  activity: ActivityLevel;
  goal: GoalType;
}

export interface HealthMetrics {
  bmr: number;
  tdee: number;
  targetCalories: number;
  waterIntake: number;
  protein: number;
  fat: number;
  carbs: number;
  bmi: number;
  bodyFat: number;
  fiberIntake: number;
  healthyWeightRange: {
    min: number;
    max: number;
  };
}
