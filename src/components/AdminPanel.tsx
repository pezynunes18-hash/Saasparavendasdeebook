import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Check, X, DollarSign, Users, TrendingUp, BookOpen } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AdminPanelProps {
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
  totalEbooks: number;
  totalSales: number;
  balance: number;
}

interface Revenue {
  platformRevenue: number;
  vendorRevenue: number;
  totalRevenue: number;
  totalSales: number;
}

export function AdminPanel({ accessToken, onLogout }: AdminPanelProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadVendors();
    loadRevenue();
  }, []);

  const loadVendors = async () => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/admin/vendors`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setVendors(data.vendors);
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
      toast.error('Falha ao carregar vendedores');
    }
  };

  const loadRevenue = async () => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/admin/platform-revenue`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setRevenue(data);
      }
    } catch (error) {
      console.error('Failed to load revenue:', error);
    }
  };

  const handleApproveVendor = async (vendorId: string, status: 'approved' | 'rejected') => {
    setIsLoading(true);
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b50138d4/admin/approve-vendor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ vendorId, status })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao atualizar vendedor');
      }

      toast.success(`Vendedor ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso`);
      loadVendors();
    } catch (error: any) {
      console.error('Failed to approve vendor:', error);
      toast.error(error.message || 'Falha ao atualizar vendedor');
    } finally {
      setIsLoading(false);
    }
  };

  const pendingVendors = vendors.filter(v => v.status === 'pending');
  const approvedVendors = vendors.filter(v => v.status === 'approved');
  const rejectedVendors = vendors.filter(v => v.status === 'rejected');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1>Painel Administrativo</h1>
          <Button variant="outline" onClick={onLogout}>
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Revenue Stats */}
        {revenue && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Receita Plataforma</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">${revenue.platformRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Comissão de 10%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Receita Vendedores</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">${revenue.vendorRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  90% das vendas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">${revenue.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {revenue.totalSales} vendas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total Vendedores</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{vendors.length}</div>
                <p className="text-xs text-muted-foreground">
                  {pendingVendors.length} pendentes
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pendentes ({pendingVendors.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Aprovados ({approvedVendors.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejeitados ({rejectedVendors.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendedores Aguardando Aprovação</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Negócio</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Data Cadastro</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>{vendor.name}</TableCell>
                        <TableCell>{vendor.businessName}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>
                          {new Date(vendor.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveVendor(vendor.id, 'approved')}
                            disabled={isLoading}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApproveVendor(vendor.id, 'rejected')}
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {pendingVendors.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum vendedor pendente
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendedores Aprovados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Negócio</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ebooks</TableHead>
                      <TableHead>Vendas</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Stripe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>{vendor.name}</TableCell>
                        <TableCell>{vendor.businessName}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>{vendor.totalEbooks}</TableCell>
                        <TableCell>{vendor.totalSales}</TableCell>
                        <TableCell>${vendor.balance.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={vendor.stripeAccountId ? 'default' : 'secondary'}>
                            {vendor.stripeAccountId ? '✓ Conectado' : 'Não conectado'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {approvedVendors.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum vendedor aprovado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendedores Rejeitados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Negócio</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Data Rejeição</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>{vendor.name}</TableCell>
                        <TableCell>{vendor.businessName}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>
                          {new Date(vendor.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveVendor(vendor.id, 'approved')}
                            disabled={isLoading}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Reativar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rejectedVendors.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum vendedor rejeitado
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
