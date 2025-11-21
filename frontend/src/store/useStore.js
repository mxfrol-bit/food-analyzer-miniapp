import { create } from 'zustand';

const useStore = create((set) => ({
  // Пользователь
  user: null,
  initData: null,
  
  // Приемы пищи
  meals: [],
  todayTotals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
  
  // UI состояния
  loading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user }),
  setInitData: (initData) => set({ initData }),
  
  setMeals: (meals) => set({ meals }),
  addMeal: (meal) => set((state) => ({
    meals: [meal, ...state.meals]
  })),
  
  setTodayTotals: (totals) => set({ todayTotals: totals }),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null })
}));

export default useStore;
