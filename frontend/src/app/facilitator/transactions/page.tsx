"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RoleGuard from "@/components/RoleGuard";
import { DollarSign, TrendingUp, Calendar, User, Eye, Download } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface Transaction {
  id: number;
  booking_reference: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  event: {
    id: number;
    title: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface TransactionStats {
  total_revenue: number;
  total_transactions: number;
  average_transaction: number;
  monthly_revenue: number;
}

export default function FacilitatorTransactions() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get("/facilitator/transactions", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      setTransactions(response.data.transactions);
      
      // Calculate stats
      const totalRevenue = response.data.total_revenue;
      const totalTransactions = response.data.transactions.length;
      const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
      
      // Calculate monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyTransactions = response.data.transactions.filter((t: Transaction) => 
        new Date(t.created_at) >= thirtyDaysAgo
      );
      const monthlyRevenue = monthlyTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      
      setStats({
        total_revenue: totalRevenue,
        total_transactions: totalTransactions,
        average_transaction: averageTransaction,
        monthly_revenue: monthlyRevenue
      });
    } catch (error: any) {
      toast.error("Failed to load transactions");
      console.error("Transactions error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsViewDialogOpen(true);
  };

  const exportTransactions = () => {
    const csvContent = [
      ["Booking Reference", "Event", "Customer", "Amount", "Currency", "Status", "Date"],
      ...transactions.map(t => [
        t.booking_reference,
        t.event.title,
        t.user.name,
        t.amount.toString(),
        t.currency,
        t.status,
        new Date(t.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Transactions exported successfully");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["facilitator"]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <span className="ml-4 text-lg">Loading transactions...</span>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["facilitator"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">View your revenue and transaction history</p>
          </div>
          <Button onClick={exportTransactions} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue, 'USD')}</div>
                <p className="text-xs text-muted-foreground">
                  Lifetime earnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_transactions}</div>
                <p className="text-xs text-muted-foreground">
                  Completed bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.average_transaction, 'USD')}</div>
                <p className="text-xs text-muted-foreground">
                  Per booking
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.monthly_revenue, 'USD')}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {transactions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground mb-4">
                When bookings are confirmed, transactions will appear here
              </p>
              <Button onClick={() => router.push("/facilitator/events")}>
                Create Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{transaction.event.title}</h3>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{transaction.user.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Reference:</span>
                          <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {transaction.booking_reference}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTransaction(transaction)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Transaction Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>
                Detailed information about this transaction
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Event</Label>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.event.title}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Booking Reference</Label>
                    <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {selectedTransaction.booking_reference}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Customer</Label>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.user.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTransaction.user.email}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Amount</Label>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Status</Label>
                    <Badge className={getStatusColor(selectedTransaction.status)}>
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-medium">Transaction Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedTransaction.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
} 