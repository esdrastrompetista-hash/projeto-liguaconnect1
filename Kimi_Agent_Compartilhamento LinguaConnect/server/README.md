# LinguaConnect Backend

Backend da plataforma LinguaConnect - Intercâmbio de idiomas com chat em tempo real e chamadas WebRTC.

## 🚀 Tecnologias

- **Node.js 20+**
- **Express.js**
- **Socket.io** (WebSockets para tempo real)
- **PostgreSQL** (Banco de dados)
- **Drizzle ORM**
- **JWT** (Autenticação)
- **bcryptjs** (Hash de senhas)

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL database (recomendado: [Supabase](https://supabase.com) ou [Neon](https://neon.tech))

## 🔧 Configuração

1. **Clone o repositório:**
```bash
git clone <repo-url>
cd server
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
FRONTEND_URL=https://your-frontend-url.com
```

4. **Crie as tabelas no banco de dados:**
Execute o script SQL abaixo no seu PostgreSQL:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  age INTEGER,
  gender VARCHAR(20),
  country VARCHAR(100),
  native_language VARCHAR(50),
  learning_libraries JSONB DEFAULT '[]',
  bio TEXT,
  avatar_url VARCHAR(500),
  google_id VARCHAR(255) UNIQUE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_one_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_two_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calls table
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ringing',
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Deploy

### Opção 1: Railway (Recomendado)

1. Crie uma conta em [Railway](https://railway.app)
2. Crie um novo projeto e adicione um banco PostgreSQL
3. Faça deploy do código:
```bash
railway login
railway init
railway up
```

### Opção 2: Render

1. Crie uma conta em [Render](https://render.com)
2. Crie um novo Web Service
3. Conecte seu repositório Git
4. Configure as variáveis de ambiente
5. Deploy!

### Opção 3: VPS (DigitalOcean, AWS, etc.)

```bash
# Build
cd server
npm install
npm run build

# Start
npm start
```

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login com email/senha
- `POST /api/auth/google` - Login com Google
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário logado

### Usuários
- `GET /api/users` - Listar usuários (com filtros)
- `GET /api/users/:id` - Buscar usuário por ID
- `PUT /api/users/profile` - Atualizar perfil
- `DELETE /api/users/account` - Deletar conta

### Mensagens
- `GET /api/messages/conversations` - Listar conversas
- `POST /api/messages/conversations` - Criar conversa
- `GET /api/messages/conversations/:id/messages` - Buscar mensagens
- `POST /api/messages/conversations/:id/messages` - Enviar mensagem

## 🔌 Eventos Socket.IO

### Chat
- `authenticate` - Autenticar socket
- `join_conversation` - Entrar em uma sala de conversa
- `send_message` - Enviar mensagem
- `typing` - Indicador de digitação
- `mark_as_read` - Marcar mensagens como lidas

### Chamadas
- `call_user` - Iniciar chamada
- `accept_call` - Aceitar chamada
- `reject_call` - Rejeitar chamada
- `end_call` - Encerrar chamada
- `webrtc_offer` - Oferta WebRTC
- `webrtc_answer` - Resposta WebRTC
- `webrtc_ice_candidate` - Candidato ICE

## 📝 Licença

MIT
