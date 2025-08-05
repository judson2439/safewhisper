import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { 
  Crown, Shield, Users, Building2, TestTube, 
  LogIn, User, UserCheck, ClipboardCheck,
  MessageCircle, Settings, BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestUser {
  username: string;
  password: string;
  name: string;
  role: string;
  workforce: string;
  workforceRole: string;
  description: string;
}

const testUsers: TestUser[] = [
  // Master Admin
  {
    username: "master_admin",
    password: "admin123", 
    name: "Master Admin",
    role: "master",
    workforce: "System",
    workforceRole: "Master",
    description: "Complete system access - all workforces, users, and analytics"
  },
  
  // Engineering Corp
  {
    username: "alice_eng",
    password: "password123",
    name: "Alice Manager",
    role: "moderator",
    workforce: "Engineering Corp",
    workforceRole: "Moderator",
    description: "Engineering team leader - can manage eng workforce + talk to other moderators"
  },
  {
    username: "bob_dev",
    password: "password123", 
    name: "Bob Developer",
    role: "user",
    workforce: "Engineering Corp",
    workforceRole: "User",
    description: "Software developer - limited to engineering workforce communications"
  },
  {
    username: "carol_senior",
    password: "password123",
    name: "Carol Senior",
    role: "user", 
    workforce: "Engineering Corp",
    workforceRole: "User",
    description: "Senior engineer - can only see and message engineering team members"
  },
  
  // Healthcare Inc
  {
    username: "dr_smith",
    password: "password123",
    name: "Dr. Jane Smith", 
    role: "moderator",
    workforce: "Healthcare Inc",
    workforceRole: "Moderator",
    description: "Medical director - manages healthcare workforce + moderator network access"
  },
  {
    username: "nurse_jones",
    password: "password123",
    name: "Mary Jones",
    role: "user",
    workforce: "Healthcare Inc", 
    workforceRole: "User",
    description: "Registered nurse - healthcare-only communications for patient privacy"
  },
  {
    username: "admin_brown", 
    password: "password123",
    name: "John Brown",
    role: "user",
    workforce: "Healthcare Inc",
    workforceRole: "User", 
    description: "Healthcare admin - restricted to healthcare workforce for HIPAA compliance"
  },
  
  // Finance Group
  {
    username: "cfo_wilson",
    password: "password123",
    name: "Sarah Wilson",
    role: "moderator", 
    workforce: "Finance Group",
    workforceRole: "Moderator",
    description: "Chief Financial Officer - finance team management + cross-moderator coordination"
  },
  {
    username: "analyst_davis",
    password: "password123",
    name: "Mike Davis", 
    role: "user",
    workforce: "Finance Group",
    workforceRole: "User",
    description: "Financial analyst - finance-only access for sensitive financial data protection"
  },
  {
    username: "clerk_martin",
    password: "password123",
    name: "Lisa Martin",
    role: "user",
    workforce: "Finance Group", 
    workforceRole: "User",
    description: "Finance clerk - limited to internal finance team communications"
  }
];

export default function TestingDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleTestLogin = async (testUser: TestUser) => {
    setIsLoggingIn(true);
    try {
      const response = await apiRequest('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.success) {
        toast({
          title: "Test Login Successful",
          description: `Logged in as ${testUser.name} (${testUser.workforceRole})`,
        });
        // Reload to update the user context
        window.location.href = '/';
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: `Failed to login as ${testUser.username}. Check console for details.`,
        variant: "destructive"
      });
      console.error('Test login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'master': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator': return <Shield className="w-4 h-4 text-purple-500" />;
      default: return <User className="w-4 h-4 text-blue-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'master': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'moderator': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getWorkforceUsers = (workforce: string) => {
    return testUsers.filter(u => u.workforce === workforce);
  };

  const workforces = Array.from(new Set(testUsers.map(u => u.workforce)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TestTube className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                  SKRAM Testing Dashboard
                </h1>
                <p className="text-gray-600 dark:text-slate-400">
                  Multi-workforce role-based testing environment
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => window.open('/api-docs', '_blank')}
                className="flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                API Docs
              </Button>
              {user && (
                <div className="text-sm text-gray-600 dark:text-slate-400">
                  Currently: <strong>{user.username}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current User Status */}
        {user && (
          <Alert className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <UserCheck className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Currently logged in as:</strong> {user.username} 
              {user.role && ` (${user.role})`}
              {" "}• Use the test accounts below to switch roles and test different user experiences.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Test Users</TabsTrigger>
            <TabsTrigger value="scenarios">Test Scenarios</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Workforces</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{workforces.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Engineering, Healthcare, Finance + Demo workforces
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Test Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{testUsers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    1 Master Admin + 3 Moderators + 6 Regular Users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Test Scenarios</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">25+</div>
                  <p className="text-xs text-muted-foreground">
                    Role boundaries, cross-workforce, security tests
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Workforce Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {workforces.map(workforce => (
                <Card key={workforce}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {workforce}
                    </CardTitle>
                    <CardDescription>
                      {getWorkforceUsers(workforce).length} test users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getWorkforceUsers(workforce).map(user => (
                        <div key={user.username} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800 rounded">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(user.role)}
                            <span className="font-medium">{user.name}</span>
                          </div>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.workforceRole}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Test Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {testUsers.map(testUser => (
                <Card key={testUser.username} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(testUser.role)}
                        {testUser.name}
                      </div>
                      <Badge className={getRoleBadgeColor(testUser.role)}>
                        {testUser.workforceRole}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{testUser.workforce}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {testUser.description}
                    </p>
                    <div className="text-xs space-y-1">
                      <div><strong>Username:</strong> {testUser.username}</div>
                      <div><strong>Password:</strong> {testUser.password}</div>
                    </div>
                    <Button 
                      onClick={() => handleTestLogin(testUser)}
                      disabled={isLoggingIn}
                      className="w-full"
                      variant={user?.username === testUser.username ? "secondary" : "default"}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {user?.username === testUser.username ? "Current User" : "Login as User"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Test Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Testing Scenarios</CardTitle>
                <CardDescription>
                  Critical test cases to validate the multi-workforce security model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Alert>
                    <Crown className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Master Admin Testing:</strong> Login as master_admin to verify system-wide access, analytics dashboard, and cross-workforce management capabilities.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Moderator Boundaries:</strong> Test alice_eng, dr_smith, and cfo_wilson can only manage their own workforces but can message other moderators.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <User className="h-4 w-4" />
                    <AlertDescription>
                      <strong>User Isolation:</strong> Verify bob_dev can only see Engineering Corp members, nurse_jones only Healthcare Inc, etc.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <MessageCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Cross-Workforce Restrictions:</strong> Test that regular users from different workforces cannot directly message each other.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Testing Checklist:</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>✓ Workforce member visibility follows role boundaries</li>
                    <li>✓ Conversation access respects workforce isolation</li>
                    <li>✓ Real-time messaging works across all user types</li>
                    <li>✓ Master admin has complete system access</li>
                    <li>✓ Moderators can coordinate across workforces</li>
                    <li>✓ Regular users are properly restricted to their workforce</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Testing Resources</CardTitle>
                <CardDescription>
                  Complete documentation and API resources for comprehensive testing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      API Documentation
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                      Complete Swagger API documentation with interactive testing capabilities.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('/api-docs', '_blank')}
                      className="w-full"
                    >
                      Open API Docs
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4" />
                      Testing Guide
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                      Detailed testing scenarios and expected results for validation.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('/COMPREHENSIVE_TESTING_GUIDE.md', '_blank')}
                      className="w-full"
                    >
                      View Testing Guide
                    </Button>
                  </div>
                </div>

                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> Use the browser's developer tools to monitor WebSocket connections and API requests while testing different user roles for detailed debugging.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}