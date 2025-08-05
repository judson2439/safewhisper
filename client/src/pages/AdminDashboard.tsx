import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, BarChart3, Users, Building2, MessageCircle, TrendingUp, ArrowLeft, LogOut, BookOpen, Shield, Clock, CheckCircle, XCircle, Eye, Download, Upload } from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import ModeratorDemo from "@/pages/ModeratorDemo";

interface AdminAnalytics {
  totalWorkforces: number;
  totalMembers: number;
  totalMessages: number;
  messagesThisYear: number;
  messagesThisMonth: number;
  messagesThisWeek: number;
  messagesToday: number;
}

interface PHIAccessLog {
  id: string;
  messageId: string;
  userId: string;
  userEmail: string;
  workforceName: string;
  accessTime: string;
  success: boolean;
  authMethod: string;
  activityType: string;
  phiTypes: string[];
  attachmentName?: string;
  fileSize?: number;
  contentPreview?: string;
}

interface MessageDetails {
  id: string;
  content: string;
  phiTypes: string[];
  phiDescription?: string;
  attachments: any[];
  createdAt: string;
  sender: {
    email: string;
    username: string;
  };
}

interface AdminDashboardProps {
  onReturnToDashboard?: () => void;
}

export default function AdminDashboard({ onReturnToDashboard }: AdminDashboardProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  
  // PHI Access Log Filters
  const [phiFilters, setPhiFilters] = useState({
    dateFrom: '',
    dateTo: '',
    userEmail: '',
    organization: 'all',
    activityType: 'all',
    status: 'all',
    phiType: ''
  });

  // Reset to dashboard when navigating to /admin route
  useEffect(() => {
    if (location === '/admin') {
      setActiveTab("dashboard");
    }
  }, [location]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AdminAnalytics>({
    queryKey: ['/api/admin/analytics'],
    enabled: user?.role === 'master' || user?.id === '45717668',
  });

  const { data: phiAccessLogs, isLoading: phiLogsLoading } = useQuery<PHIAccessLog[]>({
    queryKey: ['/api/admin/phi-access-logs'],
    enabled: (user?.role === 'master' || user?.id === '45717668') && activeTab === 'phi-access',
  });

  const { data: workforces } = useQuery<Array<{id: string, name: string}>>({
    queryKey: ['/api/workforces'],
    enabled: (user?.role === 'master' || user?.id === '45717668') && activeTab === 'phi-access',
  });

  const { data: messageDetails, isLoading: messageLoading } = useQuery<MessageDetails>({
    queryKey: ['/api/admin/message-details', selectedMessageId],
    enabled: !!selectedMessageId,
  });

  // Filter PHI logs based on current filters
  const filteredPhiLogs = phiAccessLogs?.filter(log => {
    const logDate = new Date(log.accessTime);
    const fromDate = phiFilters.dateFrom ? new Date(phiFilters.dateFrom) : null;
    const toDate = phiFilters.dateTo ? new Date(phiFilters.dateTo + 'T23:59:59') : null;
    
    return (
      (!fromDate || logDate >= fromDate) &&
      (!toDate || logDate <= toDate) &&
      (!phiFilters.userEmail || log.userEmail.toLowerCase().includes(phiFilters.userEmail.toLowerCase())) &&
      (!phiFilters.organization || phiFilters.organization === 'all' || log.workforceName === phiFilters.organization) &&
      (!phiFilters.activityType || phiFilters.activityType === 'all' || log.activityType === phiFilters.activityType) &&
      (!phiFilters.status || phiFilters.status === 'all' || (phiFilters.status === 'success' ? log.success : !log.success)) &&
      (!phiFilters.phiType || log.phiTypes.some(type => type.toLowerCase().includes(phiFilters.phiType.toLowerCase())))
    );
  }) || [];

  // Clear all filters
  const clearFilters = () => {
    setPhiFilters({
      dateFrom: '',
      dateTo: '',
      userEmail: '',
      organization: 'all',
      activityType: 'all',
      status: 'all',
      phiType: ''
    });
  };

  // Export PHI logs to CSV (uses filtered data)
  const exportPHILogs = () => {
    const logsToExport = filteredPhiLogs;
    if (!logsToExport || logsToExport.length === 0) {
      toast({
        title: "No Data",
        description: "No PHI access logs available to export.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = [
      'Timestamp',
      'User Email',
      'User ID',
      'Organization',
      'Patient First Name',
      'Patient Last Name', 
      'Status',
      'Auth Method',
      'Activity Type',
      'PHI Types',
      'Attachment Name',
      'File Size (bytes)',
      'Content Preview',
      'Message ID'
    ];

    const csvContent = [
      headers.join(','),
      ...logsToExport.map(log => [
        `"${log.accessTime}"`,
        `"${log.userEmail}"`,
        `"${log.userId}"`,
        `"${log.workforceName}"`,
        `"${log.patientFirstName || ''}"`,
        `"${log.patientLastName || ''}"`,
        `"${log.success ? 'Success' : 'Failed'}"`,
        `"${log.authMethod}"`,
        `"${log.activityType}"`,
        `"${log.phiTypes.join('; ')}"`,
        `"${log.attachmentName || ''}"`,
        `"${log.fileSize || ''}"`,
        `"${log.contentPreview?.replace(/"/g, '""') || ''}"`,
        `"${log.messageId}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `phi-access-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${logsToExport.length} PHI access log entries to CSV.`,
    });
  };

  // Allow demo access - bypass role check for development
  if (user && user?.role !== 'master' && user?.id !== '45717668') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Card className="max-w-md bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
              <Crown className="w-5 h-5 text-red-500" />
              Master Access Required
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-slate-400">
              You need master user privileges to access this dashboard.
              <br />Current user: {user?.email} (Role: {user?.role})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <strong>To test Master Admin features:</strong>
              <br />
              1. Sign out and sign in with: master_admin / admin123
              <br />
              2. Or use the Role Testing Dashboard to switch roles
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline" className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100">Return to Chat</Button>
              </Link>
              <Link href="/role-test">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Role Testing</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === "chat") {
    return (
      <div className="min-h-screen">
        <ModeratorDemo onReturnToDashboard={() => setActiveTab("dashboard")} isMasterAdmin={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Master Admin Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Welcome back, {user?.username ? `@${user.username}` : user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.open('/api-docs', '_blank')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <BookOpen className="w-4 h-4" />
                API Docs
              </Button>
              <ThemeToggle />
              {onReturnToDashboard && (
                <Button
                  variant="outline"
                  onClick={onReturnToDashboard}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Testing
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setActiveTab("chat")}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Master Chat
              </Button>
              <Link href="/workforce">
                <Button variant="outline" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Manage Workforces
                </Button>
              </Link>
              <Button
                variant="outline"
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-300 dark:text-slate-300">Analytics Dashboard</TabsTrigger>
            <TabsTrigger value="phi-access" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-300 dark:text-slate-300">PHI Access Logs</TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900/20 dark:data-[state=active]:text-blue-300 dark:text-slate-300">Integrated Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="h-screen -mx-4 -my-8">
            <ModeratorDemo onReturnToDashboard={() => setActiveTab("dashboard")} isMasterAdmin={true} />
          </TabsContent>

          <TabsContent value="phi-access" className="space-y-6">
            {/* PHI Access Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-slate-100">Total PHI Access</CardTitle>
                  <Shield className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {phiLogsLoading ? '...' : phiAccessLogs?.length || 0}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">All access attempts</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-slate-100">Successful Access</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {phiLogsLoading ? '...' : phiAccessLogs?.filter(log => log.success).length || 0}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {phiAccessLogs?.length ? 
                      `${Math.round((phiAccessLogs.filter(log => log.success).length / phiAccessLogs.length) * 100)}% success rate` :
                      'No data'
                    }
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-slate-100">Failed Attempts</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {phiLogsLoading ? '...' : phiAccessLogs?.filter(log => !log.success).length || 0}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Security violations</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-slate-100">Unique Messages</CardTitle>
                  <Eye className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {phiLogsLoading ? '...' : 
                      new Set(phiAccessLogs?.map(log => log.messageId)).size || 0
                    }
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">PHI messages accessed</p>
                </CardContent>
              </Card>
            </div>

            {/* PHI Access Log Filters */}
            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 dark:text-slate-100">Filter Audit Logs</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-600 hover:text-gray-700 border-gray-200 hover:border-gray-300"
                  >
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">From Date</label>
                    <Input
                      type="date"
                      value={phiFilters.dateFrom}
                      onChange={(e) => setPhiFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">To Date</label>
                    <Input
                      type="date"
                      value={phiFilters.dateTo}
                      onChange={(e) => setPhiFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">User Email</label>
                    <Input
                      type="text"
                      placeholder="Search by email..."
                      value={phiFilters.userEmail}
                      onChange={(e) => setPhiFilters(prev => ({ ...prev, userEmail: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Organization</label>
                    <Select value={phiFilters.organization} onValueChange={(value) => setPhiFilters(prev => ({ ...prev, organization: value }))}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="All organizations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All organizations</SelectItem>
                        {workforces?.map((workforce) => (
                          <SelectItem key={workforce.id} value={workforce.name}>
                            {workforce.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Activity Type</label>
                    <Select value={phiFilters.activityType} onValueChange={(value) => setPhiFilters(prev => ({ ...prev, activityType: value }))}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="All activities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All activities</SelectItem>
                        <SelectItem value="upload">Upload</SelectItem>
                        <SelectItem value="download">Download</SelectItem>
                        <SelectItem value="view">View</SelectItem>
                        <SelectItem value="access">Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Status</label>
                    <Select value={phiFilters.status} onValueChange={(value) => setPhiFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">PHI Type</label>
                    <Input
                      type="text"
                      placeholder="Search PHI type..."
                      value={phiFilters.phiType}
                      onChange={(e) => setPhiFilters(prev => ({ ...prev, phiType: e.target.value }))}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="text-sm text-gray-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center">
                      Showing {filteredPhiLogs.length} of {phiAccessLogs?.length || 0} entries
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PHI Access Log Table */}
            <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
                      <Shield className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                      PHI Access Audit Trail
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-slate-400">
                      Complete HIPAA-compliant audit log of all Protected Health Information access activities
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportPHILogs()}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                    disabled={phiLogsLoading || !filteredPhiLogs?.length}
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {phiLogsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500 dark:text-slate-400">Loading PHI access logs...</div>
                  </div>
                ) : filteredPhiLogs && filteredPhiLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-600">
                          <th className="text-left py-2 px-3 font-medium text-gray-900 dark:text-slate-100">Time</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-900 dark:text-slate-100">User</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-900 dark:text-slate-100">Organization</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-900 dark:text-slate-100">Patient</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-900 dark:text-slate-100">Status</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-900 dark:text-slate-100">Activity</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-900 dark:text-slate-100">Content</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPhiLogs.map((log, index) => (
                          <tr key={index} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                            <td className="py-2 px-3 text-gray-900 dark:text-slate-100">
                              <div className="text-xs">
                                {new Date(log.accessTime).toISOString().replace('T', ' ').slice(0, 19)} UTC
                              </div>
                            </td>
                            <td className="py-2 px-3 text-gray-900 dark:text-slate-100">
                              <div className="font-medium text-sm">{log.userEmail}</div>
                              <div className="text-xs text-gray-500 dark:text-slate-400">{log.userId.substring(0, 8)}...</div>
                            </td>
                            <td className="py-2 px-3 text-sm text-gray-600 dark:text-slate-300">
                              {log.workforceName}
                            </td>
                            <td className="py-2 px-3 text-sm text-gray-900 dark:text-slate-100">
                              {log.patientFirstName && log.patientLastName ? (
                                <div className="font-medium">
                                  {log.patientFirstName} {log.patientLastName}
                                </div>
                              ) : (
                                <div className="text-gray-500 dark:text-slate-400 italic text-xs">
                                  No patient name
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-sm">
                              {log.success ? (
                                <span className="text-green-600 dark:text-green-400 font-medium">Success</span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400 font-medium">Failed</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-sm text-gray-600 dark:text-slate-300">
                              <div>
                                {(() => {
                                  if (log.activityType === 'upload') {
                                    return <span className="text-blue-600 dark:text-blue-400 font-medium">PHI Upload</span>;
                                  } else if (log.activityType === 'authenticate_success') {
                                    return <span className="text-green-600 dark:text-green-400 font-medium">Auth Success</span>;
                                  } else if (log.activityType === 'authenticate_failure') {
                                    return <span className="text-red-600 dark:text-red-400 font-medium">Auth Failed</span>;
                                  } else if (log.activityType === 'download') {
                                    return <span className="text-purple-600 dark:text-purple-400 font-medium">File Download</span>;
                                  } else {
                                    return <span className="text-gray-600 dark:text-gray-400">View Message</span>;
                                  }
                                })()}
                              </div>
                              {log.attachmentName && (
                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                  {log.attachmentName} ({log.fileSize ? `${Math.round(log.fileSize / 1024)}KB` : 'N/A'})
                                </div>
                              )}
                            </td>

                            <td className="py-2 px-3 text-sm text-gray-600 dark:text-slate-300 max-w-xs">
                              <button
                                onClick={() => {
                                  setSelectedMessageId(log.messageId);
                                  setShowContentModal(true);
                                }}
                                className="text-left hover:bg-gray-50 dark:hover:bg-slate-700 rounded p-1 transition-colors cursor-pointer w-full"
                                title="Click to view full message content and attachments"
                              >
                                <div className="truncate text-blue-600 dark:text-blue-400 hover:underline">
                                  {log.contentPreview || 'Encrypted content'}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                                  {log.messageId.substring(0, 8)}... (Click to view)
                                </div>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : phiAccessLogs && phiAccessLogs.length > 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                    <div className="text-gray-500 dark:text-slate-400">No matching PHI access logs found</div>
                    <div className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                      Try adjusting your filters to see more results
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="mt-3 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                    <div className="text-gray-500 dark:text-slate-400">No PHI access logs found</div>
                    <div className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                      PHI access activities will appear here when users interact with protected health information
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-slate-100">Total Workforces</CardTitle>
                  <Building2 className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {analyticsLoading ? '...' : analytics?.totalWorkforces || 0}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">All organizations in system</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-slate-100">Total Members</CardTitle>
                  <Users className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {analyticsLoading ? '...' : analytics?.totalMembers || 0}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">All members system-wide</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-slate-100">Total Messages</CardTitle>
                  <MessageCircle className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {analyticsLoading ? '...' : analytics?.totalMessages || 0}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">All messages ever sent</p>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-slate-100">Today's Messages</CardTitle>
                  <TrendingUp className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {analyticsLoading ? '...' : analytics?.messagesToday || 0}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Last 24 hours</p>
                </CardContent>
              </Card>
            </div>

            {/* Message Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Message Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Today</span>
                      <span className="text-2xl font-bold text-green-600">
                        {analyticsLoading ? '...' : analytics?.messagesToday || 0}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-green-500 rounded-full" 
                        style={{ 
                          width: analytics?.totalMessages ? 
                            `${Math.min((analytics.messagesToday / analytics.totalMessages) * 100, 100)}%` : 
                            '0%' 
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">This Week</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {analyticsLoading ? '...' : analytics?.messagesThisWeek || 0}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full" 
                        style={{ 
                          width: analytics?.totalMessages ? 
                            `${Math.min((analytics.messagesThisWeek / analytics.totalMessages) * 100, 100)}%` : 
                            '0%' 
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">This Month</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {analyticsLoading ? '...' : analytics?.messagesThisMonth || 0}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-blue-500 rounded-full" 
                        style={{ 
                          width: analytics?.totalMessages ? 
                            `${Math.min((analytics.messagesThisMonth / analytics.totalMessages) * 100, 100)}%` : 
                            '0%' 
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">This Year</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {analyticsLoading ? '...' : analytics?.messagesThisYear || 0}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-purple-500 rounded-full" 
                        style={{ 
                          width: analytics?.totalMessages ? 
                            `${Math.min((analytics.messagesThisYear / analytics.totalMessages) * 100, 100)}%` : 
                            '0%' 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/workforce">
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <Building2 className="w-6 h-6" />
                      Manage Workforces
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col gap-2"
                    onClick={() => setActiveTab("chat")}
                  >
                    <MessageCircle className="w-6 h-6" />
                    Open Chat
                  </Button>
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <TrendingUp className="w-6 h-6" />
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>
      </div>

      {/* Message Content Modal */}
      <Dialog open={showContentModal} onOpenChange={setShowContentModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-600" />
              PHI Message Audit Details
            </DialogTitle>
            <DialogDescription>
              Complete message content and attachments for regulatory compliance audit
            </DialogDescription>
          </DialogHeader>
          
          {messageLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
              <span className="ml-2">Loading message details...</span>
            </div>
          ) : messageDetails ? (
            <div className="space-y-4">
              {/* Message Metadata */}
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Message Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Message ID:</strong> {messageDetails.id}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(messageDetails.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <strong>Sender:</strong> {messageDetails.sender.username} ({messageDetails.sender.email})
                  </div>
                  <div>
                    <strong>Patient First Name:</strong> {messageDetails.patientFirstName || 'Not provided'}
                  </div>
                  <div>
                    <strong>Patient Last Name:</strong> {messageDetails.patientLastName || 'Not provided'}
                  </div>
                  <div>
                    <strong>Full Patient Name:</strong> {messageDetails.patientFirstName && messageDetails.patientLastName 
                      ? `${messageDetails.patientFirstName} ${messageDetails.patientLastName}` 
                      : 'No complete patient name recorded'}
                  </div>
                </div>
                {messageDetails.phiDescription && (
                  <div className="mt-2">
                    <strong>PHI Description:</strong> {messageDetails.phiDescription}
                  </div>
                )}
                
                {/* PHI Types Section */}
                {messageDetails.phiTypes && messageDetails.phiTypes.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Protected Health Information Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {messageDetails.phiTypes.map((type: string, i: number) => (
                        <span 
                          key={i}
                          className="px-3 py-1 bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 text-sm rounded-full font-medium"
                        >
                          {type.replace('_', ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="bg-white dark:bg-slate-900 border p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Message Content</h3>
                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded border-l-4 border-yellow-500">
                  <pre className="whitespace-pre-wrap text-sm">{messageDetails.content}</pre>
                </div>
              </div>

              {/* Attachments */}
              {messageDetails.attachments && messageDetails.attachments.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Attachments ({messageDetails.attachments.length})</h3>
                  <div className="space-y-4">
                    {messageDetails.attachments.map((attachment: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium">{attachment.name}</div>
                            <div className="text-sm text-gray-500">
                              {attachment.size ? `${Math.round(attachment.size / 1024)}KB` : 'Unknown size'} • 
                              {attachment.type || 'Unknown type'}
                            </div>
                          </div>
                          {attachment.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  console.log('Opening PHI attachment:', attachment.name, 'ID:', attachment.id);
                                  const response = await fetch(`/api/attachments/serve/${encodeURIComponent(attachment.id)}`, {
                                    credentials: 'include'
                                  });
                                  
                                  if (!response.ok) {
                                    throw new Error(`Failed to fetch file: ${response.status}`);
                                  }
                                  
                                  const blob = await response.blob();
                                  const blobUrl = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = blobUrl;
                                  link.download = attachment.name;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(blobUrl);
                                  
                                  console.log('PHI attachment downloaded successfully:', attachment.name);
                                } catch (error) {
                                  console.error('Error opening PHI attachment:', error);
                                  alert(`Failed to open file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                }
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Open File
                            </Button>
                          )}
                        </div>
                        
                        {/* Image Preview for audit purposes */}
                        {attachment.type?.startsWith('image/') && attachment.id && (
                          <div className="mt-3">
                            <div className="text-sm font-medium mb-2">Preview (for audit purposes):</div>
                            <div className="border rounded p-2 bg-gray-50 dark:bg-slate-800">
                              <img 
                                src={`/api/attachments/serve/${encodeURIComponent(attachment.id)}`}
                                alt={attachment.name}
                                className="max-w-full max-h-64 rounded cursor-pointer hover:opacity-80"
                                onClick={async () => {
                                  try {
                                    console.log('PHI image preview clicked:', attachment.name);
                                    const response = await fetch(`/api/attachments/serve/${encodeURIComponent(attachment.id)}`, {
                                      credentials: 'include'
                                    });
                                    
                                    if (!response.ok) {
                                      throw new Error(`Failed to fetch file: ${response.status}`);
                                    }
                                    
                                    const blob = await response.blob();
                                    const blobUrl = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = blobUrl;
                                    link.download = attachment.name;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(blobUrl);
                                    
                                    console.log('PHI image downloaded from preview:', attachment.name);
                                  } catch (error) {
                                    console.error('Error downloading PHI image:', error);
                                    alert(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                  }
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'text-sm text-red-600 p-4';
                                  errorDiv.textContent = 'Image preview temporarily unavailable. Use "Open File" button above to access the file.';
                                  target.parentNode?.appendChild(errorDiv);
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-slate-400 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <strong>Audit Notice:</strong> This content is preserved for HIPAA compliance and regulatory audit purposes. 
                All access to this information is logged and monitored.
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <div className="text-gray-500">Message details could not be loaded</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}