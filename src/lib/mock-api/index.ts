/**
 * Typed Mock API Fetchers
 *
 * All fetchers accept a scope parameter for data filtering.
 * Scope is resolved from the current dev session (role + entity IDs).
 *
 * Usage:
 *   const stations = await getStations({ scopedTo: { partnerId: "PA-001" } });
 *   const users = await getUsers({ scopedTo: { stationId: "RS-001" } });
 */

import stationsData from "@/mock/stations.json";
import usersData from "@/mock/users.json";
import dashboardData from "@/mock/dashboard.json";
import messagesData from "@/mock/messages.json";
import statementsData from "@/mock/statements.json";
import pollsData from "@/mock/polls.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScopeFilter =
  | { partnerId: string }
  | { stationId: string }
  | null;

export interface FetchOptions {
  scopedTo?: ScopeFilter;
}

export interface Station {
  id: string;
  name: string;
  country: string;
  partner: string;
  partnerId: string;
  stationAdmin: string;
  category: string;
  mediaStations: number;
  activeShows: number;
  status: string;
  created: string;
  description: string;
}

export interface PartnerAdmin {
  id: string;
  name: string;
  email: string;
  country: string;
  partnerId: string;
  stationsManaged: number;
  status: string;
  created: string;
  avatar: string;
}

export interface StationAdmin {
  id: string;
  name: string;
  email: string;
  stationId: string;
  station: string;
  country: string;
  partnerId: string;
  partner: string;
  category: string;
  status: string;
  created: string;
  avatar: string;
}

export interface MediaStation {
  id: string;
  name: string;
  email: string;
  stationId: string;
  assignedStation: string;
  country: string;
  status: string;
  created: string;
  avatar: string;
}

export interface Presenter {
  id: string;
  name: string;
  email: string;
  stationId: string;
  assignedStation: string;
  assignedShow: string;
  status: string;
  created: string;
  avatar: string;
}

export interface CustomerCare {
  id: string;
  name: string;
  email: string;
  country: string;
  partnerId: string;
  status: string;
  created: string;
  avatar: string;
}

export interface ListenerMessage {
  id: string;
  created: string;
  msisdn: string;
  stationId: string;
  station: string;
  show: string;
  preview: string;
  fullMessage: string;
  operator: string;
  country: string;
  status: string;
}

export interface Transaction {
  id: string;
  msisdn: string;
  amount: string;
  currency: string;
  country: string;
  operator: string;
  receipt: string;
  status: string;
  created: string;
  updated: string;
  stationId: string;
}

export interface Listener {
  id: string;
  msisdn: string;
  country: string;
  operator: string;
  stationId: string;
  station: string;
  messages: number;
  calls: number;
  totalSpend: number;
  lastActivity: string;
  registrationDate: string;
  status: string;
}

export interface ListenerInteraction {
  id: string;
  listenerId: string;
  date: string;
  station: string;
  stationId: string;
  show: string;
  content: string;
  type: string;
  callDuration?: string;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

function matchesScope(
  item: Record<string, unknown>,
  scope: ScopeFilter
): boolean {
  if (!scope) return true;
  if ("partnerId" in scope) return item.partnerId === scope.partnerId;
  if ("stationId" in scope) return item.stationId === scope.stationId;
  return true;
}

export async function getStations(
  options: FetchOptions = {}
): Promise<Station[]> {
  let data = stationsData.stations as Station[];
  if (options.scopedTo) {
    data = data.filter((s) => matchesScope(s as unknown as Record<string, unknown>, options.scopedTo!));
  }
  return data;
}

export async function getStationById(id: string): Promise<Station | undefined> {
  return (stationsData.stations as Station[]).find((s) => s.id === id);
}

export async function getPartnerAdmins(
  options: FetchOptions = {}
): Promise<PartnerAdmin[]> {
  let data = usersData.partnerAdmins as PartnerAdmin[];
  if (options.scopedTo) {
    data = data.filter((u) => matchesScope(u as unknown as Record<string, unknown>, options.scopedTo!));
  }
  return data;
}

export async function getStationAdmins(
  options: FetchOptions = {}
): Promise<StationAdmin[]> {
  let data = usersData.stationAdmins as StationAdmin[];
  if (options.scopedTo) {
    data = data.filter((u) => matchesScope(u as unknown as Record<string, unknown>, options.scopedTo!));
  }
  return data;
}

export async function getMediaStations(
  options: FetchOptions = {}
): Promise<MediaStation[]> {
  let data = usersData.mediaStations as MediaStation[];
  if (options.scopedTo) {
    data = data.filter((u) => matchesScope(u as unknown as Record<string, unknown>, options.scopedTo!));
  }
  return data;
}

export async function getPresenters(
  options: FetchOptions = {}
): Promise<Presenter[]> {
  let data = usersData.presenters as Presenter[];
  if (options.scopedTo) {
    data = data.filter((u) => matchesScope(u as unknown as Record<string, unknown>, options.scopedTo!));
  }
  return data;
}

export async function getCustomerCare(
  options: FetchOptions = {}
): Promise<CustomerCare[]> {
  let data = usersData.customerCare as CustomerCare[];
  if (options.scopedTo) {
    data = data.filter((u) => matchesScope(u as unknown as Record<string, unknown>, options.scopedTo!));
  }
  return data;
}

export async function getMessages(
  options: FetchOptions = {}
): Promise<ListenerMessage[]> {
  let data = messagesData.messages as ListenerMessage[];
  if (options.scopedTo) {
    data = data.filter((m) => matchesScope(m as unknown as Record<string, unknown>, options.scopedTo!));
  }
  return data;
}

export async function getTransactions(
  options: FetchOptions = {}
): Promise<Transaction[]> {
  let data = messagesData.transactions as Transaction[];
  if (options.scopedTo) {
    data = data.filter((t) => matchesScope(t as unknown as Record<string, unknown>, options.scopedTo!));
  }
  return data;
}

export async function getDashboardData() {
  return dashboardData;
}

export interface Statement {
  id: string;
  created: string;
  msisdn: string;
  amount: string;
  ticket: string;
  stationRef: string;
  mediaStation: string;
  stationId: string;
  show: string;
  type: string;
  operator: string;
  country: string;
  status: string;
}

export interface PollOption {
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  station: string;
  presenter: string;
  status: "Active" | "Completed";
  totalVotes: number;
  options: PollOption[];
  created: string;
  createdDate: string;
}

export async function getStatements(
  options: FetchOptions = {}
): Promise<Statement[]> {
  let data = statementsData.statements as Statement[];
  if (options.scopedTo) {
    data = data.filter((s) => matchesScope(s as unknown as Record<string, unknown>, options.scopedTo!));
  }
  return data;
}

export async function getStatementById(id: string): Promise<Statement | undefined> {
  return (statementsData.statements as Statement[]).find((s) => s.id === id);
}

export async function getPolls(): Promise<Poll[]> {
  return pollsData.polls as Poll[];
}

export async function getPollById(id: string): Promise<Poll | undefined> {
  return (pollsData.polls as Poll[]).find((p) => p.id === id);
}

import listenersData from "@/mock/listeners.json";

export async function getListeners(
  options: FetchOptions = {}
): Promise<Listener[]> {
  let data = listenersData.listeners as Listener[];
  if (options.scopedTo) {
    data = data.filter((l) => matchesScope(l as unknown as Record<string, unknown>, options.scopedTo!));
  }
  return data;
}

export async function getListenerById(id: string): Promise<Listener | undefined> {
  return (listenersData.listeners as Listener[]).find((l) => l.id === id);
}

export async function getListenerInteractions(
  listenerId: string,
  stationId?: string
): Promise<ListenerInteraction[]> {
  let data = (listenersData.interactions as ListenerInteraction[]).filter(
    (i) => i.listenerId === listenerId
  );
  if (stationId) {
    data = data.filter((i) => i.stationId === stationId);
  }
  return data;
}
