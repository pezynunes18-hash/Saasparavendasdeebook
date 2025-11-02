import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { BookOpen, DollarSign, ShoppingCart, Upload, Trash2, AlertCircle, Check, ExternalLink, TrendingUp } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface VendorDashboardProps {
  accessToken: string;
  onLogout: () => void;
}

interface Vendor {
  id: string;
  name: string;
  businessName: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  stripeAccountId: string | null;
  commission: number;
  createdAt: string;
}

interface Ebook {
  id: string;
  title: string;
  description: string;
  price: number;
  coverUrl: string;
  author: string;
  category?: string;
  filePath?: string;
}

interface Sale {
  id: string;
  ebookId: string;
  userId: string;
  vendorAmount: number;
  platformAmount: number;
  totalAmount: number;
  createdAt: string;
  ebookTitle: string;
  buyerEmail: string;
}

const categories = ['Ficção', 'Negócios', 'Tecnologia', 'Desenvolvimento Pessoal', 'Ciências', 'Arte e Design'];

export function VendorDashboard({ accessToken, onLogout }: VendorDashboardProps) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  useEffect(() => {
    loadVendorProfile();
    loadEbooks();
    loadSales();
    loadBalance();
  }, []);

  const loadVendorProfile = async () => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/vendor-profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setVendor(data.vendor);
      } else {
        toast.error('Você não é um vendedor cadastrado');
      }
    } catch (error) {
      console.error('Failed to load vendor profile:', error);
      toast.error('Failed to load vendor profile');
    }
  };

  const loadEbooks = async () => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/vendor-ebooks`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
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

  const loadSales = async () => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/vendor-sales`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSales(data.sales);
      }
    } catch (error) {
      console.error('Failed to load sales:', error);
    }
  };

  const loadBalance = async () => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/vendor-balance`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setBalance(data.availableBalance);
        setWithdrawals(data.withdrawals);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleConnectStripe = async () => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/vendor-onboarding`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      if (response.ok && data.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error(data.error || 'Failed to create onboarding link');
      }
    } catch (error) {
      console.error('Failed to connect Stripe:', error);
      toast.error('Failed to connect Stripe account');
    }
  };

  const handleAddEbook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const ebookData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      coverUrl: formData.get('coverUrl') as string,
      author: formData.get('author') as string,
      category: selectedCategory
    };

    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/ebooks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(ebookData)
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add ebook');
      }

      toast.success('Ebook adicionado com sucesso');
      setIsAddDialogOpen(false);
      setSelectedCategory('');
      loadEbooks();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      console.error('Failed to add ebook:', error);
      toast.error(error.message || 'Failed to add ebook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEbook = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este ebook?')) return;

    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/ebooks/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete ebook');
      }

      toast.success('Ebook deletado');
      loadEbooks();
    } catch (error) {
      console.error('Failed to delete ebook:', error);
      toast.error('Failed to delete ebook');
    }
  };

  const handleUploadFile = async (ebookId: string, file: File) => {
    setUploadingFile(ebookId);

    try {
      const { projectId } = await import('../utils/supabase/info');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ebookId', ebookId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/upload-ebook-file`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: formData
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      toast.success('Arquivo enviado com sucesso');
      loadEbooks();
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    if (amount > balance) {
      toast.error('Saldo insuficiente');
      return;
    }

    setIsLoading(true);
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/vendor-withdrawal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ amount })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process withdrawal');
      }

      toast.success('Saque processado com sucesso!');
      setIsWithdrawalDialogOpen(false);
      setWithdrawalAmount('');
      loadBalance();
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Falha ao processar saque');
    } finally {
      setIsLoading(false);
    }
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.vendorAmount || 0), 0);

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1>Dashboard do Vendedor</h1>
            <p className="text-sm text-muted-foreground">{vendor.businessName}</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Alerts */}
        {vendor.status === 'pending' && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Aguardando Aprovação</AlertTitle>
            <AlertDescription>
              Sua conta está sendo revisada. Você poderá vender ebooks assim que for aprovado.
            </AlertDescription>
          </Alert>
        )}

        {vendor.status === 'rejected' && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Conta Rejeitada</AlertTitle>
            <AlertDescription>
              Infelizmente sua conta foi rejeitada. Entre em contato com o suporte.
            </AlertDescription>
          </Alert>
        )}

        {vendor.status === 'approved' && !vendor.stripeAccountId && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Conecte sua Conta Stripe</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Para receber pagamentos, você precisa conectar sua conta Stripe.</span>
              <Button onClick={handleConnectStripe} size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Conectar Stripe
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={vendor.status === 'approved' ? 'default' : 'secondary'}>
                {vendor.status === 'approved' ? '✓ Aprovado' : vendor.status === 'pending' ? 'Pendente' : 'Rejeitado'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Meus Ebooks</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{ebooks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Vendas</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{sales.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {vendor.commission}% vai para plataforma
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Balance Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Saldo Disponível</span>
              <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!vendor.stripeAccountId || balance <= 0}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Solicitar Saque
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar Saque</DialogTitle>
                    <DialogDescription>
                      Saldo disponível: ${balance.toFixed(2)}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor (USD)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        max={balance}
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <Button 
                      onClick={handleWithdrawal} 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processando...' : 'Confirmar Saque'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-4">${balance.toFixed(2)}</div>
            {withdrawals.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm mb-2">Histórico de Saques</h3>
                <div className="space-y-2">
                  {withdrawals.slice(0, 5).map((w: any) => (
                    <div key={w.id} className="flex justify-between text-sm">
                      <span>{new Date(w.createdAt).toLocaleDateString()}</span>
                      <span>${w.amount.toFixed(2)}</span>
                      <Badge variant={w.status === 'completed' ? 'default' : 'secondary'}>
                        {w.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="ebooks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ebooks">Meus Ebooks</TabsTrigger>
            <TabsTrigger value="sales">Histórico de Vendas</TabsTrigger>
          </TabsList>

          <TabsContent value="ebooks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2>Seus Ebooks</h2>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={vendor.status !== 'approved'}>
                    Adicionar Ebook
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Ebook</DialogTitle>
                    <DialogDescription>
                      Preencha os detalhes do seu ebook
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddEbook} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input id="title" name="title" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author">Autor</Label>
                      <Input id="author" name="author" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea id="description" name="description" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço (USD)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Você receberá {100 - vendor.commission}% (${((1 - vendor.commission / 100) * 10).toFixed(2)} de um ebook de $10)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverUrl">URL da Capa</Label>
                      <Input id="coverUrl" name="coverUrl" type="url" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Adicionando...' : 'Adicionar Ebook'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Capa</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ebooks.map((ebook) => (
                      <TableRow key={ebook.id}>
                        <TableCell>
                          <img
                            src={ebook.coverUrl}
                            alt={ebook.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                        </TableCell>
                        <TableCell>{ebook.title}</TableCell>
                        <TableCell>{ebook.author}</TableCell>
                        <TableCell>{ebook.category || 'N/A'}</TableCell>
                        <TableCell>${ebook.price.toFixed(2)}</TableCell>
                        <TableCell>
                          {ebook.filePath ? (
                            <span className="text-green-600 text-sm">✓ Enviado</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept=".pdf,.epub"
                                id={`file-${ebook.id}`}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadFile(ebook.id, file);
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  document.getElementById(`file-${ebook.id}`)?.click()
                                }
                                disabled={uploadingFile === ebook.id}
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                {uploadingFile === ebook.id ? 'Enviando...' : 'Upload'}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteEbook(ebook.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {ebooks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum ebook ainda. Adicione seu primeiro ebook para começar!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <h2>Histórico de Vendas</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Ebook</TableHead>
                      <TableHead>Comprador</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Sua Receita</TableHead>
                      <TableHead>Comissão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{sale.ebookTitle}</TableCell>
                        <TableCell>{sale.buyerEmail}</TableCell>
                        <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">
                          ${sale.vendorAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          ${sale.platformAmount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {sales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma venda ainda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
