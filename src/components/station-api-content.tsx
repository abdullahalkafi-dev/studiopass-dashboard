"use client";

import { useState } from "react";
import {
  Code, Key, Copy, CheckCircle2, Clock, Activity, Trash2, RefreshCw,
  Send, Zap, Globe, Loader2, Plus, X, Eye,
} from "lucide-react";
import { useRole } from "@/contexts/role-context";
import { useAppSelector } from "@/store/hooks";
import { KpiCard } from "@/components/shared/kpi-card";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusBadge, sv } from "@/components/shared/section-header";
import {
  useGetKeysQuery,
  useCreateKeyMutation,
  useRegenerateKeyMutation,
  useDeleteKeyMutation,
  useGetStatsQuery,
  useGetLogsQuery,
  useLazyTestApiEndpointQuery,
  useRevealKeyMutation,
  type StationApiKey,
} from "@/features/station-api/stationApiKeyApi";
import { toast } from "sonner";

export default function StationApiContent() {
  const role = useRole();
  const user = useAppSelector((state) => state.auth.user);
  const stationId = user?.stationId || "";

  const [logPage, setLogPage] = useState(1);
  const [showDocs, setShowDocs] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingKey, setViewingKey] = useState<string | null>(null);
  const [revealingKeyId, setRevealingKeyId] = useState<string | null>(null);
  const [revealPassword, setRevealPassword] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  // API Playground state
  const [playgroundApiKey, setPlaygroundApiKey] = useState("");
  const [playgroundLimit, setPlaygroundLimit] = useState(10);
  const [playgroundShow, setPlaygroundShow] = useState("");
  const [playgroundResult, setPlaygroundResult] = useState<any>(null);
  const [playgroundLoading, setPlaygroundLoading] = useState(false);

  const [revealKey, { isLoading: isRevealing }] = useRevealKeyMutation();

  const { data: keys, isLoading: keysLoading } = useGetKeysQuery(
    { stationId },
    { skip: !stationId }
  );
  const { data: stats, isLoading: statsLoading } = useGetStatsQuery(
    { stationId },
    { skip: !stationId }
  );
  const { data: logsData, isLoading: logsLoading } = useGetLogsQuery(
    { stationId, page: logPage, limit: 15 },
    { skip: !stationId }
  );

  const [createKey, { isLoading: isCreating }] = useCreateKeyMutation();
  const [regenerateKey, { isLoading: isRegenerating }] = useRegenerateKeyMutation();
  const [deleteKey, { isLoading: isDeleting }] = useDeleteKeyMutation();
  const [triggerTest] = useLazyTestApiEndpointQuery();

  const logs = logsData?.logs || [];
  const logsMeta = logsData?.meta;

  const handleCreateKey = async (name: string, type: "sandbox" | "production") => {
    try {
      const result = await createKey({ stationId, name, type }).unwrap();
      setShowCreateModal(false);
      setViewingKey(result.key || null);
      toast.success("API key created. Save it now — it won't be shown again.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create key");
    }
  };

  const handleRegenerate = async (id: string) => {
    if (!confirm("Regenerate this key? The old key will stop working immediately.")) return;
    try {
      const result = await regenerateKey(id).unwrap();
      setViewingKey(result.key || null);
      toast.success("Key regenerated. Save it now — it won't be shown again.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to regenerate key");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this key? It will stop working immediately.")) return;
    try {
      await deleteKey(id).unwrap();
      toast.success("Key deactivated");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to deactivate key");
    }
  };

  const handlePlaygroundTest = async () => {
    if (!playgroundApiKey.trim()) {
      toast.error("Paste your API key first");
      return;
    }

    setPlaygroundLoading(true);
    setPlaygroundResult(null);
    try {
      const result = await triggerTest({
        apiKey: playgroundApiKey.trim(),
        limit: playgroundLimit,
        show: playgroundShow || undefined,
      }).unwrap();
      setPlaygroundResult(result);
    } catch (err: any) {
      setPlaygroundResult({ error: err?.data?.message || "Request failed" });
    } finally {
      setPlaygroundLoading(false);
    }
  };

  const handleRevealKey = async (id: string) => {
    if (!revealPassword.trim()) {
      toast.error("Password is required");
      return;
    }
    try {
      const result = await revealKey({ id, password: revealPassword.trim() }).unwrap();
      setRevealedKey(result.key);
      setRevealPassword("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid password");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (!stationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">No station associated with your account.</p>
      </div>
    );
  }

  if (statsLoading && keysLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-[#02B2FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF]">
            <Code size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Station API</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage API keys and monitor external API usage for your TV station.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDocs(!showDocs)}
            className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-background hover:bg-muted transition-colors"
          >
            <Globe size={14} className="text-muted-foreground" />
            API Docs
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
          >
            <Plus size={14} /> Create API Key
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total API Hits"
          value={String(stats?.totalHits || 0)}
          icon={<Activity size={16} className="text-[#02B2FF]" />}
          iconBg="bg-[#EFF8FF]"
        />
        <KpiCard
          label="Avg Response Time"
          value={stats?.avgResponseTimeMs ? `${stats.avgResponseTimeMs}ms` : "—"}
          icon={<Clock size={16} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Success Ratio"
          value={stats?.successRatio != null ? `${(stats.successRatio * 100).toFixed(1)}%` : "—"}
          icon={<CheckCircle2 size={16} className="text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Hits Today"
          value={String(stats?.hitsToday || 0)}
          icon={<Zap size={16} className="text-violet-500" />}
          iconBg="bg-violet-50"
        />
      </div>

      {/* API Documentation Panel */}
      {showDocs && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-[#02B2FF]" />
              <h2 className="text-sm font-bold text-foreground">API Documentation</h2>
            </div>
            <button onClick={() => setShowDocs(false)} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Endpoint */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Endpoint</p>
              <div className="flex items-center gap-2">
                <code className="px-3 py-1.5 bg-muted rounded-lg text-xs font-['JetBrains_Mono',monospace] text-foreground">
                  GET /api/v1/station-api/messages
                </code>
                <button onClick={() => copyToClipboard("GET /api/v1/station-api/messages")} className="text-muted-foreground hover:text-[#02B2FF]">
                  <Copy size={12} />
                </button>
              </div>
            </div>

            {/* Parameters */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Query Parameters</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-semibold text-muted-foreground">Param</th>
                    <th className="text-left py-2 font-semibold text-muted-foreground">Type</th>
                    <th className="text-left py-2 font-semibold text-muted-foreground">Required</th>
                    <th className="text-left py-2 font-semibold text-muted-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2 font-['JetBrains_Mono',monospace] text-foreground">apiKey</td>
                    <td className="py-2 text-muted-foreground">string</td>
                    <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-bold">Required</span></td>
                    <td className="py-2 text-muted-foreground">Your station API key</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 font-['JetBrains_Mono',monospace] text-foreground">limit</td>
                    <td className="py-2 text-muted-foreground">number</td>
                    <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-bold">Optional</span></td>
                    <td className="py-2 text-muted-foreground">Max messages to return (default: 20, max: 100)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 font-['JetBrains_Mono',monospace] text-foreground">show</td>
                    <td className="py-2 text-muted-foreground">string</td>
                    <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-bold">Optional</span></td>
                    <td className="py-2 text-muted-foreground">Filter by show name (exact match, case-insensitive)</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-['JetBrains_Mono',monospace] text-foreground">before</td>
                    <td className="py-2 text-muted-foreground">ISO date</td>
                    <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-bold">Optional</span></td>
                    <td className="py-2 text-muted-foreground">Pagination — messages before this date</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Response Example */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Response</p>
              <div className="bg-muted/50 rounded-lg p-3 relative">
                <button
                  onClick={() => copyToClipboard(JSON.stringify({ messages: [{ id: "665f1a2b...", content: "Hello!", msisdn: "+256****123", show: "Morning Drive", user: { name: "John Doe", avatar: null }, sentToOutputAt: "2026-07-05T09:15:00Z", createdAt: "2026-07-05T09:10:00Z" }] }, null, 2))}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                >
                  <Copy size={12} />
                </button>
                <pre className="text-[11px] font-['JetBrains_Mono',monospace] text-foreground overflow-x-auto">
{`{
  "success": true,
  "data": [
    {
      "id": "665f1a2b...",
      "content": "Hello!",
      "msisdn": "+256****123",
      "show": "Morning Drive",
      "user": {
        "name": "John Doe",
        "avatar": "http://localhost:9000/studiopass/avatars/user123.webp"
      },
      "sentToOutputAt": "2026-07-05T09:15:00Z",
      "createdAt": "2026-07-05T09:10:00Z"
    }
  ]
}`}
                </pre>
              </div>
            </div>

            {/* cURL Example */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">cURL Example</p>
              <div className="bg-muted/50 rounded-lg p-3 relative">
                <button
                  onClick={() => copyToClipboard(`curl -H "x-api-key: YOUR_API_KEY" "http://localhost:5003/api/v1/station-api/messages?limit=10"`)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                >
                  <Copy size={12} />
                </button>
                <code className="text-[11px] font-['JetBrains_Mono',monospace] text-foreground break-all">
                  curl -H &quot;x-api-key: YOUR_API_KEY&quot; &quot;http://localhost:5003/api/v1/station-api/messages?limit=10&quot;
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Key size={14} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">API Keys</span>
          </div>
          <span className="text-xs text-muted-foreground">{keys?.length || 0} keys</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Hits</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avg Response</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keysLoading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center"><Loader2 size={16} className="animate-spin text-muted-foreground mx-auto" /></td></tr>
              ) : !keys?.length ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">No API keys yet. Create one to get started.</td></tr>
              ) : keys.map((key) => (
                <tr key={key._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-semibold text-foreground">{key.name}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      key.type === "production"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                    }`}>
                      {key.type === "production" ? "PROD" : "SANDBOX"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge label={key.isActive ? "Active" : "Inactive"} variant={sv(key.isActive ? "Active" : "Inactive")} />
                  </td>
                  <td className="px-5 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-foreground">{key.totalHits.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-xs font-['JetBrains_Mono',monospace] text-foreground">{key.avgResponseTimeMs ? `${key.avgResponseTimeMs}ms` : "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setRevealingKeyId(key._id); setRevealedKey(null); setRevealPassword(""); }}
                        disabled={!key.isActive}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all disabled:opacity-30"
                        title="View API Key"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleRegenerate(key._id)}
                        disabled={isRegenerating || !key.isActive}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-violet-50 text-muted-foreground hover:text-violet-500 transition-all disabled:opacity-30"
                        title="Regenerate"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(key._id)}
                        disabled={isDeleting || !key.isActive}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all disabled:opacity-30"
                        title="Deactivate"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Playground */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Send size={16} className="text-[#02B2FF]" />
          <h2 className="text-sm font-bold text-foreground">API Playground</h2>
          <span className="text-[10px] text-muted-foreground ml-1">(Test your API endpoint)</span>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5 space-y-3">
            {/* API Key input */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">API Key</label>
              <input
                type="text"
                value={playgroundApiKey}
                onChange={(e) => setPlaygroundApiKey(e.target.value)}
                placeholder="Paste your API key here (sp_xxxxx...)"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground font-['JetBrains_Mono',monospace] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
              />
            </div>

            {/* Limit */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Limit</label>
              <input
                type="number"
                value={playgroundLimit}
                onChange={(e) => setPlaygroundLimit(Number(e.target.value))}
                min={1}
                max={100}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground font-['JetBrains_Mono',monospace] focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
              />
            </div>

            {/* Show filter */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Show (optional)</label>
              <input
                type="text"
                value={playgroundShow}
                onChange={(e) => setPlaygroundShow(e.target.value)}
                placeholder="e.g. Morning Drive"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
              />
            </div>

            <button
              onClick={handlePlaygroundTest}
              disabled={playgroundLoading || !playgroundApiKey.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {playgroundLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {playgroundLoading ? "Sending..." : "Send Request"}
            </button>
          </div>

          <div className="col-span-7">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Response</label>
            <div className="bg-muted/50 rounded-lg p-4 min-h-[260px] max-h-[300px] overflow-auto relative">
              {playgroundResult ? (
                <>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(playgroundResult, null, 2))}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                  >
                    <Copy size={12} />
                  </button>
                  <pre className="text-[11px] font-['JetBrains_Mono',monospace] text-foreground whitespace-pre-wrap break-all">
                    {JSON.stringify(playgroundResult, null, 2)}
                  </pre>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  Select a key and send a request to see the response
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Recent API Logs</span>
          </div>
          <span className="text-xs text-muted-foreground">{logsMeta?.total || 0} total entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Endpoint</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Query</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Response Time</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Size</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">IP</th>
              </tr>
            </thead>
            <tbody>
              {logsLoading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center"><Loader2 size={16} className="animate-spin text-muted-foreground mx-auto" /></td></tr>
              ) : !logs.length ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">No API logs yet.</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground">
                    {new Date(log.hitAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-xs font-['JetBrains_Mono',monospace] text-foreground">{log.endpoint}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                    {log.queryParams ? JSON.stringify(log.queryParams) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.statusCode >= 200 && log.statusCode < 300
                        ? "bg-emerald-100 text-emerald-700"
                        : log.statusCode >= 400
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-['JetBrains_Mono',monospace] text-foreground">{log.responseTimeMs}ms</td>
                  <td className="px-5 py-3 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground">
                    {log.responseSizeBytes ? `${(log.responseSizeBytes / 1024).toFixed(1)}KB` : "—"}
                  </td>
                  <td className="px-5 py-3 text-xs font-['JetBrains_Mono',monospace] text-muted-foreground">{log.ipAddress || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logsMeta && logsMeta.totalPage > 1 && (
          <TablePagination
            pg={logPage}
            totalPages={logsMeta.totalPage}
            totalItems={logsMeta.total}
            itemLabel="logs"
            setPg={setLogPage}
          />
        )}
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <CreateKeyModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateKey}
          isLoading={isCreating}
        />
      )}

      {/* View Key Modal (shown after creation/regeneration) */}
      {viewingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setViewingKey(null)}>
          <div className="bg-popover rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Key size={16} className="text-[#02B2FF]" />
                <span className="text-sm font-bold text-foreground">API Key Created</span>
              </div>
              <button onClick={() => setViewingKey(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Save this key now. It will not be shown again.
                </p>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Your API Key</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-xs font-['JetBrains_Mono',monospace] text-foreground break-all">
                    {viewingKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(viewingKey)}
                    className="shrink-0 w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end">
              <button
                onClick={() => setViewingKey(null)}
                className="px-4 py-2 text-sm font-semibold text-foreground bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reveal Key Modal */}
      {revealingKeyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setRevealingKeyId(null); setRevealedKey(null); setRevealPassword(""); }}>
          <div className="bg-popover rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[#02B2FF]" />
                <span className="text-sm font-bold text-foreground">Reveal API Key</span>
              </div>
              <button onClick={() => { setRevealingKeyId(null); setRevealedKey(null); setRevealPassword(""); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {!revealedKey ? (
                <>
                  <p className="text-xs text-muted-foreground">Enter your password to reveal the API key.</p>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Password</label>
                    <input
                      type="password"
                      value={revealPassword}
                      onChange={(e) => setRevealPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
                      onKeyDown={(e) => { if (e.key === "Enter") handleRevealKey(revealingKeyId); }}
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setRevealingKeyId(null); setRevealPassword(""); }} className="px-4 py-2 text-sm font-semibold text-foreground bg-muted rounded-lg hover:bg-accent transition-colors">Cancel</button>
                    <button
                      onClick={() => handleRevealKey(revealingKeyId)}
                      disabled={!revealPassword.trim() || isRevealing}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isRevealing ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                      {isRevealing ? "Verifying..." : "Reveal Key"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Save this key. It will not be shown again after closing.</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Your API Key</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-xs font-['JetBrains_Mono',monospace] text-foreground break-all">{revealedKey}</code>
                      <button onClick={() => copyToClipboard(revealedKey)} className="shrink-0 w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => { setRevealingKeyId(null); setRevealedKey(null); setRevealPassword(""); }} className="px-4 py-2 text-sm font-semibold text-foreground bg-muted rounded-lg hover:bg-accent transition-colors">Done</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create Key Modal ─────────────────────────────────────────────────────

function CreateKeyModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (name: string, type: "sandbox" | "production") => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"sandbox" | "production">("production");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), type);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-popover rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-[#02B2FF]" />
            <span className="text-sm font-bold text-foreground">Create API Key</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Key Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production API"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("production")}
                className={`flex-1 px-3 py-2.5 text-sm font-semibold rounded-lg border transition-colors ${
                  type === "production"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-700"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                Production
              </button>
              <button
                type="button"
                onClick={() => setType("sandbox")}
                className={`flex-1 px-3 py-2.5 text-sm font-semibold rounded-lg border transition-colors ${
                  type === "sandbox"
                    ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-700"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                Sandbox
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-foreground bg-muted rounded-lg hover:bg-accent transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {isLoading ? "Creating..." : "Create Key"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
