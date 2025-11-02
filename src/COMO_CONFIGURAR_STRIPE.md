# 🔧 Como Configurar o Stripe (URGENTE!)

## ⚠️ Você está vendo essa mensagem porque o Stripe não está configurado

## 🎯 IMPORTANTE: Entenda o que você vai fazer

Esta configuração é para **VOCÊ (administrador da plataforma)**. 
Você vai configurar **SUA chave do Stripe** (da plataforma) apenas UMA VEZ.

**Você NÃO precisa configurar a chave de cada vendedor!**
- Após esta configuração, cada vendedor clica em "Conectar Stripe"
- O Stripe Connect cria a conta do vendedor automaticamente
- Tudo funciona sozinho!

---

Siga estes passos simples:

## Passo 1: Obter Chave do Stripe

1. **Acesse:** https://dashboard.stripe.com/test/apikeys
   - Se não tiver conta, crie em: https://dashboard.stripe.com/register

2. **Copie a "Secret key"** (a que começa com `sk_test_...`)
   - ⚠️ NÃO copie a "Publishable key"!
   - ⚠️ Use a chave de TESTE (sk_test_) para desenvolvimento

## Passo 2: Configurar no Supabase

1. **Abra:** https://supabase.com/dashboard/project/alhoevnjscrvjxjiekle/settings/functions

2. **Role até "Environment variables"**

3. **Clique em "Add new secret"**

4. **Preencha:**
   - **Nome:** `STRIPE_SECRET_KEY`
   - **Valor:** Cole sua chave (sk_test_...)

5. **Clique em "Apply"**

6. **Aguarde 15-20 segundos** para as funções reiniciarem

## Passo 3: Teste

1. Recarregue a página do painel do vendedor
2. A mensagem de erro deve desaparecer
3. O botão "Conectar Stripe" deve estar habilitado

---

## ✅ Pronto!

Agora os vendedores poderão:
- Conectar suas **próprias** contas Stripe (você não faz nada!)
- Receber pagamentos automaticamente
- Fazer saques (90% do valor das vendas)

**Você configurou a plataforma, não precisa configurar cada vendedor!**

---

## 🆘 Problemas?

### Ainda mostra "Stripe não configurado"?
- Aguarde mais 20 segundos
- Recarregue a página (F5)
- Verifique se o nome está EXATAMENTE: `STRIPE_SECRET_KEY`

### Não tenho conta Stripe?
- Crie gratuitamente: https://dashboard.stripe.com/register
- É rápido (2 minutos)
- Não precisa de cartão de crédito para testar

### Não encontro a chave?
- Vá em: https://dashboard.stripe.com/test/apikeys
- Procure por "Secret key"
- Clique em "Reveal test key"
- Copie o valor (começa com sk_test_)

---

## 🎯 Atalho Rápido

**Na interface do app:**
Clique em **"⚙️ Configurar Stripe"** no menu superior para ver o guia passo-a-passo interativo!

---

## 📝 Resumo Rápido

```
1. Pegar chave: https://dashboard.stripe.com/test/apikeys
2. Configurar: https://supabase.com/dashboard/project/alhoevnjscrvjxjiekle/settings/functions
3. Nome: STRIPE_SECRET_KEY
4. Valor: sk_test_...
5. Salvar e aguardar 20 segundos
6. Recarregar página
```

**Isso é tudo!** 🎉
