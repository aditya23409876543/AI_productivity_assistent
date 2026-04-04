import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const MOODS = {
  HAPPY: {
    name: 'Sunny (Yellow)',
    headerColor: '#FFD166',
    navColor: '#FFD166',
    accentLight: '#FFE8A1',
    cardBackground: '#FFFFFF',
  },
  CALM: {
    name: 'Calm (Green)',
    headerColor: '#A9D6B8',
    navColor: '#A9D6B8',
    accentLight: '#D0EBD9',
    cardBackground: '#FFFFFF',
  },
  RELAX: {
    name: 'Relax (Purple)',
    headerColor: '#CABAE2',
    navColor: '#CABAE2',
    accentLight: '#E2D9F3',
    cardBackground: '#FFFFFF',
  },
  STRESS: {
    name: 'Wellness (Coral)',
    headerColor: '#F29B9B',
    navColor: '#F29B9B',
    accentLight: '#FAD1D1',
    cardBackground: '#FFFFFF',
  }
};

const STORAGE_KEY = 'ai_assistant_mood';

export function ThemeProvider({ children }) {
  // Load persisted mood from localStorage, default to HAPPY
  const [currentMood, setCurrentMoodState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate it matches a known mood
        const match = Object.values(MOODS).find(m => m.name === parsed.name);
        return match || MOODS.HAPPY;
      }
    } catch { /* ignore */ }
    return MOODS.HAPPY;
  });

  // Persist to localStorage whenever mood changes
  const setCurrentMood = (mood) => {
    setCurrentMoodState(mood);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mood)); } catch { /* ignore */ }
  };

  // Apply CSS Variables to root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-header-color', currentMood.headerColor);
    root.style.setProperty('--theme-nav-color', currentMood.navColor);
    root.style.setProperty('--theme-accent-light', currentMood.accentLight);
    root.style.setProperty('--theme-card-bg', currentMood.cardBackground);
  }, [currentMood]);

  return (
    <ThemeContext.Provider value={{ currentMood, setCurrentMood, MOODS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
