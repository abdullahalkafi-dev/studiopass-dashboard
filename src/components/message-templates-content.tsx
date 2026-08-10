"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import {
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
} from "@/features/template/templateApi";
import { toast } from "sonner";
import { formatDate } from "@/utils/time-utils";
import { useTimezone } from "@/hooks/use-timezone";

interface Template {
  _id: string;
  text: string;
  station: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
}

export default function MessageTemplatesContent() {
  const timezone = useTimezone();
  const { data, isLoading } = useGetTemplatesQuery({});
  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteTemplateMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalText, setModalText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const templates: Template[] = data?.data || [];

  const handleOpenCreate = () => {
    setEditingId(null);
    setModalText("");
    setShowModal(true);
  };

  const handleOpenEdit = (t: Template) => {
    setEditingId(t._id);
    setModalText(t.text);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!modalText.trim()) {
      toast.error("Template text is required");
      return;
    }
    try {
      if (editingId) {
        await updateTemplate({ id: editingId, text: modalText.trim() }).unwrap();
        toast.success("Template updated");
      } else {
        await createTemplate({ text: modalText.trim() }).unwrap();
        toast.success("Template created");
      }
      setShowModal(false);
      setModalText("");
      setEditingId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save template");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTemplate(deleteId).unwrap();
      toast.success("Template deleted");
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete template");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center text-[#02B2FF]">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Message Templates</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage reply templates for presenters at your station
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#02B2FF] text-white rounded-lg text-sm font-semibold hover:bg-[#00A0E8] transition-colors shadow-sm"
        >
          <Plus size={14} /> Add Template
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-card rounded-xl border border-border shadow-sm p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Templates</p>
          <p className="text-2xl font-bold text-foreground mt-1">{templates.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{templates.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground">
            {templates.length} template{templates.length !== 1 ? "s" : ""}
          </span>
        </div>
        {isLoading ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileText size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground">No templates yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first template to help presenters reply faster</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Template Text</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t, i) => (
                  <tr key={t._id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-foreground line-clamp-2">{t.text}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground font-['JetBrains_Mono',monospace]">
                      {t.createdAt ? formatDate(t.createdAt, timezone) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#EFF8FF] text-muted-foreground hover:text-[#02B2FF] transition-all"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(t._id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-all"
                          title="Delete"
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
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-popover rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {editingId ? "Edit Template" : "New Template"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <textarea
              value={modalText}
              onChange={(e) => setModalText(e.target.value)}
              placeholder="e.g. Thank you for your message! We'll get back to you shortly."
              rows={4}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#02B2FF]/30 focus:border-[#02B2FF] transition-all resize-none"
            />
            <p className="text-xs text-muted-foreground">{modalText.length}/1600 characters</p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!modalText.trim() || isCreating || isUpdating}
                className="px-4 py-2 text-sm font-semibold bg-[#02B2FF] text-white rounded-lg hover:bg-[#00A0E8] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(isCreating || isUpdating) && <Loader2 size={14} className="animate-spin" />}
                {editingId ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-popover rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Delete Template?</h2>
            <p className="text-sm text-muted-foreground">
              This template will no longer be available for presenters. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-semibold border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
