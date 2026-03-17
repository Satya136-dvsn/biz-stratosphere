// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { Building2, Search, Filter, Mail, Calendar, Trash2, CheckCircle2, MoreVertical, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const AdminInquiries = () => {
  const { notifications, isLoading, markAsRead } = useNotifications();
  const [searchTerm, setSearchTerm] = useState("");

  const salesInquiries = notifications.filter(
    (n) => n.type === "sales_inquiry"
  );

  const filteredInquiries = salesInquiries.filter(
    (n) =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const InquiryCard = ({ inquiry }: { inquiry: Notification }) => {
    // Parse message if it's JSON-like (ContactSales sends structured text)
    // Example: "Enterprise Lead: Name (email). Type: Infrastructure. Requirements: ..."
    const isNew = !inquiry.read;

    return (
      <Card className={`group transition-all duration-300 hover:shadow-glow/20 ${isNew ? 'border-l-4 border-l-primary bg-primary/5' : 'bg-card/50 backdrop-blur-sm'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isNew ? 'bg-primary text-white shadow-glow' : 'bg-muted text-muted-foreground'}`}>
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {inquiry.title}
                  {isNew && <Badge variant="default" className="text-[10px] h-5 px-1.5 uppercase font-bold tracking-wider">New</Badge>}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(inquiry.created_at), "PPP p")}
                </CardDescription>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isNew && (
                  <DropdownMenuItem onClick={() => markAsRead(inquiry.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Contacted
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Archive Lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed whitespace-pre-wrap">
              {inquiry.message}
            </div>
            
            <div className="flex items-center gap-4">
              <Button size="sm" variant="outline" className="h-8 gap-2" asChild>
                <a href={`mailto:${inquiry.title.split('(')[1]?.split(')')[0] || ''}`}>
                  <Mail className="h-3.5 w-3.5" />
                  Reply via Email
                </a>
              </Button>
              <Button size="sm" variant="ghost" className="h-8 gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                CRM Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">
              Enterprise Leads
            </h1>
            <p className="text-muted-foreground text-lg mt-1">
              Manage incoming inquiries from sales and partnerships.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                className="pl-9 bg-card/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : filteredInquiries.length > 0 ? (
          <div className="grid gap-6">
            {filteredInquiries.map((inquiry) => (
              <InquiryCard key={inquiry.id} inquiry={inquiry} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card/20 rounded-3xl border border-dashed border-border">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold">No inquiries found</h2>
            <p className="text-muted-foreground mt-2 max-w-sm">
              Your enterprise pipeline is clear! All inquiries have been reviewed or none have been submitted yet.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
