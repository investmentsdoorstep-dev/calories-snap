
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  LayoutDashboard, 
  Settings, 
  Flame, 
  CheckCircle2,
  Zap,
  Target,
  Moon,
  Scale,
  Smile,
  Sparkles,
  Search,
  X,
  ChevronLeft,
  Activity,
  Dumbbell,
  Clock,
  Droplets,
  MessageCircle,
  BookOpen,
  BarChart2,
  Send,
  ChefHat,
  Coffee,
  Pizza,
  Stethoscope,
  Brain,
  Wind,
  GlassWater,
  Utensils
} from 'lucide-react';
import { AppState, UserProfile, MealRecord, NutritionData, ChatMessage, Recipe } from './types';
import { analyzeMealImage, getCoachResponse, generateRecipes } from './geminiService';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

// --- Constants ---
const INITIAL_USER: UserProfile = {
  name: '', age: 25, height: 175, weight: 70, gender: 'Other', goal: 'maintain',
  activityLevel: 'moderate', dietPreference: 'non-veg', dailyCalorieTarget: 2000,
  healthFocus: 'Balanced', allergies: [], onboarded: false, isPremium: false,
  streak: 0, lastLoggedDate: null, targetWeight: 70, sleepHours: 7, waterIntake: 8,
  stressLevel: 5, alcoholFrequency: 'never', smokingStatus: 'non-smoker', caffeineIntake: 1,
  mealsPerDay: 3, snackFrequency: 'sometimes', lateNightEating: 'rarely',
  cookingHabit: 'mostly-home', fastFoodFrequency: 'rarely', sugarCravings: 'moderate',
  saltSensitivity: 'normal', exerciseType: 'strength', workoutDuration: 45,
  strengthTrainingFrequency: 3, cardioFrequency: 2, stepGoal: 10000,
  chronicConditions: 'none', supplements: 'none', digestionQuality: 8,
  energyLevels: 'stable', dietHistory: 'balanced', supportSystem: 'friends',
  measurementSystem: 'metric', waistCircumference: 80, bodyFatPercent: 20, motivation: ''
};

const COACH_STARTERS = [
  "How do I hit my protein goal?", "Best pre-workout meals?", "How to lose fat quickly?", 
  "Keto vs Paleo: which is better?", "Morning routine for weight loss?", "Is intermittent fasting safe?",
  "How to stop sugar cravings?", "High-volume low-cal foods?", "Effective home workout plan?",
  "Why is my weight plateauing?", "Impact of sleep on fat loss?", "Is caffeine good for metabolism?",
  "How to calculate maintenance calories?", "Best vegetarian protein sources?", "Benefits of cold showers?",
  "How much fiber do I need daily?", "Does alcohol stop fat loss?", "Best time to eat carbs?",
  "How to build muscle as a vegan?", "Managing stress-induced eating?", "Top 5 supplements for focus?",
  "Gut health and weight management?", "Effective core-building exercises?", "How to track oil and sauces?",
  "Meal prep ideas for a busy week?", "Impact of hydration on hunger?", "What are anti-inflammatory foods?",
  "Dealing with hunger at night?", "How to stay motivated for gym?", "Importance of active recovery?"
];

// --- Strictly Relevant Onboarding Steps (Maintaining the 30 question flow) ---
const ONBOARDING_STEPS = [
  { title: "What should we call you?", key: 'name', type: 'text', placeholder: "Full Name" },
  { title: "Identify your biological gender.", key: 'gender', type: 'choice', options: [{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }, { label: 'Other', value: 'Other' }] },
  { title: "What is your primary health goal?", key: 'goal', type: 'choice', options: [{ label: 'Lose Fat', value: 'loss', icon: <Scale /> }, { label: 'Performance', value: 'maintain', icon: <Target /> }, { label: 'Build Muscle', value: 'gain', icon: <Flame /> }] },
  { title: "Current Age (Years)", key: 'age', type: 'range', min: 13, max: 100 },
  { title: "Current Stature (cm)", key: 'height', type: 'range', min: 100, max: 250 },
  { title: "Current Mass (kg)", key: 'weight', type: 'range', min: 30, max: 200 },
  { title: "Target Mass (kg)", key: 'targetWeight', type: 'range', min: 30, max: 200 },
  { title: "Daily Activity Level", key: 'activityLevel', type: 'choice', options: [{ label: 'Sedentary', value: 'sedentary', icon: <Moon /> }, { label: 'Moderate', value: 'moderate', icon: <Activity /> }, { label: 'Very Active', value: 'active', icon: <Zap /> }] },
  { title: "Primary Exercise Type", key: 'exerciseType', type: 'choice', options: [{ label: 'Strength', value: 'strength', icon: <Dumbbell /> }, { label: 'Cardio', value: 'cardio', icon: <Wind /> }, { label: 'Hybrid', value: 'mixed', icon: <Zap /> }] },
  { title: "Avg Workout Duration (min)", key: 'workoutDuration', type: 'range', min: 0, max: 180 },
  { title: "Strength Sessions / Week", key: 'strengthTrainingFrequency', type: 'range', min: 0, max: 7 },
  { title: "Cardio Sessions / Week", key: 'cardioFrequency', type: 'range', min: 0, max: 7 },
  { title: "Daily Step Objective", key: 'stepGoal', type: 'range', min: 2000, max: 30000, step: 1000 },
  { title: "Avg Sleep Duration (hrs)", key: 'sleepHours', type: 'range', min: 3, max: 12 },
  { title: "Daily Hydration Goal (Glasses)", key: 'waterIntake', type: 'range', min: 4, max: 20 },
  { title: "Current Stress Level", key: 'stressLevel', type: 'range', min: 1, max: 10 },
  { title: "Alcohol Consumption", key: 'alcoholFrequency', type: 'choice', options: [{ label: 'None', value: 'never' }, { label: 'Socially', value: 'social' }, { label: 'Weekly', value: 'weekly' }] },
  { title: "Smoking Status", key: 'smokingStatus', type: 'choice', options: [{ label: 'Non-Smoker', value: 'non-smoker' }, { label: 'Occasional', value: 'smoker' }] },
  { title: "Caffeine Frequency (Cups/Day)", key: 'caffeineIntake', type: 'range', min: 0, max: 10 },
  { title: "Meals Per Day", key: 'mealsPerDay', type: 'range', min: 1, max: 8 },
  { title: "Snacking Frequency", key: 'snackFrequency', type: 'choice', options: [{ label: 'Rarely', value: 'rarely' }, { label: 'Sometimes', value: 'sometimes' }, { label: 'Often', value: 'often' }] },
  { title: "Late Night Eating Habits", key: 'lateNightEating', type: 'choice', options: [{ label: 'Never', value: 'never' }, { label: 'Sometimes', value: 'sometimes' }, { label: 'Often', value: 'always' }] },
  { title: "Culinary Habits", key: 'cookingHabit', type: 'choice', options: [{ label: 'Mostly Home', value: 'mostly-home', icon: <ChefHat /> }, { label: 'Mostly Out', value: 'mostly-out', icon: <Utensils /> }] },
  { title: "Fast Food Frequency", key: 'fastFoodFrequency', type: 'choice', options: [{ label: 'Rarely', value: 'rarely', icon: <Smile /> }, { label: 'Often', value: 'often', icon: <Pizza /> }] },
  { title: "Sugar Craving Intensity", key: 'sugarCravings', type: 'choice', options: [{ label: 'Low', value: 'low' }, { label: 'Moderate', value: 'moderate' }, { label: 'High', value: 'high' }] },
  { title: "Existing Medical Conditions", key: 'chronicConditions', type: 'text', placeholder: "e.g. None, Asthma, Diabetes" },
  { title: "Daily Supplements", key: 'supplements', type: 'text', placeholder: "e.g. Creatine, Whey, Multi-V" },
  { title: "Digestion Efficiency (1-10)", key: 'digestionQuality', type: 'range', min: 1, max: 10 },
  { title: "Dietary History Context", key: 'dietHistory', type: 'choice', options: [{ label: 'Historically Stable', value: 'balanced' }, { label: 'Weight Cycling', value: 'yoyo' }] },
  { title: "What is your deep 'Why'?", key: 'motivation', type: 'text', placeholder: "Confidence, Longevity, Power" },
  { title: "Metabolic Protocol Prepared", key: 'onboarded', type: 'choice', options: [{ label: 'Initialize Cal AI', value: true }] }
];

// --- Reusable UI ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const baseStyles = "w-full py-4 rounded-[1.8rem] font-black btn-press flex items-center justify-center gap-2 select-none transition-all";
  const variants = {
    primary: "bg-black text-white",
    secondary: "bg-gray-50 text-black border border-gray-100",
    outline: "border-2 border-black text-black bg-transparent",
    text: "bg-transparent text-[#9E9E9E] hover:text-black font-bold"
  };
  return <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${className}`}>{children}</button>;
};

const Card = ({ children, className = "" }: any) => (
  <div className={`bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm ${className}`}>{children}</div>
);

// --- Inescapable Paywall ---
const Paywall = ({ onUnlock }: { onUnlock: () => void }) => (
  <div className="fixed inset-0 z-[200] bg-white flex flex-col p-6 overflow-y-auto animate-paywall-reveal hide-scrollbar">
    <div className="text-center mt-10 mb-8">
      <h1 className="text-[2.2rem] font-black tracking-tighter leading-tight mb-2">Pay less. Get better results.</h1>
      <p className="text-[#9E9E9E] font-medium text-base">Choose the plan that fits your goals.</p>
    </div>
    <div className="space-y-4 flex-1">
      <div className="relative p-6 rounded-[2rem] border-2 border-black bg-white shadow-xl">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Best Value</div>
        <h3 className="text-xl font-black">12 Months</h3>
        <div className="flex items-baseline gap-1 mt-1 mb-4">
          <span className="text-2xl font-black">$39.99</span><span className="text-[#9E9E9E] font-bold">/ year</span>
        </div>
        <ul className="space-y-2 mb-6">
          {["Full AI Recognition", "24/7 AI Health Coach", "Personalized Recipe Lab", "Advanced Metabolic Insights", "Unlimited Water Tracking"].map(f => (
            <li key={f} className="flex items-center gap-2 text-xs font-bold"><CheckCircle2 size={16} />{f}</li>
          ))}
        </ul>
        <Button onClick={onUnlock}>Unlock All Features</Button>
      </div>
      <div className="p-6 rounded-[2rem] border border-gray-100 bg-gray-50 text-center">
        <h3 className="text-lg font-black">Monthly Access</h3>
        <p className="text-xl font-black mt-1">$7.99</p>
        <Button variant="text" onClick={onUnlock}>Continue monthly</Button>
      </div>
    </div>
    <p className="text-center text-[9px] text-[#9E9E9E] font-black uppercase tracking-[0.2em] mt-8 mb-6">Secure Payment • No Commitments</p>
  </div>
);

// --- Feature Screens ---
const CoachScreen = ({ user, history, onSend }: { user: UserProfile, history: ChatMessage[], onSend: (t: string) => void }) => {
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { 
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [history]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    setInput('');
    setIsBotTyping(true);
    await onSend(text);
    setIsBotTyping(false);
  };

  return (
    <div className="h-full flex flex-col p-6 animate-premium-fade bg-white">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-black tracking-tighter">Coach</h1>
        <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white"><Sparkles size={18} /></div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-5 mb-4 hide-scrollbar">
        {history.length === 0 && (
          <div className="py-6 space-y-10">
            <div className="text-center px-4">
              <div className="w-16 h-16 bg-gray-50 rounded-[1.8rem] flex items-center justify-center mx-auto mb-4 shadow-sm"><Sparkles size={28} className="text-black" /></div>
              <h2 className="text-xl font-black mb-1">Metabolic Intelligence</h2>
              <p className="text-gray-400 font-medium text-xs leading-relaxed">I have analyzed your 30-step profile. Select a baseline query to begin your scientific consultation.</p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-1">Knowledge Starters</h4>
              <div className="grid grid-cols-1 gap-2">
                {COACH_STARTERS.slice(0, 15).map((s, i) => ( // Show first 15 for better density
                  <button 
                    key={i} 
                    onClick={() => handleSend(s)}
                    className="w-full text-left p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold text-gray-600 hover:bg-black hover:text-white transition-all btn-press flex justify-between items-center"
                  >
                    {s}
                    <ChevronLeft className="rotate-180 opacity-40" size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {history.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} reveal-item`} style={{animationDelay: '0s'}}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-xs font-medium leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-gray-50 text-black rounded-tl-none border border-gray-100'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isBotTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-50 p-4 rounded-[1.5rem] rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
              {[0, 1, 2].map(i => <div key={i} className="w-1 h-1 bg-black rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}} />)}
            </div>
          </div>
        )}
      </div>

      <div className="relative pb-20">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Ask Cal AI anything..." 
          className="w-full bg-gray-50 p-4 rounded-[1.8rem] border border-gray-100 outline-none font-bold text-xs pr-12 focus:bg-white focus:border-black transition-all shadow-sm" 
          onKeyDown={e => e.key === 'Enter' && handleSend(input)} 
        />
        <button 
          onClick={() => handleSend(input)} 
          className="absolute right-2.5 top-2 p-2.5 bg-black text-white rounded-full shadow-lg btn-press"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

const RecipeScreen = ({ user }: { user: UserProfile }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateRecipes(user).then(res => { setRecipes(res); setLoading(false); });
  }, [user]);

  return (
    <div className="h-full flex flex-col p-6 animate-premium-fade overflow-y-auto hide-scrollbar bg-white">
      <h1 className="text-3xl font-black mb-3 tracking-tighter">Recipes</h1>
      <p className="text-[#9E9E9E] font-medium mb-8 text-xs">Targeted metabolic fuel tailored for {user.dietPreference}.</p>
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center animate-bounce shadow-sm"><ChefHat size={28} className="text-black" /></div>
          <p className="text-black font-black uppercase text-[9px] tracking-widest animate-pulse">Designing gourmet menu...</p>
        </div>
      ) : (
        <div className="space-y-6 pb-32">
          {recipes.map((r, i) => (
            <Card key={i} className="bg-gray-50 border-0 p-6 space-y-4 reveal-item shadow-none" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-black w-2/3 leading-tight tracking-tighter">{r.name}</h3>
                <div className="text-right">
                  <div className="text-base font-black">{r.cals} kcal</div>
                  <div className="text-[9px] text-gray-400 font-bold uppercase">{r.time}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {r.ingredients.slice(0, 5).map((ing, idx) => (
                    <span key={idx} className="bg-white px-2.5 py-1 rounded-lg text-[9px] font-bold border border-gray-100 shadow-sm text-gray-500">{ing}</span>
                  ))}
                </div>
                <Button variant="outline" className="py-3 text-[10px] font-black uppercase tracking-widest border-black/10">Read Method</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const InsightScreen = ({ meals }: { meals: MealRecord[] }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = days.map(d => ({ name: d, cals: Math.floor(Math.random() * 800) + 1200 }));

  return (
    <div className="h-full flex flex-col p-6 animate-premium-fade bg-white">
      <h1 className="text-3xl font-black mb-6 tracking-tighter">Insights</h1>
      <Card className="mb-6 h-64 flex flex-col reveal-item shadow-sm border-gray-50">
        <h3 className="font-black text-[10px] mb-4 text-gray-400 uppercase tracking-widest">Energy Utilization</h3>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#D1D5DB'}} />
              <Bar dataKey="cals" radius={[8, 8, 8, 8]}>
                {data.map((entry, index) => <Cell key={index} fill={index === 6 ? '#000' : '#F3F4F6'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="space-y-4">
        <h3 className="text-lg font-black tracking-tighter">Performance Metrics</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-black text-white p-6 reveal-item" style={{animationDelay: '0.2s'}}><div className="text-[8px] font-black uppercase mb-1 opacity-50 tracking-widest">AVG CALS</div><div className="text-2xl font-black">1,842</div></Card>
          <Card className="bg-gray-50 border-0 p-6 reveal-item" style={{animationDelay: '0.3s'}}><div className="text-[8px] font-black uppercase mb-1 text-gray-400 tracking-widest">LOYALTY</div><div className="text-2xl font-black">92%</div></Card>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('calai_state_v3_strict');
    return saved ? JSON.parse(saved) : {
      user: INITIAL_USER, meals: [], currentScreen: 'onboarding', isAnalyzing: false, 
      analysisResult: null, tempImage: null, chatHistory: [], waterLogged: 0
    };
  });

  useEffect(() => { localStorage.setItem('calai_state_v3_strict', JSON.stringify(state)); }, [state]);

  const handleCapture = async (dataUrl: string) => {
    setState(s => ({ ...s, isAnalyzing: true, tempImage: dataUrl }));
    try {
      const result = await analyzeMealImage(dataUrl, state.user);
      setState(s => ({ ...s, isAnalyzing: false, analysisResult: result, currentScreen: 'results' }));
    } catch(e) {
      alert("AI Processing Encountered an Error.");
      setState(s => ({ ...s, isAnalyzing: false, currentScreen: 'home' }));
    }
  };

  const handleCoachMsg = async (text: string) => {
    const newHistory: ChatMessage[] = [...state.chatHistory, { role: 'user', text }];
    setState(s => ({ ...s, chatHistory: newHistory }));
    try {
      const aiResp = await getCoachResponse(newHistory, state.user);
      setState(s => ({ ...s, chatHistory: [...newHistory, { role: 'model', text: aiResp }] }));
    } catch (err) {
      setState(s => ({ ...s, chatHistory: [...newHistory, { role: 'model', text: "Service temporarily unavailable. Check your connectivity." }] }));
    }
  };

  if (!state.user.onboarded) {
    return <Onboarding onComplete={(u) => setState(s => ({ ...s, user: { ...u, onboarded: true, dailyCalorieTarget: 2200, streak: 1 }, currentScreen: 'home' }))} />;
  }

  if (!state.user.isPremium) {
    return <Paywall onUnlock={() => setState(s => ({ ...s, user: { ...s.user, isPremium: true } }))} />;
  }

  const consumed = state.meals.filter(m => new Date(m.timestamp).toDateString() === new Date().toDateString()).reduce((acc, m) => acc + m.nutrition.calories, 0);
  const left = Math.max(0, state.user.dailyCalorieTarget - consumed);
  const progress = Math.min(100, (consumed / state.user.dailyCalorieTarget) * 100);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden max-w-md mx-auto relative shadow-2xl">
      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {state.currentScreen === 'home' && (
          <div className="p-6 space-y-8 animate-premium-fade pb-32">
            <header className="flex justify-between items-center mt-2">
              <h1 className="text-3xl font-black tracking-tighter">Dash</h1>
              <div className="streak-counter flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-full font-black text-[10px] cursor-default shadow-lg">
                <Flame size={14} fill="currentColor" className="text-orange-500 animate-fire" />
                <span>{state.user.streak} DAYS</span>
              </div>
            </header>

            <Card className="bg-black text-white p-8 flex items-center justify-between shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
               <div className="relative z-10">
                 <div className="text-gray-500 text-[8px] uppercase font-black tracking-[0.2em] mb-1">ENERGY LEFT</div>
                 <div className="text-6xl font-black tabular-nums tracking-tighter leading-none">{left.toLocaleString()}</div>
               </div>
               <div className="relative w-20 h-20 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                   <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
                   <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="214" strokeDashoffset={214 - (214 * progress) / 100} strokeLinecap="round" className="text-white transition-all duration-1000" />
                 </svg>
                 <span className="absolute font-black text-[10px]">{Math.round(progress)}%</span>
               </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
               <Card className="bg-blue-50 border-0 flex flex-col justify-between h-36 p-6">
                  <div className="flex justify-between items-start">
                    <Droplets className="text-blue-500" size={24} />
                    <span className="text-[8px] font-black text-blue-300 uppercase tracking-widest">Hydration</span>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-blue-600 tracking-tighter">{state.waterLogged}</div>
                    <div className="text-[8px] font-bold text-blue-300 uppercase">/ 8 GLASSES</div>
                  </div>
                  <button onClick={() => setState(s => ({ ...s, waterLogged: Math.min(12, s.waterLogged + 1) }))} className="w-full bg-blue-100/50 py-2.5 rounded-xl text-blue-600 font-black text-[8px] uppercase mt-1.5 btn-press">Log +1</button>
               </Card>
               <Card className="bg-gray-50 border-0 flex flex-col justify-between h-36 p-6">
                  <div className="flex justify-between items-start">
                    <Dumbbell className="text-black" size={24} />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Activity</span>
                  </div>
                  <div>
                    <div className="text-3xl font-black tracking-tighter">45</div>
                    <div className="text-[8px] font-bold text-gray-400 uppercase">MINS TODAY</div>
                  </div>
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden mt-1.5"><div className="h-full bg-black rounded-full transition-all duration-1000" style={{width: '60%'}} /></div>
               </Card>
            </div>

            <section className="space-y-4">
              <div className="flex justify-between items-end border-b border-gray-50 pb-3">
                <h3 className="text-xl font-black tracking-tighter">Timeline</h3>
                <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">TODAY</span>
              </div>
              {state.meals.length === 0 ? (
                <div className="text-center py-12 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                  <p className="text-gray-300 font-bold italic text-xs">Waiting for your first scan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {state.meals.slice(0, 5).map(m => (
                    <div key={m.id} className="flex gap-4 p-4 bg-white rounded-[2rem] items-center border border-gray-100 shadow-sm">
                      <img src={m.imageUrl} className="w-16 h-16 rounded-[1.2rem] object-cover" />
                      <div className="flex-1">
                        <h4 className="font-black text-xs truncate uppercase tracking-tighter">{m.nutrition.itemsDetected[0]}</h4>
                        <p className="text-gray-400 text-[8px] font-bold uppercase tracking-widest mt-0.5">{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-base">+{m.nutrition.calories}</div>
                        <div className="text-[8px] font-black text-gray-300 uppercase tracking-widest">kcal</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {state.currentScreen === 'coach' && <CoachScreen user={state.user} history={state.chatHistory} onSend={handleCoachMsg} />}
        {state.currentScreen === 'recipes' && <RecipeScreen user={state.user} />}
        {state.currentScreen === 'insights' && <InsightScreen meals={state.meals} />}
        {state.currentScreen === 'settings' && (
          <div className="p-6 space-y-6 animate-premium-fade bg-white">
            <h1 className="text-3xl font-black mt-2 tracking-tighter">Account</h1>
            <Card className="space-y-6 p-8 border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-black rounded-[1.8rem] flex items-center justify-center text-white font-black text-2xl shadow-lg">{state.user.name[0] || 'U'}</div>
                <div><h4 className="font-black text-xl tracking-tighter">{state.user.name}</h4><p className="text-orange-500 font-bold text-[10px] uppercase tracking-widest">Premium Bio-Link</p></div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div><div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Weight</div><div className="font-black text-base">{state.user.weight} kg</div></div>
                <div><div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Target</div><div className="font-black text-base">{state.user.targetWeight} kg</div></div>
                <div><div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Cals</div><div className="font-black text-base">{state.user.dailyCalorieTarget}</div></div>
                <div><div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Streak</div><div className="font-black text-base">{state.user.streak} Days</div></div>
              </div>
            </Card>
            <Button variant="secondary" onClick={() => { localStorage.clear(); window.location.reload(); }}>Reset Protocol</Button>
          </div>
        )}
      </main>

      {state.currentScreen === 'scanner' && (
        <div className="fixed inset-0 z-[150] bg-black">
          <button onClick={() => setState(s => ({ ...s, currentScreen: 'home' }))} className="absolute top-10 left-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white z-50"><X size={20} /></button>
          <CameraCapture onCapture={handleCapture} />
        </div>
      )}

      {state.isAnalyzing && (
        <div className="fixed inset-0 z-[160] bg-white flex flex-col items-center justify-center animate-premium-fade text-center p-8">
          <div className="p-12 bg-black text-white rounded-[3rem] animate-float mb-8 shadow-2xl"><Search size={56} /></div>
          <h2 className="text-3xl font-black mb-2 tracking-tighter">Metabolic Scan...</h2>
          <p className="text-[#9E9E9E] font-medium text-base">Deconstructing nutritional architecture</p>
          <div className="mt-8 flex gap-1.5">
            {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 bg-black rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />)}
          </div>
        </div>
      )}

      {state.currentScreen === 'results' && state.analysisResult && (
        <div className="fixed inset-0 z-[155] bg-white overflow-y-auto pb-32 animate-premium-fade">
          <div className="relative h-[45vh]">
            <img src={state.tempImage!} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30" />
            <div className="absolute top-10 left-6"><button onClick={() => setState(s => ({ ...s, currentScreen: 'home' }))} className="p-3 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full text-white"><ChevronLeft size={20} /></button></div>
          </div>
          <div className="p-8 -mt-20 bg-white rounded-t-[3.5rem] space-y-10 shadow-2xl relative z-10 border-t border-gray-50">
            <div className="text-center reveal-item" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-8xl font-black tracking-tighter leading-[0.8] mb-3 tabular-nums">{state.analysisResult.calories}</h1>
              <p className="text-[#9E9E9E] font-black text-[10px] tracking-[0.4em] uppercase">Kcal identified</p>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 reveal-item text-center" style={{ animationDelay: '0.2s' }}>Macro Blueprint</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 p-4 rounded-[2rem] text-center reveal-item border border-gray-100" style={{ animationDelay: '0.3s' }}>
                  <div className="text-xl font-black tracking-tighter">{state.analysisResult.protein}g</div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Prot</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-[2rem] text-center reveal-item border border-gray-100" style={{ animationDelay: '0.4s' }}>
                  <div className="text-xl font-black tracking-tighter">{state.analysisResult.fats}g</div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Fat</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-[2rem] text-center reveal-item border border-gray-100" style={{ animationDelay: '0.5s' }}>
                  <div className="text-xl font-black tracking-tighter">{state.analysisResult.carbs}g</div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Carb</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50/50 p-3.5 rounded-[1.5rem] text-center reveal-item" style={{ animationDelay: '0.6s' }}>
                  <div className="font-black text-xs">{state.analysisResult.fiber}g</div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Fiber</div>
                </div>
                <div className="bg-gray-50/50 p-3.5 rounded-[1.5rem] text-center reveal-item" style={{ animationDelay: '0.7s' }}>
                  <div className="font-black text-xs">{state.analysisResult.sugar}g</div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sugar</div>
                </div>
                <div className="bg-gray-50/50 p-3.5 rounded-[1.5rem] text-center reveal-item" style={{ animationDelay: '0.8s' }}>
                  <div className="font-black text-xs">{state.analysisResult.sodium}mg</div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sod</div>
                </div>
              </div>
            </div>

            <Card className="bg-gray-50 border-0 flex items-center gap-4 p-6 reveal-item rounded-[2.5rem]" style={{ animationDelay: '0.9s' }}>
              <div className="w-16 h-16 bg-black text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-lg">{state.analysisResult.healthScore}</div>
              <div className="flex-1">
                <h4 className="font-black text-lg tracking-tighter leading-none">{state.analysisResult.verdict}</h4>
                <p className="text-[10px] font-bold text-gray-400 leading-relaxed mt-1.5">{state.analysisResult.fixTip}</p>
              </div>
            </Card>

            <div className="space-y-3 pt-4 reveal-item" style={{ animationDelay: '1.0s' }}>
              <Button onClick={() => {
                const m: MealRecord = { id: Date.now().toString(), timestamp: Date.now(), imageUrl: state.tempImage!, nutrition: state.analysisResult! };
                setState(s => ({ ...s, meals: [m, ...s.meals], currentScreen: 'home', streak: s.user.streak + 1 }));
              }}>Log Intake</Button>
              <Button variant="secondary" onClick={() => setState(s => ({ ...s, currentScreen: 'home' }))}>Discard</Button>
            </div>
          </div>
        </div>
      )}

      <nav className="h-28 bg-white/95 ios-blur border-t border-gray-100 flex items-center justify-around px-6 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[100] safe-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <NavIcon active={state.currentScreen === 'home'} onClick={() => setState(s => ({ ...s, currentScreen: 'home' }))} icon={<LayoutDashboard size={24} />} />
        <NavIcon active={state.currentScreen === 'coach'} onClick={() => setState(s => ({ ...s, currentScreen: 'coach' }))} icon={<MessageCircle size={24} />} />
        <div onClick={() => setState(s => ({ ...s, currentScreen: 'scanner' }))} className="bg-black text-white p-6 rounded-[2.5rem] -mt-16 shadow-2xl btn-press border-[5px] border-white"><Camera size={30} /></div>
        <NavIcon active={state.currentScreen === 'recipes'} onClick={() => setState(s => ({ ...s, currentScreen: 'recipes' }))} icon={<ChefHat size={24} />} />
        <NavIcon active={state.currentScreen === 'insights'} onClick={() => setState(s => ({ ...s, currentScreen: 'insights' }))} icon={<BarChart2 size={24} />} />
      </nav>
    </div>
  );
}

const NavIcon = ({ active, icon, onClick }: any) => (
  <button onClick={onClick} className={`transition-all p-3 rounded-2xl ${active ? 'text-black scale-110 bg-gray-50' : 'text-gray-300'}`}>{icon}</button>
);

const CameraCapture = ({ onCapture }: { onCapture: (d: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => { if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => alert("Camera permission required for metabolic scan."));
  }, []);
  const take = () => {
    const v = videoRef.current; const c = canvasRef.current;
    if (v && c) {
      c.width = 1200; c.height = 1200;
      const s = Math.min(v.videoWidth, v.videoHeight);
      c.getContext('2d')?.drawImage(v, (v.videoWidth-s)/2, (v.videoHeight-s)/2, s, s, 0, 0, 1200, 1200);
      onCapture(c.toDataURL('image/jpeg', 0.95));
    }
  };
  return (
    <div className="h-full flex flex-col justify-center p-8 items-center bg-black">
      <div className="w-full aspect-square rounded-[3rem] overflow-hidden border-2 border-white/20 mb-16 relative shadow-2xl">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute inset-0 border-[35px] border-black/50 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white/20 rounded-full animate-pulse" />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <button onClick={take} className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl btn-press p-1.5 border-[6px] border-white/10">
        <div className="w-full h-full border-[3px] border-black rounded-full" />
      </button>
      <p className="text-white font-black uppercase text-[9px] tracking-[0.4em] mt-10 opacity-30">Position Meal in Circle</p>
    </div>
  );
};

const Onboarding = ({ onComplete }: { onComplete: (u: UserProfile) => void }) => {
  const [step, setStep] = useState(0);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const current = ONBOARDING_STEPS[step];
  
  const handle = () => { 
    if (step < ONBOARDING_STEPS.length - 1) setStep(step + 1); 
    else onComplete(user); 
  };

  return (
    <div className="h-full bg-white p-8 flex flex-col animate-premium-fade">
      <div className="h-1 bg-gray-50 rounded-full mb-6">
        <div className="h-full bg-black rounded-full transition-all duration-700" style={{ width: `${((step+1)/ONBOARDING_STEPS.length)*100}%` }} />
      </div>
      <div className="mb-2">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-300">Phase {Math.floor(step / 6) + 1} / 5 • Step {step + 1}</span>
      </div>
      <h1 className="text-4xl font-black mb-8 tracking-tighter leading-[0.9]">{current.title}</h1>
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {current.type === 'text' && (
          <div className="py-6">
            <input 
              autoFocus
              value={user[current.key as keyof UserProfile] as string || ''} 
              onChange={e => setUser({...user, [current.key]: e.target.value})} 
              className="w-full text-3xl font-black border-b-4 border-black pb-2 outline-none placeholder:text-gray-100 tracking-tighter"
              placeholder={current.placeholder}
            />
          </div>
        )}
        {current.type === 'range' && (
          <div className="text-center py-6">
            <div className="text-[8rem] font-black mb-6 leading-none tracking-tighter tabular-nums">{user[current.key as keyof UserProfile] as number}</div>
            <input 
              type="range" 
              min={current.min} 
              max={current.max} 
              step={(current as any).step || 1}
              value={user[current.key as keyof UserProfile] as number} 
              onChange={e => setUser({...user, [current.key]: parseInt(e.target.value)})} 
              className="w-full h-2.5 bg-gray-100 rounded-full appearance-none accent-black" 
            />
          </div>
        )}
        {current.type === 'choice' && (
          <div className="space-y-3 py-2">
            {current.options?.map((o: any) => (
              <button 
                key={o.value} 
                onClick={() => { setUser({...user, [current.key]: o.value}); setTimeout(handle, 200); }} 
                className={`w-full p-6 text-left rounded-[2rem] border-2 transition-all flex items-center justify-between font-black text-xl tracking-tighter ${user[current.key as keyof UserProfile] === o.value ? 'bg-black text-white border-black shadow-lg' : 'bg-gray-50 border-gray-50 text-black'}`}
              >
                {o.label}
                {o.icon && React.cloneElement(o.icon, { size: 20 })}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="p-5 bg-gray-50 rounded-[1.8rem] text-black">
            <ChevronLeft size={20} />
          </button>
        )}
        <Button className="py-5 text-base" onClick={handle}>
          {step === ONBOARDING_STEPS.length - 1 ? 'Launch Protocol' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
