import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Shield, User, MessageCircle, Users, Settings, Building2, TestTube, BarChart3, LogOut } from "lucide-react";
import { Link } from "wouter";
import AdminDashboard from "@/pages/AdminDashboard";
import ModeratorDemo from "@/pages/ModeratorDemo";
import UserDemo from "@/pages/UserDemo";

interface RoleConfig {
  role: 'master' | 'moderator' | 'user';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  badge: string;
  capabilities: string[];
  testRoute: string;
}

const roleConfigs: RoleConfig[] = [
  {
    role: 'master',
    title: 'Master Admin',
    description: 'Complete system control with analytics and workforce management',
    icon: <Crown className="w-6 h-6" />,
    color: 'bg-yellow-500',
    badge: 'A',
    capabilities: [
      'System-wide analytics dashboard',
      'Create and manage workforces',
      'Invite workforce members',
      'User role management',
      'Advanced channel controls',
      'Private scram monitoring',
      'Full chat functionality'
    ],
    testRoute: '/admin'
  },
  {
    role: 'moderator',
    title: 'Moderator',
    description: 'Chat management with member and conversation controls',
    icon: <Shield className="w-6 h-6" />,
    color: 'bg-red-500',
    badge: 'M',
    capabilities: [
      'Create group conversations (Skrams)',
      'Add/remove conversation members',
      'Change conversation names',
      'Start private conversations',
      'Invite workforce members',
      'Priority message filtering',
      'Full chat functionality'
    ],
    testRoute: '/moderator-demo'
  },
  {
    role: 'user',
    title: 'Regular User',
    description: 'Basic chat functionality with secure messaging',
    icon: <User className="w-6 h-6" />,
    color: 'bg-blue-500',
    badge: 'U',
    capabilities: [
      'Send and receive messages',
      'View conversation history',
      'Start direct messages',
      'End-to-end encryption',
      'Message priority viewing',
      'Basic chat participation'
    ],
    testRoute: '/user-demo'
  }
];

export default function RoleTestDashboard() {
  const [activeRole, setActiveRole] = useState<'master' | 'moderator' | 'user' | null>(null);

  if (activeRole) {
    switch (activeRole) {
      case 'master':
        return <AdminDashboard onReturnToDashboard={() => setActiveRole(null)} />;
      case 'moderator':
        return <ModeratorDemo onReturnToDashboard={() => setActiveRole(null)} isMasterAdmin={false} />;
      case 'user':
        return <UserDemo onReturnToDashboard={() => setActiveRole(null)} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <TestTube className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SecureChat Role Testing Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Switch between Master Admin, Moderator, and Regular User for comprehensive testing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Testing Mode
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roleConfigs.map((config) => (
              <Card key={config.role} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 ${config.color} rounded-full flex items-center justify-center text-white`}>
                      {config.icon}
                    </div>
                  </div>
                  <CardTitle className="flex items-center justify-center gap-2">
                    {config.title}
                    <Badge variant="secondary">{config.badge}</Badge>
                  </CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Capabilities:</h4>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {config.capabilities.map((capability, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          {capability}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setActiveRole(config.role)}
                      className="flex-1"
                    >
                      Test {config.title}
                    </Button>
                    <Link href={config.testRoute}>
                      <Button variant="outline" size="sm">
                        Direct Link
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Navigation to Current Chat */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <MessageCircle className="w-5 h-5" />
                Current Chat Interface
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Access the main chat system with your current authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Link href="/">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Go to Main Chat
                  </Button>
                </Link>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  Live Authentication
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Feature Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison Matrix</CardTitle>
              <CardDescription>Compare capabilities across all user roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Feature</th>
                      <th className="text-center p-3 font-medium">Master Admin</th>
                      <th className="text-center p-3 font-medium">Moderator</th>
                      <th className="text-center p-3 font-medium">Regular User</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {[
                      ['Send Messages', '✅', '✅', '✅'],
                      ['View Messages', '✅', '✅', '✅'],
                      ['Direct Messages', '✅', '✅', '✅'],
                      ['Create Group Chats', '✅', '✅', '❌'],
                      ['Add Members to Chats', '✅', '✅', '❌'],
                      ['Remove Members', '✅', '✅', '❌'],
                      ['Change Chat Names', '✅', '✅', '❌'],
                      ['Invite Workforce Members', '✅', '✅', '❌'],
                      ['System Analytics', '✅', '❌', '❌'],
                      ['Workforce Management', '✅', '❌', '❌'],
                      ['User Role Management', '✅', '❌', '❌'],
                      ['System Monitoring', '✅', '❌', '❌']
                    ].map(([feature, master, moderator, user], index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3 font-medium">{feature}</td>
                        <td className="text-center p-3">{master}</td>
                        <td className="text-center p-3">{moderator}</td>
                        <td className="text-center p-3">{user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Testing Actions</CardTitle>
              <CardDescription>Common testing scenarios for each role</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="master" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="master">Master Admin Tests</TabsTrigger>
                  <TabsTrigger value="moderator">Moderator Tests</TabsTrigger>
                  <TabsTrigger value="user">User Tests</TabsTrigger>
                </TabsList>
                
                <TabsContent value="master" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => setActiveRole('master')}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Test Analytics Dashboard
                    </Button>
                    <Button variant="outline" onClick={() => setActiveRole('master')}>
                      <Building2 className="w-4 h-4 mr-2" />
                      Test Workforce Management
                    </Button>
                    <Button variant="outline" onClick={() => setActiveRole('master')}>
                      <Users className="w-4 h-4 mr-2" />
                      Test System User Management
                    </Button>
                    <Button variant="outline" onClick={() => setActiveRole('master')}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Test Master Chat Features
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="moderator" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => setActiveRole('moderator')}>
                      <Users className="w-4 h-4 mr-2" />
                      Test Member Management
                    </Button>
                    <Button variant="outline" onClick={() => setActiveRole('moderator')}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Test Group Creation
                    </Button>
                    <Button variant="outline" onClick={() => setActiveRole('moderator')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Test Chat Administration
                    </Button>
                    <Button variant="outline" onClick={() => setActiveRole('moderator')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Test Priority Filtering
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="user" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => setActiveRole('user')}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Test Basic Messaging
                    </Button>
                    <Button variant="outline" onClick={() => setActiveRole('user')}>
                      <User className="w-4 h-4 mr-2" />
                      Test Direct Messages
                    </Button>
                    <Button variant="outline" onClick={() => setActiveRole('user')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Test Security Features
                    </Button>
                    <Button variant="outline" onClick={() => setActiveRole('user')}>
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Permission Limits
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}