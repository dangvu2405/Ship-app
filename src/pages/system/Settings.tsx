import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/stores/app.store';
import { useTranslation } from '@/hooks/useTranslation';

export const Settings = () => {
  const { theme, toggleTheme, locale, setLocale } = useAppStore();
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1>{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('settings.description')}</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.appearance.title')}</CardTitle>
          <CardDescription>{t('settings.appearance.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('settings.appearance.darkMode')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings.appearance.darkModeDescription')}</p>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>

          <Separator />

          {/* Language */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('settings.appearance.language')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings.appearance.languageDescription')}</p>
            </div>
            <Select value={locale} onValueChange={(v) => setLocale(v as 'vi' | 'en')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">{t('settings.appearance.vietnamese')}</SelectItem>
                <SelectItem value="en">{t('settings.appearance.english')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Density */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('settings.appearance.compactMode')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings.appearance.compactModeDescription')}</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.notifications.title')}</CardTitle>
          <CardDescription>{t('settings.notifications.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('settings.notifications.email')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings.notifications.emailDescription')}</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('settings.notifications.push')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings.notifications.pushDescription')}</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">{t('settings.notifications.sound')}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t('settings.notifications.soundDescription')}</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.system.title')}</CardTitle>
          <CardDescription>{t('settings.system.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">{t('settings.system.version')}</span>
              <Badge variant="outline">1.0.0</Badge>
            </div>
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">{t('settings.system.environment')}</span>
              <Badge variant="secondary">{t('settings.system.development')}</Badge>
            </div>
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">{t('settings.system.apiStatus')}</span>
              <Badge variant="outline">{t('settings.system.connected')}</Badge>
            </div>
            <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">{t('settings.system.lastUpdated')}</span>
              <span className="text-sm font-medium">Feb 2026</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">{t('settings.resetToDefaults')}</Button>
        <Button>{t('settings.saveSettings')}</Button>
      </div>
    </div>
  );
};
