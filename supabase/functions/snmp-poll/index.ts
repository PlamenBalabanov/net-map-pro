import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SNMPOIDs {
  sysUpTime: string;
  hrProcessorLoad: string;
  hrStorageUsed: string;
  hrStorageSize: string;
  ifInOctets: string;
  ifOutOctets: string;
}

const OIDS: SNMPOIDs = {
  sysUpTime: '1.3.6.1.2.1.1.3.0',
  hrProcessorLoad: '1.3.6.1.2.1.25.3.3.1.2.1',
  hrStorageUsed: '1.3.6.1.2.1.25.2.3.1.6.1',
  hrStorageSize: '1.3.6.1.2.1.25.2.3.1.5.1',
  ifInOctets: '1.3.6.1.2.1.2.2.1.10.1',
  ifOutOctets: '1.3.6.1.2.1.2.2.1.16.1',
};

async function pollSNMP(ip: string, community: string) {
  try {
    // Simulated SNMP polling - In production, use net-snmp library or external SNMP service
    // For now, we'll simulate realistic data based on device IP
    const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Simulate different response patterns based on IP
    const seed = parseInt(ip.split('.').pop() || '1');
    const baseLoad = (seed * 7) % 60;
    
    const data = {
      status: random(1, 100) > 10 ? 'up' : (random(1, 100) > 50 ? 'warning' : 'down'),
      uptime: `${random(1, 90)}d ${random(0, 23)}h`,
      cpu: baseLoad + random(-5, 15),
      memory: baseLoad + random(0, 20),
      bandwidth: {
        in: random(100, 900),
        out: random(100, 900),
      }
    };

    return data;
  } catch (error) {
    console.error(`SNMP poll error for ${ip}:`, error);
    return {
      status: 'down',
      uptime: '0d 0h',
      cpu: 0,
      memory: 0,
      bandwidth: { in: 0, out: 0 }
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all devices
    const { data: devices, error: devicesError } = await supabaseClient
      .from('devices')
      .select('*');

    if (devicesError) throw devicesError;

    console.log(`Polling ${devices?.length || 0} devices...`);

    // Poll each device
    for (const device of devices || []) {
      const snmpData = await pollSNMP(device.ip, device.snmp_community);

      // Insert stats record
      const { error: statsError } = await supabaseClient
        .from('device_stats')
        .insert({
          device_id: device.id,
          status: snmpData.status,
          uptime: snmpData.uptime,
          cpu: snmpData.cpu,
          memory: snmpData.memory,
        });

      if (statsError) {
        console.error(`Error saving stats for device ${device.id}:`, statsError);
      }

      // Update link bandwidth based on device traffic
      const { data: links } = await supabaseClient
        .from('links')
        .select('*')
        .or(`source_device_id.eq.${device.id},target_device_id.eq.${device.id}`);

      for (const link of links || []) {
        const bandwidth = (snmpData.bandwidth.in + snmpData.bandwidth.out) / 2;
        const utilization = (bandwidth / link.max_bandwidth) * 100;
        
        let status = 'healthy';
        if (utilization > 90) status = 'critical';
        else if (utilization > 75) status = 'warning';

        await supabaseClient
          .from('links')
          .update({ bandwidth, status })
          .eq('id', link.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, polled: devices?.length || 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in snmp-poll function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
