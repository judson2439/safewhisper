import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function SignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    // Redirect to logout API endpoint
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="text-center shadow-xl">
            <CardHeader>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">Sign Out</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to sign out of SecureChat?
              </p>
              
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  variant="destructive"
                  className="w-full"
                >
                  {isSigningOut ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing Out...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </div>
                  )}
                </Button>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancel
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}