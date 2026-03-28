import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Package, ShoppingBag, DollarSign, Loader2 } from "lucide-react";

export default function AdminOverview() {
  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery({});
  const { data: orders, isLoading: ordersLoading } = trpc.orders.list.useQuery();

  const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
  const pendingOrders = orders?.filter((o) => o.status === "pending").length || 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-8">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Products</p>
              <p className="text-3xl font-bold text-foreground">
                {productsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : products?.length || 0}
              </p>
            </div>
            <Package className="w-10 h-10 text-primary opacity-20" />
          </div>
        </Card>

        {/* Total Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Orders</p>
              <p className="text-3xl font-bold text-foreground">
                {ordersLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : orders?.length || 0}
              </p>
            </div>
            <ShoppingBag className="w-10 h-10 text-primary opacity-20" />
          </div>
        </Card>

        {/* Pending Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Pending Orders</p>
              <p className="text-3xl font-bold text-foreground">
                {ordersLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : pendingOrders}
              </p>
            </div>
            <ShoppingBag className="w-10 h-10 text-accent opacity-20" />
          </div>
        </Card>

        {/* Total Revenue */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-foreground">
                {ordersLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `$${totalRevenue.toFixed(2)}`}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-primary opacity-20" />
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h2>
        {ordersLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Order #</th>
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Customer</th>
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Total</th>
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Status</th>
                  <th className="text-left py-2 px-4 font-semibold text-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted">
                    <td className="py-3 px-4 text-foreground font-medium">{order.orderNumber}</td>
                    <td className="py-3 px-4 text-foreground">{order.customerName}</td>
                    <td className="py-3 px-4 text-foreground font-semibold">${parseFloat(order.total).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "processing"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No orders yet</p>
        )}
      </Card>
    </div>
  );
}
