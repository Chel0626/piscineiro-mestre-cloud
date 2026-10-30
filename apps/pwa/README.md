# 🏊‍♂️ PiscineiroApp

**Aplicação completa para gerenciamento de serviços de piscinas**

Uma solução moderna e responsiva para piscineiros profissionais gerenciarem seus clientes, roteiros, produtos e faturamento de forma eficiente.

---

## 🚀 Tecnologias

- **Frontend**: Next.js 15.5.2, React 19, TypeScript
- **UI/UX**: TailwindCSS, Radix UI, Lucide Icons
- **Backend**: Firebase (Auth, Firestore)
- **PWA**: Service Worker, manifesto para instalação
- **Formulários**: React Hook Form, Zod validation
- **IA**: Google Gemini API para assistente inteligente

---

## 📱 Funcionalidades

### 🔐 **Autenticação e Perfil**
- ✅ Login e logout seguro (Firebase Auth)
- ✅ Redirecionamento automático para setup de perfil
- ✅ Perfil profissional completo (experiência, especialidades, empresa, bio)
- ✅ Widget de perfil no sidebar com informações resumidas
- ✅ Disponibilidade e aceite de emergências

### 📊 **Dashboard Inteligente**
- ✅ Saudação personalizada baseada no horário
- ✅ Previsão do tempo local
- ✅ Roteiro do dia (clientes agendados)
- ✅ Pagamentos a vencer hoje
- ✅ Pagamentos vencidos com alertas
- ✅ Widgets dinâmicos e responsivos

### 👥 **Gerenciamento de Clientes**
- ✅ **Clientes Fixos**: cadastro, edição, exclusão
- ✅ **Clientes Avulsos**: atendimentos únicos
- ✅ Busca avançada (nome, endereço, bairro)
- ✅ Visualização adaptativa (tabela no desktop, cards no mobile)
- ✅ Histórico completo de visitas e produtos
- ✅ Seções expansíveis/colapso

### 🗺️ **Roteiros da Semana**
- ✅ Visualização por dia da semana (segunda a domingo)
- ✅ **Drag & Drop** para reordenar clientes
- ✅ Contadores de clientes por dia
- ✅ Registro rápido de visitas
- ✅ Layout responsivo (3+4 botões em mobile)

### 📦 **Gestão de Produtos**
- ✅ **Check-in de Produtos**: utilizados na visita
- ✅ **Solicitação de Produtos**: lista para o cliente
- ✅ Envio automático via **WhatsApp** ou **Email**
- ✅ Histórico de solicitações (Firestore)
- ✅ Catálogo de produtos + produtos personalizados
- ✅ Aprovação/rejeição de solicitações

### 💰 **Faturamento e Cobrança**
- ✅ Widget de faturamento no sidebar
- ✅ Pagamentos a vencer (hoje e próximos)
- ✅ Pagamentos vencidos com alertas
- ✅ Ações rápidas para cobrança

### 🛠️ **Ferramentas Auxiliares**
- ✅ **Calculadora de Produtos**: estimativas precisas
- ✅ **Assistente IA**: dúvidas e sugestões com Gemini
- ✅ **Cliente Avulso**: cadastro rápido para emergências
- ✅ **Lembrete de Abastecimento**: timer no header

### 📱 **Experiência Mobile/PWA**
- ✅ **Totalmente Responsivo**: mobile-first design
- ✅ **Bottom Tab Bar**: navegação rápida em celulares
- ✅ **Sidebar Inteligente**: widgets e ferramentas
- ✅ **PWA Completo**: instalável, offline-ready
- ✅ **Service Worker**: cache para performance
- ✅ Ícones e splash screen personalizados

### 🎨 **Interface e Usabilidade**
- ✅ **Tema Claro/Escuro**: toggle automático
- ✅ **Componentes Acessíveis**: Radix UI, ARIA
- ✅ **Feedback Visual**: toasts, loading states
- ✅ **Estados Vazios**: mensagens amigáveis
- ✅ **Responsive Design**: adaptação automática

---

## 🏗️ **Estrutura do Projeto**

```
src/
├── app/                     # App Router (Next.js 13+)
│   ├── dashboard/          # Páginas protegidas
│   │   ├── page.tsx        # Dashboard principal
│   │   ├── clientes/       # Gestão de clientes
│   │   ├── roteiros/       # Roteiros da semana
│   │   ├── produtos-do-dia/# Aprovação de produtos
│   │   ├── perfil/         # Edição de perfil
│   │   └── admin/          # Painel administrativo
│   ├── api/                # API Routes
│   ├── login/              # Autenticação
│   └── setup-piscineiro/   # Configuração inicial
├── components/             # Componentes reutilizáveis
│   ├── ui/                 # Primitivos (Radix UI)
│   ├── widgets/            # Widgets do dashboard
│   └── forms/              # Formulários específicos
├── hooks/                  # Custom hooks
├── context/               # Context providers (Auth, etc)
├── lib/                   # Utilities, schemas, Firebase
└── public/                # Assets estáticos, PWA
```

---

## 🔧 **Instalação e Desenvolvimento**

### **Pré-requisitos**
- Node.js 18+
- Projeto Firebase configurado
- Chave da API Google Gemini

### **1. Clone e instale dependências**
```bash
git clone https://github.com/Chel0626/piscineiro-app.git
cd piscineiro-app
npm install
```

### **2. Configure as variáveis de ambiente**
```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

GEMINI_API_KEY=your_gemini_api_key
```

### **3. Execute o projeto**
```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build
npm run start
```

---

## 🎯 **Casos de Uso**

### **Para Piscineiros Autônomos**
- Organizar roteiros semanais
- Controlar produtos utilizados
- Gerenciar cobranças e pagamentos
- Comunicação profissional com clientes

### **Para Empresas de Piscinas**
- Gestão de múltiplos piscineiros
- Controle centralizado de produtos
- Relatórios de faturamento
- Padronização de atendimento

### **Para Clientes Finais**
- Recebimento de listas de produtos via WhatsApp
- Histórico transparente de visitas
- Comunicação direta com o piscineiro

---

## 🌟 **Diferenciais**

- **🎯 Foco no Mobile**: Desenvolvido pensando no piscineiro em campo
- **🤖 IA Integrada**: Assistente para dúvidas técnicas e sugestões
- **⚡ Performance**: PWA com cache inteligente
- **🔄 Offline-First**: Funciona mesmo sem internet
- **📱 UX Nativa**: Interface familiar aos usuários mobile
- **🔗 Integração WhatsApp**: Comunicação natural no Brasil

---

## 🚧 **Roadmap**

- [ ] Relatórios avançados e analytics
- [ ] Integração com sistemas de pagamento
- [ ] Notificações push
- [ ] Geolocalização e otimização de rotas
- [ ] Módulo de estoque avançado
- [ ] API para integrações terceiras

---

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 **Desenvolvimento**

Desenvolvido com ❤️ para profissionais de piscinas que buscam eficiência e organização em seus negócios.

**Stack**: Next.js, Firebase, TailwindCSS, TypeScript
**PWA**: Instalável, responsivo, offline-ready
**IA**: Google Gemini para assistência inteligente
