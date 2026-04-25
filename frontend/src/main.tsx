import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { RootRouter } from './RootRouter';
import './index.css';
import { I18nProvider } from './i18n/I18nProvider';
import { AuthProvider } from './auth/AuthProvider';
import { AccessTokenBridge } from './auth/AccessTokenBridge';
import { AgentContextProvider } from './agent/AgentContextProvider';
import { ActiveCloudsProvider } from './clouds/ActiveCloudsProvider';
import { ThemeProvider } from './theme/ThemeProvider';
import { CommandPalette } from './components/CommandPalette';
import { queryClient } from './lib/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <AccessTokenBridge />
              <ActiveCloudsProvider>
                <AgentContextProvider>
                  <CommandPalette />
                  <RootRouter />
                </AgentContextProvider>
              </ActiveCloudsProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  </React.StrictMode>
);
