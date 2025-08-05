import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users, Building, Mail, Settings, Crown, ArrowLeft, MessageSquare, LogOut, Key, Filter, Trash2, Edit, AlertTriangle, UserPlus, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import CreateWorkforceDialog from "@/components/Workforce/CreateWorkforceDialog";
import InviteMemberDialog from "@/components/Workforce/InviteMemberDialog";
import MemberProfileModal from "@/components/Workforce/MemberProfileModal";

interface Workforce {
  id: string;
  name: string;
  description?: string;
  emailDomain: string;
  emailProvider: string;
  emailSettings?: any;
  masterId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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

interface UserWorkforceMembership {
  workforceId: string;
  workforceName: string;
  role: string;
  membershipId: string;
}

export default function WorkforceDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateWorkforce, setShowCreateWorkforce] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [selectedWorkforce, setSelectedWorkforce] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorkforceMember | null>(null);
  const [showMemberProfile, setShowMemberProfile] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [workforceFilter, setWorkforceFilter] = useState<string>("all"); // "all" or specific workforce ID
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workforceToDelete, setWorkforceToDelete] = useState<Workforce | null>(null);
  const [showWorkforceEditDialog, setShowWorkforceEditDialog] = useState(false);
  const [workforceToEdit, setWorkforceToEdit] = useState<Workforce | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    emailDomain: '',
    emailProvider: ''
  });

  // Moderator simple name edit state
  const [showModeratorNameDialog, setShowModeratorNameDialog] = useState(false);
  const [moderatorWorkforceName, setModeratorWorkforceName] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch user's workforces (for master users)
  const { data: workforces = [] } = useQuery<Workforce[]>({
    queryKey: ['/api/workforces'],
    enabled: !!user && (user?.role === 'master' || user?.id === '45717668'),
  });

  // Fetch user's workforce membership for moderators
  const { data: userWorkforceMembership } = useQuery<UserWorkforceMembership>({
    queryKey: ['/api/user/workforce-membership'],
    enabled: !!user && user?.role === 'moderator',
  });

  // Fetch member counts for each workforce
  const workforceQueries = useQuery({
    queryKey: ['/api/workforces', 'member-counts'],
    queryFn: async () => {
      if (!workforces.length) return {};
      
      const memberCounts: Record<string, number> = {};
      await Promise.all(
        workforces.map(async (workforce) => {
          try {
            const response = await fetch(`/api/workforces/${workforce.id}/members`, {
              credentials: 'include'
            });
            if (response.ok) {
              const members = await response.json();
              memberCounts[workforce.id] = Array.isArray(members) ? members.length : 0;
            } else {
              memberCounts[workforce.id] = 0;
            }
          } catch (error) {
            memberCounts[workforce.id] = 0;
          }
        })
      );
      return memberCounts;
    },
    enabled: workforces.length > 0,
  });

  const memberCounts = workforceQueries.data || {};

  // Master users can see all workforces, moderators/users only see their own
  const availableWorkforces = user?.role === 'master' || user?.id === '45717668' 
    ? workforces 
    : userWorkforceMembership 
      ? [{ id: userWorkforceMembership.workforceId, name: userWorkforceMembership.workforceName }] 
      : [];

  // Set initial filter based on user role - moderators/users should default to their workforce
  React.useEffect(() => {
    if (user?.role === 'moderator' && userWorkforceMembership && workforceFilter === "all") {
      setWorkforceFilter(userWorkforceMembership.workforceId);
    }
  }, [user?.role, userWorkforceMembership, workforceFilter]);

  // Fetch workforce members based on user role and access
  const { data: workforceMembers = [] } = useQuery<WorkforceMember[]>({
    queryKey: ['/api/workforces', 'members', workforceFilter, user?.role],
    queryFn: async (): Promise<WorkforceMember[]> => {
      if (user?.role === 'master' || user?.id === '45717668') {
        // Master users can see all or filtered workforce members
        if (workforceFilter === "all") {
          const allMembers: WorkforceMember[] = [];
          for (const workforce of availableWorkforces) {
            try {
              const response = await fetch(`/api/workforces/${workforce.id}/members`, {
                credentials: 'include'
              });
              if (response.ok) {
                const members = await response.json();
                allMembers.push(...(Array.isArray(members) ? members : []));
              }
            } catch (error) {
              console.warn(`Failed to fetch members for workforce ${workforce.id}:`, error);
            }
          }
          return allMembers;
        } else {
          // Fetch specific workforce
          const response = await fetch(`/api/workforces/${workforceFilter}/members`, {
            credentials: 'include'
          });
          if (response.ok) {
            const members = await response.json();
            return Array.isArray(members) ? members : [];
          }
          return [];
        }
      } else if (user?.role === 'moderator' && userWorkforceMembership) {
        // Moderators can only see their own workforce members
        const response = await fetch(`/api/workforces/${userWorkforceMembership.workforceId}/members`, {
          credentials: 'include'
        });
        if (response.ok) {
          const members = await response.json();
          return Array.isArray(members) ? members : [];
        }
        return [];
      }
      return [];
    },
    enabled: !!user && (availableWorkforces.length > 0 || !!userWorkforceMembership),
  });

  // Create workforce mutation
  const createWorkforceMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      emailDomain: string;
      emailProvider: string;
      emailSettings: any;
    }) => {
      return await apiRequest('POST', '/api/workforces', {
        ...data,
        masterId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workforces'] });
      setShowCreateWorkforce(false);
      toast({
        title: "Success",
        description: "Workforce created successfully",
      });
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
        title: "Error",
        description: "Failed to create workforce",
        variant: "destructive",
      });
    },
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async (data: {
      workforceId: string;
      email: string;
      role: string;
    }) => {
      return await apiRequest('POST', `/api/workforces/${data.workforceId}/invite`, data);
    },
    onSuccess: () => {
      setShowInviteMember(false);
      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
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
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const handleCreateWorkforce = (data: {
    name: string;
    description: string;
    emailDomain: string;
    emailProvider: string;
    emailSettings: any;
  }) => {
    createWorkforceMutation.mutate(data);
  };

  const handleInviteMember = (data: {
    email: string;
    phoneNumber: string;
    role: string;
  }) => {
    if (!selectedWorkforce) return;
    inviteMemberMutation.mutate({
      workforceId: selectedWorkforce,
      ...data,
    });
  };

  const handleEditWorkforce = (workforce: Workforce) => {
    setWorkforceToEdit(workforce);
    setEditFormData({
      name: workforce.name,
      description: workforce.description || '',
      emailDomain: workforce.emailDomain,
      emailProvider: workforce.emailProvider
    });
    setShowWorkforceEditDialog(true);
  };

  const handleSaveWorkforceChanges = () => {
    if (workforceToEdit && editFormData.name.trim() && editFormData.emailDomain.trim() && editFormData.emailProvider.trim()) {
      updateWorkforceMutation.mutate({
        workforceId: workforceToEdit.id,
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || null,
        emailDomain: editFormData.emailDomain.trim(),
        emailProvider: editFormData.emailProvider.trim()
      });
    }
  };

  // Moderator simple name edit handlers
  const handleModeratorEditName = (workforce: { id: string; name: string }) => {
    setWorkforceToEdit(workforce as Workforce);
    setModeratorWorkforceName(workforce.name);
    setShowModeratorNameDialog(true);
  };

  const handleSaveModeratorName = () => {
    if (workforceToEdit && moderatorWorkforceName.trim()) {
      moderatorNameUpdateMutation.mutate({
        workforceId: workforceToEdit.id,
        name: moderatorWorkforceName.trim()
      });
    }
  };

  // Workforce status mutation
  const workforceStatusMutation = useMutation({
    mutationFn: async (data: { workforceId: string; isActive: boolean }) => {
      return await apiRequest('PATCH', `/api/workforces/${data.workforceId}/status`, {
        isActive: data.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workforces'] });
      toast({
        title: "Success",
        description: "Workforce status updated successfully",
      });
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
        title: "Error",
        description: "Failed to update workforce status",
        variant: "destructive",
      });
    },
  });

  // Update workforce mutation (comprehensive editing - Master Admin only)
  const updateWorkforceMutation = useMutation({
    mutationFn: async ({ workforceId, name, description, emailDomain, emailProvider }: { 
      workforceId: string; 
      name: string; 
      description: string | null;
      emailDomain: string; 
      emailProvider: string; 
    }) => {
      return await apiRequest('PATCH', `/api/workforces/${workforceId}`, { 
        name, 
        description, 
        emailDomain, 
        emailProvider 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workforces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/workforce-membership'] });
      setShowWorkforceEditDialog(false);
      setWorkforceToEdit(null);
      setEditFormData({
        name: '',
        description: '',
        emailDomain: '',
        emailProvider: ''
      });
      toast({
        title: "Success",
        description: "Workforce updated successfully",
      });
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
        title: "Error",
        description: "Failed to update workforce details",
        variant: "destructive",
      });
    },
  });

  // Moderator name update mutation (simple name-only editing)
  const moderatorNameUpdateMutation = useMutation({
    mutationFn: async ({ workforceId, name }: { workforceId: string; name: string }) => {
      return await apiRequest('PATCH', `/api/workforces/${workforceId}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workforces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/workforce-membership'] });
      setShowModeratorNameDialog(false);
      setWorkforceToEdit(null);
      setModeratorWorkforceName('');
      toast({
        title: "Success",
        description: "Workforce name updated successfully",
      });
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
        title: "Error",
        description: "Failed to update workforce name",
        variant: "destructive",
      });
    },
  });

  // Delete workforce mutation
  const deleteWorkforceMutation = useMutation({
    mutationFn: async (workforceId: string) => {
      return await apiRequest('DELETE', `/api/workforces/${workforceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workforces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workforces', 'member-counts'] });
      setShowDeleteConfirm(false);
      setWorkforceToDelete(null);
      setSelectedWorkforce(null); // Clear selection if the selected workforce was deleted
      toast({
        title: "Success",
        description: "Workforce deleted successfully",
      });
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
        title: "Error",
        description: "Failed to delete workforce",
        variant: "destructive",
      });
    },
  });

  // Member status mutation
  const memberStatusMutation = useMutation({
    mutationFn: async (data: { memberId: string; status: string }) => {
      console.log('Making API request to update member status:', data);
      return await apiRequest('PATCH', `/api/workforce-members/${data.memberId}/status`, {
        status: data.status,
      });
    },
    onSuccess: (data, variables) => {
      console.log('Member status update successful:', data);
      // Invalidate the correct query keys to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/workforces', selectedWorkforce, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workforces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workforces', 'member-counts'] });
      toast({
        title: "Success",
        description: "Member status updated successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Member status update failed:', error);
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
        title: "Error",
        description: `Failed to update member status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Password reset mutation
  const passwordResetMutation = useMutation({
    mutationFn: async (data: { userId: string }) => {
      return await apiRequest('POST', `/api/users/${data.userId}/reset-password`, {});
    },
    onSuccess: () => {
      setShowPasswordReset(false);
      setSelectedMember(null);
      setNewPassword("");
      toast({
        title: "Success",
        description: "Password reset instructions sent to user via SMS or email",
      });
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
        title: "Error",
        description: `Failed to send password reset: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleWorkforceStatusChange = (workforceId: string, isActive: boolean) => {
    workforceStatusMutation.mutate({ workforceId, isActive });
  };

  const handleMemberStatusChange = (memberId: string, status: string) => {
    console.log('Attempting to change member status:', { memberId, status });
    memberStatusMutation.mutate({ memberId, status });
  };

  const handlePasswordReset = (member: WorkforceMember) => {
    setSelectedMember(member);
    setShowPasswordReset(true);
  };

  const handlePasswordResetSubmit = () => {
    if (!selectedMember) return;
    passwordResetMutation.mutate({
      userId: selectedMember.user.id,
    });
  };

  const handleDeleteWorkforce = (workforce: Workforce) => {
    setWorkforceToDelete(workforce);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteWorkforce = () => {
    if (!workforceToDelete) return;
    deleteWorkforceMutation.mutate(workforceToDelete.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access for master users, admins, and moderators
  if (!user || (user?.role !== 'master' && user?.role !== 'admin' && user?.role !== 'moderator' && user?.id !== '45717668')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Access Required</h1>
          <p className="text-gray-600 dark:text-slate-400">You need administrator or moderator privileges to access the workforce dashboard.</p>
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-slate-500 mb-2">Current user: {user?.email || 'Not authenticated'}</p>
            <p className="text-sm text-gray-500 dark:text-slate-500">Role: {user?.role || 'None'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/admin">
            <Button variant="outline" className="flex items-center space-x-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-700">
              <ArrowLeft className="w-4 h-4" />
              <Crown className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>

          
          <div className="flex items-center gap-3">
            {/* Workforce Filter - only show for master users with multiple workforces */}
            {(user?.role === 'master' || user?.id === '45717668') && availableWorkforces.length > 1 && (
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                <Select value={workforceFilter} onValueChange={setWorkforceFilter}>
                  <SelectTrigger className="w-64 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600">
                    <SelectValue placeholder="Filter by workforce" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workforces ({workforceMembers.length} members)</SelectItem>
                    {availableWorkforces.map((workforce) => (
                      <SelectItem key={workforce.id} value={workforce.id}>
                        {workforce.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-slate-400">
              {user?.role === 'master' ? (
                <>
                  <Crown className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <span>Master User Dashboard</span>
                </>
              ) : user?.role === 'moderator' ? (
                <>
                  <Settings className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                  <span>Moderator Dashboard</span>
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <span>Admin Dashboard</span>
                </>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/api/logout"}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              {user?.role === 'master' ? (
                <Crown className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              ) : user?.role === 'moderator' ? (
                <Settings className="w-8 h-8 text-purple-500 dark:text-purple-400" />
              ) : (
                <Crown className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              )}
              {user?.role === 'moderator' ? 'Moderator Dashboard' : 'Workforce Dashboard'}
            </h1>
          </div>
          {user?.role === 'master' && (
            <Button onClick={() => setShowCreateWorkforce(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
              <Plus className="w-4 h-4" />
              Create Workforce
            </Button>
          )}
        </div>

        {/* Moderator Privileges Info */}
        {user?.role === 'moderator' && userWorkforceMembership && (
          <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Your Moderator Privileges
              </CardTitle>
              <CardDescription className="text-purple-700 dark:text-purple-300">
                As a moderator, you can invite both regular users and other moderators to your workforce.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-purple-800 dark:text-purple-200">
                      Workforce: {userWorkforceMembership.workforceName || 'Loading...'}
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Role: Moderator</p>
                  </div>
                  {userWorkforceMembership.workforceName && (
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleModeratorEditName({ 
                        id: userWorkforceMembership.workforceId, 
                        name: userWorkforceMembership.workforceName 
                      })}
                      className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
                      title="Edit workforce name"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Button 
                  onClick={() => {
                    setSelectedWorkforce(userWorkforceMembership.workforceId);
                    setShowInviteMember(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workforces List - Only show for Master users */}
        {user?.role === 'master' && (
          <Card className="mb-8 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
                <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Your Workforces
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-slate-400">Click on a workforce to view and manage its members</CardDescription>
            </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workforces.map((workforce) => (
                <div 
                  key={workforce.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-gray-200 dark:border-slate-600 ${
                    selectedWorkforce === workforce.id ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => setSelectedWorkforce(workforce.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100">{workforce.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-slate-300">{workforce.description}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                          <span className="text-xs text-gray-500 dark:text-slate-400">{workforce.emailDomain}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            {memberCounts[workforce.id] !== undefined ? `${memberCounts[workforce.id]} members` : 'Loading...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={workforce.isActive ? 'default' : 'destructive'}
                      className={workforce.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}
                    >
                      {workforce.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditWorkforce(workforce);
                      }}
                      className="text-yellow-600 hover:text-yellow-700 border-yellow-200 hover:border-yellow-300"
                      title="Edit workforce details"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={workforce.isActive ? 'destructive' : 'default'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWorkforceStatusChange(workforce.id, !workforce.isActive);
                      }}
                      disabled={workforceStatusMutation.isPending}
                      className={workforce.isActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                    >
                      {workforce.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkforce(workforce);
                      }}
                      disabled={deleteWorkforceMutation.isPending}
                      className="bg-red-800 hover:bg-red-900 text-white"
                      title="Delete workforce permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {workforces.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                  <Building className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">No workforces found</h3>
                  <p className="text-sm mb-4 text-gray-600 dark:text-slate-400">Create your first workforce to get started with team management.</p>
                  <Button onClick={() => setShowCreateWorkforce(true)} className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white">
                    <Plus className="w-4 h-4" />
                    Create First Workforce
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Moderator's Workforce Members */}
        {user?.role === 'moderator' && userWorkforceMembership && (
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Your Workforce Members
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-slate-400">
                    Manage members in {userWorkforceMembership.workforceName}
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setSelectedWorkforce(userWorkforceMembership.workforceId);
                    setShowInviteMember(true);
                  }}
                  size="sm" 
                  className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* This will use the same workforce members query but filtered for moderator's workforce */}
                {workforceMembers
                  .filter(member => member.workforceId === userWorkforceMembership.workforceId)
                  .map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1" 
                      onClick={() => {
                        setSelectedMember(member);
                        setShowMemberProfile(true);
                      }}
                    >
                      <div className="w-10 h-10 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {member.user.username?.charAt(0).toUpperCase() || member.user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          {member.user.username ? `@${member.user.username}` : member.user.email}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-slate-300">{member.user.email}</p>
                        {member.user.username && (
                          <p className="text-xs text-gray-400 dark:text-slate-500">Private username</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={member.role === 'moderator' ? 'default' : 'secondary'}
                        className={member.role === 'moderator' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}
                      >
                        {member.role === 'moderator' ? '⭐ Moderator' : '👤 User'}
                      </Badge>
                      <Badge 
                        variant={member.status === 'active' ? 'default' : 'destructive'}
                        className={member.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}
                      >
                        {member.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                      
                      {/* Management Action Buttons - Match Master Admin Style */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMember(member);
                          setShowPasswordReset(true);
                        }}
                        disabled={passwordResetMutation.isPending}
                        className="text-xs border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        <Key className="w-3 h-3 mr-1" />
                        Reset Password
                      </Button>
                      <Button
                        size="sm"
                        variant={member.status === 'active' ? 'destructive' : 'default'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMemberStatusChange(member.id, member.status === 'active' ? 'inactive' : 'active');
                        }}
                        disabled={memberStatusMutation.isPending}
                        className={`text-xs ${member.status === 'active' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                      >
                        {member.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
                {workforceMembers.filter(member => member.workforceId === userWorkforceMembership.workforceId).length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                    <Users className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-sm">No members found in your workforce.</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Use the Invite Member button to add team members.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Workforce Members - Only for Master users */}
        {user?.role === 'master' && selectedWorkforce && (
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
                    <Users className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    Workforce Members
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-slate-400">
                    {workforces.find(w => w.id === selectedWorkforce)?.name} team members
                  </CardDescription>
                </div>
                <Button onClick={() => setShowInviteMember(true)} size="sm" className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workforceMembers.filter(member => selectedWorkforce ? member.workforceId === selectedWorkforce : true).map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1" 
                      onClick={() => {
                        setSelectedMember(member);
                        setShowMemberProfile(true);
                      }}
                    >
                      <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {member.user.username?.charAt(0).toUpperCase() || member.user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          {member.user.username ? `@${member.user.username}` : member.user.email}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-slate-300">{member.user.email}</p>
                        {member.user.username && (
                          <p className="text-xs text-gray-400 dark:text-slate-500">Private username</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={member.role === 'moderator' ? 'default' : 'secondary'}
                        className={member.role === 'moderator' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}
                      >
                        {member.role === 'moderator' ? '⭐ Moderator' : '👤 User'}
                      </Badge>
                      <Badge variant={member.status === 'active' ? 'default' : 'destructive'} className={member.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}>
                        {member.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePasswordReset(member)}
                        disabled={passwordResetMutation.isPending}
                        className="text-xs border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                      >
                        <Key className="w-3 h-3 mr-1" />
                        Reset Password
                      </Button>
                      <Button
                        size="sm"
                        variant={member.status === 'active' ? 'destructive' : 'default'}
                        onClick={() => handleMemberStatusChange(member.id, member.status === 'active' ? 'inactive' : 'active')}
                        disabled={memberStatusMutation.isPending}
                        className={`text-xs ${member.status === 'active' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                      >
                        {member.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                ))}
                {workforceMembers.filter(member => selectedWorkforce ? member.workforceId === selectedWorkforce : true).length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                    <Users className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">No members yet</h3>
                    <p className="text-sm mb-4 text-gray-600 dark:text-slate-400">Invite team members to start collaborating.</p>
                    <Button onClick={() => setShowInviteMember(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Invite First Member
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <CreateWorkforceDialog
          open={showCreateWorkforce}
          onOpenChange={setShowCreateWorkforce}
          onSubmit={handleCreateWorkforce}
          isLoading={createWorkforceMutation.isPending}
        />

        {selectedWorkforce && (
          <InviteMemberDialog
            open={showInviteMember}
            onOpenChange={setShowInviteMember}
            onSubmit={handleInviteMember}
            isLoading={inviteMemberMutation.isPending}
            workforceId={selectedWorkforce}
          />
        )}

        {/* Member Profile Modal */}
        <MemberProfileModal
          member={selectedMember}
          open={showMemberProfile}
          onOpenChange={setShowMemberProfile}
          currentUserRole={user?.role || undefined}
        />

        {/* Password Reset Dialog */}
        <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
          <DialogContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
                <Key className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Reset Password
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-slate-400">
                Send password reset instructions to{" "}
                <span className="font-medium">
                  {selectedMember?.user.username ? `@${selectedMember.user.username}` : selectedMember?.user.email}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-medium text-orange-900 dark:text-orange-100 mb-1">
                      Send Reset Instructions
                    </h5>
                    <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                      This will send password reset instructions to the user via SMS or email. The user can then create their own new password securely.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPasswordReset(false);
                          setSelectedMember(null);
                          setNewPassword("");
                        }}
                        className="border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePasswordResetSubmit}
                        disabled={passwordResetMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white"
                      >
                        {passwordResetMutation.isPending ? "Sending..." : "Send Reset Instructions"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Workforce Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                Delete Workforce
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-slate-400">
                Are you sure you want to permanently delete{" "}
                <span className="font-medium text-red-800 dark:text-red-200">
                  {workforceToDelete?.name}
                </span>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-medium text-red-900 dark:text-red-100 mb-1">
                      Permanent Deletion
                    </h5>
                    <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                      This will permanently delete the workforce and all associated member data. 
                      Members will lose access to this workforce immediately.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setWorkforceToDelete(null);
                        }}
                        className="border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={confirmDeleteWorkforce}
                        disabled={deleteWorkforceMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
                      >
                        {deleteWorkforceMutation.isPending ? "Deleting..." : "Delete Workforce"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Moderator Simple Name Edit Dialog */}
        <Dialog open={showModeratorNameDialog} onOpenChange={setShowModeratorNameDialog}>
          <DialogContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
                <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Edit Workforce Name
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-slate-400">
                Update the name of your workforce. This will be visible to all members.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="moderator-workforce-name" className="text-gray-900 dark:text-slate-100">Workforce Name</Label>
                <Input
                  id="moderator-workforce-name"
                  value={moderatorWorkforceName}
                  onChange={(e) => setModeratorWorkforceName(e.target.value)}
                  placeholder="Enter workforce name"
                  className="mt-1 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowModeratorNameDialog(false)}
                  className="border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveModeratorName}
                  disabled={!moderatorWorkforceName.trim() || moderatorNameUpdateMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white"
                >
                  {moderatorNameUpdateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Master Admin Comprehensive Workforce Edit Dialog */}
        <Dialog open={showWorkforceEditDialog} onOpenChange={setShowWorkforceEditDialog}>
          <DialogContent className="max-w-2xl bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
                <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Edit Workforce Details
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-slate-400">
                Update workforce information. All fields are required except description.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-workforce-name" className="text-gray-900 dark:text-slate-100">Workforce Name *</Label>
                  <Input
                    id="edit-workforce-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter workforce name"
                    className="mt-1 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-workforce-description" className="text-gray-900 dark:text-slate-100">Description</Label>
                  <Input
                    id="edit-workforce-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    className="mt-1 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-email-domain" className="text-gray-900 dark:text-slate-100">Email Domain *</Label>
                  <Input
                    id="edit-email-domain"
                    value={editFormData.emailDomain}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, emailDomain: e.target.value }))}
                    placeholder="e.g., company.com"
                    className="mt-1 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email-provider" className="text-gray-900 dark:text-slate-100">Email Provider *</Label>
                  <Select
                    value={editFormData.emailProvider}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, emailProvider: value }))}
                  >
                    <SelectTrigger className="mt-1 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100">
                      <SelectValue placeholder="Select email provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600">
                      <SelectItem value="microsoft" className="text-gray-900 dark:text-slate-100">Microsoft Office 365</SelectItem>
                      <SelectItem value="google" className="text-gray-900 dark:text-slate-100">Google Workspace</SelectItem>
                      <SelectItem value="godaddy" className="text-gray-900 dark:text-slate-100">GoDaddy Email</SelectItem>
                      <SelectItem value="other" className="text-gray-900 dark:text-slate-100">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowWorkforceEditDialog(false)}
                className="border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveWorkforceChanges}
                disabled={
                  !editFormData.name.trim() || 
                  !editFormData.emailDomain.trim() || 
                  !editFormData.emailProvider.trim() || 
                  updateWorkforceMutation.isPending
                }
                className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white"
              >
                {updateWorkforceMutation.isPending ? "Updating..." : "Update Workforce"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}