import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Wifi, Server, HardDrive } from "lucide-react";

interface Device {
  id: string;
  name: string;
  ip: string;
  status: "up" | "down" | "warning";
  type: "router" | "switch" | "server";
  snmpCommunity: string;
  uptime: string;
  cpu: number;
  memory: number;
}

interface DevicePanelProps {
  devices: Device[];
  onAddDevice: () => void;
  onRemoveDevice: (id: string) => void;
}

export const DevicePanel = ({ devices, onAddDevice, onRemoveDevice }: DevicePanelProps) => {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "router":
        return <Wifi className="h-4 w-4" />;
      case "switch":
        return <Activity className="h-4 w-4" />;
      case "server":
        return <Server className="h-4 w-4" />;
      default:
        return <HardDrive className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up":
        return "text-success";
      case "warning":
        return "text-warning";
      case "down":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className="p-4 bg-card border-border h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Devices</h2>
        <Button onClick={onAddDevice} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          Add Device
        </Button>
      </div>

      <div className="space-y-3">
        {devices.map((device) => (
          <Card key={device.id} className="p-3 bg-secondary border-border hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={getStatusColor(device.status)}>
                  {getDeviceIcon(device.type)}
                </div>
                <div>
                  <h3 className="font-medium text-sm text-foreground">{device.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{device.ip}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveDevice(device.id)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                ×
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Uptime:</span>
                <p className="text-foreground font-mono">{device.uptime}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className={`font-semibold ${getStatusColor(device.status)}`}>
                  {device.status.toUpperCase()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">CPU:</span>
                <p className="text-foreground font-mono">{device.cpu}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Memory:</span>
                <p className="text-foreground font-mono">{device.memory}%</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
