/**
 * Example Page - Showcasing shadcn/ui Components
 * 
 * This page demonstrates various shadcn/ui components in a real-world context
 * following the design system principles.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export const ShadcnExamplePage = () => {
  const [progress, setProgress] = useState(33);
  const { toast } = useToast();

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Component Examples</h1>
        <p className="text-muted-foreground">
          Showcasing shadcn/ui components in action
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Card Example</CardTitle>
            <CardDescription>This is a card component</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Card content goes here. Cards are great for grouping related information.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>With Badges</CardTitle>
            <CardDescription>Status indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Progress indicator</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={progress} />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setProgress(Math.max(0, progress - 10))}
              >
                -
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setProgress(Math.min(100, progress + 10))}
              >
                +
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Forms */}
      <Card>
        <CardHeader>
          <CardTitle>Form Example</CardTitle>
          <CardDescription>Form inputs with labels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter your name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="notifications" />
            <Label htmlFor="notifications">Enable notifications</Label>
          </div>
          <Button
            onClick={() =>
              toast({
                title: 'Form submitted',
                description: 'Your information has been saved.',
              })
            }
          >
            Submit
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Table Example</CardTitle>
          <CardDescription>Data table with actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">John Doe</TableCell>
                <TableCell>john@example.com</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>
                  <Badge>Active</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Jane Smith</TableCell>
                <TableCell>jane@example.com</TableCell>
                <TableCell>User</TableCell>
                <TableCell>
                  <Badge variant="secondary">Inactive</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator />

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs Example</CardTitle>
          <CardDescription>Organized content in tabs</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Overview content goes here.
              </p>
            </TabsContent>
            <TabsContent value="analytics" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Analytics content goes here.
              </p>
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Settings content goes here.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Separator />

      {/* Dialog */}
      <Card>
        <CardHeader>
          <CardTitle>Dialog Example</CardTitle>
          <CardDescription>Modal dialogs for actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>
                  This is a dialog example. You can put any content here.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="dialog-input">Input</Label>
                  <Input id="dialog-input" placeholder="Enter value" />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Separator />

      {/* Avatars */}
      <Card>
        <CardHeader>
          <CardTitle>Avatar Example</CardTitle>
          <CardDescription>User avatars</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
