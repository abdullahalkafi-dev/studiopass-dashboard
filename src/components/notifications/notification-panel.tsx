"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  MessageSquare,
  Megaphone,
  Info,
  Check,
  CheckCheck,
  Trash2,
  ChevronDown,
} from "lucide-react";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  type Notification,
} from "@/features/notification/notificationApi";

const TYPE_ICON: Record<string, typeof Bell> = {
  reply: MessageSquare,
  announcement: Megaphone,
  system: Info,
};

const TYPE_COLOR: Record<string, string> = {
  reply: "text-blue-500",
  announcement: "text-purple-500",
  system: "text-amber-500",
};

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useGetNotificationsQuery(
    { page, limit: 15 },
    { skip: !open },
  );

  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    skip: !open,
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications: Notification[] = data?.data ?? [];
  const meta = data?.meta;
  const unreadCount = unreadData?.data?.count ?? 0;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPage(1);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
    if (!open) setPage(1);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead(undefined);
  };

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  const handleLoadMore = () => {
    if (meta && page < meta.totalPage) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleToggle}
        className="relative w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors"
      >
        <Bell size={15} className="text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setPage(1); }} />
          <div className="absolute right-0 top-full mt-1 w-80 bg-popover rounded-lg shadow-lg border border-border z-50 flex flex-col max-h-[420px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {isFetching && page === 1 && (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">Loading...</div>
              )}

              {!isFetching && notifications.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications yet</div>
              )}

              {notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] || Info;
                const iconColor = TYPE_COLOR[n.type] || "text-muted-foreground";
                return (
                  <div
                    key={n._id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${!n.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                  >
                    <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">{n.title}</span>
                        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      <span className="text-[10px] text-muted-foreground/70 mt-1 block">{timeAgo(n.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkRead(n._id)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Mark as read"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n._id)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load more */}
            {meta && page < meta.totalPage && (
              <button
                onClick={handleLoadMore}
                disabled={isFetching}
                className="flex items-center justify-center gap-1 py-2.5 text-xs text-muted-foreground hover:text-foreground border-t border-border transition-colors disabled:opacity-50"
              >
                {isFetching ? "Loading..." : "Load more"}
                {!isFetching && <ChevronDown size={12} />}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
