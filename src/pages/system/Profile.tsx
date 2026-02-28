import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/hooks/useTranslation';

export const Profile = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1>{t('profile.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('profile.description')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary/20 mb-4">
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg font-semibold">{user?.username || t('profile.user')}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex gap-2 mt-3">
              {user?.roles?.map((role) => (
                <Badge key={role.id} variant="secondary">{role.name}</Badge>
              )) ?? <Badge variant="secondary">{t('profile.user')}</Badge>}
            </div>
            <Separator className="my-5" />
            <div className="w-full space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('profile.status')}</span>
                <Badge variant="outline">{t('common.active')}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('profile.memberSince')}</span>
                <span className="font-medium">2024</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('profile.personalInformation.title')}</CardTitle>
            <CardDescription>{t('profile.personalInformation.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">{t('profile.personalInformation.username')}</Label>
                  <Input id="username" defaultValue={user?.username} placeholder={t('profile.personalInformation.usernamePlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('profile.personalInformation.email')}</Label>
                  <Input id="email" type="email" defaultValue={user?.email} placeholder={t('profile.personalInformation.emailPlaceholder')} />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-3">{t('profile.changePassword.title')}</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">{t('profile.changePassword.currentPassword')}</Label>
                    <Input id="current-password" type="password" placeholder={t('profile.changePassword.currentPasswordPlaceholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{t('profile.changePassword.newPassword')}</Label>
                    <Input id="new-password" type="password" placeholder={t('profile.changePassword.newPasswordPlaceholder')} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline">{t('common.cancel')}</Button>
                <Button>{t('profile.saveChanges')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
