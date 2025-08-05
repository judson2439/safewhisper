import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Lock, Clock, EyeOff, Users, Shield, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/signin";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lock className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SKRAM</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild className="bg-primary hover:bg-blue-700">
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Private Messaging
            <span className="text-primary block">That Actually Works</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            End-to-end encrypted conversations with automatic message deletion, 
            screenshot prevention, and group chat capabilities. Your privacy is our priority.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/signin">Start Secure Messaging</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/role-test">Try Demo</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>End-to-End Encryption</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                All messages are encrypted with AES-256 before leaving your device. 
                Only you and your recipients can read them.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Clock className="w-12 h-12 text-warning mx-auto mb-4" />
              <CardTitle>Auto-Delete Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Messages automatically disappear after 24 hours, ensuring your 
                conversations remain private and don't leave a permanent trail.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <EyeOff className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Advanced Screenshot Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Multi-layer protection blocks screenshots, screen recording, printing, 
                and developer tools. Includes visual watermarks and dynamic content protection.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-success mx-auto mb-4" />
              <CardTitle>Secure Group Chats</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create encrypted group conversations with friends, family, or 
                colleagues. Everyone gets the same level of security.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="w-12 h-12 text-success mx-auto mb-4" />
              <CardTitle>Privacy First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We don't store your messages, track your activity, or sell your 
                data. Your privacy is completely protected.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="w-12 h-12 text-warning mx-auto mb-4" />
              <CardTitle>Real-Time Messaging</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Instant message delivery with typing indicators and read receipts, 
                all while maintaining maximum security.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-12 shadow-lg">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Secure Your Conversations?
          </h3>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who trust SKRAM for their private communications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/signin">Get Started Now</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/role-test">View Demo</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Lock className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">SKRAM</span>
          </div>
          <p className="text-gray-400">
            Secure messaging that respects your privacy.
          </p>
        </div>
      </footer>
    </div>
  );
}
