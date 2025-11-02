# ❓ FAQ - Perguntas Frequentes sobre Stripe

## 🤔 Tenho que configurar a chave de cada vendedor manualmente?

**NÃO!** Absolutamente não!

Você configura **UMA VEZ SÓ** a chave da **SUA CONTA** (da plataforma).

Depois disso:
- ✅ Cada vendedor clica em "Conectar Stripe"
- ✅ O Stripe Connect cria a conta dele automaticamente
- ✅ Tudo funciona sozinho!

---

## 🔑 Qual chave eu configuro no Supabase?

A chave **DA SUA CONTA STRIPE** (a conta da plataforma).

Esta chave permite que o sistema use **Stripe Connect** para:
- Criar contas para vendedores automaticamente
- Processar pagamentos
- Fazer split automático (90% vendedor, 10% plataforma)

---

## 👤 Como os vendedores recebem?

1. **Você configura** (uma vez só): Sua chave no Supabase
2. **Vendedor clica**: "Conectar Stripe" no painel dele
3. **Stripe Connect**: Cria conta para o vendedor automaticamente
4. **Pronto**: Vendedor recebe 90% direto na conta dele!

Você **NÃO gerencia** as chaves dos vendedores. Tudo é automático!

---

## 🏪 Diferença entre chave da plataforma e do vendedor?

### Chave da Plataforma (você configura):
- É a **sua conta Stripe**
- Configurada **uma vez** no Supabase
- Permite o sistema funcionar com Stripe Connect
- Você recebe 10% de comissão automaticamente

### Chave do Vendedor (automático):
- É a **conta dele no Stripe**
- Criada **automaticamente** via Stripe Connect
- Você **NÃO precisa configurar**
- Vendedor recebe 90% automaticamente

---

## 🎯 Resumo Visual

```
[VOCÊ - ADMINISTRADOR]
     ↓
Configura SUA chave no Supabase (1x)
     ↓
Sistema fica pronto
     ↓
[VENDEDOR 1] clica "Conectar" → Conta criada automaticamente
[VENDEDOR 2] clica "Conectar" → Conta criada automaticamente  
[VENDEDOR 3] clica "Conectar" → Conta criada automaticamente
     ↓
TODOS recebem pagamentos automaticamente!
```

**Você só configura UMA VEZ. Resto é automático!**

---

## ⚙️ Como configurar agora?

1. Clique em **"⚙️ Configurar Stripe"** no menu do app
2. Siga o guia passo-a-passo
3. Pronto! Vendedores podem conectar!

ou leia: [COMO_CONFIGURAR_STRIPE.md](./COMO_CONFIGURAR_STRIPE.md)

---

## 🆘 Ainda confuso?

**Pense assim:**
- Netflix configura o sistema de pagamento DELES (uma vez)
- Você se cadastra e conecta SEU cartão automaticamente
- Você NÃO envia seu número de cartão para a Netflix manualmente

**No seu caso:**
- Você (plataforma) configura o Stripe DELA (uma vez)
- Vendedores se cadastram e conectam automaticamente
- Vendedores NÃO enviam chaves para você manualmente

✅ **É tudo automático via Stripe Connect!**
