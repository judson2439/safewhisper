import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, User, Mail, KeyRound, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isLoading, setIsLoading] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [isInviteMode, setIsInviteMode] = useState(false);

  // Check for invitation token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setInvitationToken(token);
      setIsInviteMode(true);
      // Fetch invitation details
      fetch(`/api/workforce-invitations/validate/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.invitation) {
            setInvitationData(data.invitation);
            setEmail(data.invitation.email);
            setRole(data.invitation.role === 'moderator' ? 'admin' : 'member');
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const signupData = { 
        username, 
        password, 
        email, 
        role,
        ...(invitationToken && { invitationToken })
      };

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        const error = await response.json();
        alert(error.message || "Sign up failed");
      }
    } catch (error) {
      alert("Sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">SKRAM</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/view-signin">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo and Title */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            {isInviteMode ? 'Complete Your Invitation' : 'Join SKRAM'}
          </h1>
          
          {isInviteMode && invitationData && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg max-w-md mx-auto">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">You're Invited!</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                You've been invited to join as a <strong>{invitationData.role}</strong>. 
                Complete your account setup below.
              </p>
            </div>
          )}
          
          {/* Sign Up Card */}
          <Card className="max-w-md mx-auto mb-12 shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Create Your Account</CardTitle>
              <CardDescription>
                Sign up to start secure messaging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{isInviteMode ? 'Email' : 'Email (Optional)'}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isInviteMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {!isInviteMode && (
                  <div className="space-y-2">
                    <Label htmlFor="role">Account Type</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Regular User</SelectItem>
                        <SelectItem value="admin">Moderator</SelectItem>
                        <SelectItem value="master">Master Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-lg py-6"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">End-to-End Encryption</h3>
              <p className="text-gray-600 dark:text-gray-300">Messages are encrypted before leaving your device</p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <KeyRound className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Auto-Delete Messages</h3>
              <p className="text-gray-600 dark:text-gray-300">Messages automatically delete after 24 hours</p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <User className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Role-Based Access</h3>
              <p className="text-gray-600 dark:text-gray-300">Secure permissions and workforce management</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">
              By creating an account, you agree to our terms of service and privacy policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}