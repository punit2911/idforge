import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Users, 
  Coins,
  RefreshCw,
  Clock,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";

interface PendingSubscription {
  id: string;
  user_id: string;
  token_package: number;
  amount: number;
  transaction_id: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  user_email?: string;
}

interface UserTokenInfo {
  id: string;
  user_id: string;
  tokens_used: number;
  free_limit: number;
  is_premium: boolean;
  user_email?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [pendingPayments, setPendingPayments] = useState<PendingSubscription[]>([]);
  const [userTokens, setUserTokens] = useState<UserTokenInfo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserTokenInfo | null>(null);
  const [tokenAdjustment, setTokenAdjustment] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
      if (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data === true);
      }
      setCheckingAdmin(false);
    };

    if (user) {
      checkAdminRole();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    await Promise.all([fetchPendingPayments(), fetchUserTokens()]);
    setLoadingData(false);
  };

  const fetchPendingPayments = async () => {
    const { data: payments, error } = await supabase
      .from("pending_subscriptions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payments:", error);
      return;
    }

    // Get user emails
    const userIds = [...new Set(payments?.map(p => p.user_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email")
      .in("user_id", userIds);

    const emailMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);
    
    setPendingPayments(
      payments?.map(p => ({
        ...p,
        user_email: emailMap.get(p.user_id) || "Unknown"
      })) || []
    );
  };

  const fetchUserTokens = async () => {
    const { data: tokens, error } = await supabase
      .from("usage_tokens")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching tokens:", error);
      return;
    }

    // Get user emails
    const userIds = [...new Set(tokens?.map(t => t.user_id) || [])];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email")
      .in("user_id", userIds);

    const emailMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);
    
    setUserTokens(
      tokens?.map(t => ({
        ...t,
        user_email: emailMap.get(t.user_id) || "Unknown"
      })) || []
    );
  };

  const handleVerifyPayment = async (payment: PendingSubscription) => {
    try {
      // Update subscription status
      const { error: subError } = await supabase
        .from("pending_subscriptions")
        .update({ 
          status: "verified",
          verified_at: new Date().toISOString()
        })
        .eq("id", payment.id);

      if (subError) throw subError;

      // Add tokens to user
      const { data: currentUsage } = await supabase
        .from("usage_tokens")
        .select("free_limit")
        .eq("user_id", payment.user_id)
        .maybeSingle();

      const newLimit = (currentUsage?.free_limit || 10) + payment.token_package;

      const { error: tokenError } = await supabase
        .from("usage_tokens")
        .update({ 
          free_limit: newLimit,
          is_premium: true 
        })
        .eq("user_id", payment.user_id);

      if (tokenError) throw tokenError;

      toast.success(`Payment verified! Added ${payment.token_package} tokens`);
      fetchData();
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast.error("Failed to verify payment");
    }
  };

  const handleRejectPayment = async (payment: PendingSubscription) => {
    try {
      const { error } = await supabase
        .from("pending_subscriptions")
        .update({ status: "rejected" })
        .eq("id", payment.id);

      if (error) throw error;

      toast.success("Payment rejected");
      fetchData();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast.error("Failed to reject payment");
    }
  };

  const handleAdjustTokens = async () => {
    if (!selectedUser || !tokenAdjustment) return;

    const adjustment = parseInt(tokenAdjustment);
    if (isNaN(adjustment)) {
      toast.error("Please enter a valid number");
      return;
    }

    try {
      const newLimit = Math.max(0, selectedUser.free_limit + adjustment);
      
      const { error } = await supabase
        .from("usage_tokens")
        .update({ free_limit: newLimit })
        .eq("user_id", selectedUser.user_id);

      if (error) throw error;

      toast.success(`Token limit updated to ${newLimit}`);
      setSelectedUser(null);
      setTokenAdjustment("");
      fetchData();
    } catch (error) {
      console.error("Error adjusting tokens:", error);
      toast.error("Failed to adjust tokens");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const filteredUsers = userTokens.filter(u => 
    u.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Shield className="w-20 h-20 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have admin privileges.</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Admin Panel | AI ID Card Generator</title>
      </Helmet>
      
      <Header />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Admin Panel</h1>
            </div>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold">{pendingPayments.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">{userTokens.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Premium Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold">
                    {userTokens.filter(u => u.is_premium).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Payments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Payment Verifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingPayments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No pending payments to verify
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.user_email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{payment.token_package}</Badge>
                        </TableCell>
                        <TableCell>₹{payment.amount}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.transaction_id || "N/A"}
                        </TableCell>
                        <TableCell>
                          {new Date(payment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleVerifyPayment(payment)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectPayment(payment)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* User Tokens Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                User Token Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Tokens Used</TableHead>
                    <TableHead>Token Limit</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.user_email}
                      </TableCell>
                      <TableCell>{user.tokens_used}</TableCell>
                      <TableCell>{user.free_limit}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.free_limit - user.tokens_used > 0 ? "default" : "destructive"}
                        >
                          {user.free_limit - user.tokens_used}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_premium ? (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500">
                            Premium
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                        >
                          Adjust Tokens
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Token Adjustment Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Token Limit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              User: <span className="font-medium">{selectedUser?.user_email}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Current limit: <span className="font-medium">{selectedUser?.free_limit}</span>
            </p>
            <div>
              <label className="text-sm font-medium">
                Adjustment (use negative to subtract)
              </label>
              <Input
                type="number"
                placeholder="+100 or -50"
                value={tokenAdjustment}
                onChange={(e) => setTokenAdjustment(e.target.value)}
                className="mt-1"
              />
              {tokenAdjustment && selectedUser && (
                <p className="text-sm text-muted-foreground mt-2">
                  New limit: {Math.max(0, selectedUser.free_limit + parseInt(tokenAdjustment || "0"))}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustTokens}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
