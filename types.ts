
export interface UserProfile {
  // Original & Core
  name: string;
  age: number;
  height: number;
  weight: number;
  gender: string;
  goal: 'loss' | 'gain' | 'maintain';
  activityLevel: 'sedentary' | 'moderate' | 'active';
  dietPreference: 'veg' | 'non-veg' | 'vegan';
  dailyCalorieTarget: number;
  healthFocus: string;
  allergies: string[];
  onboarded: boolean;
  isPremium: boolean;
  streak: number;
  lastLoggedDate: string | null;

  // Additional 29 Fields
  targetWeight: number;
  sleepHours: number;
  waterIntake: number;
  stressLevel: number;
  alcoholFrequency: string;
  smokingStatus: string;
  caffeineIntake: number;
  mealsPerDay: number;
  snackFrequency: string;
  lateNightEating: string;
  cookingHabit: string;
  fastFoodFrequency: string;
  sugarCravings: string;
  saltSensitivity: string;
  exerciseType: string;
  workoutDuration: number;
  strengthTrainingFrequency: number;
  cardioFrequency: number;
  stepGoal: number;
  chronicConditions: string;
  supplements: string;
  digestionQuality: number;
  energyLevels: string;
  dietHistory: string;
  supportSystem: string;
  measurementSystem: 'metric' | 'imperial';
  waistCircumference: number;
  bodyFatPercent: number;
  motivation: string;
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  sodium: number;
  healthScore: number;
  verdict: 'Great Choice' | 'Okay, But Improve' | 'Not Ideal';
  fixTip: string;
  portions: string;
  itemsDetected: string[];
}

export interface MealRecord {
  id: string;
  timestamp: number;
  imageUrl: string;
  nutrition: NutritionData;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Recipe {
  name: string;
  time: string;
  cals: number;
  ingredients: string[];
  instructions: string[];
}

export interface AppState {
  user: UserProfile;
  meals: MealRecord[];
  currentScreen: 'onboarding' | 'home' | 'progress' | 'insights' | 'settings' | 'scanner' | 'results' | 'coach' | 'recipes';
  isAnalyzing: boolean;
  analysisResult: NutritionData | null;
  tempImage: string | null;
  chatHistory: ChatMessage[];
  waterLogged: number;
}
