#!/bin/bash

# Carrega as variáveis do arquivo .env.local
# Usamos set -a para exportar automaticamente as variáveis
set -a
source apps/owner/.env.local
set +a

# Lista de variáveis para adicionar
vars=(
  "FIREBASE_CLIENT_EMAIL"
  "FIREBASE_PRIVATE_KEY"
  "FIREBASE_PROJECT_ID"
  "GEMINI_API_KEY"
  "NEXT_PUBLIC_FIREBASE_API_KEY"
  "NEXT_PUBLIC_FIREBASE_APP_ID"
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
  "OPENWEATHER_API_KEY"
  "NEXT_PUBLIC_SENTRY_DSN"
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

for var in "${vars[@]}"; do
  value="${!var}"
  if [ -n "$value" ]; then
    echo "Configurando $var..."
    
    # Remove a variável existente para evitar conflitos (ignora erros se não existir)
    npx vercel env rm "$var" production preview development -y >/dev/null 2>&1 || true
    
    # Adiciona a variável para cada ambiente separadamente
    for env in production preview development; do
      echo -n "$value" | npx vercel env add "$var" "$env" >/dev/null 2>&1 || echo "Erro ao adicionar $var em $env"
    done
    
    echo "✓ $var processada"
  else
    echo "⚠ $var está vazia ou não encontrada, pulando..."
  fi
done

echo "Todas as variáveis foram processadas!"
