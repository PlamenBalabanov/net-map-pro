import { Card } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

interface StatsPanelProps {
  totalDevices: number;
  devicesUp: number;
  devicesDown: number;
  devicesWarning: number;
  totalBandwidth: number;
  avgUtilization: number;
}

export const StatsPanel = ({
  totalDevices,
  devicesUp,
  devicesDown,
  devicesWarning,
  totalBandwidth,
  avgUtilization,
}: StatsPanelProps) => {
  const stats = [
    {
      label: "Total Devices",
      value: totalDevices,
      icon: Activity,
      color: "text-primary",
    },
    {
      label: "Devices Up",
      value: devicesUp,
      icon: CheckCircle,
      color: "text-success",
    },
    {
      label: "Warnings",
      value: devicesWarning,
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      label: "Devices Down",
      value: devicesDown,
      icon: Activity,
      color: "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <Icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
};
