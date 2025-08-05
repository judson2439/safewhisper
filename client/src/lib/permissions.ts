// Workforce role-based permission system
export type WorkforceRole = 'user' | 'moderator' | 'master';
export type SystemRole = 'member' | 'admin' | 'master';

export interface PermissionContext {
  userSystemRole: SystemRole;
  userWorkforceRole?: WorkforceRole;
  isWorkforceMember?: boolean;
}

export class PermissionChecker {
  private context: PermissionContext;

  constructor(context: PermissionContext) {
    this.context = context;
  }

  // System-level permissions
  canManageWorkforces(): boolean {
    return this.context.userSystemRole === 'master';
  }

  canAccessWorkforceDashboard(): boolean {
    return this.context.userSystemRole === 'master';
  }

  // Workforce-level permissions
  canAddMembersToWorkforce(): boolean {
    if (this.context.userSystemRole === 'master') return true;
    return this.context.userWorkforceRole === 'moderator';
  }

  canChangeChatNames(): boolean {
    if (this.context.userSystemRole === 'master') return true;
    return this.context.userWorkforceRole === 'moderator';
  }

  canAddMembersToChats(): boolean {
    if (this.context.userSystemRole === 'master') return true;
    return this.context.userWorkforceRole === 'moderator';
  }

  canRemoveMembersFromChats(): boolean {
    if (this.context.userSystemRole === 'master') return true;
    return this.context.userWorkforceRole === 'moderator';
  }

  canCreateGroupChats(): boolean {
    if (this.context.userSystemRole === 'master') return true;
    return this.context.userWorkforceRole === 'moderator';
  }

  // Basic permissions available to all workforce members
  canSendMessages(): boolean {
    return this.context.isWorkforceMember || this.context.userSystemRole === 'master';
  }

  canSendDirectMessages(): boolean {
    return this.context.isWorkforceMember || this.context.userSystemRole === 'master';
  }

  canViewChats(): boolean {
    return this.context.isWorkforceMember || this.context.userSystemRole === 'master';
  }

  // Role display helpers
  getRoleDisplayName(): string {
    if (this.context.userSystemRole === 'master') return 'Master User';
    if (this.context.userWorkforceRole === 'moderator') return 'Moderator';
    return 'User';
  }

  getRoleBadgeVariant(): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (this.context.userSystemRole === 'master') return 'destructive';
    if (this.context.userWorkforceRole === 'moderator') return 'default';
    return 'secondary';
  }

  getRoleIcon(): string {
    if (this.context.userSystemRole === 'master') return '👑';
    if (this.context.userWorkforceRole === 'moderator') return '⭐';
    return '👤';
  }
}

// Utility function to create permission checker
export function createPermissionChecker(
  userSystemRole: SystemRole,
  userWorkforceRole?: WorkforceRole,
  isWorkforceMember?: boolean
): PermissionChecker {
  return new PermissionChecker({
    userSystemRole,
    userWorkforceRole,
    isWorkforceMember,
  });
}

// Permission constants for UI components
export const PERMISSION_DESCRIPTIONS = {
  user: {
    title: 'User',
    description: 'Can chat and direct message only',
    permissions: ['Send messages', 'Direct message', 'View chats']
  },
  moderator: {
    title: 'Moderator', 
    description: 'Can add members, change chat names, add to chats',
    permissions: [
      'All User permissions',
      'Add members to workforce',
      'Change chat names', 
      'Add members to chats',
      'Create group chats',
      'Remove members from chats'
    ]
  },
  master: {
    title: 'Master User',
    description: 'Full administrative control',
    permissions: [
      'All Moderator permissions',
      'Create workforces',
      'Manage workforce settings',
      'Remove workforces'
    ]
  }
} as const;