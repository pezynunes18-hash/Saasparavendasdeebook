# 🧪 Cenários de Teste - Sistema Multi-Vendedor

## 📝 Teste 1: Fluxo Completo do Vendedor

### Passo 1: Cadastro
```
1. Acesse a home
2. Clique em "Vender Ebooks" no menu
3. Vá para aba "Cadastrar"
4. Preencha:
   - Nome Completo: Maria Silva
   - Nome do Negócio: Tech Books Store
   - Email: maria@techbooks.com
   - Senha: senha123456
5. Clique em "Cadastrar como Vendedor"

✅ Resultado esperado:
- Toast: "Cadastro realizado! Aguarde aprovação..."
- Redirecionado para Vendor Dashboard
- Status mostra "Pendente"
- Alerta amarelo: "Aguardando Aprovação"
```

### Passo 2: Aprovação pelo Admin
```
1. Abra nova aba
2. Faça login como admin (ou use usuário existente)
3. Clique em "Admin" no menu da home
4. Vá para aba "Pendentes (1)"
5. Veja Maria Silva na lista
6. Clique em "Aprovar"

✅ Resultado esperado:
- Toast: "Vendedor aprovado com sucesso"
- Maria some da lista de pendentes
- Maria aparece na aba "Aprovados"
```

### Passo 3: Conectar Stripe (Vendedor)
```
1. Volte para a aba da Maria
2. Veja alerta azul: "Conecte sua Conta Stripe"
3. Clique em "Conectar Stripe"
4. Nova aba abre com Stripe Connect
5. Preencha formulário Stripe (em teste, dados fictícios ok):
   - Business type: Individual
   - First name: Maria
   - Last name: Silva
   - Email: maria@techbooks.com
   - Phone: (use número válido)
   - Date of birth: 01/01/1990
   - Account number: 000123456789 (teste)
   - Routing number: 110000000 (teste)
6. Complete onboarding
7. Stripe redireciona de volta

✅ Resultado esperado:
- Alerta desaparece
- Badge "✓ Aprovado" aparece
- Pode adicionar ebooks
```

### Passo 4: Adicionar Ebook
```
1. No Vendor Dashboard
2. Clique em "Adicionar Ebook"
3. Preencha:
   - Título: JavaScript Moderno
   - Autor: Maria Silva
   - Categoria: Tecnologia
   - Descrição: Aprenda JavaScript ES6+ com exemplos práticos
   - Preço: 24.99
   - URL da Capa: https://picsum.photos/400/600
4. Clique "Adicionar Ebook"
5. Toast: "Ebook adicionado com sucesso"
6. Clique no botão de upload
7. Selecione arquivo PDF (qualquer PDF)
8. Aguarde upload

✅ Resultado esperado:
- Ebook aparece na tabela
- Status arquivo: "✓ Enviado"
- Estatísticas atualizadas: "Meus Ebooks: 1"
```

### Passo 5: Verificar na Loja
```
1. Vá para Home → Loja
2. Filtrar por "Tecnologia"
3. Veja "JavaScript Moderno" na lista
4. Clique no card

✅ Resultado esperado:
- Ebook visível para compradores
- Preço: $24.99
- Autor: Maria Silva
```

## 📝 Teste 2: Compra e Split de Pagamento

### Passo 1: Compra como Cliente
```
1. Na loja, adicione "JavaScript Moderno" ao carrinho
2. Clique no ícone do carrinho (canto superior)
3. Veja item no carrinho
4. Clique "Finalizar Compra"
5. Preencha cartão de teste:
   - Número: 4242 4242 4242 4242
   - Data: 12/25
   - CVC: 123
   - Nome: Test User
6. Clique "Processar Pagamento"

✅ Resultado esperado:
- Toast: "Compra realizada com sucesso!"
- Ebook disponível para download
- Carrinho esvaziado
```

### Passo 2: Verificar Vendedor
```
1. Volte para Vendor Dashboard (Maria)
2. Veja estatísticas atualizadas:
   - Total Vendas: 1
   - Receita Total: $24.99
   - Saldo Disponível: $22.49 (90% de $24.99)
3. Vá para aba "Histórico de Vendas"
4. Veja a venda:
   - Ebook: JavaScript Moderno
   - Valor Total: $24.99
   - Sua Receita: $22.49
   - Comissão: $2.50

✅ Resultado esperado:
- Vendedor recebeu 90%
- Plataforma recebeu 10%
- Saldo correto
```

### Passo 3: Verificar Admin
```
1. Vá para Admin Panel
2. Veja estatísticas de receita:
   - Receita Plataforma: $2.50
   - Receita Vendedores: $22.49
   - Receita Total: $24.99
   - Total de Vendas: 1

✅ Resultado esperado:
- Split correto (90/10)
- Métricas atualizadas
```

## 📝 Teste 3: Saque do Vendedor

### Passo 1: Solicitar Saque
```
1. No Vendor Dashboard (Maria)
2. Card "Saldo Disponível" mostra $22.49
3. Clique em "Solicitar Saque"
4. Digite valor: 20.00
5. Clique "Confirmar Saque"

✅ Resultado esperado:
- Toast: "Saque processado com sucesso!"
- Saldo atualizado: $2.49
- Histórico de Saques mostra:
  - Data: hoje
  - $20.00
  - Status: completed
```

### Passo 2: Verificar Stripe
```
1. Acesse Stripe Dashboard
2. Vá em "Connect" → "Accounts"
3. Encontre conta de Maria
4. Veja transfer de $20.00

✅ Resultado esperado:
- Transfer criado com sucesso
- Status: succeeded
- Dinheiro na conta de Maria
```

## 📝 Teste 4: Múltiplos Vendedores

### Cenário: 3 Vendedores, 5 Ebooks, 10 Vendas
```
Vendedor 1: Maria (Tech Books Store)
├── Ebook A: JavaScript Moderno ($24.99)
└── Ebook B: React Avançado ($29.99)

Vendedor 2: João (Business Academy)
├── Ebook C: Marketing Digital ($19.99)
└── Ebook D: Vendas Online ($34.99)

Vendedor 3: Ana (Creative Minds)
└── Ebook E: Design Thinking ($39.99)

Vendas:
1. Cliente 1 compra A + C + E = $84.97
2. Cliente 2 compra B + D = $64.98
3. Cliente 3 compra A = $24.99
4. Cliente 4 compra C + D + E = $94.97
5. Cliente 5 compra B = $29.99

Total de vendas: $299.90
```

### Cálculos Esperados:
```
Maria (A: $24.99 x 2, B: $29.99 x 2):
- Vendas: $109.96
- Receita (90%): $98.96
- Comissão (10%): $11.00

João (C: $19.99 x 2, D: $34.99 x 2):
- Vendas: $109.96
- Receita (90%): $98.96
- Comissão (10%): $11.00

Ana (E: $39.99 x 2):
- Vendas: $79.98
- Receita (90%): $71.98
- Comissão (10%): $8.00

Plataforma Total:
- Receita: $30.00 (10% de $299.90)
- Vendas: 10
- Vendedores Ativos: 3
```

## 📝 Teste 5: Casos de Erro

### Erro 1: Vendedor Não Aprovado Tenta Adicionar Ebook
```
1. Cadastre novo vendedor "Pedro"
2. NÃO aprove no admin
3. Tente adicionar ebook
4. Botão "Adicionar Ebook" está desabilitado

✅ Esperado: Bloqueio correto
```

### Erro 2: Saque sem Stripe Conectado
```
1. Aprove vendedor mas não conecte Stripe
2. Tente solicitar saque
3. Botão "Solicitar Saque" está desabilitado

✅ Esperado: Bloqueio correto
```

### Erro 3: Saque Maior que Saldo
```
1. Saldo: $10.00
2. Tente sacar: $20.00
3. Toast: "Saldo insuficiente"

✅ Esperado: Validação funciona
```

### Erro 4: Cartão Inválido
```
1. Tente comprar com cartão: 4000 0000 0000 0002
2. Erro: "Your card was declined"

✅ Esperado: Stripe rejeita corretamente
```

## 📝 Teste 6: Performance e Escala

### Cenário: 100 Ebooks, 1000 Vendas
```bash
# Use script para criar dados em massa

# Criar 10 vendedores
for i in {1..10}; do
  vendor_signup "vendedor${i}@test.com"
  approve_vendor "$vendor_id"
  connect_stripe "$vendor_id"
done

# Cada vendedor adiciona 10 ebooks
for vendor in vendors; do
  for j in {1..10}; do
    create_ebook "$vendor_id" "Ebook ${j}"
  done
done

# Simular 1000 vendas
for i in {1..1000}; do
  random_ebook=$(random_from_100)
  purchase "$random_ebook"
done

# Verificar:
✅ Dashboard carrega rápido
✅ Filtros funcionam
✅ Paginação necessária?
✅ Métricas corretas
```

## 🎯 Checklist Final

### Funcionalidades Core
- [ ] Cadastro de vendedor funciona
- [ ] Aprovação por admin funciona
- [ ] Stripe Connect integrado
- [ ] Vendedor pode adicionar ebooks
- [ ] Upload de arquivos funciona
- [ ] Ebooks aparecem na loja
- [ ] Compra e pagamento funcionam
- [ ] Split de pagamento correto (90/10)
- [ ] Saques processados corretamente
- [ ] Métricas de receita corretas

### UI/UX
- [ ] Alerta de status claro
- [ ] Botões desabilitados quando necessário
- [ ] Toasts informativos
- [ ] Loading states
- [ ] Mensagens de erro claras
- [ ] Responsivo mobile

### Segurança
- [ ] Autenticação funciona
- [ ] Rotas protegidas
- [ ] Vendedor só vê seus ebooks
- [ ] Admin vê tudo
- [ ] Validações de backend
- [ ] Stripe keys seguras

### Stripe
- [ ] Connect configurado
- [ ] Onboarding funciona
- [ ] Pagamentos processados
- [ ] Splits corretos
- [ ] Transfers funcionam
- [ ] Webhooks (opcional)

## 🚀 Pronto para Produção?

Se todos os testes passaram:
- ✅ Altere para keys de produção
- ✅ Teste com valores reais pequenos
- ✅ Configure monitoramento
- ✅ Ative webhooks Stripe
- ✅ Prepare suporte ao vendedor
- ✅ Lance gradualmente

## 🎉 Conclusão

Parabéns! Seu marketplace multi-vendedor está funcionando perfeitamente com:
- Stripe Connect integrado
- Split automático de pagamentos
- Sistema de saques
- Dashboard completo
- Painel administrativo

**Está pronto para escalar!** 🚀
