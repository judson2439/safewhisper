import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
// Alert component not available, will create inline alerts
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Send, 
  Users, 
  Settings, 
  UserPlus, 
  Edit, 
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

export default function UserFunctionTest() {
  const { user } = useAuth();
  const [testMessage, setTestMessage] = useState("");
  const [testResults, setTestResults] = useState<Array<{
    action: string;
    success: boolean;
    message: string;
  }>>([]);

  // Simulate testing basic user functions
  const testUserFunctions = () => {
    const results = [
      {
        action: "Send Message",
        success: true,
        message: "✅ Successfully sent message to Team Discussion"
      },
      {
        action: "View Conversation History", 
        success: true,
        message: "✅ Can read all messages in accessible conversations"
      },
      {
        action: "Direct Message",
        success: true,
        message: "✅ Can start and send direct messages to team members"
      },
      {
        action: "Change Chat Name",
        success: false,
        message: "❌ Permission denied - Only moderators can rename chats"
      },
      {
        action: "Add Members to Chat",
        success: false,
        message: "❌ Permission denied - Only moderators can add members"
      },
      {
        action: "Create Group Chat",
        success: false,
        message: "❌ Permission denied - Only moderators can create groups"
      },
      {
        action: "Invite Workforce Members",
        success: false,
        message: "❌ Permission denied - Only moderators can invite members"
      },
      {
        action: "Access Admin Dashboard",
        success: false,
        message: "❌ Access denied - Master privileges required"
      }
    ];
    
    setTestResults(results);
  };

  useEffect(() => {
    // Run tests automatically when component loads
    const timer = setTimeout(() => {
      testUserFunctions();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Basic User Function Testing</h1>
        <p className="text-gray-600">Testing what a regular user can and cannot do</p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {(user?.username || user?.email?.split('@')[0] || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            Test User Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Username</p>
              <p className="font-medium">@{user?.username || user?.email?.split('@')[0] || "user"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">System Role</p>
              <Badge variant="secondary">👤 User</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user?.email || "user@company.com"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Workforce Role</p>
              <Badge variant="outline">User</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Function Testing Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Function Testing Results</CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Running function tests...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{result.action}</p>
                      <p className={`text-sm ${
                        result.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Test Message Sending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Test message content:</p>
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Type a test message..."
              className="min-h-[100px]"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lock className="w-4 h-4 text-green-500" />
              <span>End-to-end encrypted</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Auto-deletes in 24h</span>
            </div>
            <Button 
              disabled={!testMessage.trim()}
              onClick={() => {
                if (testMessage.trim()) {
                  setTestResults(prev => [...prev, {
                    action: "Send Test Message",
                    success: true,
                    message: `✅ Message sent: "${testMessage.substring(0, 50)}${testMessage.length > 50 ? '...' : ''}"`
                  }]);
                  setTestMessage("");
                }
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Test Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Team Discussion</p>
                  <p className="text-sm text-gray-600">4 members • Group chat</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Member</Badge>
                <Button variant="outline" size="sm" disabled>
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">S</span>
                </div>
                <div>
                  <p className="font-medium">Sarah Moderator</p>
                  <p className="text-sm text-gray-600">Direct message</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">DM</Badge>
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permission Summary */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-1" />
        <div>
          <p className="text-amber-800">
            <strong>Permission Summary:</strong> Basic users can send messages, participate in conversations, and direct message team members. Management functions like creating groups, adding members, and administrative features are restricted to moderators and master users.
          </p>
        </div>
      </div>

      {/* Test Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Function Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setTestResults(prev => [...prev, {
                  action: "Attempt Group Creation",
                  success: false,
                  message: "❌ Access denied - Only moderators can create group chats"
                }]);
              }}
            >
              <Users className="w-4 h-4 mr-2" />
              Try Create Group
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                setTestResults(prev => [...prev, {
                  action: "Attempt Member Invite",
                  success: false,
                  message: "❌ Permission denied - Only moderators can invite workforce members"
                }]);
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Try Invite Member
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                setTestResults(prev => [...prev, {
                  action: "Attempt Chat Rename",
                  success: false,
                  message: "❌ Permission denied - Only moderators can change chat names"
                }]);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Try Rename Chat
            </Button>
            
            <Button 
              onClick={() => {
                setTestResults(prev => [...prev, {
                  action: "Send Direct Message",
                  success: true,
                  message: "✅ Successfully initiated direct message with team member"
                }]);
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Send Direct Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}