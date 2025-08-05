import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { enableComprehensiveScreenshotProtection } from "@/lib/advancedScreenshotProtection";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import PasswordReset from "@/pages/PasswordReset";
import SignOut from "@/pages/SignOut";
import ViewSignIn from "@/pages/ViewSignIn";
import Home from "@/pages/Home";
import WorkforceDashboard from "@/pages/WorkforceDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import UsernameSetup from "@/components/Auth/UsernameSetup";
import UserDemo from "@/pages/UserDemo";
import TestUserDemo from "@/pages/TestUserDemo";
import ModeratorDemo from "@/pages/ModeratorDemo";
import RoleTestDashboard from "@/pages/RoleTestDashboard";
import TestingDashboard from "@/pages/TestingDashboard";
import UserFunctionTest from "@/components/Demo/UserFunctionTest";
import IconExamples from "@/pages/IconExamples";

function AlreadySignedIn() {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg mb-4">You are already signed in!</p>
        <p className="text-gray-600 mb-4">Redirecting to your dashboard...</p>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

function RedirectToChat() {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/chat";
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg mb-4">Redirecting to your chat...</p>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

function RedirectToAdmin() {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/admin";
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg mb-4">Redirecting to admin dashboard...</p>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading ? (
        <Route path="*">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </Route>
      ) : !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/signin" component={SignIn} />
          <Route path="/signup" component={SignUp} />
          <Route path="/reset-password" component={PasswordReset} />
          <Route path="/signout" component={SignOut} />
          <Route path="/view-signin" component={ViewSignIn} />
          <Route path="/admin">
            <AdminDashboard />
          </Route>
          <Route path="/user-demo">
            <UserDemo />
          </Route>
          <Route path="/moderator-demo">
            <ModeratorDemo />
          </Route>
          <Route path="/role-test">
            <RoleTestDashboard />
          </Route>
          <Route path="/testing">
            <TestingDashboard />
          </Route>
        </>
      ) : user && !user.username ? (
        <Route path="*">
          <UsernameSetup 
            user={user} 
            onComplete={() => window.location.reload()} 
          />
        </Route>
      ) : (
        <>
          <Route path="/" component={
            user?.role === 'master' || user?.role === 'admin' 
              ? RedirectToAdmin
              : user?.role === 'moderator' 
                ? () => <ModeratorDemo />
                : () => <Home />
          } />
          <Route path="/reset-password" component={PasswordReset} />
          <Route path="/signup" component={SignUp} />
          <Route path="/signin">
            <AlreadySignedIn />
          </Route>
          <Route path="/signout" component={SignOut} />
          <Route path="/view-signin" component={ViewSignIn} />
          <Route path="/admin">
            {user?.role === 'master' || user?.role === 'admin' ? (
              <AdminDashboard />
            ) : user?.role === 'moderator' ? (
              <ModeratorDemo />
            ) : (
              <RedirectToChat />
            )}
          </Route>
          <Route path="/chat" component={
            user?.role === 'moderator' 
              ? () => <ModeratorDemo />
              : user?.role === 'master' || user?.role === 'admin'
                ? () => <ModeratorDemo isMasterAdmin={true} onReturnToDashboard={() => window.location.href = '/admin'} />
                : () => <Home />
          } />
          <Route path="/workforce" component={WorkforceDashboard} />
          <Route path="/user-demo">
            <UserDemo />
          </Route>
          <Route path="/user-test">
            <UserFunctionTest />
          </Route>
          <Route path="/test-user-demo">
            <TestUserDemo />
          </Route>
          <Route path="/icon-examples">
            <IconExamples />
          </Route>
          <Route path="/moderator-demo">
            <ModeratorDemo />
          </Route>
          <Route path="/role-test">
            <RoleTestDashboard />
          </Route>
          <Route path="/testing">
            <TestingDashboard />
          </Route>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Temporarily disable screenshot protection for testing
  // React.useEffect(() => {
  //   enableComprehensiveScreenshotProtection();
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="securechat-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
