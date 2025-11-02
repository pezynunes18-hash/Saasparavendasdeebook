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
import { BookOpen, DollarSign, ShoppingCart, Upload, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface DashboardProps {
  accessToken: string;
  onLogout: () => void;
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

const categories = ['Ficção', 'Negócios', 'Tecnologia', 'Desenvolvimento Pessoal', 'Ciências', 'Arte e Design'];

interface Sale {
  id: string;
  ebookId: string;
  userId: string;
  amount: number;
  createdAt: string;
  ebookTitle: string;
  buyerEmail: string;
}

export function Dashboard({ accessToken, onLogout }: DashboardProps) {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stripeStatus, setStripeStatus] = useState<string>('');

  useEffect(() => {
    loadEbooks();
    loadSales();
    checkStripeStatus();
  }, []);

  const checkStripeStatus = async () => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/stripe-status`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await response.json();
      setStripeStatus(data.configured ? `✓ Stripe configurado (${data.keyPrefix}...)` : '✗ Stripe não configurado');
      
      if (!data.configured) {
        toast.error('Stripe não está configurado. Os pagamentos não funcionarão.');
      }
    } catch (error) {
      console.error('Failed to check Stripe status:', error);
      setStripeStatus('✗ Erro ao verificar Stripe');
    }
  };

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
      toast.error('Failed to load ebooks');
    }
  };

  const loadSales = async () => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/sales`,
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

      toast.success('Ebook added successfully');
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
    if (!confirm('Are you sure you want to delete this ebook?')) return;

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

      toast.success('Ebook deleted');
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

      toast.success('File uploaded successfully');
      loadEbooks();
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploadingFile(null);
    }
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1>Admin Dashboard</h1>
          <Button variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Status do Stripe</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">{stripeStatus || 'Verificando...'}</p>
              <p className="text-sm">
                Chave publicável: pk_test_51SOuAg... (configurada) <br />
                Chave secreta: {stripeStatus.includes('✓') ? 'Configurada' : 'Não configurada'}
              </p>
              {!stripeStatus.includes('✓') && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ A variável de ambiente STRIPE_SECRET_KEY precisa ser configurada no Supabase para aceitar pagamentos.
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Ebooks</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{ebooks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{sales.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="ebooks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ebooks">Manage Ebooks</TabsTrigger>
            <TabsTrigger value="sales">Sales History</TabsTrigger>
          </TabsList>

          <TabsContent value="ebooks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2>Your Ebooks</h2>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Add New Ebook</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Ebook</DialogTitle>
                    <DialogDescription>
                      Fill in the details for your new ebook
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddEbook} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" name="title" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author">Author</Label>
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
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (USD)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverUrl">Cover Image URL</Label>
                      <Input id="coverUrl" name="coverUrl" type="url" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Adding...' : 'Add Ebook'}
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
                      <TableHead>Cover</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>Actions</TableHead>
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
                            <span className="text-green-600 text-sm">Uploaded</span>
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
                                {uploadingFile === ebook.id ? 'Uploading...' : 'Upload'}
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
                          No ebooks yet. Add your first ebook to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <h2>Sales History</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Ebook</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Amount</TableHead>
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
                        <TableCell>${sale.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {sales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No sales yet.
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
