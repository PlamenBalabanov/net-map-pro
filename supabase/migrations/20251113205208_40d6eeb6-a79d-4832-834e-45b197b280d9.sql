-- Create devices table
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ip TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('router', 'switch', 'server')),
  snmp_community TEXT NOT NULL DEFAULT 'public',
  x REAL NOT NULL DEFAULT 0,
  y REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create device_stats table for historical data
CREATE TABLE public.device_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('up', 'down', 'warning')),
  uptime TEXT,
  cpu REAL,
  memory REAL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create links table
CREATE TABLE public.links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  target_device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  bandwidth REAL DEFAULT 0,
  max_bandwidth REAL DEFAULT 1000,
  status TEXT NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for monitoring dashboard)
CREATE POLICY "Allow public read access to devices" 
ON public.devices FOR SELECT USING (true);

CREATE POLICY "Allow public insert to devices" 
ON public.devices FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to devices" 
ON public.devices FOR UPDATE USING (true);

CREATE POLICY "Allow public delete from devices" 
ON public.devices FOR DELETE USING (true);

CREATE POLICY "Allow public read access to device_stats" 
ON public.device_stats FOR SELECT USING (true);

CREATE POLICY "Allow public insert to device_stats" 
ON public.device_stats FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to links" 
ON public.links FOR SELECT USING (true);

CREATE POLICY "Allow public insert to links" 
ON public.links FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to links" 
ON public.links FOR UPDATE USING (true);

CREATE POLICY "Allow public delete from links" 
ON public.links FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_devices_updated_at
BEFORE UPDATE ON public.devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for devices and stats
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.links;