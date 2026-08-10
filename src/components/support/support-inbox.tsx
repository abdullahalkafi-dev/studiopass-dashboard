"use client";

import { useState, useEffect, useRef } from "react";
import {
  Headphones,
  Search,
  MessageSquare,
  UserCheck,
  CheckCircle2,
  Send,
  Loader2,
  Clock,
  MapPin,
  FileText,
  User,
  CreditCard,
  X,
  ImageIcon,
} from "lucide-react";
import {
  useGetUnassignedQueueQuery,
  useGetMyTicketsQuery,
  useGetClosedTicketsQuery,
  useGetConversationMessagesQuery,
  useClaimTicketMutation,
  useCloseTicketMutation,
  useSendSupportMessageMutation,
  useSearchSupportEntitiesQuery,
} from "@/features/support/supportApi";
import { EntityDetailsModal } from "@/components/support/entity-details-modal";
import { Avatar } from "@/components/shared/section-header";
import { resolveUrl } from "@/lib/utils";
import { toast } from "sonner";
import { useSocket } from "@/hooks/use-socket";
import { useAppSelector } from "@/store/hooks";

export default function SupportInbox() {
  const liveUser = useAppSelector((state) => state.auth.user);
  const { joinSupportConversation, leaveSupportConversation } = useSocket();
  const [activeTab, setActiveTab] = useState<"unassigned" | "my-tickets" | "closed">("unassigned");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Join selected conversation socket room
  useEffect(() => {
    if (selectedTicketId) {
      joinSupportConversation(selectedTicketId);
      return () => {
        leaveSupportConversation(selectedTicketId);
      };
    }
  }, [selectedTicketId, joinSupportConversation, leaveSupportConversation]);
  const [messageInput, setMessageInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Special Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [inspectEntity, setInspectEntity] = useState<any | null>(null);

  // Debounce search query by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Queries for queues
  const { data: unassignedData, isLoading: isUnassignedLoading, refetch: refetchUnassigned } =
    useGetUnassignedQueueQuery({});
  const { data: myTicketsData, isLoading: isMyTicketsLoading, refetch: refetchMyTickets } =
    useGetMyTicketsQuery({});
  const { data: closedTicketsData, isLoading: isClosedLoading, refetch: refetchClosed } =
    useGetClosedTicketsQuery({});

  // Query for messages of selected ticket
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    refetch: refetchMessages,
  } = useGetConversationMessagesQuery(selectedTicketId || "", {
    skip: !selectedTicketId,
  });

  // Query for Special Entity Search (Debounced)
  const { data: searchResultsData, isFetching: isSearching } = useSearchSupportEntitiesQuery(debouncedSearchQuery, {
    skip: debouncedSearchQuery.trim().length === 0,
  });

  const [claimTicket, { isLoading: isClaiming }] = useClaimTicketMutation();
  const [closeTicket, { isLoading: isClosing }] = useCloseTicketMutation();
  const [sendMessage, { isLoading: isSending }] = useSendSupportMessageMutation();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const unassignedList = unassignedData?.data || [];
  const myTicketsList = myTicketsData?.data || [];
  const closedTicketsList = closedTicketsData?.data || [];

  let currentList = unassignedList;
  if (activeTab === "my-tickets") currentList = myTicketsList;
  if (activeTab === "closed") currentList = closedTicketsList;

  const selectedConversation =
    messagesData?.data?.conversation || currentList.find((item: any) => item._id === selectedTicketId);
  const messageList = messagesData?.data?.messages || [];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  // Set default selected ticket when tab or list changes
  useEffect(() => {
    if (!selectedTicketId && currentList.length > 0) {
      setSelectedTicketId(currentList[0]._id);
    }
  }, [currentList, selectedTicketId]);

  const handleClaim = async (ticketId: string) => {
    try {
      await claimTicket(ticketId).unwrap();
      toast.success("Ticket claimed successfully! Moved to My Tickets.");
      setActiveTab("my-tickets");
      refetchUnassigned();
      refetchMyTickets();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to claim ticket");
    }
  };

  const handleClose = async (ticketId: string) => {
    try {
      await closeTicket(ticketId).unwrap();
      toast.success("Ticket closed successfully.");
      refetchMyTickets();
      refetchClosed();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to close ticket");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || (!messageInput.trim() && !selectedImage)) return;

    try {
      const text = messageInput;
      const fileToUpload = selectedImage || undefined;
      setMessageInput("");
      handleRemoveImage();
      await sendMessage({
        id: selectedTicketId,
        message: text || undefined,
        file: fileToUpload,
      }).unwrap();
      refetchMessages();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to send message");
    }
  };

  const searchResults = searchResultsData?.data || {
    users: [],
    transactions: [],
    statements: [],
    stations: [],
  };
  const hasSearchResults =
    searchResults.users.length > 0 ||
    searchResults.transactions.length > 0 ||
    searchResults.statements.length > 0 ||
    searchResults.stations.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Special Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#02B2FF]/10 text-[#02B2FF] flex items-center justify-center font-bold">
            <Headphones size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Customer Support Inbox</h1>
            <p className="text-xs text-muted-foreground">Manage user support tickets & real-time conversations</p>
          </div>
        </div>

        {/* Global Special Search Input */}
        <div className="relative w-full md:w-96">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Special Search: Search any User ID, Tx ID, Ticket, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-[#02B2FF] text-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-40 max-h-96 overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl p-3 space-y-3">
              <div className="flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground border-b border-border pb-2">
                <span>Special DB Search Results</span>
                {isSearching && <Loader2 size={12} className="animate-spin text-[#02B2FF]" />}
              </div>

              {!hasSearchResults && !isSearching && (
                <p className="text-xs text-center py-4 text-muted-foreground">No matching records found.</p>
              )}

              {/* Users */}
              {searchResults.users.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#02B2FF] uppercase px-2">Users / Listeners</span>
                  {searchResults.users.map((u: any) => (
                    <button
                      key={u._id}
                      onClick={() => {
                        setInspectEntity(u);
                        setIsSearchFocused(false);
                      }}
                      className="w-full text-left p-2 hover:bg-muted rounded-xl flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar src={u.avatar} initials={(u.fullName || "U")[0]} size="sm" />
                        <div>
                          <p className="font-semibold text-foreground">{u.fullName || "User"}</p>
                          <p className="text-[10px] text-muted-foreground">{u.phone || u.email || u._id}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-foreground">View</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Transactions */}
              {searchResults.transactions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-500 uppercase px-2">Credit Transactions</span>
                  {searchResults.transactions.map((tx: any) => (
                    <button
                      key={tx._id}
                      onClick={() => {
                        setInspectEntity(tx);
                        setIsSearchFocused(false);
                      }}
                      className="w-full text-left p-2 hover:bg-muted rounded-xl flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-emerald-500" />
                        <div>
                          <p className="font-semibold text-foreground">{tx.amount} Credits ({tx.type})</p>
                          <p className="text-[10px] text-muted-foreground">Ref: {tx.paymentReference || tx._id}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-foreground">View</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Statements */}
              {searchResults.statements.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-500 uppercase px-2">Statements</span>
                  {searchResults.statements.map((st: any) => (
                    <button
                      key={st._id}
                      onClick={() => {
                        setInspectEntity(st);
                        setIsSearchFocused(false);
                      }}
                      className="w-full text-left p-2 hover:bg-muted rounded-xl flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-amber-500" />
                        <div>
                          <p className="font-semibold text-foreground">Ticket: {st.ticket}</p>
                          <p className="text-[10px] text-muted-foreground">{st.msisdn}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-foreground">View</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[720px]">
        {/* Ticket List Sidebar */}
        <div className="bg-card rounded-2xl border border-border shadow-xs flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center border-b border-border p-2 bg-muted/40 gap-1.5">
            <button
              onClick={() => setActiveTab("unassigned")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "unassigned"
                  ? "bg-[#02B2FF] text-white shadow-md font-extrabold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Clock size={13} />
              Unassigned
              {unassignedList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                  {unassignedList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("my-tickets")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "my-tickets"
                  ? "bg-[#02B2FF] text-white shadow-md font-extrabold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <UserCheck size={13} />
              My Tickets
              {myTicketsList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-extrabold">
                  {myTicketsList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("closed")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "closed"
                  ? "bg-[#02B2FF] text-white shadow-md font-extrabold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <CheckCircle2 size={13} />
              Closed
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(isUnassignedLoading || isMyTicketsLoading || isClosedLoading) && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-[#02B2FF]" size={24} />
              </div>
            )}

            {!isUnassignedLoading && currentList.length === 0 && (
              <div className="text-center py-16 text-muted-foreground space-y-2">
                <MessageSquare size={32} className="mx-auto text-muted-foreground/50" />
                <p className="text-xs font-semibold">No support tickets found in this tab.</p>
              </div>
            )}

            {currentList.map((ticket: any) => {
              const isSelected = selectedTicketId === ticket._id;
              const userName = ticket.userId?.fullName || "App Listener";
              const userAvatar = ticket.userId?.avatar;
              const countryName = ticket.countryId?.name || "Global";

              return (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedTicketId(ticket._id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#02B2FF] bg-[#02B2FF]/10 dark:bg-[#02B2FF]/20 shadow-xs"
                      : "border-border hover:border-border/80 bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-[#02B2FF]">{ticket.ticketId}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar src={userAvatar} initials={(userName || "U")[0]} size="sm" />
                    <p className="text-xs font-bold text-foreground truncate">{userName}</p>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {ticket.lastMessage || "Support inquiry"}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50 text-[10px]">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin size={10} /> {countryName}
                    </span>

                    {activeTab === "unassigned" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaim(ticket._id);
                        }}
                        disabled={isClaiming}
                        className="px-2.5 py-1 rounded-lg bg-[#02B2FF] text-white font-bold hover:bg-[#02B2FF]/90 transition-colors"
                      >
                        Claim Ticket
                      </button>
                    ) : (
                      <span className={`font-bold px-2 py-0.5 rounded ${
                        ticket.status === "ASSIGNED" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}>
                        {ticket.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversation & Live Chat Panel */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-xs flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Ticket Top Info Bar */}
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={selectedConversation.userId?.avatar}
                    initials={(selectedConversation.userId?.fullName || "U")[0]}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-foreground">
                        {selectedConversation.userId?.fullName || "App Listener"}
                      </h2>
                      <button
                        onClick={() => setInspectEntity(selectedConversation.userId)}
                        className="text-[10px] text-[#02B2FF] font-semibold hover:underline"
                      >
                        View Profile
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      Ticket: {selectedConversation.ticketId} • {selectedConversation.countryId?.name || "Global"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedConversation.status === "OPEN" && (
                    <button
                      onClick={() => handleClaim(selectedConversation._id)}
                      disabled={isClaiming}
                      className="px-3 py-1.5 rounded-xl bg-[#02B2FF] text-white text-xs font-bold hover:bg-[#02B2FF]/90 transition-colors flex items-center gap-1.5"
                    >
                      <UserCheck size={14} />
                      Take Ticket
                    </button>
                  )}

                  {selectedConversation.status === "ASSIGNED" && (
                    <button
                      onClick={() => handleClose(selectedConversation._id)}
                      disabled={isClosing}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      Mark Resolved / Close
                    </button>
                  )}

                  {selectedConversation.status === "CLOSED" && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 border border-emerald-500/20">
                      <CheckCircle2 size={13} /> Ticket Resolved
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                {isMessagesLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-[#02B2FF]" size={24} />
                  </div>
                )}

                {messageList.map((msg: any) => {
                  const isAgent = msg.senderRole === "customer_care" || msg.senderRole === "super_admin";
                  const senderAvatar = isAgent ? liveUser?.avatar : selectedConversation.userId?.avatar;

                  return (
                    <div
                      key={msg._id}
                      className={`flex gap-2.5 ${isAgent ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <Avatar
                        src={senderAvatar}
                        initials={(msg.senderName || (isAgent ? "A" : "U"))[0]}
                        size="sm"
                      />

                      <div className={`flex flex-col max-w-[75%] ${isAgent ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {msg.senderName || (isAgent ? "Customer Support Agent" : "Listener")}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </span>
                        </div>

                        <div
                          className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            isAgent
                              ? "bg-[#02B2FF] text-white rounded-tr-none shadow-xs"
                              : "bg-card border border-border text-foreground rounded-tl-none shadow-xs"
                          }`}
                        >
                          <p>{msg.message}</p>

                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map((img: string, idx: number) => (
                                <a key={idx} href={resolveUrl(img)} target="_blank" rel="noreferrer">
                                  <img
                                    src={resolveUrl(img)}
                                    alt="Attachment"
                                    className="max-w-xs rounded-lg border border-border/50 object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Reply Input */}
              {selectedConversation.status !== "CLOSED" ? (
                <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-card flex flex-col gap-2">
                  {imagePreview && (
                    <div className="relative inline-block w-20 h-20 rounded-xl overflow-hidden border border-border">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Attach Image"
                    >
                      <ImageIcon size={16} />
                    </button>

                    <input
                      type="text"
                      placeholder="Type your response to the listener..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-[#02B2FF] text-foreground"
                    />

                    <button
                      type="submit"
                      disabled={isSending || (!messageInput.trim() && !selectedImage)}
                      className="px-4 py-2.5 rounded-xl bg-[#02B2FF] text-white text-xs font-bold hover:bg-[#02B2FF]/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Reply
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 border-t border-border bg-muted/30 text-center text-xs font-semibold text-muted-foreground">
                  This support ticket is closed. New user messages will create a new conversation ticket.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-3">
              <Headphones size={40} className="text-muted-foreground/40" />
              <div>
                <p className="text-sm font-bold text-foreground">No Ticket Selected</p>
                <p className="text-xs">Select an unassigned or claimed ticket from the left panel to begin chatting.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Entity Modal */}
      {inspectEntity && (
        <EntityDetailsModal entity={inspectEntity} onClose={() => setInspectEntity(null)} />
      )}
    </div>
  );
}
