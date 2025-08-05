import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Crown, 
  Users, 
  Key, 
  Phone,
  Edit3,
  Save,
  X,
  UserX
} from "lucide-react";

interface WorkforceMember {
  id: string;
  workforceId: string;
  userId: string;
  role: string;
  joinedAt: string;
  status: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    username?: string;
    phoneNumber?: string;
  };
}

interface MemberProfileModalProps {
  member: WorkforceMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserRole?: string;
}

export default function MemberProfileModal({ 
  member, 
  open, 
  onOpenChange, 
  currentUserRole 
}: MemberProfileModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(member?.role || "member");

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { userId: string }) => {
      return await apiRequest('POST', `/api/users/${data.userId}/reset-password`, {});
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Sent",
        description: "Password reset instructions have been sent to the user via SMS or email.",
      });
      setShowPasswordReset(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      return await apiRequest('POST', `/api/users/${data.userId}/role`, {
        role: data.role
      });
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "Member role has been updated successfully.",
      });
      setIsEditingRole(false);
      queryClient.invalidateQueries({ queryKey: ['/api/workforces'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
      setSelectedRole(member?.role || "member");
    },
  });

  const deactivateMemberMutation = useMutation({
    mutationFn: async (data: { memberId: string; status: string }) => {
      return await apiRequest('PATCH', `/api/workforce-members/${data.memberId}/status`, {
        status: data.status
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: `Member ${variables.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workforces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/demo/workforce-members'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update member status",
        variant: "destructive",
      });
    },
  });

  if (!member) return null;

  const handlePasswordReset = () => {
    resetPasswordMutation.mutate({ userId: member.userId });
  };

  const handleRoleUpdate = () => {
    if (selectedRole !== member.role) {
      updateRoleMutation.mutate({ userId: member.userId, role: selectedRole });
    } else {
      setIsEditingRole(false);
    }
  };

  const handleDeactivateToggle = () => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    deactivateMemberMutation.mutate({ 
      memberId: member.id, 
      status: newStatus 
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'master': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': 
      case 'moderator': return <Shield className="w-4 h-4 text-purple-500" />;
      default: return <User className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'master': 
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Master Admin</Badge>;
      case 'admin':
      case 'moderator': 
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Moderator</Badge>;
      default: 
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Member</Badge>;
    }
  };

  const canManageUser = currentUserRole === 'master' || 
    (currentUserRole === 'admin' && (member.role === 'member' || member.role === 'user'));



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {member.user.firstName?.charAt(0) || member.user.username?.charAt(0) || member.user.email?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                {member.user.email}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {getRoleIcon(member.role)}
                {getRoleBadge(member.role)}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Actions */}
          {canManageUser && (
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Account Actions
                </h4>
                <div className="space-y-4">
                  {/* Password Reset */}
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Key className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-orange-900 dark:text-orange-100 mb-1">
                          Send Password Reset
                        </h5>
                        <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                          This will send password reset instructions to the user via SMS or email. The user can then create their own new password.
                        </p>
                        <Button
                          onClick={handlePasswordReset}
                          disabled={resetPasswordMutation.isPending}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {resetPasswordMutation.isPending ? "Sending..." : "Send Reset Instructions"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Deactivate Account */}
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <UserX className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-red-900 dark:text-red-100 mb-1">
                          {member.status === 'active' ? 'Deactivate Member' : 'Activate Member'}
                        </h5>
                        <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                          {member.status === 'active' 
                            ? 'This will temporarily disable the member\'s account. They will not be able to access SKRAM until reactivated.'
                            : 'This will restore the member\'s account access. They will be able to use SKRAM again.'
                          }
                        </p>
                        <Button
                          variant="destructive"
                          onClick={handleDeactivateToggle}
                          disabled={deactivateMemberMutation.isPending}
                          className={`${
                            member.status === 'active' 
                              ? 'bg-red-600 hover:bg-red-700 text-white' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {deactivateMemberMutation.isPending 
                            ? (member.status === 'active' ? 'Deactivating...' : 'Activating...')
                            : (member.status === 'active' ? 'Deactivate Account' : 'Activate Account')
                          }
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}