/**
 * Companies Page - Redesigned with shadcn/ui
 * Still integrates with Refine hooks for data management
 */

import { useState } from 'react';
import { useDelete, useNavigation, useCreate, useUpdate, useList } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Eye from 'lucide-react/dist/esm/icons/eye';
import { useToast } from '@/hooks/use-toast';
import { Company } from '@/types';
import { AdminLayout } from '@/layouts/AdminLayout';

export const CompaniesShadcn = () => {
  const { show } = useNavigation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<Partial<Company>>({
    code: '',
    name: '',
    tax_code: '',
    email: '',
    phone: '',
    address: '',
    status: 'active',
  });

  const { mutate: createCompany } = useCreate<Company>();
  const { mutate: updateCompany } = useUpdate<Company>();
  const { mutate: deleteCompany } = useDelete();

  // Use Refine's useList hook
  const { data, isLoading, refetch } = useList<Company>({
    resource: 'companies',
    filters: searchQuery
      ? [
          {
            field: 'name',
            operator: 'contains',
            value: searchQuery,
          },
        ]
      : [],
    pagination: {
      pageSize: 10,
    },
    sorters: [
      {
        field: 'id',
        order: 'desc',
      },
    ],
  });

  const companies = data?.data || [];

  const handleDelete = (company: Company) => {
    setSelectedCompany(company);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedCompany) return;

    deleteCompany(
      {
        resource: 'companies',
        id: selectedCompany.id,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Company deleted',
            description: `${selectedCompany.name} has been deleted successfully.`,
          });
          setIsDeleteDialogOpen(false);
          setSelectedCompany(null);
          refetch();
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to delete company',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      code: company.code,
      name: company.name,
      tax_code: company.tax_code || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      status: company.status || 'active',
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCompany(null);
    setFormData({
      code: '',
      name: '',
      tax_code: '',
      email: '',
      phone: '',
      address: '',
      status: 'active',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.name) {
      toast({
        title: 'Validation error',
        description: 'Code and Name are required',
        variant: 'destructive',
      });
      return;
    }

    if (selectedCompany) {
      // Update
      updateCompany(
        {
          resource: 'companies',
          id: selectedCompany.id,
          values: formData as Partial<Company>,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Company updated',
              description: 'The company has been updated successfully.',
            });
            setIsDialogOpen(false);
            setSelectedCompany(null);
            refetch();
          },
          onError: () => {
            toast({
              title: 'Error',
              description: 'Failed to update company',
              variant: 'destructive',
            });
          },
        }
      );
    } else {
      // Create
      createCompany(
        {
          resource: 'companies',
          values: formData as Partial<Company>,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Company created',
              description: 'The company has been created successfully.',
            });
            setIsDialogOpen(false);
            refetch();
          },
          onError: () => {
            toast({
              title: 'Error',
              description: 'Failed to create company',
              variant: 'destructive',
            });
          },
        }
      );
    }
  };

  // No client-side filtering needed - server handles it via useList filters
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground">
              Manage your organizations
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedCompany ? 'Edit Company' : 'Create Company'}
                </DialogTitle>
                <DialogDescription>
                  {selectedCompany
                    ? 'Update company information'
                    : 'Add a new organization to the system'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="C001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Company Name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tax_code">Tax Code</Label>
                  <Input
                    id="tax_code"
                    value={formData.tax_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, tax_code: e.target.value }))}
                    placeholder="123456789"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {selectedCompany ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Companies</CardTitle>
            <CardDescription>
              A list of all companies in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Tax Code</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No companies found
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.code}</TableCell>
                        <TableCell>{company.name}</TableCell>
                        <TableCell>{company.tax_code || '-'}</TableCell>
                        <TableCell>{company.email || '-'}</TableCell>
                        <TableCell>{company.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={company.status === 'active' ? 'default' : 'secondary'}
                          >
                            {company.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => show('companies', company.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(company)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(company)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete{' '}
                <strong>{selectedCompany?.name}</strong> from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};
