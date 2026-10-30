'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    const checkSplash = () => {
      const lastSplashDate = localStorage.getItem('lastSplashDate');
      const today = new Date().toISOString().split('T')[0];

      if (lastSplashDate !== today) {
        setIsVisible(true);
        localStorage.setItem('lastSplashDate', today);

        // Esconder após 3 segundos
        setTimeout(() => {
          setIsVisible(false);
          // Remover do DOM após a transição
          setTimeout(() => setShouldRender(false), 500);
        }, 3000);
      } else {
        setShouldRender(false);
      }
    };

    checkSplash();
  }, []);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f172a] transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="relative w-full h-full max-w-md mx-auto">
        {/* Usando uma imagem local que deve ser colocada em public/splash.png */}
        {/* Se a imagem não existir, mostraremos um fallback elegante */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="relative w-full h-full">
                <Image
                    src="/splash-screen.png"
                    alt="Piscineiro Mestre"
                    fill
                    className="object-cover"
                    priority
                    onError={(e) => {
                        // Fallback se a imagem não carregar
                        e.currentTarget.style.display = 'none';
                        const fallback = document.getElementById('splash-fallback');
                        if (fallback) fallback.style.display = 'flex';
                    }}
                />
            </div>
            
            <div id="splash-fallback" className="hidden absolute inset-0 flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-slate-900 text-white">
                <div className="w-32 h-32 mb-6 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-white">
                        <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5-7-5-4 4 2-2" />
                        <path d="M12 13V2" />
                        <path d="M4.93 10.93 2 8" />
                        <path d="M19.07 10.93 22 8" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                    Piscineiro Mestre
                </h1>
                <p className="text-blue-200/80 text-sm">Gestão Profissional</p>
            </div>
        </div>
      </div>
    </div>
  );
}
