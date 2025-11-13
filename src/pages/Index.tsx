import { useState, useEffect } from "react";
import { NetworkCanvas } from "@/components/NetworkCanvas";
import { DevicePanel } from "@/components/DevicePanel";
import { StatsPanel } from "@/components/StatsPanel";
import { AddDeviceDialog } from "@/components/AddDeviceDialog";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceStats, setDeviceStats] = useState<Record<string, any>>({});

  const [links, setLinks] = useState<any[]>([]);

  // Fetch devices and stats from database
  useEffect(() => {
    fetchDevices();
    fetchLinks();
    
    // Subscribe to realtime updates
    const devicesChannel = supabase
      .channel('devices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        fetchDevices();
      })
      .subscribe();

    const statsChannel = supabase
      .channel('stats-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'device_stats' }, (payload) => {
        setDeviceStats(prev => ({
          ...prev,
          [payload.new.device_id]: payload.new
        }));
      })
      .subscribe();

    const linksChannel = supabase
      .channel('links-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'links' }, () => {
        fetchLinks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(devicesChannel);
      supabase.removeChannel(statsChannel);
      supabase.removeChannel(linksChannel);
    };
  }, []);

  // Poll devices every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      pollDevices();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    const { data, error } = await supabase.from('devices').select('*');
    if (error) {
      console.error('Error fetching devices:', error);
      return;
    }

    // Fetch latest stats for each device
    const devicesWithStats = await Promise.all(
      (data || []).map(async (device) => {
        const { data: stats } = await supabase
          .from('device_stats')
          .select('*')
          .eq('device_id', device.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          id: device.id,
          name: device.name,
          ip: device.ip,
          x: device.x,
          y: device.y,
          type: device.type as "router" | "switch" | "server",
          snmpCommunity: device.snmp_community,
          status: (stats?.status || 'down') as DeviceStatus,
          uptime: stats?.uptime || 'N/A',
          cpu: stats?.cpu || 0,
          memory: stats?.memory || 0,
        };
      })
    );

    setDevices(devicesWithStats);
  };

  const fetchLinks = async () => {
    const { data, error } = await supabase.from('links').select('*');
    if (error) {
      console.error('Error fetching links:', error);
      return;
    }

    setLinks((data || []).map(link => ({
      id: link.id,
      source: link.source_device_id,
      target: link.target_device_id,
      bandwidth: link.bandwidth,
      maxBandwidth: link.max_bandwidth,
      status: link.status,
    })));
  };

  const pollDevices = async () => {
    try {
      const { error } = await supabase.functions.invoke('snmp-poll');
      if (error) throw error;
    } catch (error) {
      console.error('Error polling devices:', error);
    }
  };

  const handleAddDevice = async (deviceData: any) => {
    const { error } = await supabase.from('devices').insert({
      name: deviceData.name,
      ip: deviceData.ip,
      type: deviceData.type,
      snmp_community: deviceData.snmpCommunity,
      x: Math.random() * 1000,
      y: Math.random() * 500,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Device added",
        description: `${deviceData.name} has been added successfully.`,
      });
      setShowAddDevice(false);
      // Trigger immediate poll of new device
      pollDevices();
    }
  };

  const handleRemoveDevice = async (id: string) => {
    const { error } = await supabase.from('devices').delete().eq('id', id);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Device removed",
        description: "Device has been removed successfully.",
      });
    }
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
