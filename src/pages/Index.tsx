import { useState } from "react";
import { NetworkCanvas } from "@/components/NetworkCanvas";
import { DevicePanel } from "@/components/DevicePanel";
import { StatsPanel } from "@/components/StatsPanel";
import { AddDeviceDialog } from "@/components/AddDeviceDialog";
import { Activity } from "lucide-react";

type DeviceStatus = "up" | "down" | "warning";

interface Device {
  id: string;
  name: string;
  ip: string;
  x: number;
  y: number;
  status: DeviceStatus;
  type: "router" | "switch" | "server";
  snmpCommunity: string;
  uptime: string;
  cpu: number;
  memory: number;
}

const Index = () => {
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [devices, setDevices] = useState<Device[]>([
    {
      id: "1",
      name: "Core Router",
      ip: "192.168.1.1",
      x: 200,
      y: 350,
      status: "up" as const,
      type: "router" as const,
      snmpCommunity: "public",
      uptime: "45d 12h",
      cpu: 23,
      memory: 45,
    },
    {
      id: "2",
      name: "Distribution Switch",
      ip: "192.168.1.2",
      x: 500,
      y: 200,
      status: "up" as const,
      type: "switch" as const,
      snmpCommunity: "public",
      uptime: "30d 8h",
      cpu: 15,
      memory: 32,
    },
    {
      id: "3",
      name: "Access Switch 1",
      ip: "192.168.1.3",
      x: 800,
      y: 150,
      status: "warning" as const,
      type: "switch" as const,
      snmpCommunity: "public",
      uptime: "20d 4h",
      cpu: 67,
      memory: 78,
    },
    {
      id: "4",
      name: "Web Server",
      ip: "192.168.1.10",
      x: 1000,
      y: 350,
      status: "up" as const,
      type: "server" as const,
      snmpCommunity: "public",
      uptime: "15d 22h",
      cpu: 42,
      memory: 56,
    },
    {
      id: "5",
      name: "Database Server",
      ip: "192.168.1.11",
      x: 800,
      y: 550,
      status: "up" as const,
      type: "server" as const,
      snmpCommunity: "public",
      uptime: "60d 15h",
      cpu: 38,
      memory: 62,
    },
  ]);

  const [links, setLinks] = useState([
    {
      id: "l1",
      source: "1",
      target: "2",
      bandwidth: 450.5,
      maxBandwidth: 1000,
      status: "healthy" as const,
    },
    {
      id: "l2",
      source: "2",
      target: "3",
      bandwidth: 750.2,
      maxBandwidth: 1000,
      status: "warning" as const,
    },
    {
      id: "l3",
      source: "3",
      target: "4",
      bandwidth: 320.8,
      maxBandwidth: 1000,
      status: "healthy" as const,
    },
    {
      id: "l4",
      source: "3",
      target: "5",
      bandwidth: 890.5,
      maxBandwidth: 1000,
      status: "critical" as const,
    },
  ]);

  const handleAddDevice = (newDevice: any) => {
    setDevices([...devices, newDevice]);
  };

  const handleRemoveDevice = (id: string) => {
    setDevices(devices.filter((d) => d.id !== id));
    setLinks(links.filter((l) => l.source !== id && l.target !== id));
  };

  const devicesUp = devices.filter((d) => d.status === "up").length;
  const devicesDown = devices.filter((d) => d.status === "down").length;
  const devicesWarning = devices.filter((d) => d.status === "warning").length;
  const totalBandwidth = links.reduce((sum, link) => sum + link.bandwidth, 0);
  const avgUtilization = links.length > 0
    ? links.reduce((sum, link) => sum + (link.bandwidth / link.maxBandwidth) * 100, 0) / links.length
    : 0;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="flex items-center gap-3 pb-4 border-b border-border">
          <Activity className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">NetFlow Monitor</h1>
            <p className="text-muted-foreground">Real-time SNMP Network Topology & Bandwidth Monitoring</p>
          </div>
        </header>

        <StatsPanel
          totalDevices={devices.length}
          devicesUp={devicesUp}
          devicesDown={devicesDown}
          devicesWarning={devicesWarning}
          totalBandwidth={totalBandwidth}
          avgUtilization={avgUtilization}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <NetworkCanvas devices={devices} links={links} />
          </div>
          <div className="lg:col-span-1">
            <DevicePanel
              devices={devices}
              onAddDevice={() => setShowAddDevice(true)}
              onRemoveDevice={handleRemoveDevice}
            />
          </div>
        </div>
      </div>

      <AddDeviceDialog open={showAddDevice} onOpenChange={setShowAddDevice} onAdd={handleAddDevice} />
    </div>
  );
};

export default Index;
