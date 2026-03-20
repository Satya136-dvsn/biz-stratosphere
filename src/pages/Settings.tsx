import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UsageQuotas } from "@/components/settings/UsageQuotas";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { AIProviderSettings } from "@/components/settings/AIProviderSettings";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Save, 
  Palette, 
  Moon, 
  Sun, 
  Download, 
  FileText, 
  Trash2, 
  Lock, 
  CreditCard, 
  Brain,
  ChevronRight,
  Sparkles,
  Fingerprint,
  Settings as SettingsIcon,
  ShieldCheck,
  Zap,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { PageLayout } from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { passwordSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isExporting, setIsExporting] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    reports: true,
    alerts: true,
    loginConfirmation: true,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('login_notifications_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setNotifications(prev => ({
          ...prev,
          loginConfirmation: profile.login_notifications_enabled ?? true
        }));
      }
    };

    fetchPreferences();
  }, []);

  const handleChangePassword = async () => {
    // Feature: Profile update (Backend pending)
    toast({ title: "Coming Soon", description: "Profile updates will be available in the next release." });
    console.log('Saving profile...');
  };

  const handleChangePassword = async () => {
    try {
      if (newPassword !== confirmPassword) {
        toast({
          title: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }

      // Validate password strength
      try {
        passwordSchema.parse(newPassword);
      } catch (error: any) {
        toast({
          title: "Weak Password",
          description: error.issues?.[0]?.message || "Password does not meet requirements",
          variant: "destructive",
        });
        return;
      }

      setPasswordLoading(true);

      // Verify current password by signing in (re-authentication)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Incorrect current password");
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          login_notifications_enabled: notifications.loginConfirmation,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({ 
        title: "Preferences Saved", 
        description: "Security notification protocols updated successfully." 
      });
      console.log('Saved notifications to profile:', notifications);
    } catch (err: any) {
      console.error('Failed to save notification preferences:', err);
      toast({ 
        title: "Save Failed", 
        description: err.message || "Could not synchronize security protocols.", 
        variant: "destructive" 
      });
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const { data, error } = await supabase.functions.invoke('gdpr-export');

      if (error) throw error;

      // Trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `biz-stratosphere-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: "Your personal data has been securely exported.",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Could not generate functionality export. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageLayout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase tracking-widest">SYSTEM_CONFIG</h1>
            </div>
            <p className="text-muted-foreground font-medium text-sm">
              Global override parameters and autonomous agent preferences.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono text-[10px] py-1 px-3">
                SECURE_MODE: ACTIVE
             </Badge>
          </div>
        </div>

        <Tabs defaultValue="account" orientation="vertical" className="flex flex-col md:flex-row gap-10 w-full max-w-7xl mx-auto items-start">
          <TabsList className="flex flex-col h-auto w-full md:w-72 bg-transparent space-y-2 p-0 justify-start items-stretch sticky top-6">
            <TabsTrigger 
              value="account" 
              className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 hover:bg-muted/10 text-muted-foreground/60"
            >
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Identity_Core</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
            </TabsTrigger>

            <TabsTrigger 
              value="ai-provider" 
              className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 hover:bg-muted/10 text-muted-foreground/60"
            >
              <div className="flex items-center gap-3">
                <Brain className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Neural_Engine</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
            </TabsTrigger>

            <TabsTrigger 
              value="notifications" 
              className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 hover:bg-muted/10 text-muted-foreground/60"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Alert_Protocols</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
            </TabsTrigger>

            <TabsTrigger 
              value="appearance" 
              className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 hover:bg-muted/10 text-muted-foreground/60"
            >
              <div className="flex items-center gap-3">
                <Palette className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Visual_Skin</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
            </TabsTrigger>

            <TabsTrigger 
              value="security" 
              className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 hover:bg-muted/10 text-muted-foreground/60"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Defensive_Grid</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
            </TabsTrigger>

            <TabsTrigger 
              value="privacy" 
              className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 hover:bg-muted/10 text-muted-foreground/60"
            >
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Data_Lockdown</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
            </TabsTrigger>

            <TabsTrigger 
              value="usage" 
              className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 hover:bg-muted/10 text-muted-foreground/60"
            >
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Resource_Nodes</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
            </TabsTrigger>

            <TabsTrigger 
              value="subscription" 
              className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:border-primary/20 data-[state=active]:text-primary transition-all duration-300 hover:bg-muted/10 text-muted-foreground/60"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 group-data-[state=active]:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-wider">Ops_License</span>
              </div>
              <ChevronRight className="h-3 w-3 opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 max-w-4xl w-full translate-y-0 opacity-100 transition-all duration-500">
            {/* Account Settings */}
          <TabsContent value="account" className="space-y-6 mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="bg-card/50 backdrop-blur-xl border border-border shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-transparent" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <Fingerprint className="h-4 w-4 text-primary" />
                   PROFILE_SYNOPSIS
                </CardTitle>
                <CardDescription className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/40">OPERATOR_IDENTITY_DESCRIPTORS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">DISPLAY_LABEL</Label>
                  <Input
                    id="name"
                    defaultValue={user?.user_metadata?.display_name || ""}
                    placeholder="Enter branding name"
                    className="h-11 bg-muted/50 border-input focus-visible:ring-primary/20"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">NODE_ADDRESS</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email || ""}
                    disabled
                    className="h-11 bg-muted/20 border-border/10 text-muted-foreground/50 font-mono italic"
                  />
                  <p className="text-[10px] text-muted-foreground/40 font-mono tracking-tighter">
                    NODE_ADDRESS_IS_IMMUTABLE_FOR_CURRENT_EPOCH
                  </p>
                </div>
                <Separator className="bg-border" />
                <Button onClick={handleSaveProfile} className="h-11 px-8 font-bold uppercase tracking-widest text-[10px] bg-primary text-primary-foreground hover:scale-[1.02] transition-transform">
                  <Save className="mr-2 h-4 w-4" />
                  COMMIT_IDENTITY
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6 mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="bg-card/50 backdrop-blur-xl border border-border shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary/40 to-transparent" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <Bell className="h-4 w-4 text-secondary" />
                   FEEDBACK_CHANNELS
                </CardTitle>
                <CardDescription className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/40">EVENT_DOCKING_PREFERENCES</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 group">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">EMAIL_TRANSMISSION</Label>
                    <p className="text-xs text-muted-foreground/60 uppercase">DOCK_ALERTS_TO_REGISTERED_INBOX</p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10 group">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">BROWSER_PUSH</Label>
                    <p className="text-xs text-muted-foreground/60 uppercase">REALTIME_WEB_SOCKET_INTERRUPTS</p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, push: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 group">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">REPORT_GENERATION</Label>
                    <p className="text-xs text-muted-foreground/60 uppercase">NOTIFY_ON_ANALYTIC_SYNTHESIS_COMPLETION</p>
                  </div>
                  <Switch
                    checked={notifications.reports}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, reports: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 group">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">LOGIN_CONFIRMATION</Label>
                    <p className="text-xs text-muted-foreground/60 uppercase">SECURE_LOGIN_EVENT_NOTIFICATIONS</p>
                  </div>
                  <Switch
                    checked={notifications.loginConfirmation}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, loginConfirmation: checked })
                    }
                  />
                </div>
                <Separator className="bg-border" />
                <Button onClick={handleSaveNotifications} className="h-11 px-8 font-bold uppercase tracking-widest text-[10px] bg-secondary text-secondary-foreground hover:scale-[1.02] transition-transform">
                  <Save className="mr-2 h-4 w-4" />
                  SAVE_PROTOCOL
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6 mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="bg-card/50 backdrop-blur-xl border border-border shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/40 to-transparent" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <Zap className="h-4 w-4 text-emerald-500" />
                   HUD_CONFIGURATION
                </CardTitle>
                <CardDescription className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/40">VISUAL_INTERFACE_PARAMETERS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">COLOR_SPECTRUM_MODE</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="h-11 bg-muted/50 border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4 text-orange-400" />
                          <span className="font-mono text-xs uppercase">Solaris_Light</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4 text-primary" />
                          <span className="font-mono text-xs uppercase">Obsidian_Dark</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-xs uppercase">Auto_Sync_OS</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator className="bg-border" />
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <Label className="text-sm font-bold tracking-tight">DENSE_LAYOUT</Label>
                       <p className="text-[10px] text-muted-foreground/60 uppercase">MINIMIZE_INTERFACE_PADDING_AND_HUD_SPACING</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <Label className="text-sm font-bold tracking-tight">FLUID_TRANSITIONS</Label>
                       <p className="text-[10px] text-muted-foreground/60 uppercase">ENABLE_SMOOTH_CSS_ANIMATIONS_AND_GLASS_BLUR</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6 mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="bg-card/50 backdrop-blur-xl border border-border shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/40 to-transparent" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <ShieldCheck className="h-4 w-4 text-red-500" />
                   SECURITY_OVERRIDE
                </CardTitle>
                <CardDescription className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/40">PASSPHRASE_AND_GRID_HARDENING</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="current-password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">EXISTING_PHRASE</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-11 bg-muted/50 border-input focus-visible:ring-primary/20"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="new-password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">NEW_IDENT_KEY</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-11 bg-muted/50 border-input focus-visible:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="confirm-password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">CONFIRM_KEY</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-11 bg-muted/50 border-input focus-visible:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    className="h-11 px-8 font-bold uppercase tracking-widest text-[10px] bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02]"
                    onClick={handleChangePassword}
                    disabled={passwordLoading || !currentPassword || !newPassword}
                  >
                    {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="mr-2 h-4 w-4" />}
                    ROTATE_SECURITY_KEYS
                  </Button>
                </div>
                
                <Separator className="bg-border" />
                
                <div className="p-4 rounded-xl bg-muted/5 border border-dashed border-muted-foreground/20">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold tracking-tight uppercase">MULTI_FACTOR_AUTH</p>
                      <p className="text-[10px] text-muted-foreground/60 uppercase">HARDEN_ACCESS_WITH_TEMPORAL_CODES</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6 mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="bg-card/50 backdrop-blur-xl border border-border shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/40 to-transparent" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <Lock className="h-4 w-4 text-blue-500" />
                   DATA_SOVEREIGNTY
                </CardTitle>
                <CardDescription className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/40 font-mono">PORTABILITY_AND_RETENTION_POLICY</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex items-center justify-between p-6 rounded-2xl bg-primary/5 border border-primary/10 group">
                  <div className="space-y-1">
                    <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wide group-hover:text-primary transition-colors">
                      <FileText className="h-4 w-4 text-primary" />
                      GDPR_EXTRACT_REQUEST
                    </h3>
                    <p className="text-[10px] text-muted-foreground/60 uppercase max-w-sm font-medium">DENSE_SYNCHRONOUS_EXPORT_OF_ALL_NODE_RELATED_METADATA</p>
                  </div>
                  <Button variant="outline" onClick={handleExportData} disabled={isExporting} className="h-10 px-6 font-mono text-[10px] tracking-widest uppercase bg-background/50 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all">
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : "INIT_EXPORT"}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                    <Trash2 className="h-3 w-3" />
                    PURGE_PROTOCOL_STATUS
                  </div>
                  <div className="p-6 rounded-2xl bg-muted/5 border border-border space-y-4">
                    <p className="text-xs leading-relaxed text-muted-foreground uppercase font-medium">Standard retention is active: <strong className="text-foreground border-b border-foreground/20 italic">90_SOLAR_DAYS</strong>. Systems logs are automatically purged beyond this TTL.</p>
                    <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-muted-foreground/20 font-mono text-[9px] py-1 px-3">ENFORCED_GLOBAL_POLICY</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Settings */}
          <TabsContent value="usage" className="space-y-6 mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <UsageQuotas />
          </TabsContent>

          {/* AI Provider Settings */}
          <TabsContent value="ai-provider" className="space-y-6 mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <AIProviderSettings />
          </TabsContent>

          {/* Subscription Settings */}
          <TabsContent value="subscription" className="space-y-6 mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <SubscriptionSettings />
          </TabsContent>
          </div>
        </Tabs>
      </div>
    </PageLayout>
  );
}