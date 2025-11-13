import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (device: any) => void;
}

export const AddDeviceDialog = ({ open, onOpenChange, onAdd }: AddDeviceDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    ip: "",
    type: "router",
    snmpCommunity: "public",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: Date.now().toString(),
      ...formData,
      x: 300 + Math.random() * 400,
      y: 200 + Math.random() * 300,
      status: "up",
      uptime: "0d 0h",
      cpu: Math.floor(Math.random() * 60),
      memory: Math.floor(Math.random() * 80),
    });
    setFormData({
      name: "",
      ip: "",
      type: "router",
      snmpCommunity: "public",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Add SNMP Device</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure a new network device for monitoring
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Device Name</Label>
              <Input
                id="name"
                placeholder="Core Router 1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip">IP Address</Label>
              <Input
                id="ip"
                placeholder="192.168.1.1"
                value={formData.ip}
                onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                required
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Device Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="router">Router</SelectItem>
                  <SelectItem value="switch">Switch</SelectItem>
                  <SelectItem value="server">Server</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="community">SNMP Community</Label>
              <Input
                id="community"
                placeholder="public"
                value={formData.snmpCommunity}
                onChange={(e) => setFormData({ ...formData, snmpCommunity: e.target.value })}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Add Device
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
