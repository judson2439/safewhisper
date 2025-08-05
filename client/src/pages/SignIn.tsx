import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shield, Lock, Eye, ArrowRight, Zap, User, KeyRound, Key } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isCustomSignIn, setIsCustomSignIn] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleReplitSignIn = async () => {
    setIsLoading(true);
    // Redirect to Replit Auth
    window.location.href = "/api/login";
  };

  const handleCustomSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCustomSignIn(true);
    
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const result = await response.json();
        const user = result.user;
        
        // Redirect based on user role
        if (user?.role === 'master' || user?.role === 'admin') {
          window.location.href = "/admin";
        } else {
          window.location.href = "/chat";
        }
      } else {
        const error = await response.json();
        alert(error.message || "Sign in failed");
      }
    } catch (error) {
      alert("Sign in failed. Please try again.");
    } finally {
      setIsCustomSignIn(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }
    
    setIsResettingPassword(true);
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: resetUsername, newPassword }),
      });

      if (response.ok) {
        alert("Password reset successfully! You can now sign in with your new password.");
        setShowPasswordReset(false);
        setResetUsername("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const error = await response.json();
        alert(error.message || "Password reset failed");
      }
    } catch (error) {
      alert("Password reset failed. Please try again.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Main Sign In Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
              Welcome to SKRAM
            </h1>
            
            {/* Sign In Card */}
            <Card className="max-w-md mx-auto mb-12 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Sign In to Your Account</CardTitle>
                <CardDescription>
                  Choose your preferred sign-in method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="username" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="username" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Username
                    </TabsTrigger>
                    <TabsTrigger value="replit" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Replit
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="username" className="space-y-4 mt-6">
                    <form onSubmit={handleCustomSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Enter your username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button 
                        type="submit"
                        disabled={isCustomSignIn}
                        className="w-full text-lg py-6"
                        size="lg"
                      >
                        {isCustomSignIn ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Signing In...
                          </div>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                    
                    {/* Forgot Password Link */}
                    <div className="text-center mt-4">
                      <Button
                        variant="link"
                        onClick={() => setShowPasswordReset(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-0 h-auto"
                      >
                        Forgot your password?
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="replit" className="space-y-4 mt-6">
                    <Button 
                      onClick={handleReplitSignIn}
                      disabled={isLoading}
                      className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
                      size="lg"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Signing In...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Lock className="w-5 h-5" />
                          Sign In with Replit
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>



          {/* Security Features */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>End-to-End Encryption</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  All messages are encrypted with AES-256 before leaving your device. 
                  Only you and your recipients can read them.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Real-Time Messaging</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Instant message delivery with typing indicators and read receipts, 
                  all while maintaining maximum security.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              By signing in, you agree to our terms of service and privacy policy
            </p>
          </div>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
        <DialogContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
              <Key className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Reset Your Password
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-slate-400">
              Enter your username and set a new password
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <Label htmlFor="resetUsername" className="text-gray-900 dark:text-slate-100">Username</Label>
              <Input
                id="resetUsername"
                type="text"
                value={resetUsername}
                onChange={(e) => setResetUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <Label htmlFor="newPasswordReset" className="text-gray-900 dark:text-slate-100">New Password</Label>
              <Input
                id="newPasswordReset"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPasswordReset" className="text-gray-900 dark:text-slate-100">Confirm New Password</Label>
              <Input
                id="confirmPasswordReset"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordReset(false);
                  setResetUsername("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!resetUsername || !newPassword || newPassword.length < 6 || isResettingPassword}
                className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white"
              >
                {isResettingPassword ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}