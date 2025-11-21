// import { atom } from 'nanostores';
// import { logStore } from './logs';

// export type Theme = 'dark' | 'light';

// export const kTheme = 'bolt_theme';

// export function themeIsDark() {
//   return themeStore.get() === 'dark';
// }

// export const DEFAULT_THEME = 'light';

// export const themeStore = atom<Theme>(initStore());

// function initStore() {
//   if (!import.meta.env.SSR) {
//     const persistedTheme = localStorage.getItem(kTheme) as Theme | undefined;
//     const themeAttribute = document.querySelector('html')?.getAttribute('data-theme');

//     return persistedTheme ?? (themeAttribute as Theme) ?? DEFAULT_THEME;
//   }

//   return DEFAULT_THEME;
// }

// export function toggleTheme() {
//   const currentTheme = themeStore.get();
//   const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

//   // Update the theme store
//   themeStore.set(newTheme);

//   // Update localStorage
//   localStorage.setItem(kTheme, newTheme);

//   // Update the HTML attribute
//   document.querySelector('html')?.setAttribute('data-theme', newTheme);

//   // Update user profile if it exists
//   try {
//     const userProfile = localStorage.getItem('bolt_user_profile');

//     if (userProfile) {
//       const profile = JSON.parse(userProfile);
//       profile.theme = newTheme;
//       localStorage.setItem('bolt_user_profile', JSON.stringify(profile));
//     }
//   } catch (error) {
//     console.error('Error updating user profile theme:', error);
//   }

//   logStore.logSystem(`Theme changed to ${newTheme} mode`);
// }
// app/lib/stores/theme.ts



// import { atom } from 'nanostores';
// import { logStore } from './logs';
// import type { DesignScheme } from '~/types/design-scheme';

// /* ---------------------------------------------
//    THEME TYPES
// --------------------------------------------- */
// export type Theme = 'light' | 'dark' | 'neon';

// export const kTheme = 'bolt_theme';
// export const kDesignScheme = 'bolt_design_scheme';

// export const DEFAULT_THEME: Theme = 'light';

// /* ---------------------------------------------
//    THEME STORE INITIALIZATION
// --------------------------------------------- */
// export const themeStore = atom<Theme>(initStore());

// function initStore(): Theme {
//   if (!import.meta.env.SSR) {
//     const stored = localStorage.getItem(kTheme) as Theme | null;
//     const htmlTheme = document.documentElement.getAttribute('data-theme') as Theme | null;
//     return stored ?? htmlTheme ?? DEFAULT_THEME;
//   }
//   return DEFAULT_THEME;
// }

// export function themeIsDark() {
//   return themeStore.get() === 'dark';
// }

// /* ---------------------------------------------
//    APPLY THEME (light | dark | neon)
// --------------------------------------------- */
// export function applyTheme(theme: Theme) {
//   themeStore.set(theme);

//   if (!import.meta.env.SSR) {
//     localStorage.setItem(kTheme, theme);
//     document.documentElement.setAttribute('data-theme', theme);
//   }

//   logStore.logSystem(`Theme changed to ${theme}`);
// }

// /* ---------------------------------------------
//    TOGGLE THEME
//    neon → light
//    dark → light
//    light → dark
// --------------------------------------------- */
// export function toggleTheme() {
//   const current = themeStore.get();

//   let next: Theme;
//   if (current === 'light') next = 'dark';
//   else next = 'light';

//   applyTheme(next);
// }

// /* ---------------------------------------------
//    APPLY DESIGN SCHEME COLORS TO REAL CSS VARS
// --------------------------------------------- */
// export function applyDesignScheme(designScheme: DesignScheme) {
//   if (import.meta.env.SSR) return;
//   if (!designScheme) return;

//   try {
//     const palette = designScheme.palette || {};

//     // Map design palette keys → actual UI CSS variables
//     const map: Record<string, string> = {
//       primary: '--bolt-elements-button-primary-background',
//       'primary-text': '--bolt-elements-button-primary-text',
//       secondary: '--bolt-elements-button-secondary-background',
//       'secondary-text': '--bolt-elements-button-secondary-text',

//       background: '--bolt-elements-bg-depth-1',
//       'surface-1': '--bolt-elements-bg-depth-2',
//       'surface-2': '--bolt-elements-bg-depth-3',

//       'text-primary': '--bolt-elements-textPrimary',
//       'text-secondary': '--bolt-elements-textSecondary',

//       accent: '--bolt-elements-item-backgroundAccent',
//       link: '--bolt-elements-messages-linkColor',

//       'code-bg': '--bolt-elements-code-background',
//       'code-text': '--bolt-elements-code-text',

//       cta: '--bolt-elements-cta-background',
//       'cta-text': '--bolt-elements-cta-text',
//     };

//     // Assign CSS variables
//     for (const roleKey of Object.keys(palette)) {
//       const cssVar = map[roleKey];
//       const value = palette[roleKey];

//       if (cssVar) {
//         document.documentElement.style.setProperty(cssVar, value);
//       } else {
//         // fallback for unmapped keys
//         document.documentElement.style.setProperty(
//           `--bolt-palette-${roleKey}`,
//           value
//         );
//       }
//     }

//     localStorage.setItem(kDesignScheme, JSON.stringify(designScheme));

//     logStore.logSystem('Design scheme applied');
//   } catch (err) {
//     console.error('applyDesignScheme error:', err);
//   }
// }

// /* ---------------------------------------------
//    LOAD & APPLY PERSISTED DESIGN SCHEME
// --------------------------------------------- */
// export function loadPersistedDesignScheme(): DesignScheme | null {
//   if (import.meta.env.SSR) return null;

//   try {
//     const raw = localStorage.getItem(kDesignScheme);
//     if (!raw) return null;

//     const ds = JSON.parse(raw) as DesignScheme;
//     applyDesignScheme(ds);
//     return ds;
//   } catch (err) {
//     console.error('loadPersistedDesignScheme error:', err);
//     return null;
//   }
// }



// app/lib/stores/theme.ts
import { atom } from 'nanostores';
import { logStore } from './logs';
import type { DesignScheme } from '~/types/design-scheme';
import { THEME_VERSION, THEME_VERSION_KEY } from '~/lib/constants/theme';

/* ---------------------------------------------
   THEME TYPES
--------------------------------------------- */
export type Theme = 'light' | 'dark' | 'neon';

export const kTheme = 'bolt_theme';
export const kDesignScheme = 'bolt_design_scheme';

export const DEFAULT_THEME: Theme = 'light';

function ensureThemeVersionSynced() {
  if (import.meta.env.SSR) return;

  try {
    const storedVersion = localStorage.getItem(THEME_VERSION_KEY);
    if (storedVersion !== THEME_VERSION) {
      localStorage.removeItem(kDesignScheme);
      localStorage.removeItem(kTheme);
      localStorage.setItem(THEME_VERSION_KEY, THEME_VERSION);
    }
  } catch (err) {
    console.error('Theme version sync failed:', err);
  }
}

/* ---------------------------------------------
   INIT THEME STORE
--------------------------------------------- */
export const themeStore = atom<Theme>(initStore());

function initStore(): Theme {
  if (import.meta.env.SSR) return DEFAULT_THEME;

  ensureThemeVersionSynced();
  const stored = localStorage.getItem(kTheme) as Theme | null;
  const htmlTheme = document.documentElement.getAttribute('data-theme') as Theme | null;

  return stored ?? htmlTheme ?? DEFAULT_THEME;
}

/* ---------------------------------------------
   UTIL: IS DARK MODE?
--------------------------------------------- */
export function themeIsDark() {
  return themeStore.get() === 'dark';
}

/* ---------------------------------------------
   APPLY A THEME (light | dark | neon)
--------------------------------------------- */
export function applyTheme(theme: Theme) {
  themeStore.set(theme);

  if (!import.meta.env.SSR) {
    ensureThemeVersionSynced();
    localStorage.setItem(kTheme, theme);
    localStorage.setItem(THEME_VERSION_KEY, THEME_VERSION);
    document.documentElement.setAttribute('data-theme', theme);

    // Update user profile if available
    try {
      const raw = localStorage.getItem('bolt_user_profile');
      if (raw) {
        const profile = JSON.parse(raw);
        profile.theme = theme;
        localStorage.setItem('bolt_user_profile', JSON.stringify(profile));
      }
    } catch (err) {
      console.error('Error updating stored user profile theme:', err);
    }
  }

  logStore.logSystem(`Theme changed to ${theme}`);
}

/* ---------------------------------------------
   TOGGLE BETWEEN LIGHT & DARK
   (NEON STAYS ONLY WHEN MANUALLY SELECTED)
--------------------------------------------- */
export function toggleTheme() {
  const current = themeStore.get();
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

/* ---------------------------------------------
   ENABLE NEON MODE
--------------------------------------------- */
export function enableNeonMode() {
  applyTheme('neon');
}

/* ---------------------------------------------
   DISABLE NEON MODE (BACK TO LIGHT)
--------------------------------------------- */
export function disableNeonMode() {
  applyTheme('light');
}

/* ---------------------------------------------
   APPLY CUSTOM DESIGN SCHEME (COLOR PALETTE)
--------------------------------------------- */
export function applyDesignScheme(designScheme: DesignScheme) {
  if (import.meta.env.SSR) return;
  if (!designScheme) return;

  try {
    ensureThemeVersionSynced();
    const palette = designScheme.palette || {};

    // Role → CSS variable mapping
    const map: Record<string, string> = {
      primary: '--bolt-elements-button-primary-background',
      'primary-text': '--bolt-elements-button-primary-text',

      secondary: '--bolt-elements-button-secondary-background',
      'secondary-text': '--bolt-elements-button-secondary-text',

      background: '--bolt-elements-bg-depth-1',
      'surface-1': '--bolt-elements-bg-depth-2',
      'surface-2': '--bolt-elements-bg-depth-3',

      'text-primary': '--bolt-elements-textPrimary',
      'text-secondary': '--bolt-elements-textSecondary',

      accent: '--bolt-elements-item-backgroundAccent',
      link: '--bolt-elements-messages-linkColor',

      'code-bg': '--bolt-elements-code-background',
      'code-text': '--bolt-elements-code-text',

      cta: '--bolt-elements-cta-background',
      'cta-text': '--bolt-elements-cta-text',
    };

    // Apply to CSS variables
    for (const roleKey of Object.keys(palette)) {
      const cssVar = map[roleKey];
      const value = palette[roleKey];

      if (cssVar) {
        document.documentElement.style.setProperty(cssVar, value);
      } else {
        // unmapped keys = fallback
        document.documentElement.style.setProperty(
          `--bolt-palette-${roleKey}`,
          value
        );
      }
    }

    localStorage.setItem(kDesignScheme, JSON.stringify(designScheme));
    localStorage.setItem(THEME_VERSION_KEY, THEME_VERSION);

    logStore.logSystem('Design scheme applied');
  } catch (err) {
    console.error('applyDesignScheme error:', err);
  }
}

/* ---------------------------------------------
   AUTO-LOAD DESIGN SCHEME ON STARTUP
--------------------------------------------- */
export function loadPersistedDesignScheme(): DesignScheme | null {
  if (import.meta.env.SSR) return null;

  try {
    ensureThemeVersionSynced();
    const raw = localStorage.getItem(kDesignScheme);
    if (!raw) return null;

    const scheme = JSON.parse(raw) as DesignScheme;
    applyDesignScheme(scheme);
    return scheme;
  } catch (err) {
    console.error('loadPersistedDesignScheme error:', err);
    return null;
  }
}
