import { PropsWithChildren } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Wraps the app in a light/dark-mode aware theme provider. The `class`
 * strategy toggles `dark` on <html>, which Tailwind reads via its
 * `darkMode: 'class'` setting — we update tailwind.config.js for that in a
 * companion commit. Defaults to system preference.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
