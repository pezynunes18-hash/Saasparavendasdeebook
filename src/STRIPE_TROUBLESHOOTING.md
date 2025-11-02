# Troubleshooting - Conexão Stripe para Vendedores

## Problema: Vendedores não conseguem conectar conta Stripe

### Possíveis Causas e Soluções

#### 1. Stripe não configurado no servidor
**Sintomas:**
- Botão "Conectar Stripe" desabilitado
- Mensagem: "⚠️ Stripe não configurado no servidor"

**Solução:**
Configure a variável de ambiente `STRIPE_SECRET_KEY` no Supabase:

1. Acesse o Dashboard do Supabase
2. Vá em **Project Settings** → **Edge Functions**
3. Adicione a variável de ambiente:
   - Nome: `STRIPE_SECRET_KEY`
   - Valor: Sua chave secreta do Stripe (começa com `sk_test_` ou `sk_live_`)
4. Reinicie as Edge Functions

**Como obter a chave do Stripe:**
1. Acesse https://dashboard.stripe.com/apikeys
2. Copie a "Secret key"
3. Para testes, use a chave de teste (sk_test_...)
4. Para produção, use a chave real (sk_live_...)

#### 2. Vendedor não aprovado
**Sintomas:**
- Erro: "Vendedor ainda não aprovado"

**Solução:**
1. Faça login como administrador (pezynn@gmail.com)
2. Acesse o Painel Admin
3. Aprove o vendedor na aba "Pendentes"

#### 3. Erro ao criar conta Stripe Connect
**Sintomas:**
- Erro retornado ao clicar em "Conectar Stripe"
- Console mostra erro do Stripe

**Solução:**
Verifique se:
- A chave do Stripe está correta
- A conta Stripe tem Stripe Connect habilitado
- O email do vendedor é válido

#### 4. Popup bloqueado
**Sintomas:**
- Nada acontece ao clicar no botão
- Navegador bloqueou popup

**Solução:**
- Permita popups para o site
- Ou clique com botão direito → "Abrir em nova aba"

### Verificação de Status

Para verificar se o Stripe está configurado:

```bash
# Teste a rota de status
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-b50138d4/stripe-status
```

Resposta esperada quando configurado:
```json
{
  "configured": true,
  "keyPrefix": "sk_test",
  "message": "Stripe is configured"
}
```

### Logs de Debug

O sistema agora inclui logs detalhados. Para debugar:

1. Abra o Console do navegador (F12)
2. Clique em "Conectar Stripe"
3. Observe os logs:
   - "Requesting Stripe onboarding..."
   - "Stripe onboarding response: {...}"

No servidor (Supabase Logs):
- "=== Stripe Onboarding Request ==="
- "User ID: ..."
- "Vendor status: approved"
- "Stripe account created: acct_..."

### Fluxo Completo de Conexão Stripe

1. **Vendedor se cadastra** → Status: pending
2. **Admin aprova** → Status: approved
3. **Vendedor clica "Conectar Stripe"**
   - Sistema cria conta Stripe Connect
   - Abre página de onboarding do Stripe
4. **Vendedor preenche dados no Stripe**
   - Informações pessoais/empresariais
   - Dados bancários
5. **Stripe redireciona de volta** → stripeAccountId salvo
6. **Vendedor pode receber pagamentos** 💰

### Testando a Integração

1. Crie um vendedor de teste
2. Aprove o vendedor como admin
3. Conecte conta Stripe (use dados de teste)
4. Adicione um ebook
5. Faça uma compra usando cartão de teste: `4242 4242 4242 4242`
6. Verifique se o split foi feito (90% vendedor, 10% plataforma)

### Cartões de Teste Stripe

- **Sucesso:** 4242 4242 4242 4242
- **Requer autenticação:** 4000 0025 0000 3155
- **Recusado:** 4000 0000 0000 9995

Data: qualquer data futura
CVC: qualquer 3 dígitos
CEP: qualquer 5 dígitos

### Suporte

Se o problema persistir:
1. Verifique os logs do Supabase Functions
2. Verifique o Dashboard do Stripe para erros
3. Confirme que a chave STRIPE_SECRET_KEY está configurada
4. Teste com outro vendedor/navegador

## Configuração Recomendada

### Desenvolvimento
```env
STRIPE_SECRET_KEY=sk_test_...
```

### Produção
```env
STRIPE_SECRET_KEY=sk_live_...
```

**IMPORTANTE:** Nunca compartilhe suas chaves secretas ou faça commit delas no Git!
