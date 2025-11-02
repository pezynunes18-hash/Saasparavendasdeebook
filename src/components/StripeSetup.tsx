import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ExternalLink, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function StripeSetup() {
  const [stripeKey, setStripeKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [step, setStep] = useState<'intro' | 'getkey' | 'configure'>('intro');

  const projectId = 'alhoevnjscrvjxjiekle';
  const supabaseUrl = `https://supabase.com/dashboard/project/${projectId}/settings/functions`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              Configuração da Plataforma (Uma Vez Só)
            </CardTitle>
            <CardDescription>
              Configure SUA chave do Stripe (da plataforma) para permitir que vendedores
              conectem SUAS PRÓPRIAS contas automaticamente via Stripe Connect.
              <br /><br />
              <strong>⚠️ Você NÃO precisa configurar a chave de cada vendedor manualmente!</strong>
              <br />
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 mt-2"
                onClick={() => window.open('/FAQ_STRIPE.md', '_blank')}
              >
                ❓ Confuso? Leia o FAQ
              </Button>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Step 1: Intro */}
        {step === 'intro' && (
          <Card>
            <CardHeader>
              <CardTitle>Passo 1: Entenda o Processo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200 mb-4">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">Como Funciona:</AlertTitle>
                <AlertDescription className="text-blue-800">
                  <ol className="list-decimal ml-4 mt-2 space-y-2">
                    <li><strong>Você configura:</strong> Sua chave da plataforma (esta configuração)</li>
                    <li><strong>Vendedor clica:</strong> "Conectar Stripe" no painel dele</li>
                    <li><strong>Stripe cria:</strong> Conta automática para o vendedor</li>
                    <li><strong>Resultado:</strong> Vendedor recebe 90%, você 10%, tudo automático!</li>
                  </ol>
                </AlertDescription>
              </Alert>
              
              <p>
                O sistema usa <strong>Stripe Connect</strong> para processar pagamentos com split automático:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>90%</strong> vai para o vendedor do ebook</li>
                <li><strong>10%</strong> fica com a plataforma (você)</li>
                <li>Pagamentos automáticos via Stripe</li>
                <li>Cada vendedor gerencia sua própria conta</li>
              </ul>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Você vai precisar de:</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal ml-4 mt-2 space-y-1">
                    <li>Uma conta Stripe <strong>SUA</strong> (da plataforma) - gratuita</li>
                    <li>Sua chave secreta da API (Secret Key)</li>
                    <li>Acesso ao Dashboard do Supabase</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 pt-4">
                <Button onClick={() => setStep('getkey')} className="flex-1">
                  Continuar →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Get Stripe Key */}
        {step === 'getkey' && (
          <Card>
            <CardHeader>
              <CardTitle>Passo 2: Obter Chave do Stripe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">2.1. Crie uma conta Stripe DA PLATAFORMA (se não tiver)</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Esta é a SUA conta, não dos vendedores. Vendedores conectam depois automaticamente.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://dashboard.stripe.com/register', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Criar Minha Conta Stripe
                  </Button>
                </div>

                <div>
                  <h3 className="font-medium mb-2">2.2. Acesse a página de API Keys DA SUA CONTA</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Esta chave permite que o sistema gerencie contas conectadas dos vendedores.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://dashboard.stripe.com/test/apikeys', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Minhas API Keys
                  </Button>
                </div>

                <div>
                  <h3 className="font-medium mb-2">2.3. Copie a "Secret key"</h3>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Para testes:</strong> Use a chave que começa com <code className="bg-gray-100 px-2 py-1 rounded">sk_test_...</code>
                      <br />
                      <strong>Para produção:</strong> Use <code className="bg-gray-100 px-2 py-1 rounded">sk_live_...</code> (ative sua conta primeiro)
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe-key">Cole SUA Secret Key (da plataforma) aqui:</Label>
                  <p className="text-xs text-muted-foreground">
                    Não é a chave dos vendedores! Eles conectam depois automaticamente.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="stripe-key"
                      type={showKey ? 'text' : 'password'}
                      value={stripeKey}
                      onChange={(e) => setStripeKey(e.target.value)}
                      placeholder="sk_test_..."
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>
                </div>

                {stripeKey && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Chave detectada! Tipo: {stripeKey.startsWith('sk_test_') ? 'TESTE' : stripeKey.startsWith('sk_live_') ? 'PRODUÇÃO' : 'INVÁLIDA'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('intro')}>
                  ← Voltar
                </Button>
                <Button 
                  onClick={() => setStep('configure')} 
                  disabled={!stripeKey || !stripeKey.startsWith('sk_')}
                  className="flex-1"
                >
                  Próximo: Configurar →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Configure in Supabase */}
        {step === 'configure' && (
          <Card>
            <CardHeader>
              <CardTitle>Passo 3: Configurar no Supabase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Agora você precisa adicionar essa chave como variável de ambiente no Supabase Edge Functions.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">3.1. Abra as configurações do Supabase</h3>
                  <Button 
                    onClick={() => window.open(supabaseUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Edge Functions Settings
                  </Button>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">3.2. Adicione a variável de ambiente:</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <Label>Nome da Variável:</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-white px-3 py-2 rounded border flex-1">
                          STRIPE_SECRET_KEY
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard('STRIPE_SECRET_KEY')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>Valor:</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-white px-3 py-2 rounded border flex-1 font-mono text-sm overflow-x-auto">
                          {showKey ? stripeKey : '••••••••••••••••••••••••'}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowKey(!showKey)}
                        >
                          {showKey ? 'Ocultar' : 'Mostrar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(stripeKey)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">3.3. No Supabase Dashboard:</h3>
                  <ol className="list-decimal ml-6 space-y-2 text-sm">
                    <li>Role até a seção <strong>"Environment variables"</strong></li>
                    <li>Clique em <strong>"Add new secret"</strong></li>
                    <li>Cole o nome: <code className="bg-gray-100 px-1">STRIPE_SECRET_KEY</code></li>
                    <li>Cole o valor: sua chave secreta</li>
                    <li>Clique em <strong>"Apply"</strong></li>
                    <li>As Edge Functions serão reiniciadas automaticamente</li>
                  </ol>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Importante:</strong> Após salvar, aguarde 10-20 segundos para as functions reiniciarem.
                    Depois recarregue a página do painel do vendedor.
                    <br /><br />
                    <strong>✅ Resultado:</strong> O botão "Conectar Stripe" ficará habilitado e cada vendedor
                    poderá conectar sua própria conta Stripe automaticamente (você não precisa fazer mais nada!).
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('getkey')}>
                  ← Voltar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    toast.success('Configuração concluída! Recarregue a página do vendedor.');
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Concluir
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Video Tutorial Option */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Precisa de ajuda visual?</h3>
                <p className="text-sm text-muted-foreground">
                  Tutorial em vídeo no YouTube
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => window.open('https://www.youtube.com/results?search_query=stripe+api+key+setup', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Tutorial
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Problemas Comuns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">🔴 Ainda aparece "Stripe não configurado"</h4>
              <p className="text-sm text-muted-foreground">
                → Aguarde 20 segundos após salvar no Supabase<br />
                → Recarregue a página do vendedor (F5)<br />
                → Verifique se o nome está correto: STRIPE_SECRET_KEY
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-1">🔴 Erro ao conectar com Stripe</h4>
              <p className="text-sm text-muted-foreground">
                → Verifique se a chave está correta<br />
                → Para testes, use sk_test_...<br />
                → Verifique os logs no Supabase
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-1">🔴 Vendedor não consegue conectar</h4>
              <p className="text-sm text-muted-foreground">
                → Certifique-se que o vendedor foi aprovado primeiro<br />
                → Vá no Painel Admin e aprove o vendedor<br />
                → Depois ele poderá conectar sua conta Stripe
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
