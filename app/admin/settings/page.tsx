'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import {
  Settings, Globe, Mail, CreditCard, Bell, Shield, Database,
  Upload, Save, RefreshCw, AlertTriangle, CheckCircle, Smartphone,
  Building2, Palette, FileText, Users, BookOpen, DollarSign
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'EduPlatform Africa',
    tagline: 'Learn from the best African instructors',
    supportEmail: 'support@eduplatform.africa',
    contactPhone: '+254 700 123 456',
    defaultLanguage: 'en',
    defaultCurrency: 'USD',
    timezone: 'Africa/Nairobi',
    maintenanceMode: false,
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.mailgun.org',
    smtpPort: '587',
    smtpUsername: 'postmaster@eduplatform.africa',
    smtpPassword: '••••••••••••',
    fromEmail: 'noreply@eduplatform.africa',
    fromName: 'EduPlatform Africa',
    welcomeEmailEnabled: true,
    enrollmentEmailEnabled: true,
    completionEmailEnabled: true,
    marketingEmailEnabled: false,
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    mpesaEnabled: true,
    mpesaConsumerKey: '••••••••••••',
    mpesaConsumerSecret: '••••••••••••',
    mpesaShortcode: '174379',
    stripeEnabled: true,
    stripePublicKey: 'pk_live_••••••••',
    stripeSecretKey: 'sk_live_••••••••',
    paypalEnabled: false,
    paypalClientId: '',
    paypalSecret: '',
    platformFeePercent: 15,
    minimumPayout: 50,
    payoutFrequency: 'monthly',
  });

  // Course Settings
  const [courseSettings, setCourseSettings] = useState({
    requireApproval: true,
    autoPublish: false,
    maxFileSize: 500,
    allowedFormats: ['mp4', 'pdf', 'doc', 'docx', 'ppt', 'pptx'],
    maxCourseDuration: 100,
    minLessons: 5,
    refundPeriod: 30,
    enableReviews: true,
    enableCertificates: true,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newUserAlert: true,
    newCourseAlert: true,
    refundAlert: true,
    reportAlert: true,
    lowBalanceAlert: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleReset = () => {
    setShowResetDialog(false);
    // Reset to defaults would go here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Configure your platform settings and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          {saveMessage && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">{saveMessage}</span>
            </div>
          )}
          <Button variant="outline" onClick={() => setShowResetDialog(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Information</CardTitle>
              <CardDescription>Basic information about your platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={generalSettings.platformName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={generalSettings.tagline}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, tagline: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={generalSettings.contactPhone}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localization</CardTitle>
              <CardDescription>Language, currency, and timezone settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select
                    value={generalSettings.defaultLanguage}
                    onValueChange={(v) => setGeneralSettings({ ...generalSettings, defaultLanguage: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sw">Swahili</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select
                    value={generalSettings.defaultCurrency}
                    onValueChange={(v) => setGeneralSettings({ ...generalSettings, defaultCurrency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="TSH">TSH - Kenyan Shilling</SelectItem>
                      <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                      <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                      <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(v) => setGeneralSettings({ ...generalSettings, timezone: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                      <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                      <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                      <SelectItem value="Africa/Cairo">Africa/Cairo (EET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>Enable maintenance mode to take the platform offline temporarily</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Enable Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    When enabled, users will see a maintenance page instead of the platform
                  </p>
                </div>
                <Switch
                  checked={generalSettings.maintenanceMode}
                  onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, maintenanceMode: checked })}
                />
              </div>
              {generalSettings.maintenanceMode && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Maintenance Mode is Active</p>
                    <p className="text-sm text-yellow-700">
                      The platform is currently offline. Only admins can access the dashboard.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>Configure your email server settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">Username</Label>
                  <Input
                    id="smtpUsername"
                    value={emailSettings.smtpUsername}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                  />
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  />
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure which emails are sent automatically</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Welcome Email</p>
                  <p className="text-sm text-muted-foreground">Send welcome email to new users</p>
                </div>
                <Switch
                  checked={emailSettings.welcomeEmailEnabled}
                  onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, welcomeEmailEnabled: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enrollment Confirmation</p>
                  <p className="text-sm text-muted-foreground">Send confirmation when users enroll in courses</p>
                </div>
                <Switch
                  checked={emailSettings.enrollmentEmailEnabled}
                  onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, enrollmentEmailEnabled: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Course Completion</p>
                  <p className="text-sm text-muted-foreground">Send email when users complete courses</p>
                </div>
                <Switch
                  checked={emailSettings.completionEmailEnabled}
                  onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, completionEmailEnabled: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">Allow sending marketing and promotional emails</p>
                </div>
                <Switch
                  checked={emailSettings.marketingEmailEnabled}
                  onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, marketingEmailEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    M-Pesa
                  </CardTitle>
                  <CardDescription>Safaricom M-Pesa payment integration</CardDescription>
                </div>
                <Switch
                  checked={paymentSettings.mpesaEnabled}
                  onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, mpesaEnabled: checked })}
                />
              </div>
            </CardHeader>
            {paymentSettings.mpesaEnabled && (
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Consumer Key</Label>
                    <Input
                      type="password"
                      value={paymentSettings.mpesaConsumerKey}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, mpesaConsumerKey: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Consumer Secret</Label>
                    <Input
                      type="password"
                      value={paymentSettings.mpesaConsumerSecret}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, mpesaConsumerSecret: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Business Shortcode</Label>
                  <Input
                    value={paymentSettings.mpesaShortcode}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, mpesaShortcode: e.target.value })}
                    className="max-w-xs"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Stripe
                  </CardTitle>
                  <CardDescription>Card payments via Stripe</CardDescription>
                </div>
                <Switch
                  checked={paymentSettings.stripeEnabled}
                  onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, stripeEnabled: checked })}
                />
              </div>
            </CardHeader>
            {paymentSettings.stripeEnabled && (
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Publishable Key</Label>
                    <Input
                      type="password"
                      value={paymentSettings.stripePublicKey}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, stripePublicKey: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <Input
                      type="password"
                      value={paymentSettings.stripeSecretKey}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, stripeSecretKey: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-purple-600" />
                    PayPal
                  </CardTitle>
                  <CardDescription>PayPal payment integration</CardDescription>
                </div>
                <Switch
                  checked={paymentSettings.paypalEnabled}
                  onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, paypalEnabled: checked })}
                />
              </div>
            </CardHeader>
            {paymentSettings.paypalEnabled && (
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Client ID</Label>
                    <Input
                      type="password"
                      value={paymentSettings.paypalClientId}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, paypalClientId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secret</Label>
                    <Input
                      type="password"
                      value={paymentSettings.paypalSecret}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, paypalSecret: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commission & Payouts</CardTitle>
              <CardDescription>Configure platform fees and instructor payouts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Platform Fee (%)</Label>
                  <Input
                    type="number"
                    value={paymentSettings.platformFeePercent}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, platformFeePercent: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Percentage taken from each sale</p>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Payout (USD)</Label>
                  <Input
                    type="number"
                    value={paymentSettings.minimumPayout}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, minimumPayout: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">Minimum amount for instructor payout</p>
                </div>
                <div className="space-y-2">
                  <Label>Payout Frequency</Label>
                  <Select
                    value={paymentSettings.payoutFrequency}
                    onValueChange={(v) => setPaymentSettings({ ...paymentSettings, payoutFrequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Course Settings */}
        <TabsContent value="courses" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Approval</CardTitle>
              <CardDescription>Configure how courses are published</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require Approval</p>
                  <p className="text-sm text-muted-foreground">
                    New courses must be approved by admin before publishing
                  </p>
                </div>
                <Switch
                  checked={courseSettings.requireApproval}
                  onCheckedChange={(checked) => setCourseSettings({ ...courseSettings, requireApproval: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-publish Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Allow updates to published courses without re-approval
                  </p>
                </div>
                <Switch
                  checked={courseSettings.autoPublish}
                  onCheckedChange={(checked) => setCourseSettings({ ...courseSettings, autoPublish: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content Limits</CardTitle>
              <CardDescription>Set limits for course content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Max File Size (MB)</Label>
                  <Input
                    type="number"
                    value={courseSettings.maxFileSize}
                    onChange={(e) => setCourseSettings({ ...courseSettings, maxFileSize: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Course Duration (hours)</Label>
                  <Input
                    type="number"
                    value={courseSettings.maxCourseDuration}
                    onChange={(e) => setCourseSettings({ ...courseSettings, maxCourseDuration: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Lessons</Label>
                  <Input
                    type="number"
                    value={courseSettings.minLessons}
                    onChange={(e) => setCourseSettings({ ...courseSettings, minLessons: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Allowed File Formats</Label>
                <div className="flex flex-wrap gap-2">
                  {courseSettings.allowedFormats.map(format => (
                    <Badge key={format} variant="secondary">.{format}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Features</CardTitle>
              <CardDescription>Enable or disable course features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Reviews</p>
                  <p className="text-sm text-muted-foreground">Allow students to leave reviews on courses</p>
                </div>
                <Switch
                  checked={courseSettings.enableReviews}
                  onCheckedChange={(checked) => setCourseSettings({ ...courseSettings, enableReviews: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Certificates</p>
                  <p className="text-sm text-muted-foreground">Issue certificates upon course completion</p>
                </div>
                <Switch
                  checked={courseSettings.enableCertificates}
                  onCheckedChange={(checked) => setCourseSettings({ ...courseSettings, enableCertificates: checked })}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Refund Period (days)</Label>
                <Input
                  type="number"
                  value={courseSettings.refundPeriod}
                  onChange={(e) => setCourseSettings({ ...courseSettings, refundPeriod: parseInt(e.target.value) })}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Number of days students can request a refund after purchase
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
              <CardDescription>Configure how notifications are delivered</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Send notifications via email</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Send browser push notifications</p>
                </div>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, pushNotifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Send SMS notifications (additional charges apply)</p>
                </div>
                <Switch
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, smsNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Alerts</CardTitle>
              <CardDescription>Choose which events trigger admin notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New User Registration</p>
                  <p className="text-sm text-muted-foreground">Alert when a new user signs up</p>
                </div>
                <Switch
                  checked={notificationSettings.newUserAlert}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newUserAlert: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Course Submission</p>
                  <p className="text-sm text-muted-foreground">Alert when a course is submitted for review</p>
                </div>
                <Switch
                  checked={notificationSettings.newCourseAlert}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, newCourseAlert: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Refund Request</p>
                  <p className="text-sm text-muted-foreground">Alert when a refund is requested</p>
                </div>
                <Switch
                  checked={notificationSettings.refundAlert}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, refundAlert: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Content Reports</p>
                  <p className="text-sm text-muted-foreground">Alert when content is reported</p>
                </div>
                <Switch
                  checked={notificationSettings.reportAlert}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, reportAlert: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Balance Alert</p>
                  <p className="text-sm text-muted-foreground">Alert when payout balance is low</p>
                </div>
                <Switch
                  checked={notificationSettings.lowBalanceAlert}
                  onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, lowBalanceAlert: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Settings</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset all settings to their default values? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

