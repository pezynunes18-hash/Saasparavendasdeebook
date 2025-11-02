import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { BookOpen, Star, Users, ShoppingCart, ArrowRight, User, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

interface HomeProps {
  onNavigate: (view: 'store' | 'auth' | 'vendor-auth' | 'vendor-dashboard' | 'admin') => void;
  accessToken: string | null;
  onLogout: () => void;
  onShowAuth: () => void;
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

const categories = [
  { name: 'Ficção', icon: '📚', color: 'bg-blue-100 text-blue-800' },
  { name: 'Negócios', icon: '💼', color: 'bg-green-100 text-green-800' },
  { name: 'Tecnologia', icon: '💻', color: 'bg-purple-100 text-purple-800' },
  { name: 'Desenvolvimento Pessoal', icon: '🌟', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'Ciências', icon: '🔬', color: 'bg-pink-100 text-pink-800' },
  { name: 'Arte e Design', icon: '🎨', color: 'bg-orange-100 text-orange-800' }
];

export function Home({ onNavigate, accessToken, onLogout, onShowAuth }: HomeProps) {
  const [featuredEbooks, setFeaturedEbooks] = useState<Ebook[]>([]);

  useEffect(() => {
    loadFeaturedEbooks();
  }, []);

  const loadFeaturedEbooks = async () => {
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
        setFeaturedEbooks(data.ebooks.slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to load featured ebooks:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1>EbookStore</h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-4">
              <Button variant="ghost" onClick={() => onNavigate('store')}>
                Loja
              </Button>
              <Button variant="ghost" onClick={() => onNavigate('vendor-auth')}>
                Vender Ebooks
              </Button>
              {accessToken && (
                <Button variant="ghost" onClick={() => onNavigate('admin')}>
                  Admin
                </Button>
              )}
              {accessToken ? (
                <Button variant="outline" onClick={onLogout}>
                  Sair
                </Button>
              ) : (
                <Button onClick={onShowAuth}>
                  <User className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
              )}
            </nav>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <Button variant="ghost" onClick={() => onNavigate('store')}>
                    Loja
                  </Button>
                  <Button variant="ghost" onClick={() => onNavigate('vendor-auth')}>
                    Vender Ebooks
                  </Button>
                  {accessToken && (
                    <Button variant="ghost" onClick={() => onNavigate('admin')}>
                      Admin
                    </Button>
                  )}
                  {accessToken ? (
                    <Button variant="outline" onClick={onLogout}>
                      Sair
                    </Button>
                  ) : (
                    <Button onClick={onShowAuth}>
                      <User className="h-4 w-4 mr-2" />
                      Entrar
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="w-fit">Sua biblioteca digital</Badge>
              <h2 className="text-4xl lg:text-5xl">
                Descubra milhares de ebooks em um só lugar
              </h2>
              <p className="text-lg text-muted-foreground">
                Explore nossa coleção crescente de ebooks de alta qualidade. 
                Leia onde quiser, quando quiser.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => onNavigate('store')}>
                  Explorar Loja
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                {!accessToken && (
                  <Button size="lg" variant="outline" onClick={onShowAuth}>
                    Criar Conta Grátis
                  </Button>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <div className="text-3xl mb-2">1000+</div>
              <p className="opacity-90">Ebooks Disponíveis</p>
            </div>
            <div>
              <Users className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <div className="text-3xl mb-2">5000+</div>
              <p className="opacity-90">Leitores Ativos</p>
            </div>
            <div>
              <Star className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <div className="text-3xl mb-2">4.8/5</div>
              <p className="opacity-90">Avaliação Média</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl mb-4">Explore por Categoria</h2>
            <p className="text-lg text-muted-foreground">
              Encontre exatamente o que você procura
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.name} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onNavigate('store')}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <p className="text-sm">{category.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Ebooks Section */}
      {featuredEbooks.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl mb-4">Ebooks em Destaque</h2>
              <p className="text-lg text-muted-foreground">
                Nossos títulos mais populares
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredEbooks.map((ebook) => (
                <Card key={ebook.id} className="flex flex-col hover:shadow-lg transition-shadow">
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
                  <CardFooter className="flex justify-between items-center">
                    <span className="text-lg">${ebook.price.toFixed(2)}</span>
                    <Button size="sm" onClick={() => onNavigate('store')}>
                      Ver Mais
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button size="lg" variant="outline" onClick={() => onNavigate('store')}>
                Ver Todos os Ebooks
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Vendor CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl mb-4">Venda Seus Ebooks e Ganhe Dinheiro</h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se ao nosso marketplace e comece a lucrar com seus conhecimentos
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 p-6 rounded-lg">
              <div className="text-3xl mb-2">90%</div>
              <p>de cada venda vai para você</p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg">
              <div className="text-3xl mb-2">✓</div>
              <p>Pagamentos via Stripe Connect</p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg">
              <div className="text-3xl mb-2">∞</div>
              <p>Saques ilimitados</p>
            </div>
          </div>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => onNavigate('vendor-auth')}
          >
            Começar a Vender Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl mb-4">Por que escolher nossa plataforma?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <ShoppingCart className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Compra Segura</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pagamentos processados com segurança via Stripe. Seus dados estão protegidos.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <BookOpen className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Acesso Imediato</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Baixe seus ebooks instantaneamente após a compra. Leia em qualquer dispositivo.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Star className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Qualidade Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Conteúdo selecionado dos melhores autores e editoras do mercado.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl mb-6">
            Pronto para começar sua jornada de leitura?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Junte-se a milhares de leitores e descubra seu próximo ebook favorito hoje.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => onNavigate('store')}>
              Explorar Loja
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {!accessToken && (
              <Button size="lg" variant="outline" onClick={onShowAuth}>
                Criar Conta Grátis
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6" />
                <span>EbookStore</span>
              </div>
              <p className="text-sm text-gray-400">
                Sua biblioteca digital de ebooks premium.
              </p>
            </div>
            <div>
              <p className="mb-4">Categorias</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Ficção</li>
                <li>Negócios</li>
                <li>Tecnologia</li>
              </ul>
            </div>
            <div>
              <p className="mb-4">Suporte</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Central de Ajuda</li>
                <li>Contato</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <p className="mb-4">Legal</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Termos de Uso</li>
                <li>Política de Privacidade</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2024 EbookStore. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
