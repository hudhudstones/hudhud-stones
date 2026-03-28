import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function AdminOrders() {
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const { data: orders, isLoading, refetch } = trpc.orders.list.useQuery();
  const updateStatus = trpc.orders.updateStatus.useMutation();

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({
        id: orderId,
        status: newStatus as any,
      });
      toast.success("Order status updated");
      refetch();
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-8">Orders</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div
                className="flex justify-between items-start cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-semibold text-foreground">{order.orderNumber}</h3>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Customer: {order.customerName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.customerEmail} • {order.customerPhone}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-primary mb-2">
                    ${parseFloat(order.total).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  {expandedOrder === order.id ? (
                    <ChevronUp className="w-5 h-5 ml-auto mt-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto mt-2" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div className="mt-6 pt-6 border-t border-border space-y-6">
                  {/* Shipping Address */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Shipping Address</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {order.customerAddress}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Order Items</h4>
                    <div className="space-y-2">
                      {/* Items would be fetched separately, showing placeholder */}
                      <p className="text-sm text-muted-foreground">
                        Items details loading...
                      </p>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Update Status</h4>
                    <div className="flex gap-2 flex-wrap">
                      {["pending", "processing", "completed", "cancelled"].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(order.id, status)}
                          disabled={order.status === status}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            order.status === status
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground hover:bg-muted/80"
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">{order.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No orders yet</p>
        </Card>
      )}
    </div>
  );
}
