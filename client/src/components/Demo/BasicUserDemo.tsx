import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Users, Settings, UserPlus, Edit, Crown, Lock } from "lucide-react";

export default function BasicUserDemo() {
  const { user } = useAuth();
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Basic User Experience</h1>
        <p className="text-gray-600">What a regular user can see and do in SecureChat</p>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {(user?.username || user?.email?.split('@')[0] || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            Basic User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Username</p>
              <p className="font-medium">@{user?.username || user?.email?.split('@')[0] || "user"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                <span className="text-sm">👤</span>
                User
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user?.email || "user@company.com"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Workforce</p>
              <p className="font-medium">Test Company</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Functions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-700">✅ What Basic Users CAN Do</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Send Messages</p>
                <p className="text-sm text-green-600">Chat in all conversations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Direct Messages</p>
                <p className="text-sm text-green-600">Private conversations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Lock className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">View Chats</p>
                <p className="text-sm text-green-600">Access conversation history</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Encrypted Communication</p>
                <p className="text-sm text-green-600">All messages are secure</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restricted Functions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-700">❌ What Basic Users CANNOT Do</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg opacity-60">
              <Edit className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-medium text-red-800">Change Chat Names</p>
                <p className="text-sm text-red-600">Only moderators can edit</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg opacity-60">
              <UserPlus className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-medium text-red-800">Add Members to Chats</p>
                <p className="text-sm text-red-600">Requires moderator permissions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg opacity-60">
              <Users className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-medium text-red-800">Create Group Chats</p>
                <p className="text-sm text-red-600">Only moderators can create</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg opacity-60">
              <Crown className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-medium text-red-800">Invite New Members</p>
                <p className="text-sm text-red-600">Workforce management restricted</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg opacity-60">
              <Settings className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-medium text-red-800">Workforce Management</p>
                <p className="text-sm text-red-600">Master user only</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UI Demonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Chat Interface for Basic Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Team Discussion</h3>
                  <p className="text-sm text-gray-600">
                    <Lock className="w-3 h-3 inline mr-1" />
                    End-to-end encrypted • 3 members
                  </p>
                </div>
              </div>
              
              {/* Settings dropdown - disabled for basic users */}
              <Button variant="outline" size="sm" disabled className="opacity-50">
                <Settings className="w-4 h-4" />
                <span className="ml-2 text-xs">(No permissions)</span>
              </Button>
            </div>
            
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">Basic users can read and send messages</p>
              <p className="text-xs text-gray-400">but cannot manage chat settings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Basic User Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700">
            Basic users have a simple, focused experience designed for secure communication. 
            They can participate in conversations and send messages, but management functions 
            are handled by moderators and master users to maintain security and organization.
          </p>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              🔒 Security: All messages are end-to-end encrypted with 24-hour auto-delete
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}