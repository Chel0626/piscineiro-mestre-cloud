'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Aguarda o load da página para não bloquear o carregamento inicial
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[SW] Service Worker registrado com sucesso:', registration.scope);
            
            // Verifica atualizações periodicamente
            setInterval(() => {
              registration.update();
            }, 60000); // Verifica a cada 1 minuto
          })
          .catch((error) => {
            console.error('[SW] Falha ao registrar Service Worker:', error);
          });

        // Atualiza quando houver nova versão disponível
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[SW] Nova versão detectada, recarregando página...');
          window.location.reload();
        });
      });
    }
  }, []);

  return null;
}
