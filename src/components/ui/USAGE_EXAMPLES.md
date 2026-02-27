# shadcn/ui Usage Examples

Các ví dụ sử dụng các components shadcn/ui đã được cài đặt.

## Toast Notifications

```tsx
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

function MyComponent() {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: "Thành công",
          description: "Đã lưu dữ liệu thành công.",
        });
      }}
    >
      Hiển thị Toast
    </Button>
  );
}
```

## Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function MyTabs() {
  return (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Tài khoản</TabsTrigger>
        <TabsTrigger value="password">Mật khẩu</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        Nội dung tài khoản
      </TabsContent>
      <TabsContent value="password">
        Nội dung mật khẩu
      </TabsContent>
    </Tabs>
  );
}
```

## Sheet (Sidebar)

```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

function MySheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Mở Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Tiêu đề</SheetTitle>
          <SheetDescription>
            Mô tả nội dung
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
```

## Drawer

```tsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

function MyDrawer() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Mở Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Tiêu đề</DrawerTitle>
          <DrawerDescription>Mô tả</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button>Xác nhận</Button>
          <DrawerClose asChild>
            <Button variant="outline">Hủy</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
```

## Progress Bar

```tsx
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';

function MyProgress() {
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500);
    return () => clearTimeout(timer);
  }, []);

  return <Progress value={progress} className="w-[60%]" />;
}
```

## Skeleton Loading

```tsx
import { Skeleton } from '@/components/ui/skeleton';

function MySkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}
```

## Spinner

```tsx
import { Spinner } from '@/components/ui/spinner';

function MySpinner() {
  return (
    <div className="flex items-center justify-center">
      <Spinner />
    </div>
  );
}
```

## Switch

```tsx
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

function MySwitch() {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Chế độ máy bay</Label>
    </div>
  );
}
```

## Pagination

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

function MyPagination() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
```

## Badge

```tsx
import { Badge } from '@/components/ui/badge';

function MyBadge() {
  return (
    <div className="flex gap-2">
      <Badge>Mặc định</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  );
}
```

## Avatar

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function MyAvatar() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  );
}
```

## Import từ index (Khuyến nghị)

Thay vì import từng file riêng lẻ, bạn có thể import từ `@/components/ui`:

```tsx
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Badge,
  Avatar,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
```

## Tài liệu tham khảo

Xem thêm tại: https://ui.shadcn.com/docs/components
