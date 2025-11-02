import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ShoppingCart, Download, User, Home as HomeIcon, Plus, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Cart } from './Cart';

interface StoreProps {
  accessToken: string | null;
  onLogout: () => void;
  onShowAuth: () => void;
  onNavigateHome: () => void;
}

interface Ebook {
  id: string;
  title: string;
  description: string;
  price: number;
  coverUrl: string;
  author: string;
  category?: string;
}

// Stripe publishable key
const stripePromise = loadStripe(
  'pk_test_51SOuAg2KwVnNEfrVwvjLL34TtSaiQrJ2i9HhWqQyeKIpAhynijkCHWKpPpiMflJbyaTTn0edTlQO2ewQ2gLtyhzq00iuxba1u0'
);

function CheckoutForm({ 
  ebooks, 
  accessToken, 
  onSuccess 
}: { 
  ebooks: Ebook[]; 
  accessToken: string; 
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const totalPrice = ebooks.reduce((sum, ebook) => sum + ebook.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;
    if (ebooks.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    setIsProcessing(true);

    try {
      const { projectId } = await import('../utils/supabase/info');

      // Process each ebook purchase
      for (const ebook of ebooks) {
        // Create payment intent
        const intentResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/create-payment-intent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ ebookId: ebook.id })
          }
        );

        const intentData = await intentResponse.json();

        if (!intentResponse.ok) {
          console.error('Payment intent error:', intentData);
          console.error('Response status:', intentResponse.status);
          const errorMessage = intentData.error || 'Failed to create payment intent';
          const errorDetails = intentData.details || '';
          throw new Error(`${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`);
        }

        const { clientSecret } = intentData;

        if (!clientSecret) {
          console.error('No client secret in response:', intentData);
          throw new Error('Failed to get payment client secret');
        }

        // Confirm payment
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) throw new Error('Card element not found');

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        // Confirm purchase on backend
        const confirmResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/confirm-purchase`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              ebookId: ebook.id,
              paymentIntentId: paymentIntent.id
            })
          }
        );

        if (!confirmResponse.ok) {
          throw new Error('Failed to confirm purchase');
        }
      }

      toast.success(`${ebooks.length} ebook(s) comprado(s) com sucesso!`);
      onSuccess();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Items no Carrinho</Label>
        <div className="max-h-40 overflow-y-auto space-y-2 p-2 border rounded">
          {ebooks.map((ebook) => (
            <div key={ebook.id} className="flex justify-between text-sm">
              <span className="truncate">{ebook.title}</span>
              <span>${ebook.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span>Total</span>
          <span className="text-lg">${totalPrice.toFixed(2)}</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Card Details</Label>
        <div className="border rounded-md p-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        Test card: 4242 4242 4242 4242, any future date, any CVC
      </div>
      <Button type="submit" className="w-full" disabled={!stripe || isProcessing}>
        {isProcessing ? 'Processando...' : `Pagar $${totalPrice.toFixed(2)}`}
      </Button>
    </form>
  );
}

const categories = ['Todos', 'Ficção', 'Negócios', 'Tecnologia', 'Desenvolvimento Pessoal', 'Ciências', 'Arte e Design'];

export function Store({ accessToken, onLogout, onShowAuth, onNavigateHome }: StoreProps) {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [purchases, setPurchases] = useState<Ebook[]>([]);
  const [cart, setCart] = useState<Ebook[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEbooks();
    if (accessToken) {
      loadPurchases();
    }
  }, [accessToken]);

  const loadEbooks = async () => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/ebooks`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setEbooks(data.ebooks);
      }
    } catch (error) {
      console.error('Failed to load ebooks:', error);
    }
  };

  const loadPurchases = async () => {
    if (!accessToken) return;

    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/my-purchases`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setPurchases(data.purchases);
      }
    } catch (error) {
      console.error('Failed to load purchases:', error);
    }
  };

  const handleAddToCart = (ebook: Ebook) => {
    if (!accessToken) {
      toast.error('Por favor, faça login para comprar');
      onShowAuth();
      return;
    }

    if (isPurchased(ebook.id)) {
      toast.info('Você já possui este ebook');
      return;
    }

    if (cart.some(item => item.id === ebook.id)) {
      toast.info('Este ebook já está no carrinho');
      return;
    }

    setCart([...cart, ebook]);
    toast.success('Adicionado ao carrinho');
  };

  const handleRemoveFromCart = (ebookId: string) => {
    setCart(cart.filter(item => item.id !== ebookId));
    toast.success('Removido do carrinho');
  };

  const handleClearCart = () => {
    setCart([]);
    toast.success('Carrinho limpo');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleDownload = async (ebookId: string) => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/download/${ebookId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get download URL');
      }

      window.open(data.downloadUrl, '_blank');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download');
    }
  };

  const isPurchased = (ebookId: string) => {
    return purchases.some(p => p.id === ebookId);
  };

  const isInCart = (ebookId: string) => {
    return cart.some(item => item.id === ebookId);
  };

  const filteredEbooks = ebooks.filter((ebook) => {
    const matchesCategory = selectedCategory === 'Todos' || ebook.category === selectedCategory;
    const matchesSearch = ebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ebook.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ebook.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onNavigateHome}>
                <HomeIcon className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                <h1>Loja de Ebooks</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {accessToken && (
                <Cart
                  items={cart}
                  onRemove={handleRemoveFromCart}
                  onCheckout={handleCheckout}
                  onClear={handleClearCart}
                />
              )}
              {accessToken ? (
                <Button variant="outline" onClick={onLogout}>
                  Sair
                </Button>
              ) : (
                <Button variant="outline" onClick={onShowAuth}>
                  <User className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {accessToken && (
          <Tabs defaultValue="browse" className="mb-8">
            <TabsList>
              <TabsTrigger value="browse">Navegar Ebooks</TabsTrigger>
              <TabsTrigger value="library">Minha Biblioteca</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="mt-6">
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <Input
                  placeholder="Buscar por título, autor ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEbooks.map((ebook) => (
                  <Card key={ebook.id} className="flex flex-col">
                    <CardHeader className="p-0">
                      <img
                        src={ebook.coverUrl}
                        alt={ebook.title}
                        className="w-full h-64 object-cover rounded-t-lg"
                      />
                    </CardHeader>
                    <CardContent className="flex-1 pt-4">
                      {ebook.category && (
                        <Badge variant="secondary" className="mb-2">{ebook.category}</Badge>
                      )}
                      <CardTitle className="line-clamp-2">{ebook.title}</CardTitle>
                      <CardDescription className="mt-2">
                        by {ebook.author}
                      </CardDescription>
                      <p className="mt-2 text-sm line-clamp-3">{ebook.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                      <span className="text-lg">${ebook.price.toFixed(2)}</span>
                      {isPurchased(ebook.id) ? (
                        <Button variant="secondary" disabled>
                          <Check className="h-4 w-4 mr-2" />
                          Comprado
                        </Button>
                      ) : isInCart(ebook.id) ? (
                        <Button variant="outline" disabled>
                          No Carrinho
                        </Button>
                      ) : (
                        <Button onClick={() => handleAddToCart(ebook)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {filteredEbooks.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum ebook encontrado.
                </div>
              )}
            </TabsContent>

            <TabsContent value="library" className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {purchases.map((ebook) => (
                  <Card key={ebook.id} className="flex flex-col">
                    <CardHeader className="p-0">
                      <img
                        src={ebook.coverUrl}
                        alt={ebook.title}
                        className="w-full h-64 object-cover rounded-t-lg"
                      />
                    </CardHeader>
                    <CardContent className="flex-1 pt-4">
                      <CardTitle className="line-clamp-2">{ebook.title}</CardTitle>
                      <CardDescription className="mt-2">
                        by {ebook.author}
                      </CardDescription>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={() => handleDownload(ebook.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {purchases.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Você ainda não comprou nenhum ebook.
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!accessToken && (
          <>
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <Input
                placeholder="Buscar por título, autor ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEbooks.map((ebook) => (
                <Card key={ebook.id} className="flex flex-col">
                  <CardHeader className="p-0">
                    <img
                      src={ebook.coverUrl}
                      alt={ebook.title}
                      className="w-full h-64 object-cover rounded-t-lg"
                    />
                  </CardHeader>
                  <CardContent className="flex-1 pt-4">
                    {ebook.category && (
                      <Badge variant="secondary" className="mb-2">{ebook.category}</Badge>
                    )}
                    <CardTitle className="line-clamp-2">{ebook.title}</CardTitle>
                    <CardDescription className="mt-2">
                      by {ebook.author}
                    </CardDescription>
                    <p className="mt-2 text-sm line-clamp-3">{ebook.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <span className="text-lg">${ebook.price.toFixed(2)}</span>
                    <Button onClick={() => handleAddToCart(ebook)}>
                      Comprar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Compra</DialogTitle>
            <DialogDescription>
              Complete seu pagamento para acessar os ebooks
            </DialogDescription>
          </DialogHeader>
          {cart.length > 0 && accessToken && (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                ebooks={cart}
                accessToken={accessToken}
                onSuccess={() => {
                  setIsCheckoutOpen(false);
                  setCart([]);
                  loadPurchases();
                  loadEbooks();
                }}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
