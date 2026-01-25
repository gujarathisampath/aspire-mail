"use client";

import { useState } from "react";
import { Folder } from "@/lib/generated/prisma/client";
import { createFolder, deleteFolder, updateFolder } from "@/lib/actions/user-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Folder as FolderIcon, 
  Pencil, 
  Trash2, 
  Plus, 
  MoreHorizontal,
  Cloud,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
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
} from "@/components/ui/alert";

interface FolderSettingsProps {
  initialFolders: Folder[];
}

export function FolderSettings({ initialFolders }: FolderSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Folders</h2>
          <p className="text-sm text-muted-foreground">
            Create custom folders on your mail server to organize emails.
          </p>
        </div>
        <AddFolderDialog />
      </div>

      {/* Info Banner */}
      <Alert>
        <Cloud className="h-4 w-4" />
        <AlertDescription>
          Folders are synced with your IMAP mail server. Changes will appear in all your email clients.
        </AlertDescription>
      </Alert>

      {/* Folder List */}
      {initialFolders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {initialFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg">
      <FolderIcon className="w-10 h-10 text-muted-foreground mb-3" />
      <h3 className="font-medium mb-1">No custom folders</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
        Create folders to organize your emails.
      </p>
      <AddFolderDialog />
    </div>
  );
}

function FolderCard({ folder }: { folder: Folder }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this folder? Emails inside may be permanently deleted.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteFolder(folder.id);
      toast.success("Folder deleted from server");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <FolderIcon className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{folder.name}</p>
          {folder.icon && (
            <p className="text-xs text-muted-foreground">Icon: {folder.icon}</p>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <EditFolderDialog folder={folder} onClose={() => setIsEditOpen(false)} />
      </Dialog>
    </div>
  );
}

function AddFolderDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await createFolder({ name, icon });
      toast.success("Folder created on server");
      setOpen(false);
      setName("");
      setIcon("");
    } catch (e: any) {
      setError(e.message || "Failed to create folder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Folder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
          <DialogDescription>
            This folder will be created on your mail server.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Folder Name *</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="e.g., Work" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon">Icon Name (optional)</Label>
            <Input 
              id="icon" 
              value={icon} 
              onChange={(e) => setIcon(e.target.value)} 
              placeholder="e.g., briefcase" 
            />
            <p className="text-xs text-muted-foreground">
              Lucide icon name for display in sidebar
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditFolderDialog({ folder, onClose }: { folder: Folder; onClose: () => void }) {
  const [name, setName] = useState(folder.name);
  const [icon, setIcon] = useState(folder.icon || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await updateFolder(folder.id, { name, icon });
      toast.success("Folder updated");
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to update folder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Rename Folder</DialogTitle>
        <DialogDescription>
          The folder will be renamed on your mail server.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="edit-name">Folder Name *</Label>
          <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-icon">Icon Name</Label>
          <Input id="edit-icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
