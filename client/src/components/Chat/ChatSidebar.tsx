import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, LogOut, Zap, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Conversation {
  id: string;
  name: string;
  isGroup: boolean;
  members: Array<{
    user: {
      id: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      profileImageUrl?: string;
    };
  }>;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: (name: string, isGroup: boolean, memberIds: string[]) => void;
  currentUserId: string;
}

export default function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  currentUserId,
}: ChatSidebarProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [isGroupChat, setIsGroupChat] = useState(true);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateConversation = () => {
    if (newChatName.trim()) {
      onCreateConversation(newChatName, isGroupChat, []);
      setNewChatName("");
      setIsGroupChat(true);
      setIsCreateDialogOpen(false);
    }
  };

  const getConversationDisplayName = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.name;
    }
    
    // For direct messages, show the other user's username
    const otherMember = conversation.members?.find(m => m.user.id !== currentUserId);
    if (otherMember && otherMember.user) {
      return otherMember.user.username || otherMember.user.firstName || otherMember.user.email || "Unknown User";
    }
    
    // Fallback: extract username from "Direct: user1 & user2" format
    if (conversation.name.startsWith('Direct: ')) {
      const usernames = conversation.name.replace('Direct: ', '').split(' & ');
      // Return the username that's not the current user's
      return usernames.find(name => name !== (user?.username || user?.email)) || usernames[0] || "Unknown User";
    }
    
    return conversation.name;
  };

  return (
    <div className="w-64 bg-slate-800 flex flex-col h-full">
      {/* Workspace Header */}
      <div className="h-12 bg-slate-900 flex items-center px-3 border-b border-slate-600">
        <div className="flex items-center space-x-2 flex-1">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="text-white font-bold text-sm">
            SecureChat
          </span>
        </div>
      </div>

      {/* Search and Jump to */}
      <div className="px-3 py-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-slate-300 hover:bg-slate-700 hover:text-white text-xs h-7"
        >
          <Search className="w-3 h-3 mr-2" />
          Jump to...
        </Button>
      </div>

      {/* Group Skrams Section */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="py-2">
          <div className="flex items-center justify-between mb-1 px-2">
            <button className="flex items-center text-slate-300 hover:text-white text-xs font-medium">
              <div className="flex mr-1">
                <Zap className="w-3 h-3" />
                <Zap className="w-3 h-3 -ml-1" />
              </div>
              Group Skrams
            </button>
            <div className="flex items-center space-x-1">
              <Dialog open={isCreateDialogOpen && isGroupChat} onOpenChange={(open) => { setIsCreateDialogOpen(open); setIsGroupChat(true); }}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setIsGroupChat(true); setIsCreateDialogOpen(true); }}
                    className="w-4 h-4 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                    title="Add group skram"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Group Skram</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Group Skram Name</label>
                      <Input
                        placeholder="e.g. team-discussion"
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCreateConversation}>
                      Create Group Skram
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="space-y-0">
            {filteredConversations.filter(c => c.isGroup).map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`group w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center ${
                  activeConversationId === conversation.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="truncate flex-1">{conversation.name}</span>
                <div className="flex items-center ml-2 text-xs opacity-70 space-x-2">
                  {(conversation.unreadCount || 0) > 0 && (
                    <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium min-w-[18px] text-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Direct Messages Section */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1 px-2">
              <button className="flex items-center text-slate-300 hover:text-white text-xs font-medium">
                <span className="mr-1">▼</span>
                Private Skrams
              </button>
              <Dialog open={isCreateDialogOpen && !isGroupChat} onOpenChange={(open) => { setIsCreateDialogOpen(open); setIsGroupChat(false); }}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setIsGroupChat(false); setIsCreateDialogOpen(true); }}
                    className="w-4 h-4 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                    title="Start private skram"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start Private Skram</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">User Name</label>
                      <Input
                        placeholder="Enter username"
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCreateConversation}>
                      Start Private Skram
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-0">
              {filteredConversations.filter(c => !c.isGroup).map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`group w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center ${
                    activeConversationId === conversation.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="truncate flex-1">{getConversationDisplayName(conversation)}</span>
                  {(conversation.unreadCount || 0) > 0 && (
                    <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium min-w-[18px] text-center ml-2">
                      {conversation.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User Profile at Bottom */}
      <div className="h-12 bg-slate-900 border-t border-slate-600 flex items-center px-3">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {user?.username?.[0] || user?.firstName?.[0] || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user?.username || user?.firstName || 'User'}
            </p>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <span className="text-slate-400 text-xs">
                {user?.role === 'master' ? 'Master' : user?.role === 'admin' ? 'Admin' : 'Member'}
              </span>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-5 h-5 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
          onClick={() => window.location.href = "/api/logout"}
          title="Sign Out"
        >
          <LogOut className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}