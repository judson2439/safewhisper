import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { User, Crown } from "lucide-react";

interface UsernameSetupProps {
  user: {
    id: string;
    email: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role: string | null;
  };
  onComplete: () => void;
}

export default function UsernameSetup({ user, onComplete }: UsernameSetupProps) {
  const [username, setUsername] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setupUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      return await apiRequest('PATCH', '/api/auth/user/username', { username });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Success",
        description: "Your username has been set up successfully!",
      });
      onComplete();
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
        description: error.message.includes('duplicate') 
          ? "Username already taken. Please choose another."
          : "Failed to set username. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    // Basic username validation
    if (username.length < 3) {
      toast({
        title: "Invalid Username",
        description: "Username must be at least 3 characters long",
        variant: "destructive",
      });
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast({
        title: "Invalid Username",
        description: "Username can only contain letters, numbers, and underscores",
        variant: "destructive",
      });
      return;
    }
    
    setupUsernameMutation.mutate(username);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {user.role === 'master' ? (
              <Crown className="w-12 h-12 text-yellow-500" />
            ) : (
              <User className="w-12 h-12 text-blue-500" />
            )}
          </div>
          <CardTitle className="text-2xl">Welcome to SecureChat!</CardTitle>
          <CardDescription>
            Create a private username to protect your identity. This will be your display name in all conversations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Choose Your Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="e.g., alex_dev, sarah_m, john_designer"
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                disabled={setupUsernameMutation.isPending}
              />
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500">
                  • 3-20 characters long
                </p>
                <p className="text-xs text-gray-500">
                  • Letters, numbers, and underscores only
                </p>
                <p className="text-xs text-gray-500">
                  • Cannot be changed later
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">Privacy Protection</p>
              <p className="text-xs text-blue-600">
                Your username keeps your real identity private. Other users will only see @{username || 'your_username'} in chats.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={setupUsernameMutation.isPending || !username.trim()}
            >
              {setupUsernameMutation.isPending ? "Setting up..." : "Create Username"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}