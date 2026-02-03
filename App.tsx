import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, HealthMetrics, Gender, ActivityLevel, GoalType } from './types';
import { ACTIVITY_LABELS, GOAL_LABELS, calculateBMR, calculateWater } from './constants';
import { 
  Activity, 
  Droplets, 
  Target, 
  User, 
  Utensils,
  Palette,
  AlertCircle,
  Scale,
  Zap,
  CheckCircle2,
  Leaf,
  Beef
} from 'lucide-react';

type ThemeColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue';

const THEME_OPTIONS: { id: ThemeColor; color: string; label: string }[] = [
  { id: 'indigo', color: 'bg-indigo-600', label: 'Индиго' },
  { id: 'emerald', color: 'bg-emerald-600', label: 'Изумруд' },
  { id: 'rose', color: 'bg-rose-600', label: 'Роза' },
  { id: 'amber', color: 'bg-amber-600', label: 'Янтарь' },
  { id: 'blue', color: 'bg-blue-600', label: 'Голубой' },
];

const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeColor>(() => {
    return (localStorage.getItem('fitlife-theme') as ThemeColor) || 'indigo';
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('fitlife-profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        startingWeight: parsed.startingWeight ?? parsed.weight,
        targetWeight: parsed.targetWeight ?? (parsed.weight - 5),
        targetMonths: parsed.targetMonths ?? 2
      };
    }
    return {
      age: 25,
      height: 170,
      weight: 70,
      startingWeight: 70,
      targetWeight: 65,
      targetMonths: 2,
      gender: Gender.FEMALE,
      activity: ActivityLevel.LIGHTLY_ACTIVE,
      goal: GoalType.LOSE_WEIGHT,
    };
  });


  useEffect(() => {
    localStorage.setItem('fitlife-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('fitlife-profile', JSON.stringify(profile));
  }, [profile]);

  const metrics = useMemo<HealthMetrics>(() => {
    const bmr = calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
    const tdee = bmr * parseFloat(profile.activity);
    
    let targetCalories = tdee;
    if (profile.goal === GoalType.LOSE_WEIGHT) targetCalories *= 0.8;
    if (profile.goal === GoalType.GAIN_WEIGHT) targetCalories *= 1.15;

    // --- REFINED PROTEIN CALCULATION (Weight based) ---
    // Base multiplier by activity
    let proteinMultiplier = 1.2;
    const act = parseFloat(profile.activity);
    if (act <= 1.2) proteinMultiplier = 1.0;
    else if (act <= 1.4) proteinMultiplier = 1.3;
    else if (act <= 1.6) proteinMultiplier = 1.6;
    else proteinMultiplier = 1.8;

    // Gender adjustment: Men usually have higher lean mass
    if (profile.gender === Gender.MALE) proteinMultiplier += 0.1;

    // Goal adjustment: High protein is vital for satiety/muscle in deficit and building in surplus
    if (profile.goal === GoalType.LOSE_WEIGHT) proteinMultiplier += 0.3;
    if (profile.goal === GoalType.GAIN_WEIGHT) proteinMultiplier += 0.2;

    const protein = Math.round(profile.weight * proteinMultiplier);
    
    // Fat and Carbs (remaining calories)
    const fat = Math.round((targetCalories * 0.25) / 9);
    const carbs = Math.round((targetCalories - (protein * 4) - (fat * 9)) / 4);
    
    const bmi = profile.weight / Math.pow(profile.height / 100, 2);
    
    const genderVal = profile.gender === Gender.MALE ? 1 : 0;
    const bodyFat = (1.20 * bmi) + (0.23 * profile.age) - (10.8 * genderVal) - 5.4;

    // Recommendation is ~14g per 1000 calories
    const fiberIntake = Math.round(targetCalories * 0.014);

    const healthyWeightRange = {
      min: Math.round(18.5 * Math.pow(profile.height / 100, 2)),
      max: Math.round(24.9 * Math.pow(profile.height / 100, 2)),
    };

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      waterIntake: calculateWater(profile.weight),
      protein,
      fat,
      carbs,
      bmi,
      bodyFat,
      fiberIntake,
      healthyWeightRange
    };
  }, [profile]);

  const goalProgress = useMemo(() => {
    const isLosing = profile.goal === GoalType.LOSE_WEIGHT;
    const totalDiff = Math.abs(profile.startingWeight - profile.targetWeight);
    
    const weeklyRate = (totalDiff / (profile.targetMonths * 4.34 || 1)).toFixed(2);
    const isHealthyRate = isLosing ? parseFloat(weeklyRate) <= 1.0 : parseFloat(weeklyRate) <= 0.6;

    const targetBmi = profile.targetWeight / Math.pow(profile.height / 100, 2);
    let targetFeedback = { message: '', color: 'text-slate-400' };

    if (profile.goal !== GoalType.MAINTAIN) {
      if (targetBmi < 17.5) {
        targetFeedback = { message: 'Критически низкий вес!', color: 'text-rose-600' };
      } else if (targetBmi < 18.5) {
        targetFeedback = { message: 'Ниже нормы (дефицит)', color: 'text-amber-600' };
      } else if (targetBmi > 35) {
        targetFeedback = { message: 'Риск для здоровья!', color: 'text-rose-600' };
      } else if (targetBmi > 30) {
        targetFeedback = { message: 'Слишком большой вес', color: 'text-orange-600' };
      } else if (targetBmi > 25) {
        targetFeedback = { message: 'Выше нормы (избыток)', color: 'text-amber-600' };
      } else {
        targetFeedback = { message: 'Здоровый вес', color: 'text-emerald-600' };
      }
    }

    return {
      totalDiff,
      weeklyRate,
      isHealthyRate,
      targetFeedback
    };
  }, [profile]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => {
      const isNumeric = !(name === 'gender' || name === 'activity' || name === 'goal');
      if (isNumeric && value === '') return { ...prev, [name]: 0 };
      
      const newVal = isNumeric ? Number(value) : value;
      
      if (name === 'weight') {
        return { 
          ...prev, 
          weight: newVal as number, 
          startingWeight: newVal as number 
        };
      }
      
      return { ...prev, [name]: newVal };
    });
  };

  const getBmiZone = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Дефицит веса', color: 'bg-blue-400', textColor: 'text-blue-600' };
    if (bmi < 25) return { label: 'Норма', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
    if (bmi < 30) return { label: 'Избыточный вес', color: 'bg-amber-400', textColor: 'text-amber-600' };
    return { label: 'Ожирение', color: 'bg-rose-500', textColor: 'text-rose-600' };
  };

  const getBodyFatZone = (bfp: number, gender: Gender) => {
    if (gender === Gender.FEMALE) {
      if (bfp < 14) return { label: 'Опасно низкий', color: 'bg-blue-400', textColor: 'text-blue-600' };
      if (bfp < 21) return { label: 'Атлетичный', color: 'bg-emerald-400', textColor: 'text-emerald-600' };
      if (bfp < 31) return { label: 'Норма', color: 'bg-emerald-600', textColor: 'text-emerald-700' };
      return { label: 'Избыток жира', color: 'bg-rose-500', textColor: 'text-rose-600' };
    } else {
      if (bfp < 6) return { label: 'Опасно низкий', color: 'bg-blue-400', textColor: 'text-blue-600' };
      if (bfp < 14) return { label: 'Атлетичный', color: 'bg-emerald-400', textColor: 'text-emerald-600' };
      if (bfp < 24) return { label: 'Норма', color: 'bg-emerald-600', textColor: 'text-emerald-700' };
      return { label: 'Избыток жира', color: 'bg-rose-500', textColor: 'text-rose-600' };
    }
  };

  const themeClasses = {
    bg: `bg-${theme}-600`,
    bgHover: `hover:bg-${theme}-700`,
    bgLight: `bg-${theme}-50`,
    text: `text-${theme}-600`,
    textDark: `text-${theme}-900`,
    textLight: `text-${theme}-100`,
    border: `border-${theme}-200`,
    borderLight: `border-${theme}-100`,
    ring: `focus:ring-${theme}-500`,
    shadow: `shadow-${theme}-200`,
    accent: `text-${theme}-500`,
    accentBg: `bg-${theme}-100`,
    buttonActive: `bg-${theme}-50 border-${theme}-200 text-${theme}-700`,
    gradient: `from-${theme}-50 to-slate-50`,
    progress: `bg-${theme}-500`,
  };

  const bmiZone = getBmiZone(metrics.bmi);
  const fatZone = getBodyFatZone(metrics.bodyFat, profile.gender);

  const goalLabelText = profile.goal === GoalType.LOSE_WEIGHT 
    ? 'для похудения' 
    : profile.goal === GoalType.GAIN_WEIGHT 
    ? 'для набора массы' 
    : 'для поддержания';

  return (
    <div className="min-h-screen bg-slate-50 pb-12 transition-colors duration-300">
      <header className={`${themeClasses.bg} text-white py-8 px-4 shadow-lg transition-colors duration-500`}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">FitLife AI</h1>
              <p className={`text-sm ${themeClasses.textLight} opacity-90`}>
                Персональный ИИ-план здоровья
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur-sm">
            <Palette className="w-4 h-4 mr-1 opacity-70" />
            <div className="flex gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${opt.color} ${theme === opt.id ? 'border-white scale-125' : 'border-transparent opacity-60'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 -mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: User Data & Composition */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className={`w-5 h-5 ${themeClasses.accent}`} />
              Мои данные
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Пол</label>
                <div className="flex gap-2">
                  <button onClick={() => setProfile(p => ({...p, gender: Gender.MALE}))}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm transition ${profile.gender === Gender.MALE ? themeClasses.buttonActive : 'bg-white border-slate-200 text-slate-600'}`}>Мужской</button>
                  <button onClick={() => setProfile(p => ({...p, gender: Gender.FEMALE}))}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm transition ${profile.gender === Gender.FEMALE ? themeClasses.buttonActive : 'bg-white border-slate-200 text-slate-600'}`}>Женский</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tighter">Возраст</label>
                  <input type="number" name="age" value={profile.age || ''} onChange={handleChange} className={`w-full px-3 py-2 rounded-lg border border-slate-200 ${themeClasses.ring} outline-none transition font-bold`} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tighter">Рост (см)</label>
                  <input type="number" name="height" value={profile.height || ''} onChange={handleChange} className={`w-full px-3 py-2 rounded-lg border border-slate-200 ${themeClasses.ring} outline-none transition font-bold`} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Вес сейчас (кг)</label>
                <div className="relative">
                  <input 
                    type="number" step="0.1" name="weight" value={profile.weight || ''} onChange={handleChange} 
                    className={`w-full pl-3 pr-10 py-3 rounded-xl border-2 border-slate-200 ${themeClasses.ring} outline-none font-black text-xl transition-all`} 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase">кг</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Активность</label>
                <select name="activity" value={profile.activity} onChange={handleChange} className={`w-full px-3 py-2 rounded-lg border border-slate-200 ${themeClasses.ring} outline-none text-xs transition font-bold text-slate-600`}>
                  {Object.entries(ACTIVITY_LABELS).map(([val, label]) => (<option key={val} value={val}>{label}</option>))}
                </select>
              </div>
            </div>
          </div>

          {/* Unified Composition Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10"><Scale className="w-12 h-12" /></div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity className={`w-5 h-5 ${themeClasses.accent}`} />
              Состав тела
            </h2>

            {/* BMI & FAT */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">ИМТ</p>
                <p className={`text-2xl font-black ${bmiZone.textColor}`}>{metrics.bmi.toFixed(1)}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{bmiZone.label}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Жир (оценка)</p>
                <p className={`text-2xl font-black ${fatZone.textColor}`}>{metrics.bodyFat.toFixed(1)}%</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{fatZone.label}</p>
              </div>
            </div>

            {/* HEALTH NORMS (GREEN) */}
            <div className="space-y-6 py-2">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <Beef className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ваша норма белка</p>
                    <p className="text-xs font-bold text-slate-500 uppercase">для сохранения мышц</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-3xl font-black text-emerald-600 tabular-nums">{metrics.protein}г</p>
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">в день</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Клетчатка</p>
                    <p className="text-xs font-bold text-slate-500 uppercase">норма пищеварения</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-3xl font-black text-emerald-600 tabular-nums">{metrics.fiberIntake}г</p>
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">цель</p>
                </div>
              </div>
            </div>

            {/* RECOMMENDATION COMMENTARY */}
            <div className="p-5 bg-emerald-50 rounded-[2rem] border border-emerald-100 space-y-3 relative overflow-hidden">
              <div className="absolute -right-2 -bottom-2 opacity-10 rotate-12"><Droplets className="w-16 h-16 text-emerald-600" /></div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-xs font-black text-emerald-900 uppercase">Как улучшить ИМТ и Жир:</p>
              </div>
              <p className="text-[11px] font-bold text-emerald-800 leading-relaxed italic opacity-90">
                «Пейте {metrics.waterIntake}л чистой воды, съедайте норму клетчатки из овощей и держите {metrics.protein}г белка — это обеспечит сытость и ускорит метаболизм для снижения процента жира.»
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
               <div className="flex items-center gap-2 mb-2">
                 <Scale className="w-3 h-3 text-slate-400" />
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Здоровый вес для вашего роста:</p>
               </div>
               <div className="bg-slate-50 p-3 rounded-xl text-center">
                  <span className={`text-xl font-black ${themeClasses.textDark}`}>{metrics.healthyWeightRange.min} – {metrics.healthyWeightRange.max}</span>
                  <span className="text-xs font-bold text-slate-400 ml-1">кг</span>
               </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Strategy & Goals */}
        <section className="lg:col-span-2 space-y-6">
          {/* Goal Configuration */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Target className={`w-5 h-5 ${themeClasses.accent}`} />
              Настройка цели
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Направление</label>
                  <select name="goal" value={profile.goal} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl border-2 border-slate-100 ${themeClasses.ring} outline-none text-sm transition font-semibold`}>
                    {Object.entries(GOAL_LABELS).map(([val, label]) => (<option key={val} value={val}>{label}</option>))}
                  </select>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between transition-all hover:border-slate-300">
                   <label className="text-[10px] font-black text-slate-400 uppercase">Начальный вес</label>
                   <div className="flex items-center gap-2">
                      <input type="number" step="0.1" name="startingWeight" value={profile.startingWeight || ''} onChange={handleChange} className="w-16 bg-transparent font-black text-slate-700 outline-none text-right" />
                      <span className="text-[10px] font-black text-slate-300">КГ</span>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 focus-within:border-emerald-200 transition-all">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Целевой вес</label>
                    <div className="flex items-center gap-1">
                      <input type="number" step="0.1" name="targetWeight" value={profile.targetWeight || ''} onChange={handleChange} className={`w-full bg-transparent outline-none transition font-black text-2xl text-slate-800`} />
                      <span className="text-[10px] font-black text-slate-300">КГ</span>
                    </div>
                    <div className={`mt-1 text-[10px] font-bold uppercase transition-colors ${goalProgress.targetFeedback.color}`}>
                      {goalProgress.targetFeedback.message}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Срок (мес)</label>
                    <input type="number" name="targetMonths" value={profile.targetMonths || ''} onChange={handleChange} className={`w-full bg-transparent outline-none transition font-black text-2xl text-slate-800`} />
                  </div>
                </div>
                <div className={`p-4 rounded-2xl flex items-center gap-3 transition-colors ${goalProgress.isHealthyRate ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                  {goalProgress.isHealthyRate ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span className="text-[10px] font-black uppercase tracking-tight">{goalProgress.weeklyRate} кг/нед — {goalProgress.isHealthyRate ? 'безопасный темп' : 'внимание: риск для обмена веществ'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* UNIFIED STRATEGY BLOCK */}
          <div className={`bg-white rounded-[2.5rem] shadow-xl border-2 ${themeClasses.border} overflow-hidden`}>
            <div className={`${themeClasses.bg} p-6 text-white flex justify-between items-center`}>
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 fill-current text-white/80" />
                <h3 className="font-black uppercase tracking-widest text-sm">Стратегия {goalLabelText}</h3>
              </div>
              <div className="text-[10px] font-black opacity-80 uppercase tracking-widest">Персональный расчет</div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="space-y-8">
                  <div className="relative">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-7xl font-black ${themeClasses.text} tracking-tighter tabular-nums leading-none`}>
                        {metrics.targetCalories}
                      </span>
                      <span className="text-xl font-black text-slate-400 uppercase tracking-widest">ккал</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest">рекомендуемый суточный калораж</p>
                  </div>

                  <div className="flex items-center gap-6 p-5 bg-blue-50 rounded-[1.5rem] border border-blue-100">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Droplets className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1 text-blue-600">
                        <span className="text-3xl font-black tabular-nums">{metrics.waterIntake}</span>
                        <span className="text-sm font-bold uppercase">литра</span>
                      </div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">воды для обмена веществ</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Utensils className="w-3 h-3" /> Баланс нутриентов
                  </h4>
                  <div className="space-y-5">
                    {[
                      { label: 'Белки', value: metrics.protein, color: themeClasses.progress, width: '30%', text: themeClasses.text },
                      { label: 'Жиры', value: metrics.fat, color: 'bg-amber-400', width: '25%', text: 'text-amber-600' },
                      { label: 'Углеводы', value: metrics.carbs, color: 'bg-slate-800', width: '45%', text: 'text-slate-800' }
                    ].map((macro) => (
                      <div key={macro.label} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                          <span className="text-slate-500">{macro.label}</span>
                          <span className={macro.text}>{macro.value}г</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full ${macro.color} transition-all duration-1000`} style={{ width: macro.width }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>
      </main>

      <footer className="max-w-4xl mx-auto px-4 mt-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] pb-12">
        <p>© 2024 FitLife AI. Все расчеты являются оценочными. Для медицинских целей обратитесь к специалисту.</p>
      </footer>
    </div>
  );
};

export default App;
