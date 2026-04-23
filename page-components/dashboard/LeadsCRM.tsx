"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CeremonySelector } from "@/components/dashboard/CeremonySelector";
import { SetupStepper } from "@/components/dashboard/SetupStepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar,
  MoreHorizontal,
  Download,
  Plus,
  Star,
  Building,
  X,
  Loader2,
  Edit,
  Trash2,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: "new" | "contacted" | "qualified" | "converted";
  source: string;
  createdAt: string;
}

const initialLeads: Lead[] = [
  { id: "1", name: "John Smith", email: "john@acmecorp.com", company: "Acme Corp", phone: "+1234567890", status: "new", source: "Website", createdAt: "2024-01-15" },
  { id: "2", name: "Jane Doe", email: "jane@techstartup.io", company: "Tech Startup", phone: "+1234567891", status: "contacted", source: "Demo Request", createdAt: "2024-01-14" },
  { id: "3", name: "Robert Brown", email: "robert@enterprise.com", company: "Enterprise Ltd", phone: "+1234567892", status: "qualified", source: "Referral", createdAt: "2024-01-13" },
  { id: "4", name: "Sarah Wilson", email: "sarah@awards.org", company: "Awards Foundation", phone: "+1234567893", status: "converted", source: "Website", createdAt: "2024-01-12" },
  { id: "5", name: "Mike Johnson", email: "mike@events.co", company: "Events Co", phone: "+1234567894", status: "new", source: "Contact Form", createdAt: "2024-01-11" },
];

const statusColors = {
  new: "bg-blue-500/20 text-blue-500",
  contacted: "bg-gold/20 text-gold",
  qualified: "bg-purple-500/20 text-purple-500",
  converted: "bg-green-500/20 text-green-500",
};

export default function LeadsCRM() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    source: "Website",
  });

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || lead.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: "Total Leads", value: leads.length, icon: Users },
    { label: "New", value: leads.filter((l) => l.status === "new").length, icon: Star },
    { label: "Qualified", value: leads.filter((l) => l.status === "qualified").length, icon: Building },
    { label: "Converted", value: leads.filter((l) => l.status === "converted").length, icon: Check },
  ];

  const resetForm = () => {
    setFormData({ name: "", email: "", company: "", phone: "", source: "Website" });
  };

  const handleAddLead = async () => {
    if (!formData.name || !formData.email || !formData.company) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newLead: Lead = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      company: formData.company,
      phone: formData.phone || "",
      status: "new",
      source: formData.source,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setLeads([newLead, ...leads]);
    setIsLoading(false);
    setIsAddModalOpen(false);
    resetForm();

    toast({
      title: "Lead added successfully!",
      description: `${formData.name} has been added to your CRM.`,
    });
  };

  const handleEditLead = async () => {
    if (!editingLead || !formData.name || !formData.email || !formData.company) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setLeads(leads.map((l) => 
      l.id === editingLead.id 
        ? { ...l, name: formData.name, email: formData.email, company: formData.company, phone: formData.phone, source: formData.source }
        : l
    ));

    setIsLoading(false);
    setIsEditModalOpen(false);
    setEditingLead(null);
    resetForm();

    toast({
      title: "Lead updated!",
      description: "The lead has been updated successfully.",
    });
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      company: lead.company,
      phone: lead.phone,
      source: lead.source,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteLead = (id: string) => {
    const lead = leads.find(l => l.id === id);
    setLeads(leads.filter((l) => l.id !== id));
    toast({
      title: "Lead deleted",
      description: `${lead?.name || 'The lead'} has been removed from your CRM.`,
    });
  };

  const handleUpdateStatus = (id: string, status: Lead["status"]) => {
    setLeads(leads.map((l) => 
      l.id === id ? { ...l, status } : l
    ));
    toast({
      title: "Status updated",
      description: `Lead status changed to ${status}.`,
    });
  };

  const handleExport = () => {
    // Simulate CSV export
    const csvContent = [
      ["Name", "Email", "Company", "Phone", "Status", "Source", "Created"],
      ...leads.map(l => [l.name, l.email, l.company, l.phone, l.status, l.source, l.createdAt])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete!",
      description: "Your leads have been exported as CSV.",
    });
  };

  const handleEmailLead = (lead: Lead) => {
    window.open(`mailto:${lead.email}?subject=Following up from Awardscut`, "_blank");
    toast({
      title: "Opening email client",
      description: `Composing email to ${lead.name}...`,
    });
  };

  const handleCallLead = (lead: Lead) => {
    if (lead.phone) {
      window.open(`tel:${lead.phone}`, "_blank");
      toast({
        title: "Initiating call",
        description: `Calling ${lead.name}...`,
      });
    } else {
      toast({
        title: "No phone number",
        description: "This lead doesn't have a phone number.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Ceremony Selector */}
        <CeremonySelector />
        <SetupStepper />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recipients & Delivery</h1>
            <p className="text-muted-foreground">Manage winners and track clip delivery status.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-5 w-5" />
              Export
            </Button>
            <Button variant="hero" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-5 w-5" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="p-4 rounded-xl bg-card border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-card border border-border/50"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["new", "contacted", "qualified", "converted"].map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "hero" : "secondary"}
                size="sm"
                onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Leads Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="rounded-xl bg-card border border-border/50 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contact</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Company</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Source</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredLeads.map((lead, index) => (
                    <motion.tr 
                      key={lead.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{lead.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{lead.company}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={`px-3 py-1 rounded-full text-xs font-medium capitalize cursor-pointer hover:opacity-80 transition-opacity ${statusColors[lead.status]}`}>
                              {lead.status}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-card border-border">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, "new")}>New</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, "contacted")}>Contacted</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, "qualified")}>Qualified</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, "converted")}>Converted</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="p-4 text-muted-foreground">{lead.source}</td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {lead.createdAt}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEmailLead(lead)}>
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCallLead(lead)}>
                            <Phone className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border">
                              <DropdownMenuItem onClick={() => openEditModal(lead)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteLead(lead.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No leads found</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add Lead Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Lead</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new lead to your CRM.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-muted-foreground">Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                className="bg-muted border-border/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                className="bg-muted border-border/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Company *</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Corp"
                className="bg-muted border-border/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
                className="bg-muted border-border/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Source</Label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full h-10 px-3 mt-1 rounded-lg bg-muted border border-border/50 text-foreground"
              >
                <option value="Website">Website</option>
                <option value="Demo Request">Demo Request</option>
                <option value="Referral">Referral</option>
                <option value="Contact Form">Contact Form</option>
                <option value="Social Media">Social Media</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => { setIsAddModalOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleAddLead} disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
              ) : (
                <><Plus className="h-4 w-4" /> Add Lead</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Lead</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update lead information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-muted-foreground">Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                className="bg-muted border-border/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                className="bg-muted border-border/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Company *</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Corp"
                className="bg-muted border-border/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
                className="bg-muted border-border/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Source</Label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full h-10 px-3 mt-1 rounded-lg bg-muted border border-border/50 text-foreground"
              >
                <option value="Website">Website</option>
                <option value="Demo Request">Demo Request</option>
                <option value="Referral">Referral</option>
                <option value="Contact Form">Contact Form</option>
                <option value="Social Media">Social Media</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => { setIsEditModalOpen(false); setEditingLead(null); resetForm(); }}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleEditLead} disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Check className="h-4 w-4" /> Save Changes</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
