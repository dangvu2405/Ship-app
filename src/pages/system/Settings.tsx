import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/stores/app.store';

export const Settings = () => {
  const { theme, toggleTheme, locale, setLocale } = useAppStore();

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Page Header */}
        <div>
          <h1>Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your application preferences</p>
        </div>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Toggle between light and dark theme</p>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>

            <Separator />

            {/* Language */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Language</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Select your preferred language</p>
              </div>
              <Select value={locale} onValueChange={(v) => setLocale(v as 'vi' | 'en')}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tieng Viet</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Density */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Compact Mode</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Reduce padding for denser UI</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Receive email for important updates</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Receive browser push notifications</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Sound</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Play sound for notifications</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Application version and environment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Version</span>
                <Badge variant="outline">1.0.0</Badge>
              </div>
              <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Environment</span>
                <Badge variant="info">Development</Badge>
              </div>
              <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">API Status</span>
                <Badge variant="success">Connected</Badge>
              </div>
              <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm font-medium">Feb 2026</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Settings</Button>
        </div>
      </div>
    </AdminLayout>
  );
};
