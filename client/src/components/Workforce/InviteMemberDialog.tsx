import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    workforceId: string;
    email: string;
    phoneNumber: string;
    role: string;
  }) => void;
  workforceId: string;
  isLoading?: boolean;
}

export default function InviteMemberDialog({
  open,
  onOpenChange,
  onSubmit,
  workforceId,
  isLoading = false,
}: InviteMemberDialogProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("user");

  // Check if current user can invite moderators
  const canInviteModerators = user?.role === 'master' || user?.role === 'admin' || user?.role === 'moderator';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !phoneNumber || !workforceId) {
      return;
    }

    onSubmit({
      workforceId,
      email,
      phoneNumber,
      role,
    });

    // Reset form
    setEmail("");
    setPhoneNumber("");
    setRole("user");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-slate-100">Invite Team Member</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-slate-400">
              Send an invitation to join this workforce organization.
              {canInviteModerators && (
                <span className="block mt-1 text-sm font-medium text-purple-600 dark:text-purple-400">
                  As a {user?.role === 'moderator' ? 'moderator' : user?.role}, you can invite both users and moderators.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right text-gray-900 dark:text-slate-100">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@company.com"
                className="col-span-3 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right text-gray-900 dark:text-slate-100">
                Phone
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(555) 123-4567"
                className="col-span-3 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right text-gray-900 dark:text-slate-100">
                Role
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="col-span-3 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100">
                  <SelectValue placeholder="Select member role" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600">
                  <SelectItem value="user" className="text-gray-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700">Regular User</SelectItem>
                  {canInviteModerators && (
                    <SelectItem value="moderator" className="text-gray-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700">
                      <span className="flex items-center">
                        Moderator
                        <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">(Can manage content & invite others)</span>
                      </span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !email || !phoneNumber} className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white">
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}