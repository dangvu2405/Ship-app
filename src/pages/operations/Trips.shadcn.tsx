/**
 * Trips Page - Redesigned with shadcn/ui
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
import Package from 'lucide-react/dist/esm/icons/package';
import { useToast } from '@/hooks/use-toast';
import { Trip } from '@/types';

// Mock data - replace with actual API calls
const mockTrips: Trip[] = [
  {
    id: 1,
    code: 'T001',
    customer_id: 1,
    driver_id: 1,
    vehicle_id: 1,
    start_point: 'Ho Chi Minh City',
    end_point: 'Hanoi',
    distance_km: 1730,
    price: 5000000,
    status: 'completed',
    start_time: '2024-01-15 08:00:00',
    end_time: '2024-01-16 12:00:00',
  },
  {
    id: 2,
    code: 'T002',
    customer_id: 2,
    driver_id: 2,
    vehicle_id: 2,
    start_point: 'Da Nang',
    end_point: 'Ho Chi Minh City',
    distance_km: 960,
    price: 3000000,
    status: 'in_progress',
    start_time: '2024-01-20 09:00:00',
  },
];

export const TripsShadcn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [formData, setFormData] = useState<Partial<Trip>>({
    code: '',
    customer_id: 0,
    driver_id: 0,
    vehicle_id: 0,
    start_point: '',
    end_point: '',
    distance_km: 0,
    price: 0,
    status: 'pending',
  });

  const filteredTrips = trips.filter(
    (trip) =>
      trip.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.start_point?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.end_point?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleDelete = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedTrip) return;

    setTrips(prev => prev.filter((t) => t.id !== selectedTrip.id));
    toast({
      title: 'Trip deleted',
      description: `Trip ${selectedTrip.code} has been deleted successfully.`,
    });
    setIsDeleteDialogOpen(false);
    setSelectedTrip(null);
  };

  const handleEdit = (trip: Trip) => {
    setSelectedTrip(trip);
    setFormData({
      code: trip.code,
      customer_id: trip.customer_id,
      driver_id: trip.driver_id,
      vehicle_id: trip.vehicle_id,
      start_point: trip.start_point,
      end_point: trip.end_point,
      distance_km: trip.distance_km,
      price: trip.price,
      status: trip.status,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedTrip(null);
    setFormData({
      code: '',
      customer_id: 0,
      driver_id: 0,
      vehicle_id: 0,
      start_point: '',
      end_point: '',
      distance_km: 0,
      price: 0,
      status: 'pending',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.start_point || !formData.end_point) {
      toast({
        title: 'Validation error',
        description: 'Code, start point, and end point are required',
        variant: 'destructive',
      });
      return;
    }

    if (selectedTrip) {
      // Update
      setTrips(prev =>
        prev.map((t) => (t.id === selectedTrip.id ? { ...selectedTrip, ...formData } as Trip : t))
      );
      toast({
        title: 'Trip updated',
        description: 'The trip has been updated successfully.',
      });
    } else {
      // Create
      setTrips(prev => {
        const newTrip: Trip = {
          id: prev.length + 1,
          ...formData,
          code: formData.code!,
          customer_id: formData.customer_id!,
          driver_id: formData.driver_id!,
          vehicle_id: formData.vehicle_id!,
          start_point: formData.start_point!,
          end_point: formData.end_point!,
          distance_km: formData.distance_km || 0,
          price: formData.price || 0,
          status: formData.status || 'pending',
        } as Trip;
        return [...prev, newTrip];
      });
      toast({
        title: 'Trip created',
        description: 'The trip has been created successfully.',
      });
    }
    setIsDialogOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
            <p className="text-muted-foreground">
              Manage trip operations
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedTrip ? 'Edit Trip' : 'Create Trip'}
                </DialogTitle>
                <DialogDescription>
                  {selectedTrip
                    ? 'Update trip information'
                    : 'Add a new trip to the system'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid gap-2">
                  <Label htmlFor="code">Trip Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="T001"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_point">Start Point *</Label>
                    <Input
                      id="start_point"
                      value={formData.start_point}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_point: e.target.value }))}
                      placeholder="Ho Chi Minh City"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_point">End Point *</Label>
                    <Input
                      id="end_point"
                      value={formData.end_point}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_point: e.target.value }))}
                      placeholder="Hanoi"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="distance_km">Distance (km)</Label>
                    <Input
                      id="distance_km"
                      type="number"
                      value={formData.distance_km || ''}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, distance_km: e.target.value ? parseInt(e.target.value) : 0 }))
                      }
                      placeholder="1730"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (VND)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, price: e.target.value ? parseInt(e.target.value) : 0 }))
                      }
                      placeholder="5000000"
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {selectedTrip ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter trips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, start point, or end point..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Trips</CardTitle>
            <CardDescription>
              A list of all trips in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      <div className="flex flex-col items-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <p>No trips found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">{trip.code}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{trip.start_point}</span>
                          <span className="text-xs text-muted-foreground">→ {trip.end_point}</span>
                        </div>
                      </TableCell>
                      <TableCell>{trip.distance_km} km</TableCell>
                      <TableCell>{formatCurrency(trip.price)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(trip.status)}>
                          {trip.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {trip.start_time
                          ? new Date(trip.start_time).toLocaleDateString('vi-VN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
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
                            <DropdownMenuItem onClick={() => navigate(`/admin/trips/${trip.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(trip)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(trip)}
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
                This action cannot be undone. This will permanently delete trip{' '}
                <strong>{selectedTrip?.code}</strong> from the system.
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
