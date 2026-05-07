import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CeremonySelector } from "@/components/dashboard/CeremonySelector";
import { SetupStepper } from "@/components/dashboard/SetupStepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCeremony } from "@/contexts/CeremonyContext";
import { 
  Upload, 
  Plus, 
  Trophy, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Download,
  ChevronDown,
  Check,
  X,
  Loader2,
  FileSpreadsheet,
  Mail,
  Phone,
  User,
  Award,
  ArrowRight
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
} from "@/components/ui/dropdown-menu";
import { FaceEnrollmentPanel } from "@/components/livestream/FaceEnrollmentPanel";

interface AwardData {
  id: string;
  category: string;
  winner: string;
  email: string;
  phone: string;
  status: "pending" | "generated" | "delivered";
}

export default function AwardsManager() {
  const navigate = useNavigate();
  const { selectedCeremony, updateCeremonyProgress } = useCeremony();
  const [awards, setAwards] = useState<AwardData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAwards, setSelectedAwards] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<AwardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    category: "",
    winner: "",
    email: "",
    phone: "",
  });

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    void loadAwards();
  }, []);

  async function ensureEventId(userId: string) {
    const { data: room } = await supabase
      .from("stream_rooms")
      .select("id")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (room?.id) return room.id;

    const { data: created, error } = await supabase
      .from("stream_rooms")
      .insert({
        user_id: userId,
        name: selectedCeremony?.name || "Main Stage",
        status: "idle",
      })
      .select("id")
      .single();

    if (error || !created) throw error || new Error("Could not create ceremony workspace");
    return created.id;
  }

  async function loadAwards() {
    setIsPageLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAwards([]);
      setIsPageLoading(false);
      return;
    }

    const [awardsRes, clipsRes] = await Promise.all([
      supabase
        .from("award_categories")
        .select("id, name, recipient_name, recipient_email, recipient_phone, status, scheduled_order, created_at")
        .eq("user_id", user.id)
        .order("scheduled_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("generated_clips")
        .select("award_category_id, status")
        .eq("user_id", user.id)
        .not("award_category_id", "is", null),
    ]);

    if (awardsRes.error) {
      toast({ title: "Could not load awards", description: awardsRes.error.message, variant: "destructive" });
      setIsPageLoading(false);
      return;
    }

    const generatedByAward = new Set((clipsRes.data || []).map((c) => c.award_category_id).filter(Boolean));
    const deliveredByAward = new Set((clipsRes.data || []).filter((c) => c.status === "delivered").map((c) => c.award_category_id).filter(Boolean));

    setAwards((awardsRes.data || []).map((a) => ({
      id: a.id,
      category: a.name,
      winner: a.recipient_name || "",
      email: a.recipient_email || "",
      phone: a.recipient_phone || "",
      status: deliveredByAward.has(a.id) ? "delivered" : generatedByAward.has(a.id) ? "generated" : "pending",
    })));
    setIsPageLoading(false);
  }

  const filteredAwards = awards.filter((award) => {
    const matchesSearch = 
      award.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      award.winner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      award.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterStatus || award.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const resetForm = () => {
    setFormData({ category: "", winner: "", email: "", phone: "" });
  };

  const handleAddAward = async () => {
    if (!formData.category || !formData.winner) {
      toast({
        title: "Missing information",
        description: "Please enter the award category and winner name.",
        variant: "destructive",
      });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      toast({ title: "Please log in", description: "You need to be signed in to save awards.", variant: "destructive" });
      return;
    }

    try {
      const eventId = await ensureEventId(user.id);
      const nextOrder = awards.length + 1;
      const { data, error } = await supabase
        .from("award_categories")
        .insert({
          event_id: eventId,
          user_id: user.id,
          name: formData.category.trim(),
          recipient_name: formData.winner.trim(),
          recipient_email: formData.email.trim() || null,
          recipient_phone: formData.phone.trim() || null,
          scheduled_order: nextOrder,
          status: "pending",
        })
        .select("id, name, recipient_name, recipient_email, recipient_phone")
        .single();

      if (error || !data) throw error || new Error("Award was not saved");

      setAwards([...awards, {
        id: data.id,
        category: data.name,
        winner: data.recipient_name || "",
        email: data.recipient_email || "",
        phone: data.recipient_phone || "",
        status: "pending",
      }]);
      updateCeremonyProgress("awards", true);
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Award not saved",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(false);
    setIsAddModalOpen(false);
    resetForm();

    toast({
      title: "Award saved successfully!",
      description: `${formData.category} has been added to your awards list.`,
    });
  };

  const handleEditAward = async () => {
    if (!editingAward || !formData.category || !formData.winner) {
      toast({
        title: "Missing information",
        description: "Please enter the award category and winner name.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from("award_categories")
      .update({
        name: formData.category.trim(),
        recipient_name: formData.winner.trim(),
        recipient_email: formData.email.trim() || null,
        recipient_phone: formData.phone.trim() || null,
      })
      .eq("id", editingAward.id);

    if (error) {
      setIsLoading(false);
      toast({ title: "Award not updated", description: error.message, variant: "destructive" });
      return;
    }

    setAwards(awards.map((a) =>
      a.id === editingAward.id
        ? { ...a, category: formData.category, winner: formData.winner, email: formData.email, phone: formData.phone }
        : a
    ));

    setIsLoading(false);
    setIsEditModalOpen(false);
    setEditingAward(null);
    resetForm();

    toast({
      title: "Award updated!",
      description: "The award has been updated successfully.",
    });
  };

  const openEditModal = (award: AwardData) => {
    setEditingAward(award);
    setFormData({
      category: award.category,
      winner: award.winner,
      email: award.email,
      phone: award.phone,
    });
    setIsEditModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
  };

  const handleUploadCSV = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to import awards.");

      const eventId = await ensureEventId(user.id);
      const text = await uploadedFile.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      const header = lines[0]?.split(",").map((h) => h.trim().toLowerCase()) || [];
      const indexOf = (...names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;
      const categoryIdx = indexOf("category", "name", "award");
      const winnerIdx = indexOf("winner", "recipient_name", "recipient", "name");
      const emailIdx = indexOf("email", "recipient_email");
      const phoneIdx = indexOf("phone", "recipient_phone");

      if (lines.length < 2 || categoryIdx < 0 || winnerIdx < 0) {
        throw new Error("CSV needs category and winner columns.");
      }

      const rows = lines.slice(1).map((line, index) => {
        const cells = line.split(",").map((c) => c.trim());
        return {
          event_id: eventId,
          user_id: user.id,
          name: cells[categoryIdx] || `Award ${index + 1}`,
          recipient_name: cells[winnerIdx] || null,
          recipient_email: emailIdx >= 0 ? cells[emailIdx] || null : null,
          recipient_phone: phoneIdx >= 0 ? cells[phoneIdx] || null : null,
          scheduled_order: awards.length + index + 1,
          status: "pending",
        };
      });

      const { data, error } = await supabase.from("award_categories").insert(rows).select("id, name, recipient_name, recipient_email, recipient_phone");
      if (error) throw error;

      const newAwards: AwardData[] = (data || []).map((a) => ({
        id: a.id,
        category: a.name,
        winner: a.recipient_name || "",
        email: a.recipient_email || "",
        phone: a.recipient_phone || "",
        status: "pending",
      }));

      setAwards([...awards, ...newAwards]);
      updateCeremonyProgress("awards", true);
      setIsUploadModalOpen(false);
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast({
        title: "CSV imported successfully!",
        description: `${newAwards.length} awards were saved and are ready for Clip Generation.`,
      });
    } catch (error) {
      toast({
        title: "CSV import failed",
        description: error instanceof Error ? error.message : "Please check the file and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const award = awards.find(a => a.id === id);
    const { error } = await supabase.from("award_categories").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setAwards(awards.filter((a) => a.id !== id));
    setSelectedAwards((prev) => prev.filter((awardId) => awardId !== id));
    toast({
      title: "Award deleted",
      description: `${award?.category || 'The award'} has been removed from your real awards list.`,
    });
  };

  const handleClipGeneration = () => {
    const count = selectedAwards.length || awards.filter((a) => a.winner.trim()).length;
    if (count === 0) {
      toast({
        title: "No winners ready",
        description: "Add at least one award with a winner name first.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Opening Clip Generation",
      description: `${count} saved award${count !== 1 ? 's are' : ' is'} ready to generate.`,
    });
    navigate("/dashboard/clip-generation");
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your awards list is being exported as CSV...",
    });
  };

  const toggleSelectAll = () => {
    if (selectedAwards.length === filteredAwards.length) {
      setSelectedAwards([]);
    } else {
      setSelectedAwards(filteredAwards.map((a) => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedAwards.includes(id)) {
      setSelectedAwards(selectedAwards.filter((a) => a !== id));
    } else {
      setSelectedAwards([...selectedAwards, id]);
    }
  };

  const statusCounts = {
    all: awards.length,
    pending: awards.filter(a => a.status === "pending").length,
    generated: awards.filter(a => a.status === "generated").length,
    delivered: awards.filter(a => a.status === "delivered").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Ceremony Selector */}
        <CeremonySelector />
        <SetupStepper />
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Awards Manager</h1>
              <p className="text-muted-foreground">Manage your saved award list used by AI monitoring and Clip Generation.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <FaceEnrollmentPanel triggerLabel="Face Recognition" />
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="secondary" onClick={() => setIsUploadModalOpen(true)}>
                <Upload className="h-5 w-5" />
                Upload CSV
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="hero" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-5 w-5" />
                Add Award
              </Button>
            </motion.div>
            {awards.length > 0 && (
              <Button variant="secondary" onClick={() => { updateCeremonyProgress("awards", true); navigate("/dashboard/templates"); }}>
                Next: Template
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { label: "Total Awards", count: statusCounts.all, color: "text-foreground" },
            { label: "Pending", count: statusCounts.pending, color: "text-gold" },
            { label: "Generated", count: statusCounts.generated, color: "text-blue-500" },
            { label: "Delivered", count: statusCounts.delivered, color: "text-green-500" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="p-4 rounded-xl bg-card border border-border/50 text-center"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{isPageLoading ? "…" : stat.count}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-card border border-border/50"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search awards or winners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border/50 text-foreground"
            />
          </div>
          <div className="flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <Filter className="h-5 w-5" />
                  {filterStatus ? filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1) : "Filter"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem onClick={() => setFilterStatus(null)} className="cursor-pointer">
                  All ({statusCounts.all})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("pending")} className="cursor-pointer">
                  Pending ({statusCounts.pending})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("generated")} className="cursor-pointer">
                  Generated ({statusCounts.generated})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("delivered")} className="cursor-pointer">
                  Delivered ({statusCounts.delivered})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-5 w-5" />
              Export
            </Button>
            <Button variant="gold" onClick={handleClipGeneration}>
              <Trophy className="h-5 w-5" />
              Clip Generation
            </Button>
          </div>
        </motion.div>

        {/* Awards Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-xl bg-card border border-border/50 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="text-left p-4">
                    <button
                      onClick={toggleSelectAll}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        selectedAwards.length === filteredAwards.length && filteredAwards.length > 0
                          ? "bg-primary border-primary"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {selectedAwards.length === filteredAwards.length && filteredAwards.length > 0 && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </button>
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Winner</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                {filteredAwards.map((award, index) => (
                    <motion.tr
                      key={award.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <button
                          onClick={() => toggleSelect(award.id)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            selectedAwards.includes(award.id)
                              ? "bg-primary border-primary"
                              : "border-border hover:border-primary"
                          }`}
                        >
                          {selectedAwards.includes(award.id) && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{award.category}</span>
                        </div>
                      </td>
                      <td className="p-4 text-foreground">{award.winner}</td>
                      <td className="p-4 text-muted-foreground">{award.email}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          award.status === "delivered"
                            ? "bg-green-500/20 text-green-500"
                            : award.status === "generated"
                            ? "bg-blue-500/20 text-blue-500"
                            : "bg-gold/20 text-gold"
                        }`}>
                          {award.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => openEditModal(award)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(award.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Empty state */}
        {filteredAwards.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No awards found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStatus
                ? "Try adjusting your search or filter." 
                : "Upload a CSV or add awards manually to get started."}
            </p>
            <Button variant="hero" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-5 w-5" />
              Add Your First Award
            </Button>
          </motion.div>
        )}
      </div>

      {/* Add Award Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Award className="h-5 w-5 text-primary" />
              Add New Award
            </DialogTitle>
            <DialogDescription>
              Enter the award details and winner information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-foreground">Category *</Label>
              <div className="relative">
                <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="category"
                  placeholder="e.g., Best Innovation"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="pl-10 bg-muted border-border/50 text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="winner" className="text-foreground">Winner Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="winner"
                  placeholder="e.g., John Smith"
                  value={formData.winner}
                  onChange={(e) => setFormData({ ...formData, winner: e.target.value })}
                  className="pl-10 bg-muted border-border/50 text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 bg-muted border-border/50 text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">Phone Number (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="e.g., +1 234 567 890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10 bg-muted border-border/50 text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={() => { setIsAddModalOpen(false); resetForm(); }}
              >
                Cancel
              </Button>
              <Button 
                variant="hero" 
                className="flex-1" 
                onClick={handleAddAward}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Award
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Award Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Edit className="h-5 w-5 text-primary" />
              Edit Award
            </DialogTitle>
            <DialogDescription>
              Update the award details and winner information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category" className="text-foreground">Category *</Label>
              <div className="relative">
                <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-category"
                  placeholder="e.g., Best Innovation"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="pl-10 bg-muted border-border/50 text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-winner" className="text-foreground">Winner Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-winner"
                  placeholder="e.g., John Smith"
                  value={formData.winner}
                  onChange={(e) => setFormData({ ...formData, winner: e.target.value })}
                  className="pl-10 bg-muted border-border/50 text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="e.g., john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 bg-muted border-border/50 text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="text-foreground">Phone Number (optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-phone"
                  placeholder="e.g., +1 234 567 890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10 bg-muted border-border/50 text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={() => { setIsEditModalOpen(false); setEditingAward(null); resetForm(); }}
              >
                Cancel
              </Button>
              <Button 
                variant="hero" 
                className="flex-1" 
                onClick={handleEditAward}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload CSV Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Upload CSV File
            </DialogTitle>
              <DialogDescription>
                Import multiple awards from a CSV file. Required columns: category, winner. Optional: email, phone.
              </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <motion.div 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                uploadedFile 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <AnimatePresence mode="wait">
                {uploadedFile ? (
                  <motion.div
                    key="uploaded"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileSpreadsheet className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    </motion.div>
                    <p className="text-foreground font-medium mb-1">Click to select CSV file</p>
                    <p className="text-sm text-muted-foreground">or drag and drop</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* CSV Format Guide */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
              <p className="text-sm font-medium text-foreground mb-2">CSV Format Example:</p>
              <code className="text-xs text-muted-foreground block font-mono">
                category,winner,email,phone<br />
                Best Innovation,John Smith,john@email.com,+1234567890
              </code>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={() => { setIsUploadModalOpen(false); setUploadedFile(null); }}
              >
                Cancel
              </Button>
              <Button 
                variant="hero" 
                className="flex-1" 
                onClick={handleUploadCSV}
                disabled={isLoading || !uploadedFile}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Awards
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
