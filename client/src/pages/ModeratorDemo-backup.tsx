import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Users, Settings, UserPlus, UserX, Edit3, Plus, Send, Shield, Lock, Edit } from "lucide-react";
import { SecureChatWebSocket } from "@/lib/websocket";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import ChatSidebar from "@/components/Chat/ChatSidebar";
import ChatArea from "@/components/Chat/ChatArea";

// Mock moderator user data
const mockModeratorUser = {
  id: "moderator-demo",
  username: "ModeratorDemo",
  firstName: "Demo",
  lastName: "Moderator",
  email: "moderator@demo.com",
  role: "moderator" as const
};

// Message interface
interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  isSystemMessage?: boolean;
}

// Workforce member interface
interface WorkforceMember {
  userId: string;
  email: string;
  username: string;
  role: string;
}

// Initial demo messages
const initialMessages: Message[] = [
  {
    id: "1",
    sender: "System",
    content: "Welcome to the Moderator Demo! You have enhanced permissions.",
    timestamp: "10:30 AM",
    isOwn: false
  },
  {
    id: "2", 
    sender: "John User",
    content: "Hi everyone! Looking forward to collaborating.",
    timestamp: "10:32 AM",
    isOwn: false
  }
];

export default function ModeratorDemo() {
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState("team-discussion");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [wsAuthenticated, setWsAuthenticated] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<{[key: string]: any[]}>({
    "team-discussion": initialMessages,
    "project-alpha": [],
    "announcements": []
  });
  const [conversationNames, setConversationNames] = useState<{[key: string]: string}>({
    "team-discussion": "Team Discussion",
    "project-alpha": "Project Alpha", 
    "announcements": "Announcements"
  });
  const [dynamicConversations, setDynamicConversations] = useState<Array<{id: string, name: string, members: number, realId: string, isGroup: boolean}>>([]);
  const [workforceMembers, setWorkforceMembers] = useState<WorkforceMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [conversationMembers, setConversationMembers] = useState<string[]>([]);
  const [conversationMemberDetails, setConversationMemberDetails] = useState<any[]>([]);
  // Removed manual mode - only workforce member dropdown now
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string>("");
  const [showEditChatDialog, setShowEditChatDialog] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);

  const [newChatName, setNewChatName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  
  const websocketRef = useRef<SecureChatWebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedChatRef = useRef(selectedChat);

  // Fetch workforce members and conversation members on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch workforce members
        const workforceResponse = await fetch('/api/demo/workforce-members');
        if (workforceResponse.ok) {
          const members = await workforceResponse.json();
          console.log('Fetched workforce members:', members);
          setWorkforceMembers(members);
        } else {
          console.error('Failed to fetch workforce members:', workforceResponse.status);
        }

        // Fetch current conversation members to filter them out
        const currentConversationId = conversationMapping[selectedChat as keyof typeof conversationMapping] || selectedChat;
        const membersResponse = await fetch(`/api/demo/conversations/${currentConversationId}/members`);
        if (membersResponse.ok) {
          const members = await membersResponse.json();
          setConversationMembers(members.map((m: any) => m.userId));
          // Deduplicate conversation member details
          const uniqueMembers = members.filter((member: any, index: number, self: any[]) => 
            self.findIndex(m => m.userId === member.userId) === index
          );
          setConversationMemberDetails(uniqueMembers);
        }

        // Update member counts for all conversations
        await updateAllMemberCounts();
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    
    fetchData();
  }, [selectedChat]);

  // Initialize WebSocket connection with moderator permissions
  useEffect(() => {
    const userId = '45717668'; // Use the existing admin user ID for demo
    if (!websocketRef.current) {
      console.log('Initializing WebSocket for moderator:', userId);
      websocketRef.current = new SecureChatWebSocket(userId);
      
      websocketRef.current.onMessage('authenticated', () => {
        console.log('Moderator WebSocket authenticated');
        setWsAuthenticated(true);
        // Join the default conversation
        websocketRef.current?.joinConversation("685ce588-7e82-490c-b02e-e529d3971dea");
      });
      
      // Listen for new messages
      websocketRef.current.onMessage('new_message', (data) => {
        console.log('Moderator received message:', data);
        
        // Find which conversation this message belongs to
        let conversationKey = null;
        
        // First check static conversations (group chats)
        for (const [key, value] of Object.entries(conversationMapping)) {
          if (value === data.message.conversationId) {
            conversationKey = key;
            break;
          }
        }
        
        // If not found in static conversations, check if it's a Direct Scram
        if (!conversationKey) {
          console.log('Message not found in static conversations, checking dynamic conversations');
          console.log('Dynamic conversations:', dynamicConversations.map(c => c.id));
          console.log('Message conversation ID:', data.message.conversationId);
          
          const directConv = dynamicConversations.find(conv => conv.id === data.message.conversationId);
          if (directConv) {
            conversationKey = directConv.id; // Use the Direct Scram conversation ID directly
            console.log('Found Direct Scram conversation:', conversationKey);
          } else {
            // If not found in dynamic conversations, it might be a Direct Scram that we haven't loaded yet
            // Use the conversation ID directly as the key
            conversationKey = data.message.conversationId;
            console.log('Using conversation ID directly as key:', conversationKey);
          }
        }
        
        if (!conversationKey) {
          console.log('No conversation key found, ignoring message');
          return;
        }
        
        // Filter out admin/system user details from regular users
        let senderName = 'System';
        if (data.message.sender?.role === 'member' || data.message.senderId === userId) {
          senderName = data.message.sender?.firstName || data.message.sender?.username || data.message.sender?.email || 'Moderator Demo';
        }
        
        const newMessage = {
          id: data.message.id,
          sender: senderName,
          content: data.message.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: data.message.senderId === userId
        };
        
        // Add message to conversation storage
        setConversationMessages(prev => {
          const conversationMsgs = prev[conversationKey] || [];
          if (conversationMsgs.some(msg => msg.id === newMessage.id)) {
            return prev;
          }
          return {
            ...prev,
            [conversationKey]: [...conversationMsgs, newMessage]
          };
        });
        
        // Update display if it's the current conversation
        if (conversationKey === selectedChatRef.current) {
          console.log('Updating messages for current conversation:', conversationKey);
          setMessages(prev => {
            if (prev.some(msg => msg.id === newMessage.id)) {
              console.log('Message already exists, skipping');
              return prev;
            }
            console.log('Adding new message to display:', newMessage);
            return [...prev, newMessage];
          });
          
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          console.log('Message not for current conversation. Current:', selectedChatRef.current, 'Message for:', conversationKey);
        }
      });
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.disconnect();
        websocketRef.current = null;
      }
    };
  }, []);

  // Update ref when selectedChat changes
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Map conversation display IDs to actual database IDs
  const conversationMapping = {
    "team-discussion": "685ce588-7e82-490c-b02e-e529d3971dea",
    "project-alpha": "d0576b4e-8246-43d9-b351-a821e3645cd6",
    "announcements": "a80b5a7c-43d0-48aa-8c4d-7a9734668293"
  };

  const [baseConversations, setBaseConversations] = useState([
    {
      id: "team-discussion",
      name: "Team Discussion",
      members: 0,
      realId: "685ce588-7e82-490c-b02e-e529d3971dea",
      isGroup: true
    },
    {
      id: "project-alpha",
      name: "Project Alpha",
      members: 0,
      realId: "d0576b4e-8246-43d9-b351-a821e3645cd6",
      isGroup: true
    },
    {
      id: "announcements",
      name: "Announcements",
      members: 0,
      realId: "a80b5a7c-43d0-48aa-8c4d-7a9734668293",
      isGroup: true
    }
  ]);

  // Function to fetch member count for a conversation
  const fetchMemberCount = async (conversationId: string): Promise<number> => {
    try {
      const response = await fetch(`/api/demo/conversations/${conversationId}/members`);
      if (response.ok) {
        const members = await response.json();
        return members.length;
      }
    } catch (error) {
      console.error('Failed to fetch member count:', error);
    }
    return 0;
  };

  // Update member counts for all conversations
  const updateAllMemberCounts = async () => {
    const updatedBaseConversations = await Promise.all(
      baseConversations.map(async (conv) => {
        const memberCount = await fetchMemberCount(conv.realId);
        return { ...conv, members: memberCount };
      })
    );
    setBaseConversations(updatedBaseConversations);

    // Also update dynamic conversations
    const updatedDynamicConversations = await Promise.all(
      dynamicConversations.map(async (conv) => {
        const memberCount = await fetchMemberCount(conv.id);
        return { ...conv, members: memberCount };
      })
    );
    setDynamicConversations(updatedDynamicConversations);
  };

  // Only include group conversations in the main conversations list
  // Direct Scrams (!isGroup) are displayed separately in their own section
  const conversations = [...baseConversations, ...dynamicConversations.filter(conv => conv.isGroup !== false)];

  const handleSendMessage = () => {
    if (!messageInput.trim() || !websocketRef.current || !wsAuthenticated) {
      console.log('Cannot send message:', { 
        hasMessage: !!messageInput.trim(), 
        hasWebSocket: !!websocketRef.current, 
        wsAuthenticated 
      });
      return;
    }
    
    console.log('Moderator sending message:', messageInput.trim());
    console.log('Selected chat:', selectedChat);
    // For dynamic conversations, use the selectedChat directly, otherwise use mapping
    const realConversationId = conversationMapping[selectedChat as keyof typeof conversationMapping] || selectedChat;
    console.log('Real conversation ID for message:', realConversationId);
    
    if (realConversationId) {
      websocketRef.current.sendMessage(realConversationId, messageInput.trim());
    } else {
      console.error('No real conversation ID found for:', selectedChat);
    }
    
    setMessageInput("");
  };

  const handleConversationSwitch = async (conversationId: string) => {
    if (conversationId === selectedChat) return;
    
    console.log('Moderator switching to conversation:', conversationId);
    setSelectedChat(conversationId);
    selectedChatRef.current = conversationId;
    // For dynamic conversations, use the conversationId directly, otherwise use mapping
    const realConversationId = conversationMapping[conversationId as keyof typeof conversationMapping] || conversationId;
    
    // Join the WebSocket room for this conversation
    if (websocketRef.current && wsAuthenticated) {
      console.log('Joining WebSocket room for conversation:', realConversationId);
      websocketRef.current.joinConversation(realConversationId);
    }
    
    // Load messages for the selected conversation
    const conversationMsgs = conversationMessages[conversationId] || [];
    setMessages(conversationMsgs);
    
    // Load members for the selected conversation
    try {
      const membersResponse = await fetch(`/api/demo/conversations/${realConversationId}/members`);
      if (membersResponse.ok) {
        const members = await membersResponse.json();
        setConversationMembers(members.map((m: any) => m.userId));
        // Deduplicate conversation member details
        const uniqueMembers = members.filter((member: any, index: number, self: any[]) => 
          self.findIndex(m => m.userId === member.userId) === index
        );
        setConversationMemberDetails(uniqueMembers);
      }
    } catch (error) {
      console.error('Failed to fetch conversation members:', error);
    }
    
    if (realConversationId && websocketRef.current && wsAuthenticated) {
      websocketRef.current.joinConversation(realConversationId);
    }
  };

  // Moderator-specific functions
  const handleAddMember = async () => {
    if (!selectedMember) return;
    
    const member = workforceMembers.find(m => m.userId === selectedMember);
    if (!member) return;
    
    const emailToInvite = member.email;
    
    try {
      const currentConversationId = conversationMapping[selectedChat as keyof typeof conversationMapping] || selectedChat;
      console.log('Adding member to conversation:', currentConversationId, 'Email:', emailToInvite);
      
      const response = await fetch(`/api/demo/conversations/${currentConversationId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToInvite }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Member invitation successful:', result);
        
        // Show immediate visual feedback with username
        const displayName = member.username;
        
        alert(`✅ SUCCESS: ${displayName} has been invited and added to the conversation!`);
        
        toast({
          title: "Member Invited",
          description: `${displayName} has been invited and added to the conversation.`,
        });
        
        // Send a system message to the conversation about the new member
        const systemMessage = {
          id: `invite-${Date.now()}`,
          sender: "System",
          content: `🎉 ${member.username} has been invited to join the conversation by ${mockModeratorUser.username}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
          isSystemMessage: true
        };
        
        // Add the system message to current conversation immediately
        setMessages(prev => [...prev, systemMessage]);
        setConversationMessages(prev => ({
          ...prev,
          [selectedChat]: [...(prev[selectedChat] || []), systemMessage]
        }));
        
        // Send via WebSocket so other users in the conversation see the notification
        if (websocketRef.current && wsAuthenticated) {
          websocketRef.current.sendMessage(currentConversationId, systemMessage.content);
        }
        
        // Update conversation member list by adding the new member
        setConversationMembers(prev => {
          if (!prev.includes(result.member.userId)) {
            return [...prev, result.member.userId];
          }
          return prev;
        });

        // Add to member details for removal dropdown (check for duplicates)
        const newMemberDetails = workforceMembers.find(m => m.userId === result.member.userId);
        if (newMemberDetails) {
          setConversationMemberDetails(prev => {
            const exists = prev.some(member => member.userId === newMemberDetails.userId);
            if (!exists) {
              return [...prev, {
                userId: newMemberDetails.userId,
                user: { username: newMemberDetails.username, email: newMemberDetails.email }
              }];
            }
            return prev;
          });
        }

        // Update member counts for all conversations
        await updateAllMemberCounts();
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Send Invitation",
          description: error.message || "Could not invite member to conversation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    }
    
    setSelectedMember("");
    setShowAddMemberDialog(false);
  };

  const handleDirectMessage = async (member: any) => {
    console.log('Starting direct message with:', member);
    
    try {
      // Create or find existing direct conversation
      const response = await fetch('/api/demo/conversations/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: member.userId,
          initiatorId: "45717668" // Current moderator
        }),
      });

      console.log('Direct message API response:', response.status);

      if (response.ok) {
        const directConversation = await response.json();
        console.log('Direct conversation created:', directConversation);
        
        // Add to conversations list if not already there
        const existingConv = dynamicConversations.find(c => c.id === directConversation.id);
        if (!existingConv) {
          const newConversation = {
            id: directConversation.id,
            name: `Direct: ${member.user?.username || member.user?.email || member.userId}`,
            members: 2,
            isGroup: false, // This is crucial - marks it as a direct conversation
            lastMessage: "Direct conversation started",
            timestamp: "now",
            unread: 0,
            realId: directConversation.id
          };
          console.log('Adding new direct conversation to list:', newConversation);
          setDynamicConversations((prev: any) => [...prev, newConversation]);
        }
        
        // Switch to the direct conversation
        console.log('Switching to conversation:', directConversation.id);
        setSelectedChat(directConversation.id);
        
        // Initialize conversation messages if needed
        setConversationMessages(prev => ({
          ...prev,
          [directConversation.id]: []
        }));
        
        // Join the WebSocket room for this Direct Scram
        if (websocketRef.current && wsAuthenticated) {
          websocketRef.current.joinConversation(directConversation.id);
        }
        
        console.log('Direct message setup complete');
        
        // Show success notification
        alert(`✅ Direct Scram Started with ${member.user?.username || member.user?.email || member.userId}!`);
      } else {
        const errorData = await response.json();
        console.error('Direct message API error:', errorData);
        alert(`❌ Error: ${errorData.message || "Failed to start direct conversation"}`);
      }
    } catch (error) {
      console.error('Failed to start direct message - detailed error:', error);
      alert("❌ Error: Failed to start direct conversation");
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      const currentConversationId = conversationMapping[selectedChat as keyof typeof conversationMapping] || selectedChat;
      console.log('Removing member from conversation:', currentConversationId, 'UserId:', memberToRemove);
      
      const response = await fetch(`/api/demo/conversations/${currentConversationId}/members/${memberToRemove}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Member removal successful:', result);
        
        // Find the member details for notification
        const removedMember = conversationMemberDetails.find(m => m.userId === memberToRemove);
        const displayName = removedMember?.user?.username || memberToRemove;
        
        alert(`✅ SUCCESS: ${displayName} has been removed from the conversation!`);
        
        toast({
          title: "Member Removed",
          description: `${displayName} has been removed from the conversation.`,
        });
        
        // Send a system message to the conversation about the removal
        const systemMessage = {
          id: `remove-${Date.now()}`,
          sender: "System",
          content: `🔴 ${displayName} has been removed from the conversation by ${mockModeratorUser.username}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
          isSystemMessage: true
        };
        
        // Add the system message to current conversation immediately
        setMessages(prev => [...prev, systemMessage]);
        setConversationMessages(prev => ({
          ...prev,
          [selectedChat]: [...(prev[selectedChat] || []), systemMessage]
        }));
        
        // Send via WebSocket so other users in the conversation see the notification
        if (websocketRef.current && wsAuthenticated) {
          websocketRef.current.sendMessage(currentConversationId, systemMessage.content);
        }
        
        // Update conversation member lists by removing the member
        setConversationMembers(prev => prev.filter(id => id !== memberToRemove));
        setConversationMemberDetails(prev => prev.filter(m => m.userId !== memberToRemove));

        // Update member counts for all conversations
        await updateAllMemberCounts();
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Remove Member",
          description: error.message || "Could not remove member from conversation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    }
    
    setMemberToRemove("");
    setShowRemoveMemberDialog(false);
  };

  const handleEditChatName = async () => {
    if (!newChatName.trim()) return;
    
    try {
      const currentConversationId = conversationMapping[selectedChat as keyof typeof conversationMapping] || selectedChat;
      const response = await fetch(`/api/demo/conversations/${currentConversationId}/name`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newChatName.trim() }),
      });

      if (response.ok) {
        // Update the conversation name in local state
        setConversationNames(prev => ({
          ...prev,
          [selectedChat]: newChatName.trim()
        }));
        
        toast({
          title: "Chat Renamed",
          description: `Chat name changed to "${newChatName}".`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Rename Chat",
          description: error.message || "Could not rename conversation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename chat. Please try again.",
        variant: "destructive",
      });
    }
    
    setNewChatName("");
    setShowEditChatDialog(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      const response = await fetch('/api/demo/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || undefined
        }),
      });

      if (response.ok) {
        const newConversation = await response.json();
        
        // Add the new conversation to the dynamic list
        const newConvForList = {
          id: newConversation.id,
          name: newGroupName.trim(),
          members: 1, // Creator is the first member
          realId: newConversation.id,
          isGroup: true
        };
        
        setDynamicConversations(prev => [...prev, newConvForList]);
        setConversationMessages(prev => ({
          ...prev,
          [newConversation.id]: []
        }));
        
        toast({
          title: "Group Created",
          description: `"${newGroupName}" group chat has been created.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Create Group",
          description: error.message || "Could not create group conversation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    }
    
    setNewGroupName("");
    setNewGroupDescription("");
    setShowCreateGroupDialog(false);
  };



  const currentConversation = conversations.find(c => c.id === selectedChat);

  // Transform conversations for ChatSidebar component
  const chatSidebarConversations = conversations.map(conv => ({
    id: conv.id,
    name: conv.name,
    isGroup: true, // All demo conversations are group chats
    members: [], // Will be populated by member count
    lastMessage: `${conv.members} members`,
    lastMessageTime: "",
    unreadCount: 0
  }));

  const handleSidebarConversationSelect = (conversationId: string) => {
    setSelectedChat(conversationId);
  };

  const handleCreateConversation = (name: string, isGroup: boolean, memberIds: string[]) => {
    console.log('Creating conversation:', { name, isGroup, memberIds });
    // Handle conversation creation
  };

  return (
    <div className="h-screen bg-slate-900 flex">
      {/* Left Sidebar - Slack Style */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Workspace Header */}
        <div className="h-14 bg-slate-900 border-b border-slate-700 flex items-center px-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">SecureChat</span>
          </div>
        </div>

        {/* Channels Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">Group Skrams</h3>
              <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-slate-400 hover:text-white hover:bg-slate-700">
                    <Plus className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-600">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Group Skram</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="group-name" className="text-slate-300">Group Skram Name</Label>
                      <Input
                        id="group-name"
                        placeholder="e.g. marketing-team"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="group-description" className="text-slate-300">Description (Optional)</Label>
                      <Input
                        id="group-description"
                        placeholder="What's this channel about?"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleCreateGroup} className="flex-1 bg-green-600 hover:bg-green-700" disabled={!newGroupName.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Channel
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Channel List */}
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationSwitch(conversation.id)}
                  className={`w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center space-x-2 ${
                    selectedChat === conversation.id 
                      ? "bg-blue-600 text-white" 
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <span className="text-slate-400">#</span>
                  <span className="flex-1 truncate">{conversation.name}</span>
                  <span className="text-xs text-slate-400">{conversation.members}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div className="p-3 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">Direct Messages</h3>
            </div>
            <div className="space-y-1">
              {dynamicConversations
                .filter(conv => !conv.isGroup)
                .map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationSwitch(conversation.id)}
                  className={`w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center space-x-2 ${
                    selectedChat === conversation.id 
                      ? "bg-blue-600 text-white" 
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                  <span className="flex-1 truncate">{conversation.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile at Bottom */}
        <div className="h-14 bg-slate-900 border-t border-slate-700 flex items-center px-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
              <span className="text-white text-sm font-medium">M</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{mockModeratorUser.username}</p>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-slate-400 text-xs">Moderator</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Chat Area - Slack Style */}
      <div className="flex-1 flex flex-col bg-white">
        
        {/* Channel Header - Slack Style */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="text-gray-500 mr-1">#</span>
              {currentConversation?.name || "general"}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{currentConversation?.members || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Lock className="w-4 h-4 text-green-600" />
                <span>Encrypted</span>
              </div>
            </div>
          </div>
          
          {/* Moderator Actions */}
          <div className="flex items-center space-x-2">
            <Badge variant={wsAuthenticated ? "default" : "secondary"} className="bg-green-100 text-green-800 border-green-300">
              {wsAuthenticated ? "✓ Connected" : "Connecting..."}
            </Badge>
            
            {/* Moderator Controls Dropdown */}
            <div className="flex space-x-1">
              <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Member to #{currentConversation?.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      Select a workforce member to add to this channel
                    </p>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="member-select">Select Member</Label>
                      <Select value={selectedMember} onValueChange={setSelectedMember}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a member to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const availableMembers = workforceMembers
                              ?.filter(member => !conversationMembers.includes(member.userId)) || [];
                            
                            if (!workforceMembers || workforceMembers.length === 0) {
                              return <div className="px-2 py-1 text-sm text-muted-foreground">Loading members...</div>;
                            }
                            
                            if (availableMembers.length === 0) {
                              return <div className="px-2 py-1 text-sm text-muted-foreground">All members are already in this channel</div>;
                            }
                            
                            return availableMembers.map((member, index) => (
                              <SelectItem key={`${member.userId}-${index}`} value={member.userId}>
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">{member.username.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <span className="font-medium">{member.username}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {member.role}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleAddMember} 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={!selectedMember}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add to Channel
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showEditChatDialog} onOpenChange={setShowEditChatDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100">
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rename Channel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="new-chat-name">Channel Name</Label>
                      <Input
                        id="new-chat-name"
                        placeholder="Enter new channel name"
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleEditChatName} className="flex-1 bg-green-600 hover:bg-green-700" disabled={!newChatName.trim()}>
                        <Edit className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setShowEditChatDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700">Moderator Controls</span>
              </div>
              <div className="flex space-x-2">
                <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <UserPlus className="h-3 w-3 mr-1" />
                      Invite Members
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Workforce Members to {currentConversation?.name}</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        Select a workforce member to invite to this conversation
                      </p>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="member-select">Select Workforce Member</Label>
                        <Select value={selectedMember} onValueChange={setSelectedMember}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a member to invite" />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              const availableMembers = workforceMembers
                                ?.filter(member => !conversationMembers.includes(member.userId)) || [];
                              
                              if (!workforceMembers || workforceMembers.length === 0) {
                                return <div className="px-2 py-1 text-sm text-muted-foreground">Loading workforce members...</div>;
                              }
                              
                              if (availableMembers.length === 0) {
                                return <div className="px-2 py-1 text-sm text-muted-foreground">All workforce members are already in this conversation</div>;
                              }
                              
                              return availableMembers.map((member, index) => (
                                <SelectItem key={`${member.userId}-${index}`} value={member.userId}>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{member.username}</span>
                                    <span className="text-sm text-muted-foreground">({member.email})</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {member.role}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          {workforceMembers.filter(member => !conversationMembers.includes(member.userId)).length} workforce members available to invite
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleAddMember} 
                          className="flex-1"
                          disabled={!selectedMember}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Member
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showEditChatDialog} onOpenChange={setShowEditChatDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Edit className="h-3 w-3 mr-1" />
                      Rename Chat
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Chat Name</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="new-chat-name">New Chat Name</Label>
                        <Input
                          id="new-chat-name"
                          placeholder="Enter new chat name"
                          value={newChatName}
                          onChange={(e) => setNewChatName(e.target.value)}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleEditChatName} className="flex-1" disabled={!newChatName.trim()}>
                          <Edit className="h-4 w-4 mr-2" />
                          Update Name
                        </Button>
                        <Button variant="outline" onClick={() => setShowEditChatDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Group Chat</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                          id="group-name"
                          placeholder="Enter group name"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="group-description">Description (Optional)</Label>
                        <Input
                          id="group-description"
                          placeholder="Brief description of the group"
                          value={newGroupDescription}
                          onChange={(e) => setNewGroupDescription(e.target.value)}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleCreateGroup} className="flex-1" disabled={!newGroupName.trim()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Group
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Demo: {mockModeratorUser.username}
            </div>
          </div>
        </div>
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">#</span>
                </div>
                
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    # {currentConversation?.name || "Select a conversation"}
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-green-500" />
                      <span>End-to-end encrypted</span>
                    </div>
                    <span>•</span>
                    <span>{currentConversation?.members || 0} members</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-red-500" />
                      <span>Moderator Demo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={wsAuthenticated ? "default" : "secondary"} className="bg-green-100 text-green-800">
                {wsAuthenticated ? "✓ Connected" : "Connecting..."}
              </Badge>
            </div>
          </div>
        </div>

        {/* Messages Area - Slack Style */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3 hover:bg-gray-50 px-2 py-1 rounded">
                {!message.isOwn && (
                  <div className={`w-9 h-9 rounded flex items-center justify-center flex-shrink-0 mt-1 ${
                    message.isSystemMessage ? "bg-blue-500" : "bg-green-500"
                  }`}>
                    <span className="text-white text-sm font-medium">
                      {message.sender.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  {!message.isOwn && (
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className={`font-bold text-sm ${
                        message.isSystemMessage ? "text-blue-600" : "text-gray-900"
                      }`}>
                        {message.sender}
                      </span>
                      <span className="text-xs text-gray-500">{message.timestamp}</span>
                    </div>
                  )}
                  
                  <div className={`${message.isOwn ? "bg-blue-600 text-white px-3 py-2 rounded-lg inline-block ml-auto" : ""}`}>
                    <p className={`text-sm leading-relaxed ${
                      message.isOwn ? "text-white" : message.isSystemMessage ? "text-blue-800 font-medium" : "text-gray-900"
                    }`}>
                      {message.content}
                    </p>
                    {message.isOwn && (
                      <p className="text-xs text-blue-200 mt-1">{message.timestamp}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input - Authentic Slack Style */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="relative">
            <div className="border border-gray-300 rounded-lg focus-within:border-blue-500 focus-within:shadow-md transition-all">
              <div className="p-3">
                <Input
                  type="text"
                  placeholder={`Message #${currentConversation?.name || 'general'}`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="border-0 p-0 text-sm focus:ring-0 focus:outline-none placeholder-gray-500 bg-transparent"
                />
              </div>
              
              {/* Message Toolbar */}
              <div className="border-t border-gray-200 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="flex items-center space-x-1 text-xs">
                    <Lock className="w-3 h-3 text-green-500" />
                    <span className="text-green-600">End-to-end encrypted</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center space-x-1 text-xs">
                    <Shield className="w-3 h-3 text-red-500" />
                    <span className="text-red-600">Moderator</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!wsAuthenticated || !messageInput.trim()}
                  size="sm"
                  className={`${
                    messageInput.trim() && wsAuthenticated
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  } px-3 py-1.5 text-sm`}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Slack Style Members */}
      <div className="w-72 bg-gray-50 border-l border-gray-200 flex flex-col">
        {/* Members Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Members</h3>
            <div className="flex items-center space-x-1">
              <Badge variant="secondary" className="text-xs">
                {conversationMemberDetails.length}
              </Badge>
              <Dialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-600 hover:text-red-700">
                    <UserX className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Remove Member from Conversation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select member to remove</Label>
                      <Select value={memberToRemove} onValueChange={setMemberToRemove}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a member to remove" />
                        </SelectTrigger>
                        <SelectContent>
                          {conversationMemberDetails
                            .filter(member => member.userId !== "45717668") // Don't allow removing moderator
                            .map((member, index) => (
                            <SelectItem key={`remove-${member.userId}-${index}`} value={member.userId}>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{member.user?.username || member.userId}</span>
                                <span className="text-sm text-muted-foreground">({member.user?.email})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleRemoveMember} 
                        variant="destructive" 
                        className="flex-1"
                        disabled={!memberToRemove}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Remove Member
                      </Button>
                      <Button variant="outline" onClick={() => setShowRemoveMemberDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Members List - Slack Style */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-1">
            {conversationMemberDetails.map((member, index) => (
              <div
                key={`member-${member.userId}-${index}`}
                className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 cursor-pointer group text-sm"
                onClick={() => handleDirectMessage(member)}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                <div 
                  className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-medium ${
                    member.userId === "45717668" 
                      ? "bg-red-500" 
                      : member.user?.role === "moderator" 
                        ? "bg-orange-500" 
                        : "bg-gray-500"
                  }`}
                >
                  {(member.user?.username || member.userId).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-900 truncate">
                      {member.user?.username || member.userId}
                    </span>
                    {member.userId === "45717668" ? (
                      <span className="text-xs text-red-600">(moderator)</span>
                    ) : member.user?.role === "moderator" ? (
                      <span className="text-xs text-orange-600">(mod)</span>
                    ) : null}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MessageCircle className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            ))}
            
            {conversationMemberDetails.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No members found</p>
              </div>
            )}
          </div>
        </div>

        {/* Hidden Actions - preserve functionality */}
        <div className="hidden">
          <div className="space-y-2">
            <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Workforce Members to {currentConversation?.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Select a workforce member to invite to this conversation
                  </p>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="member-select">Select Workforce Member</Label>
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a member to invite" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          console.log('Workforce members in dropdown:', workforceMembers);
                          console.log('Conversation members:', conversationMembers);
                          
                          const availableMembers = workforceMembers
                            ?.filter(member => !conversationMembers.includes(member.userId)) || [];
                          
                          console.log('Available members for invitation:', availableMembers);
                          
                          if (!workforceMembers || workforceMembers.length === 0) {
                            return <div className="px-2 py-1 text-sm text-muted-foreground">Loading workforce members...</div>;
                          }
                          
                          if (availableMembers.length === 0) {
                            return <div className="px-2 py-1 text-sm text-muted-foreground">All workforce members are already in this conversation</div>;
                          }
                          
                          return availableMembers.map((member, index) => (
                            <SelectItem key={`${member.userId}-${index}`} value={member.userId}>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{member.username}</span>
                                <span className="text-sm text-muted-foreground">({member.email})</span>
                                <Badge variant="secondary" className="text-xs">
                                  {member.role}
                                </Badge>
                              </div>
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {workforceMembers.filter(member => !conversationMembers.includes(member.userId)).length} workforce members available to invite
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleAddMember} 
                      className="flex-1"
                      disabled={!selectedMember}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start text-red-600 hover:text-red-700">
                  <UserX className="h-4 w-4 mr-2" />
                  Remove Members
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Remove Member from Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select member to remove</Label>
                    <Select value={memberToRemove} onValueChange={setMemberToRemove}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a member to remove" />
                      </SelectTrigger>
                      <SelectContent>
                        {conversationMemberDetails
                          .filter(member => member.userId !== "45717668") // Don't allow removing moderator
                          .map((member, index) => (
                          <SelectItem key={`remove-${member.userId}-${index}`} value={member.userId}>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{member.user?.username || member.userId}</span>
                              <span className="text-sm text-muted-foreground">({member.user?.email})</span>
                            </div>
                          </SelectItem>
                        ))}
                        {conversationMemberDetails.filter(member => member.userId !== "45717668").length === 0 && (
                          <div className="px-2 py-1 text-sm text-muted-foreground">
                            No members available to remove
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {conversationMemberDetails.filter(member => member.userId !== "45717668").length} members can be removed
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRemoveMemberDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleRemoveMember}
                    disabled={!memberToRemove}
                  >
                    Remove Member
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showEditChatDialog} onOpenChange={setShowEditChatDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Chat Name
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Chat Name</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="chatname">New Chat Name</Label>
                    <Input
                      id="chatname"
                      placeholder="Enter new name"
                      value={newChatName}
                      onChange={(e) => setNewChatName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleEditChatName} className="w-full">
                    Update Name
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="groupname">Group Name</Label>
                    <Input
                      id="groupname"
                      placeholder="Enter group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Brief description"
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateGroup} className="w-full">
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden">
          {/* Group Conversations Section */}
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Group Conversations
            </h3>
          </div>
          <div className="px-4 overflow-y-auto mb-4">
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedChat === conversation.id ? "bg-accent border-primary" : ""
                  }`}
                  onClick={() => handleConversationSwitch(conversation.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conversation.name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {conversation.members}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Direct Scrams Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <Lock className="w-4 h-4 mr-2 text-green-600" />
                Direct Scrams
                <Badge variant="secondary" className="ml-2 text-xs">Private</Badge>
              </h3>
            </div>
            <div className="px-4 overflow-y-auto">
              <div className="space-y-2">
                {dynamicConversations
                  .filter(conv => !conv.isGroup)
                  .map((conversation) => (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer transition-colors hover:bg-green-50 border-green-200 ${
                      selectedChat === conversation.id ? "bg-green-50 border-green-400" : ""
                    }`}
                    onClick={() => handleConversationSwitch(conversation.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-green-800">
                            {conversation.name}
                          </p>
                          <p className="text-xs text-green-600">End-to-end encrypted</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-green-600">
                            Private
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {dynamicConversations.filter(conv => !conv.isGroup).length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No direct conversations yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Click on any member to start a Direct Scram</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-16 border-b bg-card flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold">{currentConversation?.name}</h2>
              <p className="text-xs text-muted-foreground">
                {currentConversation?.members} members
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={wsAuthenticated ? "default" : "secondary"}>
              {wsAuthenticated ? "Connected" : "Connecting..."}
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isOwn
                      ? "bg-primary text-primary-foreground"
                      : message.isSystemMessage
                      ? "bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800"
                      : "bg-muted"
                  }`}
                >
                  {!message.isOwn && (
                    <p className={`text-xs font-medium mb-1 ${
                      message.isSystemMessage ? "text-blue-600 dark:text-blue-400" : ""
                    }`}>
                      {message.sender}
                    </p>
                  )}
                  <p className={`text-sm ${
                    message.isSystemMessage ? "text-blue-800 dark:text-blue-200 font-medium" : ""
                  }`}>
                    {message.content}
                  </p>
                  <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t bg-card p-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!wsAuthenticated}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      
      <Toaster />
    </div>
  );
}