// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Mail, 
  Building, 
  Briefcase, 
  Loader2, 
  Save, 
  Camera, 
  Upload, 
  ShieldCheck, 
  ShieldAlert, 
  Calendar,
  Sparkles,
  Command,
  Fingerprint,
  Lock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageLayout } from '@/components/layout/PageLayout';

export function Profile() {
  const { profile, loading, updating, error, updateProfile } = useProfile();
  const { toast } = useToast();

  // Form state
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setCompanyName(profile.company_name || '');
      setRoleTitle(profile.role || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    if (profile) {
      const changed =
        fullName !== (profile.full_name || '') ||
        bio !== (profile.bio || '') ||
        companyName !== (profile.company_name || '') ||
        roleTitle !== (profile.role || '');
      setHasChanges(changed);
    }
  }, [fullName, bio, companyName, roleTitle, profile]);

  const handleSave = async () => {
    const result = await updateProfile({
      full_name: fullName || null,
      bio: bio || null,
      company_name: companyName || null,
      role: roleTitle || null,
    });

    if (result.success) {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
      setHasChanges(false);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile?.user_id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl } as any)
        .eq('user_id', profile?.user_id);

      if (updateError) {
        throw updateError;
      }

      setAvatarUrl(data.publicUrl);
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setCompanyName(profile.company_name || '');
      setRoleTitle(profile.role || '');
      setHasChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
            <Loader2 className="h-10 w-10 text-primary animate-spin relative z-10" />
          </div>
          <span className="text-sm font-bold tracking-[0.2em] text-muted-foreground uppercase opacity-60">DECRYPTING_IDENTITY...</span>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center p-6">
        <Card className="w-full max-w-md bg-[hsl(220_18%_8%)] border-destructive/20 shadow-2xl">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-destructive/10 border border-destructive/20 mb-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground uppercase tracking-widest">INITIALIZATION_FAILURE</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-4 font-mono text-xs tracking-widest uppercase border-destructive/20">RETRY_LOAD</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageLayout>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[hsl(220_16%_12%)]">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Fingerprint className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-widest">IDENTITY_CORE</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl font-medium">
            Authorized node parameters for <span className="text-primary/80 font-mono">{profile?.email}</span>. Manage persona attributes and security descriptors.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mb-1">SYSTEM_STATUS</div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-[10px]">VERIFIED_OPERATOR</Badge>
          </div>
          <Separator orientation="vertical" className="h-10 bg-[hsl(220_16%_14%)]" />
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || updating}
            className={cn(
               "h-11 px-6 font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all duration-300 shadow-xl",
               hasChanges ? "bg-primary text-primary-foreground shadow-primary/20 hover:scale-[1.02]" : "opacity-50"
            )}
          >
            {updating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                <span>COMMIT_CHANGES</span>
              </div>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Avatar & Core Info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="relative overflow-hidden bg-[hsl(220_18%_7%)]/50 backdrop-blur-xl border border-[hsl(220_16%_12%)] shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-secondary/40 to-transparent" />
            <CardContent className="pt-10 pb-8 flex flex-col items-center">
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Avatar className="h-32 w-32 border-4 border-[hsl(220_16%_12%)] shadow-[0_0_40px_rgba(0,0,0,0.4)] relative z-10">
                  <AvatarImage src={avatarUrl || ''} alt={fullName} />
                  <AvatarFallback className="text-4xl font-black bg-[hsl(220_18%_10%)] text-primary">
                    {fullName?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <label 
                  htmlFor="avatar-upload" 
                  className={cn(
                    "absolute inset-0 bg-black/60 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 transform scale-95 group-hover:scale-100",
                    uploadingAvatar && "opacity-100"
                  )}
                >
                  {uploadingAvatar ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <Camera className="h-8 w-8 text-white" />}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </div>

              <div className="mt-8 text-center space-y-2">
                <h3 className="text-xl font-bold text-foreground leading-none">{fullName || 'IDENT_PENDING'}</h3>
                <p className="text-sm font-mono text-muted-foreground/60">{profile?.email}</p>
                <div className="pt-4 flex flex-wrap justify-center gap-2">
                  <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary/70 font-mono text-[9px] uppercase tracking-tighter">NODE_LVL: 04</Badge>
                  <Badge variant="outline" className="bg-secondary/5 border-secondary/20 text-secondary/70 font-mono text-[9px] uppercase tracking-tighter">ROLE: {roleTitle || 'ANALYST'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(220_18%_7%)]/50 border border-[hsl(220_16%_12%)] shadow-xl relative overflow-hidden">
            <CardHeader className="py-4 border-b border-[hsl(220_16%_12%)] bg-muted/5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                TEMPORAL_LOG
              </CardTitle>
            </CardHeader>
            <CardContent className="py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">INITIAL_INSTANTIATION</span>
                <span className="text-[11px] font-mono text-foreground/80">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <Separator className="bg-[hsl(220_16%_12%)]" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">LAST_SYNCHRONIZATION</span>
                <span className="text-[11px] font-mono text-foreground/80">
                  {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Forms */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="overflow-hidden bg-[hsl(220_18%_7%)]/50 backdrop-blur-xl border border-[hsl(220_16%_12%)] shadow-2xl relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Command className="h-24 w-24 text-primary" />
            </div>
            
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                 <Sparkles className="h-4 w-4 text-primary" />
                 CORE_ATTRIBUTES
              </CardTitle>
              <CardDescription className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/40 font-mono">OPERATOR_METADATA_PARAMETERS</CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-primary/50" />
                    IDENTIFIER_STRING
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Enter full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 bg-[hsl(220_18%_9%)] border-[hsl(220_16%_16%)] focus-visible:ring-primary/20 text-sm font-medium"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-primary/50" />
                    COMM_NODE_ADDRESS
                  </Label>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="h-11 bg-muted/20 border-border/10 text-sm font-mono text-muted-foreground/50 italic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="company" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-primary/50" />
                    ORGANIZATION_UNIT
                  </Label>
                  <Input
                    id="company"
                    placeholder="Company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-11 bg-[hsl(220_18%_9%)] border-[hsl(220_16%_16%)] focus-visible:ring-primary/20 text-sm font-medium"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-primary/50" />
                    FUNCTIONAL_DESIGNATION
                  </Label>
                  <Input
                    id="role"
                    placeholder="Role title"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="h-11 bg-[hsl(220_18%_9%)] border-[hsl(220_16%_16%)] focus-visible:ring-primary/20 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="bio" className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 flex items-center gap-2">
                  NEURAL_EXPOSITION / BIO
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Extended descriptor of the operator's focus areas..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="bg-[hsl(220_18%_9%)] border-[hsl(220_16%_16%)] focus-visible:ring-primary/20 text-sm font-medium resize-none leading-relaxed"
                />
              </div>

              <div className="pt-6 border-t border-[hsl(220_16%_14%)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500/60" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40 font-mono tracking-tighter">ENCRYPTION_LAYER: AES-256-ACTIVE</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={!hasChanges || updating}
                    className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 hover:bg-muted/10 font-mono"
                  >
                    RESET_FIELDS
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[hsl(220_18%_7%)] to-[hsl(220_18%_9%)] border border-primary/10 shadow-xl overflow-hidden group relative">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                  <Lock className="h-6 w-6" />
                </div>
                <div className="text-center sm:text-left">
                   <h4 className="font-bold text-base uppercase tracking-wider">SECURITY_PROTOCOL_ACTIVE</h4>
                   <p className="text-xs text-muted-foreground leading-snug font-medium">Multi-Factor Authentication and session hardening are currently enforced for this identity node.</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="font-mono text-[10px] tracking-widest uppercase border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors h-10 px-6">MANAGE_KEY</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}