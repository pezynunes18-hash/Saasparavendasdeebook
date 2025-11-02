# 🛒 Sistema Multi-Vendedor com Stripe Connect

## 📋 Visão Geral

Sistema completo de marketplace de ebooks onde múltiplos vendedores podem cadastrar e vender seus produtos, com split automático de pagamentos via Stripe Connect.

## 🎯 Principais Funcionalidades

### Para Vendedores
- ✅ Cadastro e autenticação de vendedores
- ✅ Integração com Stripe Connect para receber pagamentos
- ✅ Dashboard exclusivo para gerenciar ebooks
- ✅ Visualização de vendas e estatísticas
- ✅ Sistema de saldo e saques
- ✅ Upload de arquivos PDF/EPUB
- ✅ Categorização de ebooks

### Para Administradores
- ✅ Aprovação/rejeição de vendedores
- ✅ Visualização de todos os vendedores
- ✅ Métricas de receita da plataforma vs vendedores
- ✅ Controle de comissões

### Para Compradores
- ✅ Compra de ebooks de múltiplos vendedores
- ✅ Carrinho de compras
- ✅ Pagamento seguro via Stripe
- ✅ Download de ebooks comprados

## 💰 Modelo de Negócio

### Split de Pagamento
```
Venda de $10,00:
├── Vendedor recebe: $9,00 (90%)
├── Plataforma recebe: $1,00 (10%)
└── Taxa Stripe: ~$0,30 + 2,9%
```

### Fluxo de Dinheiro
1. Cliente compra ebook por $10
2. Stripe processa o pagamento
3. Sistema divide automaticamente:
   - $9 vai direto para conta Stripe do vendedor
   - $1 fica na conta da plataforma
4. Vendedor pode sacar a qualquer momento

## 🔑 Como Funciona

### 1. Cadastro do Vendedor
```typescript
POST /vendor-signup
{
  "email": "vendedor@email.com",
  "password": "senha123",
  "name": "João Silva",
  "businessName": "Editora Silva"
}
```

**Status inicial:** `pending` (aguardando aprovação)

### 2. Aprovação pelo Admin
```typescript
POST /admin/approve-vendor
{
  "vendorId": "uuid-do-vendedor",
  "status": "approved" // ou "rejected"
}
```

**Após aprovação:** Vendedor pode conectar Stripe e adicionar ebooks

### 3. Conexão com Stripe Connect
```typescript
POST /vendor-onboarding
// Retorna URL para onboarding do Stripe
{
  "url": "https://connect.stripe.com/express/..."
}
```

**Tipo de conta:** Stripe Express Account
- Mais simples para vendedores
- Stripe gerencia compliance e KYC
- Pagamentos diretos

### 4. Adicionar Ebook
```typescript
POST /ebooks
{
  "title": "Meu Ebook",
  "description": "Descrição...",
  "price": 9.99,
  "author": "João Silva",
  "category": "Tecnologia",
  "coverUrl": "https://..."
}
```

**Ebook é automaticamente vinculado ao vendedor**

### 5. Compra e Split Automático
```typescript
// Cliente compra ebook
POST /create-payment-intent
{
  "ebookId": "uuid-do-ebook"
}

// Sistema cria payment intent com split:
stripe.paymentIntents.create({
  amount: 1000, // $10.00
  application_fee_amount: 100, // $1.00 (10%)
  transfer_data: {
    destination: vendor.stripeAccountId // Conta do vendedor
  }
})
```

### 6. Saque do Vendedor
```typescript
POST /vendor-withdrawal
{
  "amount": 50.00
}

// Sistema cria transfer para conta do vendedor
stripe.transfers.create({
  amount: 5000,
  destination: vendor.stripeAccountId
})
```

## 📊 Estrutura de Dados

### Vendedor (vendor)
```typescript
{
  id: string;
  email: string;
  name: string;
  businessName: string;
  status: 'pending' | 'approved' | 'rejected';
  stripeAccountId: string | null;
  commission: number; // % da plataforma (padrão: 10)
  createdAt: string;
}
```

### Ebook
```typescript
{
  id: string;
  title: string;
  description: string;
  price: number;
  author: string;
  category: string;
  vendorId: string | null; // null = ebook da plataforma
  coverUrl: string;
  filePath: string;
  createdAt: string;
}
```

### Venda (sale)
```typescript
{
  id: string;
  ebookId: string;
  userId: string;
  vendorId: string | null;
  totalAmount: number;
  vendorAmount: number; // 90%
  platformAmount: number; // 10%
  paymentIntentId: string;
  createdAt: string;
}
```

### Saque (withdrawal)
```typescript
{
  id: string;
  vendorId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transferId: string;
  createdAt: string;
  completedAt: string;
}
```

## 🚀 Rotas da API

### Autenticação
- `POST /vendor-signup` - Cadastrar vendedor
- `GET /vendor-profile` - Obter perfil do vendedor

### Stripe Connect
- `POST /vendor-onboarding` - Gerar link de onboarding Stripe

### Gestão de Ebooks (Vendedor)
- `POST /ebooks` - Criar ebook (vincula ao vendedor)
- `GET /vendor-ebooks` - Listar ebooks do vendedor
- `DELETE /ebooks/:id` - Deletar ebook

### Vendas e Finanças (Vendedor)
- `GET /vendor-sales` - Listar vendas do vendedor
- `GET /vendor-balance` - Obter saldo disponível
- `POST /vendor-withdrawal` - Solicitar saque

### Admin
- `GET /admin/vendors` - Listar todos vendedores
- `POST /admin/approve-vendor` - Aprovar/rejeitar vendedor
- `GET /admin/platform-revenue` - Métricas financeiras

## 🎨 Componentes Frontend

### VendorAuthForm
Formulário de cadastro e login de vendedores

### VendorDashboard
Dashboard completo do vendedor com:
- Status de aprovação
- Estatísticas (ebooks, vendas, receita)
- Saldo e histórico de saques
- Gestão de ebooks
- Histórico de vendas detalhado

### AdminPanel
Painel administrativo com:
- Lista de vendedores pendentes
- Aprovação/rejeição de vendedores
- Métricas de receita da plataforma
- Estatísticas de vendedores

## 🔒 Segurança

### Autenticação
- Supabase Auth para gerenciar sessões
- JWT tokens para autenticação de API
- Verificação de vendedor em rotas protegidas

### Stripe Connect
- Express Accounts (Stripe gerencia compliance)
- Pagamentos diretos sem tocar no dinheiro
- Transfers automáticos

### Validações
- Vendedor precisa estar aprovado para vender
- Vendedor precisa conectar Stripe para receber
- Verificação de saldo antes de saques
- Verificação de propriedade de ebooks

## 📈 Métricas e Dashboard

### Vendedor vê:
- Total de ebooks publicados
- Número de vendas
- Receita total (90% das vendas)
- Saldo disponível para saque
- Histórico de saques

### Admin vê:
- Receita da plataforma (10% de comissão)
- Receita total dos vendedores
- Número de vendedores ativos
- Vendedores pendentes de aprovação
- Estatísticas por vendedor

## 🎯 Próximos Passos

### Melhorias Sugeridas
1. **Email Notifications**
   - Notificar vendedor quando aprovado
   - Confirmar saques por email
   - Notificar quando houver venda

2. **Reviews e Ratings**
   - Compradores podem avaliar ebooks
   - Vendedores têm rating médio
   - Sistema de comentários

3. **Analytics Avançado**
   - Gráficos de vendas ao longo do tempo
   - Top vendedores
   - Ebooks mais vendidos
   - Taxa de conversão

4. **Comissões Dinâmicas**
   - Comissão variável por categoria
   - Desconto para vendedores com mais vendas
   - Promoções temporárias

5. **Sistema de Afiliados**
   - Vendedores podem gerar links de afiliado
   - Comissão por indicação
   - Dashboard de afiliados

## ⚠️ Importante

### Configuração Necessária
1. **Stripe Secret Key**
   - Configurar no Supabase: `STRIPE_SECRET_KEY`
   - Necessário para processamento de pagamentos

2. **Stripe Connect**
   - Ativar Stripe Connect no dashboard Stripe
   - Configurar redirect URLs
   - Testar com contas test

3. **Webhook Stripe** (Opcional)
   - Configurar webhook para eventos de pagamento
   - URL: `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/stripe-webhook`
   - Eventos: `payment_intent.succeeded`, `transfer.created`

## 🎉 Conclusão

Agora você tem um marketplace completo de ebooks com:
- ✅ Múltiplos vendedores
- ✅ Split automático de pagamentos
- ✅ Stripe Connect integrado
- ✅ Dashboard para vendedores
- ✅ Painel administrativo
- ✅ Sistema de saques
- ✅ Gestão de comissões

**Você pode começar a aceitar vendedores e escalar seu negócio!** 🚀
