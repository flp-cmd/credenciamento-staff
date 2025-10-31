# Sistema de Credenciamento - Frontend

Sistema completo de gerenciamento de credenciamento para eventos, desenvolvido com Next.js 16, React 19, TypeScript e Tailwind CSS.

## 📋 Estrutura do Projeto

```
src/
├── app/                          # Páginas e rotas (App Router)
│   ├── dashboard/                # Dashboard do admin
│   ├── login/                    # Página de login
│   ├── events/[eventId]/         # Páginas de eventos
│   │   ├── page.tsx              # Detalhes do evento
│   │   ├── teams/                # Gerenciamento de equipes
│   │   │   └── [teamId]/         # Detalhes da equipe
│   │   │       ├── positions/    # Cargos da equipe
│   │   │       │   └── [positionId]/  # Config de campos
│   │   │       └── staff/        # Staff da equipe
│   │   └── staff/                # Todos os funcionários
│   ├── team/[teamCode]/          # Acesso do líder (público)
│   │   ├── register/             # Cadastro de staff
│   │   └── staff/                # Lista de staff
│   └── api/                      # API routes (backend)
├── components/
│   ├── ui/                       # Componentes reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   └── layout/                   # Componentes de layout
│       ├── Navbar.tsx
│       └── PageHeader.tsx
├── contexts/
│   └── AuthContext.tsx           # Contexto de autenticação
├── lib/
│   ├── api-client.ts             # Cliente HTTP
│   ├── auth.ts                   # Utilitários de auth
│   ├── db.ts                     # Conexão com banco
│   └── middleware.ts             # Middlewares da API
└── types/
    └── index.ts                  # Tipos TypeScript

```

## 🚀 Tecnologias Utilizadas

- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização
- **PostgreSQL** - Banco de dados (via Neon)
- **Zod** - Validação de schemas
- **JWT** - Autenticação

## 📱 Fluxo de Páginas

### Admin (Autenticado via JWT)

1. **`/login`** - Login do administrador
2. **`/dashboard`** - Lista de eventos
3. **`/events/[id]`** - Visão geral do evento
4. **`/events/[id]/teams`** - Lista de equipes
5. **`/events/[id]/teams/[teamId]`** - Detalhes da equipe + código de acesso
6. **`/events/[id]/teams/[teamId]/positions`** - Lista de cargos
7. **`/events/[id]/teams/[teamId]/positions/[positionId]`** - Configurar campos obrigatórios
8. **`/events/[id]/teams/[teamId]/staff`** - Funcionários da equipe
9. **`/events/[id]/staff`** - Todos os funcionários do evento

### Líder de Equipe (Autenticado via team_code)

1. **`/team/[teamCode]`** - Dashboard do líder
2. **`/team/[teamCode]/register`** - Cadastrar novo funcionário
3. **`/team/[teamCode]/staff`** - Ver funcionários cadastrados

## 🎨 Componentes UI

### Button

```tsx
<Button variant="primary" size="md" isLoading={false}>
  Clique aqui
</Button>
```

Variantes: `primary`, `secondary`, `danger`, `ghost`
Tamanhos: `sm`, `md`, `lg`

### Input

```tsx
<Input
  label="Nome"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error="Campo obrigatório"
  required
/>
```

### Card

```tsx
<Card>
  <CardHeader>Título</CardHeader>
  <CardContent>Conteúdo</CardContent>
  <CardFooter>Rodapé</CardFooter>
</Card>
```

## 🔐 Autenticação

### Admin (JWT)

```typescript
const { admin, token, login, logout } = useAuth();

// Login
await login(email, password);

// Fazer requisição autenticada
const response = await apiClient.get("/api/events", token);
```

### Líder de Equipe (team_code)

```typescript
// Requisição com team_code
const response = await apiClient.post(
  "/api/staff",
  { team_id, position_id, name, cpf },
  teamCode // UUID da equipe
);
```

## 📡 API Client

```typescript
import { apiClient } from "@/src/lib/api-client";

// GET
const { data, error } = await apiClient.get<ResponseType>(
  "/api/endpoint",
  token
);

// POST
const { data, error } = await apiClient.post<ResponseType>(
  "/api/endpoint",
  { field: "value" },
  token
);

// PUT
const { data, error } = await apiClient.put<ResponseType>(
  "/api/endpoint/1",
  { field: "new value" },
  token
);

// DELETE
const { data, error } = await apiClient.delete<ResponseType>(
  "/api/endpoint/1",
  token
);
```

## 🎯 Padrões de Código

### Estrutura de Página

```typescript
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const { admin, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Proteção de rota
  useEffect(() => {
    if (!authLoading && !admin) {
      router.push("/login");
    }
  }, [admin, authLoading, router]);

  // Carregar dados
  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    setIsLoading(true);
    const response = await apiClient.get("/api/data", token!);
    if (response.data) {
      setData(response.data);
    }
    setIsLoading(false);
  };

  // Loading state
  if (authLoading || isLoading) {
    return <LoadingSpinner />;
  }

  return <div>{/* Conteúdo */}</div>;
}
```

### Formulários

```typescript
const [formData, setFormData] = useState({ name: "", email: "" });
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState("");

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError("");
  setIsSubmitting(true);

  const response = await apiClient.post("/api/endpoint", formData, token);

  if (response.error) {
    setError(response.error);
    setIsSubmitting(false);
  } else {
    // Sucesso
    onSuccess();
  }
};
```

## 🎨 Estilos e Design

### Cores Principais

- **Primary**: Blue-600 (`#2563eb`)
- **Success**: Green-600
- **Danger**: Red-600
- **Gray**: Gray-50 a Gray-900

### Responsividade

```tsx
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

### Estados de Hover

```tsx
<Card className="hover:shadow-lg transition-shadow cursor-pointer">
  {/* Conteúdo */}
</Card>
```

## 🔄 Estado de Loading

### Spinner Padrão

```tsx
<div className="text-center py-12">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
  <p className="mt-4 text-gray-600">Carregando...</p>
</div>
```

### Botão com Loading

```tsx
<Button isLoading={isSubmitting}>Salvar</Button>
```

## 📝 Validação de Campos

A validação de campos obrigatórios é feita no backend, mas o frontend exibe os erros:

```typescript
// Backend retorna erro
if (response.error) {
  setError(response.error); // "Campo obrigatório ausente: cpf"
}
```

## 🚦 Navegação

### Breadcrumbs

```tsx
<PageHeader
  title="Título da Página"
  description="Descrição"
  breadcrumbs={[
    { label: "Eventos", href: "/dashboard" },
    { label: "Detalhes", href: `/events/${eventId}` },
    { label: "Atual" },
  ]}
  action={<Button>Ação</Button>}
/>
```

### Links

```tsx
import Link from "next/link";

<Link href="/dashboard">
  <Button>Ir para Dashboard</Button>
</Link>;
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
DATABASE_URL=postgresql://...
JWT_SECRET=seu-secret-aqui
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Instalação

```bash
# Instalar dependências
yarn install

# Rodar em desenvolvimento
yarn dev

# Build para produção
yarn build

# Iniciar produção
yarn start
```

## 📊 Endpoints da API

Veja a documentação completa dos endpoints no arquivo principal do projeto ou nos testes do Postman.

## 🎯 Próximos Passos

- [ ] Adicionar exportação de relatórios (CSV/PDF)
- [ ] Implementar busca e filtros avançados
- [ ] Adicionar sistema de notificações
- [ ] Implementar upload de fotos para credenciais
- [ ] Adicionar dashboard com gráficos e estatísticas
- [ ] Implementar sistema de aprovação de cadastros
- [ ] Adicionar histórico de alterações

## 🤝 Contribuindo

1. Mantenha a estrutura de pastas organizada
2. Use TypeScript para tipagem forte
3. Siga os padrões de código estabelecidos
4. Teste em diferentes tamanhos de tela
5. Adicione loading states em todas as operações assíncronas
6. Trate erros adequadamente

## 📄 Licença

Este projeto é proprietário e confidencial.
