import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Tag, Link2, MessageSquare, History, RotateCcw, Save, Send } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { getDoc, callMethodDirect } from '../../services/api';
import { formatDate, formatDateTime } from '../../lib/utils';

function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent || tmp.innerText || '';
}

interface Version {
  name: string;
  owner: string;
  creation: string;
  data: string;
}

interface Comment {
  name: string;
  content: string;
  owner: string;
  creation: string;
}

interface ToDoDetail {
  name: string;
  owner: string;
  status: string;
  priority: string;
  color: string;
  date: string;
  allocated_to: string;
  description: string;
  reference_type: string;
  reference_name: string;
  assigned_by: string;
  assigned_by_full_name: string;
  creation: string;
  modified: string;
  modified_by: string;
}

interface DocInfo {
  user_info: Record<string, { fullname: string; image: string | null; name: string; email: string }>;
  comments: Comment[];
  versions: Version[];
  attachments: unknown[];
  assignments: unknown[];
}

export default function TodoDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ToDoDetail | null>(null);
  const [docinfo, setDocinfo] = useState<DocInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editColor, setEditColor] = useState('#39E4A5');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    getDoc<ToDoDetail>('ToDo', name)
      .then(res => {
        const doc = res.docs[0];
        setData(doc);
        setEditStatus(doc.status);
        setEditPriority(doc.priority);
        setEditColor(doc.color || '#39E4A5');
        setDocinfo(res.docinfo as DocInfo);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [name]);

  const userMap = docinfo?.user_info || {};

  const getUserName = (email: string) =>
    userMap[email]?.fullname || email || '—';

  const parseVersion = (dataStr: string): { added: unknown[]; changed: [string, string, string][]; removed: unknown[] } => {
    try {
      return JSON.parse(dataStr);
    } catch {
      return { added: [], changed: [], removed: [] };
    }
  };

  const handleSave = () => {
    if (!data) return;
    setSaving(true);
    fetch('/api/resource/ToDo/' + data.name, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        status: editStatus,
        priority: editPriority,
        color: editColor,
      }),
    })
      .then(res => res.json())
      .then(() => {
        setData(prev => prev ? { ...prev, status: editStatus, priority: editPriority, color: editColor } : null);
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !data) return;
    setSubmittingComment(true);
    try {
      // Use frappe.desk.form.utils.add_comment - correct API for Frappe
      await callMethodDirect('frappe.desk.form.utils.add_comment', {
        reference_doctype: 'ToDo',
        reference_name: data.name,
        content: `<div class="ql-editor read-mode"><p>${commentText}</p></div>`,
        comment_email: 'okeynhat@gmail.com',
        comment_by: 'Thức Trần Minh',
      });
      setCommentText('');
      // Refresh docinfo to get updated comments
      const res = await getDoc('ToDo', data.name);
      setDocinfo(res.docinfo as DocInfo);
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/4 animate-pulse" />
        <div className="bg-white rounded-lg border border-gray-100 p-6 space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Không tìm thấy việc này</p>
        </div>
      </div>
    );
  }

  const descText = stripHtml(data.description || '');

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={descText || 'Việc cần làm'}
        subtitle={data.name}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/projects/todos')} className="btn btn-ghost flex items-center gap-1">
              <ArrowLeft size={18} />
              Quay lại
            </button>
            {data.status === 'Closed' && (
              <button className="btn btn-outline flex items-center gap-1">
                <RotateCcw size={16} />
                Reopen
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary flex items-center gap-1"
            >
              <Save size={16} />
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main form */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-100 overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
            <StatusBadge status={data.status} />
            {data.color && (
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: data.color }} />
            )}
          </div>

          {/* Form fields */}
          <div className="p-6 space-y-5">
            {/* Status */}
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-600">Status</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                className="select select-sm flex-1 max-w-xs"
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-600">Priority</label>
              <select
                value={editPriority}
                onChange={e => setEditPriority(e.target.value)}
                className="select select-sm flex-1 max-w-xs"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Color */}
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-600">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editColor || '#39E4A5'}
                  onChange={e => setEditColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={editColor || '#39E4A5'}
                  onChange={e => setEditColor(e.target.value)}
                  className="input input-sm w-24"
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-600">Due Date</label>
              <div className="flex items-center gap-1 text-sm text-gray-700">
                <Calendar size={14} className="text-gray-400" />
                {formatDate(data.date)}
              </div>
            </div>

            {/* Allocated To */}
            <div className="flex items-center gap-4">
              <label className="w-32 text-sm font-medium text-gray-600">Allocated To</label>
              <div className="flex items-center gap-1 text-sm text-gray-700">
                <User size={14} className="text-gray-400" />
                {getUserName(data.allocated_to)}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
              <div className="border border-gray-200 rounded-lg p-4 min-h-[80px] bg-gray-50 text-sm text-gray-800">
                {descText || '—'}
              </div>
            </div>

            {/* Reference */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Link2 size={16} />
                Reference
              </h3>
              <div className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium text-gray-600">Type</label>
                <span className="text-sm font-medium text-blue-700">{data.reference_type || '—'}</span>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium text-gray-600">Name</label>
                <span className="text-sm font-medium text-blue-600 cursor-pointer hover:underline">
                  {data.reference_name || '—'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-32 text-sm font-medium text-gray-600">Assigned By</label>
                <span className="text-sm text-gray-700">{getUserName(data.assigned_by)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info */}
          <div className="bg-white rounded-lg border border-gray-100 p-4 text-xs text-gray-500 space-y-2">
            <p>Created by {getUserName(data.owner)}</p>
            <p>{formatDateTime(data.creation)}</p>
            <p>Last edited by {getUserName(data.modified_by)}</p>
            <p>{formatDateTime(data.modified)}</p>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                <MessageSquare size={14} />
                Comments
                {(docinfo?.comments?.length || 0) > 0 && (
                  <span className="text-xs text-gray-400">({docinfo!.comments.length})</span>
                )}
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {docinfo?.comments?.length ? (
                docinfo.comments.map(c => (
                  <div key={c.name} className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-semibold">
                          {getUserName(c.owner).charAt(0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-800">{getUserName(c.owner)}</span>
                        <span className="text-xs text-gray-400 ml-2">{formatDateTime(c.creation)}</span>
                      </div>
                    </div>
                    <div className="ml-8 text-sm text-gray-700">
                      {stripHtml(c.content)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-gray-400">Chưa có bình luận</div>
              )}
            </div>
            {/* Comment input */}
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-semibold">
                    {userMap[data.owner]?.fullname?.charAt(0) || userMap[data.owner]?.name?.charAt(0) || 'Y'}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                    placeholder="Nhập bình luận..."
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <div className="flex justify-end mt-1">
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || submittingComment}
                      className="btn btn-primary btn-sm flex items-center gap-1"
                    >
                      <Send size={12} />
                      {submittingComment ? 'Đang gửi...' : 'Gửi'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity / Versions */}
          <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <History size={14} className="text-gray-500" />
              <h3 className="font-medium text-sm text-gray-700">Activity</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {docinfo?.versions?.length ? (
                docinfo.versions.map(v => {
                  const parsed = parseVersion(v.data);
                  const changes = parsed.changed.map(([field, from, to]) => (
                    <span key={field}>{field}: <s>{from}</s> → {to}</span>
                  ));
                  return (
                    <div key={v.name} className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                          <span className="text-gray-500 text-xs font-semibold">
                            {getUserName(v.owner).charAt(0)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-700">
                          <span className="font-medium">{getUserName(v.owner)}</span>
                          <div className="mt-0.5 space-y-0.5">{changes}</div>
                          <div className="mt-1 text-gray-400">{formatDateTime(v.creation)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-gray-400">Chưa có hoạt động</div>
              )}
              {/* Created */}
              <div className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-gray-500 text-xs font-semibold">
                      {getUserName(data.owner).charAt(0)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-700">
                    <span className="font-medium">{getUserName(data.owner)}</span> created this
                    <div className="mt-1 text-gray-400">{formatDateTime(data.creation)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
