import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface EditNameDialogProps {
  conversationId: string;
  currentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EditNameDialog({ conversationId, currentName, isOpen, onClose }: EditNameDialogProps) {
  const [name, setName] = useState(currentName);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: newName }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update name");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Name updated",
        description: "Conversation name has been successfully updated.",
      });
      onClose();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to update name",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== currentName) {
      updateNameMutation.mutate(name.trim());
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] secure-content">
        <DialogHeader>
          <DialogTitle>Edit Conversation Name</DialogTitle>
          <DialogDescription>
            Change the name of this conversation. All members will see the new name.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Conversation name"
                required
                maxLength={50}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateNameMutation.isPending || !name.trim()}
            >
              {updateNameMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}