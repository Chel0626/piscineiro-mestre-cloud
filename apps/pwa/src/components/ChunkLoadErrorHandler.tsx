'use client';

import { useEffect } from 'react';

export function ChunkLoadErrorHandler() {
  useEffect(() => {
    const handler = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'error' in event ? event.error : event.reason;
      
      // Verifica se é um erro de carregamento de chunk (versão antiga em cache)
      if (
        error?.name === 'ChunkLoadError' || 
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Loading CSS chunk') ||
        error?.message?.includes('missing')
      ) {
        console.warn('ChunkLoadError detected, reloading page to fetch new version...');
        
        // Previne loops infinitos de reload (máximo 1 reload a cada 10 segundos)
        const lastReload = sessionStorage.getItem('chunk_reload_time');
        const now = Date.now();
        
        if (!lastReload || now - parseInt(lastReload) > 10000) {
          sessionStorage.setItem('chunk_reload_time', String(now));
          
          // Força reload ignorando cache se possível (embora window.location.reload(true) esteja deprecated em alguns browsers, o reload normal já ajuda)
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', handler);

    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', handler);
    };
  }, []);

  return null;
}
