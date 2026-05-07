import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  Plus,
  Trash2,
  PlayCircle,
  CalendarDays,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";

interface AwardCategoryRow {
  id: string;
  name: string;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  scheduled_order: number;
  status: string;
}

interface BrandingJson {
  logo_url?: string;
  primary?: string;
  secondary?: string;
  accent?: string;
  [key: string]: string | undefined;
}

interface EventRow {
  id: string;
  user_id: string;
  name: string;
  event_date: string | null;
  venue: string | null;
  branding_json: BrandingJson;
  status: string;
}

function EventSetupInner() {
  const { id: eventId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [categories, setCategories] = useState<AwardCategoryRow[]>([]);

  // Form state
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [branding, setBranding] = useState<BrandingJson>({
    primary: "#7C5CFC",
    secondary: "#1F1F2E",
    accent: "#F5A623",
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [testingClip, setTestingClip] = useState(false);

  // Manual add row state
  const [newCat, setNewCat] = useState({
    name: "",
    recipient_name: "",
    recipient_email: "",
    recipient_phone: "",
  });

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.scheduled_order - b.scheduled_order),
    [categories],
  );

  useEffect(() => {
    if (!eventId || !user) return;
    (async () => {
      setLoading(true);
      const { data: ev, error: evErr } = await supabase
        .from("stream_rooms")
        .select("id, user_id, name, event_date, venue, branding_json, status")
        .eq("id", eventId)
        .maybeSingle();

      if (evErr || !ev) {
        toast.error("Event not found");
        navigate("/dashboard");
        return;
      }
      const evRow = ev as unknown as EventRow;
      setEvent(evRow);
      setName(evRow.name || "");
      setEventDate(evRow.event_date ? evRow.event_date.slice(0, 16) : "");
      setVenue(evRow.venue || "");
      setBranding({
        primary: "#7C5CFC",
        secondary: "#1F1F2E",
        accent: "#F5A623",
        ...(evRow.branding_json || {}),
      });

      const { data: cats } = await supabase
        .from("award_categories")
        .select("id, name, recipient_name, recipient_email, recipient_phone, scheduled_order, status")
        .eq("event_id", eventId)
        .order("scheduled_order", { ascending: true });

      setCategories((cats || []) as AwardCategoryRow[]);
      setLoading(false);
    })();
  }, [eventId, user, navigate]);

  async function handleSaveEvent() {
    if (!event) return;
    setSaving(true);
    const { error } = await supabase
      .from("stream_rooms")
      .update({
        name: name.trim() || "Untitled Event",
        event_date: eventDate ? new Date(eventDate).toISOString() : null,
        venue: venue.trim() || null,
        branding_json: branding,
      })
      .eq("id", event.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save", { description: error.message });
      return;
    }
    toast.success("Event details saved");
  }

  async function handleLogoUpload(file: File) {
    if (!event || !user) return;
    setLogoUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/event-${event.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("ceremony-videos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("ceremony-videos").getPublicUrl(path);
      const next = { ...branding, logo_url: pub.publicUrl };
      setBranding(next);
      await supabase
        .from("stream_rooms")
        .update({ branding_json: next })
        .eq("id", event.id);
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleAddCategory() {
    if (!event || !user || !newCat.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    const nextOrder = categories.length
      ? Math.max(...categories.map((c) => c.scheduled_order)) + 1
      : 1;
    const { data, error } = await supabase
      .from("award_categories")
      .insert({
        event_id: event.id,
        user_id: user.id,
        name: newCat.name.trim(),
        recipient_name: newCat.recipient_name.trim() || null,
        recipient_email: newCat.recipient_email.trim() || null,
        recipient_phone: newCat.recipient_phone.trim() || null,
        scheduled_order: nextOrder,
        status: "pending",
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to add", { description: error.message });
      return;
    }
    setCategories((prev) => [...prev, data as AwardCategoryRow]);
    setNewCat({ name: "", recipient_name: "", recipient_email: "", recipient_phone: "" });
  }

  async function handleDeleteCategory(id: string) {
    const { error } = await supabase.from("award_categories").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed", { description: error.message });
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleCsvUpload(file: File) {
    if (!event || !user) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
      if (lines.length < 2) {
        toast.error("CSV is empty");
        return;
      }
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const idx = (k: string) => header.indexOf(k);
      const iName = idx("name");
      const iRec = idx("recipient_name");
      const iEmail = idx("email");
      const iPhone = idx("phone");
      const iOrder = idx("order");

      if (iName === -1) {
        toast.error("CSV must contain a 'name' column");
        return;
      }

      const baseOrder = categories.length
        ? Math.max(...categories.map((c) => c.scheduled_order)) + 1
        : 1;

      const rows = lines.slice(1).map((line, idx2) => {
        const cells = line.split(",").map((c) => c.trim());
        return {
          event_id: event.id,
          user_id: user.id,
          name: cells[iName] || `Untitled ${idx2 + 1}`,
          recipient_name: iRec >= 0 ? cells[iRec] || null : null,
          recipient_email: iEmail >= 0 ? cells[iEmail] || null : null,
          recipient_phone: iPhone >= 0 ? cells[iPhone] || null : null,
          scheduled_order: iOrder >= 0 && cells[iOrder]
            ? parseInt(cells[iOrder], 10) || baseOrder + idx2
            : baseOrder + idx2,
          status: "pending",
        };
      });

      const { data, error } = await supabase
        .from("award_categories")
        .insert(rows)
        .select();
      if (error) throw error;
      setCategories((prev) => [...prev, ...((data || []) as AwardCategoryRow[])]);
      toast.success(`Imported ${data?.length || 0} categories`);
    } catch (err) {
      toast.error("CSV import failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async function handleTestClip() {
    setTestingClip(true);
    try {
      // Stub — calls existing generate-clip with safe defaults later when a sample asset is wired.
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Test clip pipeline OK", {
        description: "Connected to clip generator. Real test asset wiring lands in Phase 2.",
      });
    } finally {
      setTestingClip(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="capitalize">{event.status}</Badge>
            <span className="text-xs text-muted-foreground">Event setup</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{name || "Untitled Event"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure branding and award queue before going live.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTestClip} disabled={testingClip}>
            {testingClip ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
            Run test clip
          </Button>
          <Button onClick={handleSaveEvent} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="categories">
            Award Categories
            <Badge variant="secondary" className="ml-2">{categories.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event details</CardTitle>
              <CardDescription>Basic info shown in the control room and on clips.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="2026 Excellence Awards" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_date" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Event date
                  </Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Venue
                  </Label>
                  <Input
                    id="venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Royal Albert Hall, London"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Logo and colour palette for clip overlays.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Logo
                </Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                    {branding.logo_url ? (
                      <img src={branding.logo_url} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleLogoUpload(f);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                      disabled={logoUploading}
                    >
                      {logoUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      Upload logo
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["primary", "secondary", "accent"] as const).map((key) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`color-${key}`} className="capitalize">{key} colour</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`color-${key}`}
                        type="color"
                        className="w-14 h-10 p-1 cursor-pointer"
                        value={branding[key] || "#000000"}
                        onChange={(e) => setBranding({ ...branding, [key]: e.target.value })}
                      />
                      <Input
                        value={branding[key] || ""}
                        onChange={(e) => setBranding({ ...branding, [key]: e.target.value })}
                        placeholder="#7C5CFC"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Award categories</CardTitle>
                <CardDescription>
                  Imported queue. CSV columns: <code>name, recipient_name, email, phone, order</code>
                </CardDescription>
              </div>
              <div>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCsvUpload(f);
                    e.target.value = "";
                  }}
                />
                <Button variant="outline" size="sm" onClick={() => document.getElementById("csv-upload")?.click()}>
                  <Upload className="h-4 w-4 mr-2" /> CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Manual add row */}
              <div className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg border border-dashed border-border">
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-xs">Category</Label>
                  <Input
                    value={newCat.name}
                    onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                    placeholder="Best Director"
                  />
                </div>
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-xs">Recipient</Label>
                  <Input
                    value={newCat.recipient_name}
                    onChange={(e) => setNewCat({ ...newCat, recipient_name: e.target.value })}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="col-span-12 md:col-span-3 space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={newCat.recipient_email}
                    onChange={(e) => setNewCat({ ...newCat, recipient_email: e.target.value })}
                    placeholder="jane@email.com"
                  />
                </div>
                <div className="col-span-8 md:col-span-2 space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={newCat.recipient_phone}
                    onChange={(e) => setNewCat({ ...newCat, recipient_phone: e.target.value })}
                    placeholder="+44…"
                  />
                </div>
                <div className="col-span-4 md:col-span-1">
                  <Button onClick={handleAddCategory} className="w-full" size="icon" aria-label="Add">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Queue */}
              {sortedCategories.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  No categories yet. Add one above or import a CSV.
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedCategories.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                    >
                      <Badge variant="outline" className="font-mono">#{c.scheduled_order}</Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {c.recipient_name || "—"}
                          {c.recipient_email ? ` · ${c.recipient_email}` : ""}
                          {c.recipient_phone ? ` · ${c.recipient_phone}` : ""}
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">{c.status}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(c.id)}
                        aria-label="Delete category"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function EventSetup() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <EventSetupInner />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
