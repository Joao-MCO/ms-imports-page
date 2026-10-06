# MS Imports

Sistema de gestão de vendas e inventário para loja de importados. Inclui PDV/lançamento de pedidos, controle de estoque, cadastros de produtos, clientes e usuários, e um dashboard com métricas e gráficos.

## Funcionalidades

- **Autenticação** com NextAuth (credentials + JWT) e papéis `admin` / `manager`.
- **Pedidos**
  - Pedidos com múltiplos itens (produto, quantidade e preço unitário).
  - Desconto percentual aplicado ao total.
  - Número sequencial automático por pedido (`#0001`).
  - Controle de estoque: desconto automático no lançamento; permite vender mesmo sem estoque (opção "Vender mesmo assim").
  - Status: `OPENED` (Aberto), `PAID` (Pago), `DISCARDED` (Descartado).
  - Formas de pagamento: `PIX`, `CREDIT_CARD`, `DEBIT_CARD`, `CASH`, `BOLETO`, `OTHER`.
  - Impressão de recibo para pedidos pagos.
  - Filtros por status e forma de pagamento.
- **Produtos**: CRUD com categoria, preço e estoque; filtro por categoria.
- **Clientes**: CRUD com CPF/CNPJ (11 ou 14 dígitos).
- **Usuários**: CRUD (apenas admin), senha com hash (bcryptjs).
- **Dashboard (Gerenciamento)**:
  - KPIs: total de pedidos, receita, ticket médio, taxa de conversão, total de clientes e produtos.
  - Gráficos: pedidos por dia, receita por dia, top 5 produtos e distribuição por status.
  - Filtros por período (início/fim), status e forma de pagamento.
- **Soft delete**: registros são marcados com `deletedAt` em vez de removidos fisicamente. Pedidos descartados recebem `status: DISCARDED`.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **MongoDB** + **Mongoose 9**
- **NextAuth v5** (credentials, sessão em JWT)
- **React Hook Form** + **Zod**
- **TanStack Table**, **Recharts**, **date-fns**, **bcryptjs**

## Estrutura do projeto

```
app/
  (auth)/login/          # Tela de login
  (dashboard)/orders/    # Página de pedidos
  (dashboard)/management/# Dashboard, produtos, clientes e usuários
  api/                   # Rotas de API (Next.js Route Handlers)
    auth/                # Handlers do NextAuth
    clients/ users/ products/ orders/ dashboard/stats/
components/
  ui/                    # Botão, Input, Modal, Select, DataTable, etc.
  orders/                # OrderTable, OrderModal, PaymentModal, ReceiptModal
  management/            # ProductTable, ClientTable, UserTable, DashboardCharts
lib/
  validations/           # Schemas Zod (create/update/query)
  auth-config.ts         # Configuração do NextAuth
  mongodb.ts             # Conexão com o MongoDB
models/                  # Mongoose: User, Client, Product, Order, Counter
middleware.ts            # Proteção de rotas (dashboard e orders autenticados)
```

## Pré-requisitos

- Node.js 20+
- MongoDB (local ou Atlas)

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env` baseado no `.env.example`:

   ```bash
   cp .env.example .env
   ```

3. Preencha as variáveis:

   ```env
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/istore

   # NextAuth
   NEXTAUTH_SECRET=<gere com: openssl rand -base64 32>
   NEXTAUTH_URL=http://localhost:3000
   ```

### Criando o primeiro usuário administrador

A API de usuários exige autenticação de um `admin`, então o primeiro usuário deve ser criado direto no banco:

```zsh
mongosh "mongodb://localhost:27017/istore" --eval '
  const bcrypt = require("bcryptjs");
  const hash = bcrypt.hashSync("sua-senha", 10);
  db.users.insertOne({
    name: "Administrador",
    email: "admin@msimports.com",
    password: hash,
    role: "admin",
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });
'
```

## Executando

```bash
npm run dev      # desenvolvimento (http://localhost:3000)
npm run build    # build de produção
npm run start    # roda a build de produção
npm run lint     # ESLint
npx tsc --noEmit # verificação de tipos
```

## API

Todas as rotas protegidas exigem sessão autenticada. Endpoints de usuários exigem `admin`.

### Pedidos — `/api/orders`

| Método | Descrição |
| ------ | --------- |
| `GET` | Lista pedidos com paginação |
| `POST` | Cria pedido (valida estoque, desconta estoque e gera número sequencial) |
| `PATCH` `/api/orders/:id` | Atualiza pedido (ajusta estoque e recalcula total) |
| `DELETE` `/api/orders/:id` | Descartar pedido (`status: DISCARDED`) |

Query params do `GET`: `page`, `limit`, `search`, `status` (`OPENED|PAID|DISCARDED|ALL`), `paymentMethod` (`PIX|CREDIT_CARD|DEBIT_CARD|CASH|BOLETO|OTHER|ALL`), `startDate`, `endDate`, `sortBy`, `sortOrder`.

Body do `POST`:

```json
{
  "clientId": "65f...",
  "items": [{ "productId": "65f...", "quantity": 2, "unitPrice": 49.9 }],
  "discount": 10,
  "status": "OPENED",
  "paymentMethod": "PIX",
  "allowOutOfStock": false
}
```

### Produtos — `/api/products`

`GET` (params: `page`, `limit`, `search`, `category`, `sortBy`, `sortOrder`), `POST`, `PATCH /:id`, `DELETE /:id`.

### Clientes — `/api/clients`

`GET`, `POST`, `PATCH /:id`, `DELETE /:id`.

### Usuários — `/api/users` (somente admin)

`GET`, `POST`, `PATCH /:id`, `DELETE /:id`.

### Dashboard — `/api/dashboard/stats`

`GET` com params `startDate`, `endDate`, `status`, `paymentMethod`. Retorna KPIs, pedidos por dia, top 5 produtos e distribuição de status.

## Modelo de dados

- **User**: `name`, `email` (único), `password` (hash), `role` (`admin|manager`).
- **Client**: `name`, `email`, `phone`, `document` (CPF/CNPJ), `address`.
- **Product**: `name`, `description`, `price`, `stock`, `category`.
- **Order**: `clientId`, `items[{productId, quantity, unitPrice}]`, `discount`, `totalPrice`, `status`, `orderNumber` (sequencial via modelo `Counter`), `paymentMethod`.
- **Counter**: usado para gerar números sequenciais (`name` + `seq`).

## Observações

- Pedidos criados antes da refatoração multi-item (campos `productId`/`quantity`/`unitPrice` no topo) ainda são listados normalmente — o serializer normaliza o formato legado.
- Descartar um pedido **não** restaura o estoque.
- O tema suporta claro/escuro e a impressão de recibo usa regras de `@media print` em `app/globals.css`.
