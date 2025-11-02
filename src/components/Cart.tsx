import React from 'react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { ShoppingCart, Trash2, X } from 'lucide-react';

interface Ebook {
  id: string;
  title: string;
  description: string;
  price: number;
  coverUrl: string;
  author: string;
  category?: string;
}

interface CartProps {
  items: Ebook[];
  onRemove: (ebookId: string) => void;
  onCheckout: () => void;
  onClear: () => void;
}

export function Cart({ items, onRemove, onCheckout, onClear }: CartProps) {
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
            >
              {items.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Carrinho de Compras</span>
            {items.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClear}
                className="text-muted-foreground"
              >
                Limpar
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            {items.length === 0 
              ? 'Seu carrinho está vazio' 
              : `${items.length} ${items.length === 1 ? 'item' : 'itens'} no carrinho`
            }
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <ShoppingCart className="h-20 w-20 text-muted-foreground mb-4 opacity-30" />
            <p className="text-lg text-muted-foreground mb-2">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground">
              Adicione ebooks à sua cesta para começar
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 -mx-6 px-6 my-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="line-clamp-2 mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.author}
                      </p>
                      <p className="font-medium">${item.price.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(item.id)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total</span>
                <span className="text-2xl">${total.toFixed(2)}</span>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={onCheckout}
              >
                Finalizar Compra
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
