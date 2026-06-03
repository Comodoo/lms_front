'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, Lock, Settings2, ShieldAlert, Monitor, Globe, Mail, BookOpen, Smartphone } from 'lucide-react';

export default function InstructorSettingsPage() {
  const { user, updatePreferences, changePassword, enableTwoFactor, disableTwoFactor, deleteAccount } = useAuth();
  const { toast } = useToast();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'data'>('general');
  
  // Password State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 2FA State
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{secret?: string, qrCode?: string} | null>(null);

  // Delete Account State
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!user) return null;

  // --- Handlers ---

  const handleTogglePreference = (key: keyof typeof user.preferences) => {
    updatePreferences({ [key]: !user.preferences[key] });
    toast({
      title: "Preference Updated",
      description: "Your settings have been saved successfully.",
    });
  };

  const handleSelectPreference = (key: keyof typeof user.preferences, value: string) => {
    updatePreferences({ [key]: value });
    toast({
      title: "Preference Updated",
      description: "Your settings have been saved successfully.",
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    
    setIsChangingPassword(true);
    const result = await changePassword(passwords.current, passwords.new);
    setIsChangingPassword(false);

    if (result.success) {
      toast({ title: "Success", description: result.message });
      setPasswords({ current: '', new: '', confirm: '' });
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };

  const handleSetup2FA = async () => {
    const res = await enableTwoFactor();
    if (res.success) {
      setQrCodeData(res);
      setShowTwoFactorDialog(true);
    }
  };

  const handleDisable2FA = async () => {
    const res = await disableTwoFactor('123456'); // Mocking proper code entry for demo
    if (res.success) {
      toast({ title: "2FA Disabled", description: res.message });
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await deleteAccount(deletePassword);
    if (!res.success) {
      toast({ title: "Error", description: res.message, variant: "destructive" });
    }
  };

  // --- Render Tabs ---

  const renderGeneralTab = () => (
    <Card className="border-none shadow-sm animate-in fade-in duration-300">
      <CardHeader>
        <CardTitle>General Preferences</CardTitle>
        <CardDescription>Manage your language, timezone, and appearance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-muted-foreground"/> Language</Label>
              <p className="text-sm text-muted-foreground">Select your preferred language.</p>
            </div>
            <Select value={user.preferences.language} onValueChange={(val) => handleSelectPreference('language', val)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English (US)</SelectItem>
                <SelectItem value="sw">Swahili</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2"><Monitor className="w-4 h-4 text-muted-foreground"/> Theme</Label>
              <p className="text-sm text-muted-foreground">Customize your UI theme.</p>
            </div>
            <Select value={user.preferences.theme} onValueChange={(val) => handleSelectPreference('theme', val)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System Default</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderNotificationsTab = () => (
    <Card className="border-none shadow-sm animate-in fade-in duration-300">
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Control how and when you receive alerts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50 dark:bg-slate-900/50">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-primary"/> Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive system alerts and updates via email.</p>
            </div>
            <Switch 
              checked={user.preferences.emailNotifications} 
              onCheckedChange={() => handleTogglePreference('emailNotifications')}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50 dark:bg-slate-900/50">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary"/> Course Reminders</Label>
              <p className="text-sm text-muted-foreground">Get notified about upcoming classes or pending results.</p>
            </div>
            <Switch 
              checked={user.preferences.courseReminders} 
              onCheckedChange={() => handleTogglePreference('courseReminders')}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4 bg-slate-50 dark:bg-slate-900/50">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold flex items-center gap-2"><Smartphone className="w-4 h-4 text-primary"/> Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive push notifications on your mobile device.</p>
            </div>
            <Switch 
              checked={user.preferences.pushNotifications} 
              onCheckedChange={() => handleTogglePreference('pushNotifications')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Ensure your account is using a long, random password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input 
                id="current" type="password" required 
                value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input 
                id="new" type="password" required minLength={8}
                value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input 
                id="confirm" type="password" required minLength={8}
                value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})}
              />
            </div>
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          <CardDescription>Add additional security to your account using an authenticator app.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border dark:bg-slate-900/50">
            <div>
              <p className="font-semibold text-sm">Authenticator App</p>
              <p className="text-sm text-muted-foreground">
                {user.twoFactorEnabled 
                  ? 'Two-factor authentication is currently enabled.' 
                  : 'Protect your account with a one-time password.'}
              </p>
            </div>
            {user.twoFactorEnabled ? (
              <Button variant="outline" onClick={handleDisable2FA} className="text-destructive hover:text-destructive">Disable 2FA</Button>
            ) : (
              <Button onClick={handleSetup2FA}>Enable 2FA</Button>
            )}
          </div>

          <Dialog open={showTwoFactorDialog} onOpenChange={setShowTwoFactorDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                <DialogDescription>
                  Scan this QR code with your authenticator app to enable 2FA. (Mock Data)
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center p-6 bg-white rounded-lg">
                <div className="w-48 h-48 bg-slate-200 border-2 border-dashed flex items-center justify-center text-slate-500">
                  [ QR Code Image ]
                </div>
              </div>
              <p className="text-center font-mono text-sm">{qrCodeData?.secret}</p>
              <DialogFooter>
                <Button onClick={() => {
                  toast({title: "Success", description: "2FA Enabled successfully! (Demo)"});
                  updatePreferences({ }); // trigger re-render
                  setShowTwoFactorDialog(false);
                }}>Confirm Setup</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );

  const renderDataTab = () => (
    <Card className="border-none shadow-sm border-destructive/20 animate-in fade-in duration-300">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Danger Zone</CardTitle>
        <CardDescription>Irreversible and destructive actions for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5">
          <div>
            <p className="font-semibold text-sm">Delete Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently remove your account and all associated data.
            </p>
          </div>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive">Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleDeleteAccount} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="delete-password">Please type your password to confirm:</Label>
                  <Input 
                    id="delete-password" type="password" required 
                    value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                  <Button type="submit" variant="destructive">Yes, delete my account</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );

  const tabsList = [
    { id: 'general', label: 'General', icon: Settings2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Login', icon: Lock },
    { id: 'data', label: 'Data & Privacy', icon: ShieldAlert },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {tabsList.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50'
                  }
                `}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && renderGeneralTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'data' && renderDataTab()}
        </div>
      </div>
    </div>
  );
}
