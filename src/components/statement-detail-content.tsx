"use client";

import Link from "next/link";
import { ArrowLeft, MessageSquare, Phone } from "lucide-react";
import { StatusBadge, sv } from "@/components/shared/section-header";

interface Statement {
  id: string; created: string; msisdn: string; amount: string; ticket: string;
  stationRef: string; mediaStation: string; stationId: string; show: string;
  type: string; operator: string; country: string; status: string;
}

const STATEMENTS: Record<string, Statement> = {
  "LS-004821": { id:"LS-004821", created:"2024-06-18 09:02", msisdn:"+254712345678", amount:"5.00",  ticket:"TKT-8821", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Morning Drive",  type:"Message", operator:"Safaricom", country:"Kenya",    status:"Successful" },
  "LS-004820": { id:"LS-004820", created:"2024-06-18 08:47", msisdn:"+256701234567", amount:"2.50",  ticket:"TKT-8820", stationRef:"RAD-UG-01", mediaStation:"Radio Uganda",     stationId:"RS-002", show:"Evening News",   type:"Call",    operator:"MTN",       country:"Uganda",   status:"Successful" },
  "LS-004819": { id:"LS-004819", created:"2024-06-18 08:31", msisdn:"+233241234567", amount:"1.00",  ticket:"TKT-8819", stationRef:"JOY-FM-GH", mediaStation:"Joy FM Ghana",     stationId:"RS-003", show:"Breakfast Show", type:"Message", operator:"MTN",       country:"Ghana",    status:"Successful" },
  "LS-004818": { id:"LS-004818", created:"2024-06-18 08:14", msisdn:"+255612345678", amount:"3.00",  ticket:"TKT-8818", stationRef:"HOT-96-TZ", mediaStation:"Hot 96",           stationId:"RS-005", show:"Weekend Vibes",  type:"Call",    operator:"Airtel",    country:"Tanzania", status:"Successful" },
  "LS-004817": { id:"LS-004817", created:"2024-06-18 07:58", msisdn:"+2348012345678",amount:"10.00", ticket:"TKT-8817", stationRef:"CIT-TV-KE", mediaStation:"Citizen TV",       stationId:"TV-001", show:"Talk Back",      type:"Message", operator:"Airtel",    country:"Nigeria",  status:"Successful" },
  "LS-004816": { id:"LS-004816", created:"2024-06-18 07:42", msisdn:"+250781234567", amount:"2.00",  ticket:"TKT-8816", stationRef:"PEA-FM-GH", mediaStation:"Peace FM",         stationId:"RS-004", show:"Sports Hour",    type:"Call",    operator:"MTN",       country:"Rwanda",   status:"Successful" },
  "LS-004815": { id:"LS-004815", created:"2024-06-18 07:20", msisdn:"+254798765432", amount:"5.00",  ticket:"TKT-8815", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Morning Drive",  type:"Message", operator:"Airtel",    country:"Kenya",    status:"Successful" },
  "LS-004814": { id:"LS-004814", created:"2024-06-18 07:05", msisdn:"+256702345678", amount:"2.50",  ticket:"TKT-8814", stationRef:"NTV-UG-01", mediaStation:"NTV Uganda",       stationId:"TV-002", show:"Evening News",   type:"Call",    operator:"Airtel",    country:"Uganda",   status:"Successful" },
  "LS-004813": { id:"LS-004813", created:"2024-06-18 06:48", msisdn:"+233501234567", amount:"1.00",  ticket:"TKT-8813", stationRef:"JOY-FM-GH", mediaStation:"Joy FM Ghana",     stationId:"RS-003", show:"Talk Back",      type:"Message", operator:"Vodacom",   country:"Ghana",    status:"Successful" },
  "LS-004812": { id:"LS-004812", created:"2024-06-18 06:30", msisdn:"+255623456789", amount:"3.00",  ticket:"TKT-8812", stationRef:"HOT-96-TZ", mediaStation:"Hot 96",           stationId:"RS-005", show:"Breakfast Show", type:"Call",    operator:"Vodacom",   country:"Tanzania", status:"Successful" },
  "LS-004811": { id:"LS-004811", created:"2024-06-17 22:15", msisdn:"+2348023456789",amount:"10.00", ticket:"TKT-8811", stationRef:"CIT-TV-KE", mediaStation:"Citizen TV",       stationId:"TV-001", show:"Sports Hour",    type:"Message", operator:"Glo",       country:"Nigeria",  status:"Successful" },
  "LS-004810": { id:"LS-004810", created:"2024-06-17 21:50", msisdn:"+254723456789", amount:"5.00",  ticket:"TKT-8810", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Weekend Vibes",  type:"Call",    operator:"Safaricom", country:"Kenya",    status:"Successful" },
  "LS-004809": { id:"LS-004809", created:"2024-06-17 21:22", msisdn:"+250782345678", amount:"2.00",  ticket:"TKT-8809", stationRef:"RAD-UG-01", mediaStation:"Radio Uganda",     stationId:"RS-002", show:"Morning Drive",  type:"Message", operator:"MTN",       country:"Rwanda",   status:"Successful" },
  "LS-004808": { id:"LS-004808", created:"2024-06-17 20:48", msisdn:"+233209876543", amount:"1.00",  ticket:"TKT-8808", stationRef:"PEA-FM-GH", mediaStation:"Peace FM",         stationId:"RS-004", show:"Evening News",   type:"Call",    operator:"Orange",    country:"Ghana",    status:"Successful" },
  "LS-004807": { id:"LS-004807", created:"2024-06-17 20:10", msisdn:"+255634567890", amount:"3.00",  ticket:"TKT-8807", stationRef:"HOT-96-TZ", mediaStation:"Hot 96",           stationId:"RS-005", show:"Talk Back",      type:"Message", operator:"Airtel",    country:"Tanzania", status:"Successful" },
  "LS-004806": { id:"LS-004806", created:"2024-06-17 19:44", msisdn:"+254733456789", amount:"5.00",  ticket:"TKT-8806", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Breakfast Show", type:"Call",    operator:"Safaricom", country:"Kenya",    status:"Successful" },
  "LS-004805": { id:"LS-004805", created:"2024-06-17 19:20", msisdn:"+2349012345678",amount:"10.00", ticket:"TKT-8805", stationRef:"CIT-TV-KE", mediaStation:"Citizen TV",       stationId:"TV-001", show:"Sports Hour",    type:"Message", operator:"9Mobile",   country:"Nigeria",  status:"Successful" },
  "LS-004804": { id:"LS-004804", created:"2024-06-17 18:58", msisdn:"+256703456789", amount:"2.50",  ticket:"TKT-8804", stationRef:"NTV-UG-01", mediaStation:"NTV Uganda",       stationId:"TV-002", show:"Morning Drive",  type:"Call",    operator:"MTN",       country:"Uganda",   status:"Successful" },
  "LS-004803": { id:"LS-004803", created:"2024-06-17 18:33", msisdn:"+254745678901", amount:"5.00",  ticket:"TKT-8803", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Weekend Vibes",  type:"Message", operator:"Airtel",    country:"Kenya",    status:"Successful" },
  "LS-004802": { id:"LS-004802", created:"2024-06-17 18:05", msisdn:"+233261234567", amount:"1.00",  ticket:"TKT-8802", stationRef:"JOY-FM-GH", mediaStation:"Joy FM Ghana",     stationId:"RS-003", show:"Evening News",   type:"Call",    operator:"MTN",       country:"Ghana",    status:"Successful" },
  "LS-004801": { id:"LS-004801", created:"2024-06-17 17:40", msisdn:"+255645678901", amount:"3.00",  ticket:"TKT-8801", stationRef:"HOT-96-TZ", mediaStation:"Hot 96",           stationId:"RS-005", show:"Breakfast Show", type:"Message", operator:"Vodacom",   country:"Tanzania", status:"Successful" },
  "LS-004800": { id:"LS-004800", created:"2024-06-17 17:12", msisdn:"+2348034567890",amount:"10.00", ticket:"TKT-8800", stationRef:"CIT-TV-KE", mediaStation:"Citizen TV",       stationId:"TV-001", show:"Talk Back",      type:"Call",    operator:"Airtel",    country:"Nigeria",  status:"Successful" },
  "LS-004799": { id:"LS-004799", created:"2024-06-17 16:48", msisdn:"+250783456789", amount:"2.00",  ticket:"TKT-8799", stationRef:"RAD-UG-01", mediaStation:"Radio Uganda",     stationId:"RS-002", show:"Sports Hour",    type:"Message", operator:"MTN",       country:"Rwanda",   status:"Successful" },
  "LS-004798": { id:"LS-004798", created:"2024-06-17 16:22", msisdn:"+256704567890", amount:"2.50",  ticket:"TKT-8798", stationRef:"NTV-UG-01", mediaStation:"NTV Uganda",       stationId:"TV-002", show:"Morning Drive",  type:"Call",    operator:"Airtel",    country:"Uganda",   status:"Successful" },
  "LS-004797": { id:"LS-004797", created:"2024-06-17 15:55", msisdn:"+254756789012", amount:"5.00",  ticket:"TKT-8797", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Evening News",   type:"Message", operator:"Safaricom", country:"Kenya",    status:"Successful" },
  "LS-004796": { id:"LS-004796", created:"2024-06-17 15:28", msisdn:"+233278901234", amount:"1.00",  ticket:"TKT-8796", stationRef:"JOY-FM-GH", mediaStation:"Joy FM Ghana",     stationId:"RS-003", show:"Weekend Vibes",  type:"Call",    operator:"MTN",       country:"Ghana",    status:"Successful" },
  "LS-004795": { id:"LS-004795", created:"2024-06-17 15:02", msisdn:"+255656789012", amount:"3.00",  ticket:"TKT-8795", stationRef:"HOT-96-TZ", mediaStation:"Hot 96",           stationId:"RS-005", show:"Breakfast Show", type:"Message", operator:"Vodacom",   country:"Tanzania", status:"Successful" },
  "LS-004794": { id:"LS-004794", created:"2024-06-17 14:35", msisdn:"+2348045678901",amount:"10.00", ticket:"TKT-8794", stationRef:"CIT-TV-KE", mediaStation:"Citizen TV",       stationId:"TV-001", show:"Talk Back",      type:"Call",    operator:"Glo",       country:"Nigeria",  status:"Successful" },
  "LS-004793": { id:"LS-004793", created:"2024-06-17 14:10", msisdn:"+250784567890", amount:"2.00",  ticket:"TKT-8793", stationRef:"RAD-UG-01", mediaStation:"Radio Uganda",     stationId:"RS-002", show:"Sports Hour",    type:"Message", operator:"MTN",       country:"Rwanda",   status:"Successful" },
  "LS-004792": { id:"LS-004792", created:"2024-06-17 13:48", msisdn:"+254767890123", amount:"5.00",  ticket:"TKT-8792", stationRef:"CAP-FM-KE", mediaStation:"Capital FM Kenya", stationId:"RS-001", show:"Morning Drive",  type:"Call",    operator:"Safaricom", country:"Kenya",    status:"Successful" },
};

export default function StatementDetailContent({ id }: { id: string }) {
  const stmt = STATEMENTS[id];

  if (!stmt) {
    return (
      <div className="space-y-6">
        <Link href="/listener-statement" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
          <ArrowLeft size={13} /> Back to Listener Statement
        </Link>
        <div className="text-center py-16">
          <p className="text-sm font-semibold text-foreground">Statement not found</p>
          <p className="text-xs text-muted-foreground mt-1">The statement you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  const isMsg = stmt.type === "Message";

  return (
    <div className="space-y-6">
      <Link href="/listener-statement" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#02B2FF] transition-colors">
        <ArrowLeft size={13} /> Back to Listener Statement
      </Link>

      <div>
        <h1 className="text-xl font-bold text-foreground">Statement Details</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Reference: {stmt.ticket}</p>
      </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMsg ? "bg-[#02B2FF]/10" : "bg-violet-100"}`}>
          {isMsg ? <MessageSquare size={18} className="text-[#02B2FF]" /> : <Phone size={18} className="text-violet-500" />}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-emerald-700">{stmt.type} — {stmt.show}</div>
          <div className="text-xs text-emerald-600">{stmt.mediaStation} · {stmt.created}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-emerald-700 font-['JetBrains_Mono',monospace]">${stmt.amount}</div>
          <StatusBadge label={stmt.status} variant={sv(stmt.status)} />
        </div>
      </div>

      {/* Interaction Details */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/30">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interaction Details</span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border">
          {([
            ["Created Date",      stmt.created],
            ["MSISDN",            stmt.msisdn],
            ["Amount",            `$${stmt.amount}`],
            ["Ticket",            stmt.ticket],
            ["Station Reference", stmt.stationRef],
            ["Station",           stmt.mediaStation],
            ["Show",              stmt.show],
            ["Interaction Type",  stmt.type],
            ["Operator",          stmt.operator],
            ["Country",           stmt.country],
          ] as [string, string][]).map(([lbl, val], i) => (
            <div key={lbl} className={`px-5 py-4 ${i < 9 ? "border-b border-border" : ""}`}>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{lbl}</div>
              <div className="text-sm font-semibold text-foreground">{val}</div>
            </div>
          ))}
          <div className="col-span-2 px-5 py-4 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Status</div>
            <StatusBadge label={stmt.status} variant={sv(stmt.status)} />
          </div>
        </div>
      </div>

      {/* Back Button */}
      <Link href="/listener-statement" className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm font-semibold text-foreground bg-white hover:bg-muted transition-colors">
        <ArrowLeft size={14} /> Back to Listener Statement
      </Link>
    </div>
  );
}
