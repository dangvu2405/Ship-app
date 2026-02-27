/**
 * Vehicles Page - Redesigned with shadcn/ui
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
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
import Truck from 'lucide-react/dist/esm/icons/truck';
import { useToast } from '@/hooks/use-toast';
import { Vehicle } from '@/types';

// Mock data - replace with actual API calls
const mockVehicles: Vehicle[] = [
  {
    id: 1,
    plate_number: 'ABC-1234',
    type: 'Truck',
    brand: 'Toyota',
    model: 'Hiace',
    year: 2020,
    capacity: 1500,
    status: 'active',
    office_id: 1,
  },
  {
    id: 2,
    plate_number: 'XYZ-5678',
    type: 'Van',
    brand: 'Ford',
    model: 'Transit',
    year: 2021,
    capacity: 1200,
    status: 'active',
    office_id: 1,
  },
];

export const VehiclesShadcn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plate_number: '',
    type: '',
    brand: '',
    model: '',
    year: undefined,
    capacity: undefined,
    status: 'active',
    office_id: 1,
  });

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.plate_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedVehicle) return;

    setVehicles(prev => prev.filter((v) => v.id !== selectedVehicle.id));
    toast({
      title: 'Vehicle deleted',
      description: `${selectedVehicle.plate_number} has been deleted successfully.`,
    });
    setIsDeleteDialogOpen(false);
    setSelectedVehicle(null);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      plate_number: vehicle.plate_number,
      type: vehicle.type,
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year,
      capacity: vehicle.capacity,
      status: vehicle.status,
      office_id: vehicle.office_id,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedVehicle(null);
    setFormData({
      plate_number: '',
      type: '',
      brand: '',
      model: '',
      year: undefined,
      capacity: undefined,
      status: 'active',
      office_id: 1,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.plate_number || !formData.type) {
      toast({
        title: 'Validation error',
        description: 'Plate number and type are required',
        variant: 'destructive',
      });
      return;
    }

    if (selectedVehicle) {
      // Update
      setVehicles(prev =>
        prev.map((v) => (v.id === selectedVehicle.id ? { ...selectedVehicle, ...formData } as Vehicle : v))
      );
      toast({
        title: 'Vehicle updated',
        description: 'The vehicle has been updated successfully.',
      });
    } else {
      // Create
      setVehicles(prev => {
        const newVehicle: Vehicle = {
          id: prev.length + 1,
          ...formData,
          plate_number: formData.plate_number!,
          type: formData.type!,
          status: formData.status || 'active',
          office_id: formData.office_id || 1,
        } as Vehicle;
        return [...prev, newVehicle];
      });
      toast({
        title: 'Vehicle created',
        description: 'The vehicle has been created successfully.',
      });
    }
    setIsDialogOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
            <p className="text-muted-foreground">
              Manage your fleet vehicles
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedVehicle ? 'Edit Vehicle' : 'Create Vehicle'}
                </DialogTitle>
                <DialogDescription>
                  {selectedVehicle
                    ? 'Update vehicle information'
                    : 'Add a new vehicle to the fleet'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="plate_number">Plate Number *</Label>
                  <Input
                    id="plate_number"
                    value={formData.plate_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                    placeholder="ABC-1234"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Truck">Truck</SelectItem>
                      <SelectItem value="Van">Van</SelectItem>
                      <SelectItem value="Car">Car</SelectItem>
                      <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="Toyota"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="Hiace"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year || ''}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, year: e.target.value ? parseInt(e.target.value) : undefined }))
                      }
                      placeholder="2020"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Capacity (kg)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity || ''}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          capacity: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      placeholder="1500"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {selectedVehicle ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by plate number, brand, or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicles</CardTitle>
            <CardDescription>
              A list of all vehicles in the fleet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      <div className="flex flex-col items-center py-8">
                        <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                        <p>No vehicles found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.plate_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{vehicle.type}</Badge>
                      </TableCell>
                      <TableCell>{vehicle.brand || '-'}</TableCell>
                      <TableCell>{vehicle.model || '-'}</TableCell>
                      <TableCell>{vehicle.year || '-'}</TableCell>
                      <TableCell>{vehicle.capacity ? `${vehicle.capacity} kg` : '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            vehicle.status === 'active'
                              ? 'default'
                              : vehicle.status === 'maintenance'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {vehicle.status}
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
                            <DropdownMenuItem onClick={() => navigate(`/admin/vehicles/${vehicle.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(vehicle)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(vehicle)}
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
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete vehicle{' '}
                <strong>{selectedVehicle?.plate_number}</strong> from the system.
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
