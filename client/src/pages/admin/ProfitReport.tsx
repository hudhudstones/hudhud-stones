import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type ReportType = "daily" | "weekly" | "monthly";

export default function ProfitReport() {
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const dailyReport = trpc.reports.daily.useQuery(
    {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    { enabled: reportType === "daily" }
  );

  const weeklyReport = trpc.reports.weekly.useQuery(
    {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    { enabled: reportType === "weekly" }
  );

  const monthlyReport = trpc.reports.monthly.useQuery(
    {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    { enabled: reportType === "monthly" }
  );

  const currentReport = {
    daily: dailyReport,
    weekly: weeklyReport,
    monthly: monthlyReport,
  }[reportType];

  const data = currentReport.data || [];
  const isLoading = currentReport.isLoading;

  const totals = data.reduce(
    (acc, row) => ({
      orders: acc.orders + row.orderCount,
      revenue: acc.revenue + row.totalRevenue,
      cost: acc.cost + row.totalCost,
      profit: acc.profit + row.totalProfit,
    }),
    { orders: 0, revenue: 0, cost: 0, profit: 0 }
  );

  const totalProfitPercentage =
    totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Profit Report
        </h1>
        <p className="text-muted-foreground">
          Track revenue, costs, and profit across different time periods
        </p>
      </div>

      {/* Filters */}
      <Card className="p-6 border-2 border-primary/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => currentReport.refetch()}
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-2 border-primary/30">
          <p className="text-sm text-muted-foreground mb-2">Total Orders</p>
          <p className="text-3xl font-bold text-foreground">
            {totals.orders}
          </p>
        </Card>

        <Card className="p-6 border-2 border-primary/30">
          <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-foreground">
            ${totals.revenue.toFixed(2)}
          </p>
        </Card>

        <Card className="p-6 border-2 border-primary/30">
          <p className="text-sm text-muted-foreground mb-2">Total Cost</p>
          <p className="text-3xl font-bold text-foreground">
            ${totals.cost.toFixed(2)}
          </p>
        </Card>

        <Card className="p-6 border-2 border-primary/30">
          <p className="text-sm text-muted-foreground mb-2">Total Profit</p>
          <p className="text-3xl font-bold text-green-600">
            ${totals.profit.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalProfitPercentage.toFixed(1)}% margin
          </p>
        </Card>
      </div>

      {/* Report Table */}
      <Card className="p-6 border-2 border-primary/50 overflow-x-auto">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Breakdown
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No data available for the selected period
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  {reportType === "daily"
                    ? "Date"
                    : reportType === "weekly"
                      ? "Week Starting"
                      : "Month"}
                </th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">
                  Orders
                </th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">
                  Revenue
                </th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">
                  Cost
                </th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">
                  Profit
                </th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">
                  Margin %
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4 text-foreground">{row.date}</td>
                  <td className="text-right py-3 px-4 text-foreground">
                    {row.orderCount}
                  </td>
                  <td className="text-right py-3 px-4 text-foreground">
                    ${row.totalRevenue.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-4 text-foreground">
                    ${row.totalCost.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-4 font-semibold text-green-600">
                    ${row.totalProfit.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-4 text-foreground">
                    {row.profitPercentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
