"use client";

import { useState } from "react";
import { Identity } from "@/lib/generated/prisma/client";
import { createIdentity, deleteIdentity, updateIdentity, setDefaultIdentity } from "@/lib/actions/user-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  User, 
  Pencil, 
  Trash2, 
  Plus, 
  Star, 
  MoreHorizontal,
  Check,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface IdentitySettingsProps {
  initialIdentities: Identity[];
}

export function IdentitySettings({ initialIdentities }: IdentitySettingsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Identities</h2>
          <p className="text-sm text-muted-foreground">
            Manage sender profiles used when composing emails.
          </p>
        </div>
        <AddIdentityDialog />
      </div>

      {/* Info */}
      <Alert className="flex items-center">
        <AlertTitle>
          <User className="h-4 w-4"/>
        </AlertTitle>
        <AlertDescription className="ml-2">
          The default identity is used when sending new emails. Reply-to and auto-BCC settings are applied automatically.
        </AlertDescription>
      </Alert>

      {/* Identity List */}
      {initialIdentities.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {initialIdentities.map((identity) => (
            <IdentityCard key={identity.id} identity={identity} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg">
      <User className="w-10 h-10 text-muted-foreground mb-3" />
      <h3 className="font-medium mb-1">No identities</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
        Create an identity to personalize your sent emails.
      </p>
      <AddIdentityDialog />
    </div>
  );
}

function IdentityCard({ identity }: { identity: Identity }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this identity?")) return;
    
    setIsDeleting(true);
    try {
      await deleteIdentity(identity.id);
      toast.success("Identity deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async () => {
    try {
      await setDefaultIdentity(identity.id);
      toast.success("Default identity updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${identity.isDefault ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <User className="w-5 h-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{identity.name || identity.email}</p>
            {identity.isDefault && (
              <Badge variant="secondary" className="text-xs">
                <Check className="w-3 h-3 mr-1" />
                Default
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{identity.email}</p>
          {identity.replyTo && (
            <p className="text-xs text-muted-foreground">Reply-To: {identity.replyTo}</p>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!identity.isDefault && (
            <DropdownMenuItem onClick={handleSetDefault}>
              <Star className="w-4 h-4 mr-2" />
              Set as Default
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <EditIdentityDialog identity={identity} onClose={() => setIsEditOpen(false)} />
      </Dialog>
    </div>
  );
}

function AddIdentityDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [bcc, setBcc] = useState("");
  const [signature, setSignature] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await createIdentity({ name, email, replyTo, bcc, signature, isDefault });
      toast.success("Identity created");
      setOpen(false);
      setName(""); setEmail(""); setReplyTo(""); setBcc(""); setSignature(""); setIsDefault(false);
    } catch (e: any) {
      setError(e.message || "Failed to create identity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Identity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Identity</DialogTitle>
          <DialogDescription>
            Identity settings are used when sending emails.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="john@example.com" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="replyTo">Reply-To</Label>
              <Input id="replyTo" type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="replies@example.com" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bcc">Auto BCC</Label>
              <Input id="bcc" type="email" value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="archive@example.com" />
            </div>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="signature">Signature</Label>
            <Textarea 
              id="signature" 
              value={signature} 
              onChange={(e) => setSignature(e.target.value)} 
              placeholder="Best regards,&#10;John"
              rows={3}
            />
          </div>
          
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="default">Set as default</Label>
            <Switch id="default" checked={isDefault} onCheckedChange={setIsDefault} />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditIdentityDialog({ identity, onClose }: { identity: Identity; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [name, setName] = useState(identity.name || "");
  const [email, setEmail] = useState(identity.email);
  const [replyTo, setReplyTo] = useState(identity.replyTo || "");
  const [bcc, setBcc] = useState(identity.bcc || "");
  const [signature, setSignature] = useState(identity.signature || "");
  const [isDefault, setIsDefault] = useState(identity.isDefault);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await updateIdentity(identity.id, { name, email, replyTo, bcc, signature, isDefault });
      toast.success("Identity updated");
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to update identity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Identity</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="edit-name">Display Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-email">Email *</Label>
            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="edit-replyTo">Reply-To</Label>
            <Input id="edit-replyTo" type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-bcc">Auto BCC</Label>
            <Input id="edit-bcc" type="email" value={bcc} onChange={(e) => setBcc(e.target.value)} />
          </div>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="edit-signature">Signature</Label>
          <Textarea id="edit-signature" value={signature} onChange={(e) => setSignature(e.target.value)} rows={3} />
        </div>
        
        <div className="flex items-center justify-between py-2">
          <Label htmlFor="edit-default">Set as default</Label>
          <Switch id="edit-default" checked={isDefault} onCheckedChange={setIsDefault} />
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
