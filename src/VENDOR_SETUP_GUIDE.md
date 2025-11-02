# 🚀 Guia Rápido: Setup do Sistema Multi-Vendedor

## ✅ Checklist de Configuração

### 1. Configurar Stripe Connect
```bash
# 1. Acesse o Dashboard Stripe: https://dashboard.stripe.com
# 2. Vá em "Connect" no menu lateral
# 3. Clique em "Get Started"
# 4. Configure as URLs de redirect:
#    - Refresh URL: https://seu-dominio.com/vendor-dashboard
#    - Return URL: https://seu-dominio.com/vendor-dashboard
```

### 2. Ativar Stripe Connect no Backend
O código já está pronto! Apenas certifique-se que:
- ✅ `STRIPE_SECRET_KEY` está configurada no Supabase
- ✅ A chave começa com `sk_test_` (teste) ou `sk_live_` (produção)

### 3. Testar o Fluxo

#### Como Vendedor:
```bash
1. Abra a home
2. Clique em "Vender Ebooks"
3. Cadastre-se com:
   - Nome: João Silva
   - Negócio: Editora Silva
   - Email: vendedor@test.com
   - Senha: senha123

4. Aguarde aprovação (ou use Admin)
```

#### Como Admin:
```bash
1. Faça login como admin
2. Clique em "Admin" no menu
3. Vá para aba "Pendentes"
4. Aprove o vendedor clicando em "Aprovar"
```

#### Conectar Stripe:
```bash
1. Após aprovação, vendedor vê alerta
2. Clique em "Conectar Stripe"
3. Nova aba abre com onboarding Stripe
4. Preencha dados (em teste, pode usar dados fictícios)
5. Complete o onboarding
6. Volte para dashboard
```

#### Adicionar Ebook:
```bash
1. No Vendor Dashboard
2. Clique em "Adicionar Ebook"
3. Preencha:
   - Título: "Guia de React"
   - Autor: "João Silva"
   - Categoria: "Tecnologia"
   - Descrição: "Aprenda React do zero"
   - Preço: 19.99
   - URL da Capa: (qualquer imagem)
4. Upload arquivo PDF/EPUB
5. Ebook aparece na loja!
```

#### Fazer uma Venda:
```bash
1. Como comprador, vá para Loja
2. Adicione ebook ao carrinho
3. Clique no carrinho (ícone canto superior direito)
4. Clique "Finalizar Compra"
5. Use cartão de teste Stripe:
   - Número: 4242 4242 4242 4242
   - Data: qualquer futura
   - CVC: qualquer 3 dígitos
6. Confirme pagamento
```

#### Ver Resultado:
```bash
# Vendedor vê:
- Saldo aumenta com 90% da venda
- Nova venda no histórico
- Pode solicitar saque

# Admin vê:
- Receita da plataforma aumenta 10%
- Total de vendas incrementa
```

## 🧪 Teste Completo do Sistema

### Cenário: Primeiro Vendedor
```typescript
// 1. Cadastro
POST /vendor-signup
{
  "email": "vendedor1@test.com",
  "password": "senha123",
  "name": "Maria Santos",
  "businessName": "Digital Books Co"
}
// ✅ Status: pending

// 2. Admin aprova
POST /admin/approve-vendor
{
  "vendorId": "maria-uuid",
  "status": "approved"
}
// ✅ Status: approved

// 3. Vendedor conecta Stripe
POST /vendor-onboarding
// ✅ Retorna URL do Stripe
// ✅ Vendedor completa onboarding
// ✅ stripeAccountId salvo

// 4. Vendedor adiciona ebook
POST /ebooks
{
  "title": "Marketing Digital 2025",
  "price": 29.99,
  "author": "Maria Santos",
  "category": "Negócios"
}
// ✅ Ebook criado e vinculado a Maria

// 5. Cliente compra
POST /create-payment-intent { "ebookId": "ebook-uuid" }
// ✅ Payment Intent com split:
//    - $26.99 → Maria (90%)
//    - $3.00 → Plataforma (10%)

// 6. Maria solicita saque
POST /vendor-withdrawal { "amount": 26.99 }
// ✅ Transfer criado para conta Stripe de Maria
// ✅ Saldo zerado
```

## 🎯 Fluxos de Uso

### Fluxo 1: Novo Vendedor
```
Home → "Vender Ebooks" → Cadastro → Login → 
Aguardar Aprovação → Conectar Stripe → Adicionar Ebook → 
Upload Arquivo → Ebook na Loja → Primeira Venda → 
Ver Saldo → Solicitar Saque → Dinheiro na Conta
```

### Fluxo 2: Admin Gerencia
```
Login → Admin → Pendentes → Aprovar Vendedor →
Ver Estatísticas → Ver Receita Plataforma →
Aprovar mais vendedores → Dashboard Analytics
```

### Fluxo 3: Cliente Compra
```
Home → Loja → Filtrar por Categoria → 
Adicionar ao Carrinho → Mais Ebooks → 
Finalizar Compra → Pagar → Download Ebooks
```

## 💡 Dicas e Boas Práticas

### Para Vendedores
1. **Complete o perfil Stripe**
   - Preencha todos os dados corretamente
   - Use documentos válidos (em produção)
   - Verifique conta bancária

2. **Ebooks de qualidade**
   - Use capas profissionais
   - Descrições detalhadas
   - Categorize corretamente
   - Faça upload de arquivos completos

3. **Gerencie suas vendas**
   - Monitore estatísticas diariamente
   - Responda dúvidas de clientes
   - Atualize ebooks quando necessário

### Para Admins
1. **Aprove vendedores rapidamente**
   - Verifique informações básicas
   - Rejeite perfis suspeitos
   - Comunique-se com vendedores

2. **Monitore a plataforma**
   - Acompanhe métricas diariamente
   - Identifique vendedores top
   - Ofereça suporte quando necessário

## ⚙️ Configurações Avançadas

### Alterar Comissão
```typescript
// No backend: index.tsx
// Linha ~73
vendor.commission = 15; // Altere de 10 para 15%
```

### Adicionar Categorias
```typescript
// Em VendorDashboard.tsx e Dashboard.tsx
const categories = [
  'Ficção',
  'Negócios',
  'Tecnologia',
  'Sua Nova Categoria' // Adicione aqui
];
```

### Customizar Status de Aprovação
```typescript
// Backend: adicione status extras
status: 'pending' | 'approved' | 'rejected' | 'suspended'
```

## 🐛 Troubleshooting

### Erro: "Stripe not configured"
```bash
✅ Solução:
1. Verifique se STRIPE_SECRET_KEY está no Supabase
2. Chave deve começar com sk_test_ ou sk_live_
3. Reinicie o servidor Deno
```

### Erro: "Failed to create payment intent"
```bash
✅ Solução:
1. Verifique logs no dashboard Stripe
2. Confirme que Connect está ativado
3. Teste com vendedor sem Stripe conectado primeiro
```

### Vendedor não consegue conectar Stripe
```bash
✅ Solução:
1. Status precisa ser 'approved'
2. Verifique redirect URLs no Stripe
3. Tente gerar novo link de onboarding
```

### Saque falha
```bash
✅ Solução:
1. Vendedor tem Stripe conectado?
2. Saldo suficiente?
3. Conta Stripe ativada e verificada?
4. Veja logs do transfer no Stripe
```

## 📊 Métricas Importantes

### Acompanhe:
- **Taxa de Aprovação**: % vendedores aprovados
- **Taxa de Conexão Stripe**: % aprovados que conectaram
- **Tempo Médio de Aprovação**: dias até aprovar
- **Vendedores Ativos**: com pelo menos 1 ebook
- **Ticket Médio**: valor médio por venda
- **Taxa de Saque**: frequência de saques

## 🎉 Pronto para Produção

Antes de lançar:
- ✅ Altere chaves Stripe para produção
- ✅ Configure domínio real
- ✅ Teste todos os fluxos
- ✅ Configure emails de notificação
- ✅ Prepare termos de uso para vendedores
- ✅ Configure taxa de comissão final
- ✅ Teste saques reais
- ✅ Configure webhook Stripe

## 🚀 Go Live!

```bash
# Sua plataforma está pronta!
# - Vendedores podem se cadastrar
# - Admin pode aprovar
# - Pagamentos são divididos automaticamente
# - Saques funcionam
# - Compradores podem comprar

# Boa sorte com seu marketplace! 🎊
```
