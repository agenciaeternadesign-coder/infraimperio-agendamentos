# Infraimpério — Gestão de Agendamentos

Aplicação web completa para gestão de **visitas de orçamento** da empresa Infraimpério (Barreiro, Setúbal).

---

## Funcionalidades

| Módulo | Descrição |
|---|---|
| **Dashboard** | Resumo do dia, próxima visita em destaque, alertas de clientes recorrentes, próximas visitas |
| **Agenda** | Calendário mensal e semanal com cards de visitas por estado e cor |
| **Rota do Dia** | Rota optimizada (Barreiro → Lisboa → Barreiro) com mapa Google Maps interactivo, tempos reais de deslocação, drag-and-drop e botão "Abrir no Maps" |
| **Clientes** | Cadastro completo com histórico de visitas, pesquisa e edição inline |
| **Nova Visita** | Formulário em 2 passos com pesquisa de cliente existente + alerta automático de cliente recorrente |
| **Notificações WhatsApp** | Botões wa.me com mensagem pré-preenchida (sem configuração) + envio automático via Twilio |
| **Notificações E-mail** | Confirmação imediata e lembretes 3d/1d/dia via EmailJS (sem backend) |
| **Exportar / Importar** | Download de `appointments.json` para backup e script externo; importação e sincronização automática |
| **Configurações** | Dados empresa, Google Maps API Key, EmailJS, Twilio, horário de trabalho |

---

## Instalação e desenvolvimento local

```bash
npm install
npm run dev
# Abre em http://localhost:5173
```

## Build de produção

```bash
npm run build
# Saída em dist/
```

## Deploy no Vercel

1. Faça push do projecto para um repositório GitHub.
2. Em [vercel.com](https://vercel.com) clique em **Add New → Project** e importe o repositório.
3. Clique em **Deploy** — o Vite é detectado automaticamente.

O `vercel.json` já está configurado com `rewrites` para o roteamento SPA.

---

## Configuração — Google Maps API

O mapa interactivo e os tempos reais de deslocação requerem uma API Key do Google.

**Custo:** gratuito até 200 USD/mês de crédito (cobre centenas de rotas diárias).

### Passo 1 — Criar projecto no Google Cloud

Aceda ao [Google Cloud Console](https://console.cloud.google.com) e crie um projecto (ou seleccione um existente).

### Passo 2 — Activar as APIs necessárias

Em **APIs e Serviços → Biblioteca**, active:
- **Maps JavaScript API**
- **Directions API**

### Passo 3 — Criar credencial

Em **APIs e Serviços → Credenciais → Criar credencial → Chave de API**, clique em Criar.

Recomenda-se restringir a chave ao domínio do Vercel (`*.vercel.app` ou o domínio próprio).

### Passo 4 — Inserir na app

Na app, vá a **Configurações → Google Maps** e cole a API Key.

A Rota do Dia passará a mostrar:
- Mapa interactivo com a rota traçada
- Tempos de deslocação reais (ex: "14 min · 8,3 km") entre cada paragem
- Total de tempo de viagem do dia

---

## Configuração — Notificações por E-mail (EmailJS)

Envio de e-mails sem backend, plano gratuito até 200 mensagens/mês.

### Passo 1 — Criar conta

Aceda a [emailjs.com](https://www.emailjs.com) e registe-se.

### Passo 2 — Criar serviço de e-mail

Em **Email Services**, adicione Gmail, Outlook ou SMTP próprio. Copie o **Service ID**.

### Passo 3 — Criar dois templates

**Template de Confirmação** — sugestão de assunto e corpo:

```
Assunto: A sua visita de orçamento está confirmada — {{company_name}}

Olá {{to_name}},

A sua visita de orçamento foi agendada com sucesso.

📅 Data e hora: {{visit_date}}
📍 Morada: {{visit_address}}
🔨 Tipo de obra: {{work_type}}

Para qualquer dúvida: {{company_name}} — {{company_phone}}

Até breve!
```

**Template de Lembrete** — sugestão:

```
Assunto: Lembrete — visita de orçamento {{company_name}}

Olá {{to_name}},

Lembrete da sua visita de orçamento {{reminder_type}}.

📅 {{visit_date}}
📍 {{visit_address}}

{{company_name}} — {{company_phone}}
```

### Passo 4 — Obter Public Key

Em **Account → General**, copie a **Public Key**.

### Passo 5 — Inserir na app

**Configurações → E-mail Automático**: preencha Service ID, Public Key, Template ID Confirmação e Template ID Lembrete.

**Variáveis disponíveis nos templates:**

| Variável | Conteúdo |
|---|---|
| `{{to_name}}` | Nome do cliente |
| `{{to_email}}` | E-mail do cliente |
| `{{visit_date}}` | Data e hora (ex: 20/05/2026 às 10:00) |
| `{{visit_address}}` | Morada da visita |
| `{{work_type}}` | Tipo de obra |
| `{{company_name}}` | Nome da empresa |
| `{{company_phone}}` | Telefone da empresa |
| `{{company_email}}` | E-mail da empresa |
| `{{reminder_type}}` | "3 dias", "1 dia" ou "hoje" |

**Lembretes automáticos:** verificados quando a app é aberta — se a data de uma visita for daqui a 3 dias, 1 dia ou hoje, e o lembrete ainda não foi enviado, a app envia automaticamente.

---

## Configuração — WhatsApp

### Nível 1 — Disponível imediatamente (sem configuração)

Em cada visita (modal de detalhe), aparecem botões **"Enviar por WhatsApp"** que abrem o WhatsApp Web/App com a mensagem já escrita. A proprietária só clica em Enviar.

Funciona para:
- Mensagem de confirmação da visita
- Lembretes (3 dias antes, 1 dia antes, dia da visita)

Não requer conta, API key nem backend.

### Nível 2 — Envio automático via Twilio WhatsApp

Permite enviar mensagens automaticamente sem intervenção manual.

**Passo 1 — Criar conta Twilio**

Aceda a [twilio.com](https://www.twilio.com) e crie conta gratuita (trial).

**Passo 2 — Activar sandbox WhatsApp**

No painel Twilio: **Messaging → Try it out → Send a WhatsApp message**.
Siga as instruções para activar o sandbox e enviar a mensagem de activação a partir do telemóvel da empresa.

**Passo 3 — Obter credenciais**

Na página principal do Console Twilio:
- **Account SID** (começa por `AC...`)
- **Auth Token**
- **Número Twilio WhatsApp** (sandbox: geralmente `+14155238886`)

**Passo 4 — Inserir na app**

**Configurações → WhatsApp → Nível 2**: preencha Account SID, Auth Token e Número Twilio.

> **Nota sobre CORS em produção:** A API do Twilio não suporta chamadas directas do browser por razões de segurança (CORS). Em desenvolvimento local funciona normalmente. Em produção (Vercel), é necessário um backend proxy — sugestão: criar uma [Vercel Edge Function](https://vercel.com/docs/functions) que reencaminhe os pedidos para o Twilio.

---

## Exportar / Importar dados

### Exportar

Em **Configurações → Exportar / Importar**, clique em **Exportar** para descarregar `appointments.json` com todos os agendamentos no formato:

```json
[
  {
    "id": "v123",
    "cliente": {
      "nome": "Maria Santos",
      "telefone": "+351 912 345 678",
      "email": "maria@exemplo.pt",
      "morada": "Rua Augusta 45, Lisboa"
    },
    "data": "2026-05-20",
    "hora": "09:00",
    "moradaVisita": "Rua Augusta 45, Lisboa",
    "tipoObra": "remodelacao",
    "estado": "agendado",
    "notificacoes": {
      "confirmacao": true,
      "lembrete3dias": false,
      "lembrete1dia": false,
      "lembreteNoDia": false
    },
    "observacoes": "Remodelação da cozinha",
    "criadoEm": "2026-05-10T10:00:00.000Z"
  }
]
```

O campo `notificacoes` regista quais lembretes já foram enviados, permitindo que um script externo saiba quais faltam.

### Sincronização automática (Chrome/Edge)

Em browsers modernos, o botão **Activar sincronização** usa a File System Access API para escolher um ficheiro local — a app actualiza-o automaticamente a cada alteração (durante a sessão actual).

### Importar

Clique em **Importar** e seleccione um `appointments.json` previamente exportado. Os agendamentos são adicionados aos existentes (não substituem).

---

## Persistência de dados

Todos os dados são guardados no **localStorage** do browser.

**Chaves utilizadas:**
- `infraimperio_visits` — agendamentos
- `infraimperio_clients` — clientes
- `infraimperio_settings` — configurações

**Backup manual via consola do browser:**
```js
JSON.stringify({
  visits:   JSON.parse(localStorage.getItem('infraimperio_visits')),
  clients:  JSON.parse(localStorage.getItem('infraimperio_clients')),
  settings: JSON.parse(localStorage.getItem('infraimperio_settings')),
})
```

---

## Stack técnica

| Pacote | Versão | Uso |
|---|---|---|
| React | 18 | UI |
| Vite | 5 | Build tool |
| Tailwind CSS | 3 | Estilos |
| React Router | 6 | Roteamento SPA |
| date-fns | 3 | Datas em PT |
| @dnd-kit | 6/8 | Drag-and-drop da rota |
| @react-google-maps/api | 2 | Mapa interactivo + Directions API |
| @emailjs/browser | 4 | E-mails sem backend |

---

## Estrutura do projecto

```
src/
├── App.jsx
├── main.jsx
├── index.css
├── contexts/
│   └── AppContext.jsx          # Estado global + CRUD + auto-export
├── data/
│   └── sampleData.js           # Dados de exemplo (4 clientes, 4 visitas)
├── utils/
│   ├── storage.js              # Wrapper localStorage
│   ├── dateUtils.js            # Formatação de datas PT
│   ├── routeUtils.js           # Algoritmo nearest-neighbour + URL Google Maps
│   ├── emailUtils.js           # EmailJS (confirmação + lembretes)
│   ├── whatsappUtils.js        # wa.me links + Twilio REST
│   └── exportUtils.js          # JSON export/import + File System Access API
├── components/
│   ├── Layout.jsx              # Shell: sidebar + topbar
│   ├── Sidebar.jsx             # Navegação lateral
│   ├── StatusBadge.jsx         # Badge de estado das visitas
│   ├── VisitModal.jsx          # Modal de detalhe + WhatsApp + estado
│   └── MapaRota.jsx            # Google Maps com DirectionsRenderer
└── pages/
    ├── Dashboard.jsx
    ├── Agenda.jsx              # Calendário mensal + semanal
    ├── RotaDia.jsx             # Rota optimizada + mapa
    ├── Clientes.jsx
    ├── ClienteDetalhe.jsx
    ├── NovaVisita.jsx
    └── Configuracoes.jsx
```
