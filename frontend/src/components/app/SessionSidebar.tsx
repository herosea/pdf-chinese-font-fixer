
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SessionMetadata } from '@/types';
import { PlusCircle, Clock, Trash2, FileText, Edit2 } from 'lucide-react';

interface SessionSidebarProps {
  sessions: SessionMetadata[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newName: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SessionSidebar: React.FC<SessionSidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  isOpen,
  onToggle
}) => {
  const { t, i18n } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(i18n.language === 'en' ? 'en-US' : 'zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startEditing = (e: React.MouseEvent, session: SessionMetadata) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditValue(session.name);
  };

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingId(null);
    setEditValue('');
  };

  const saveEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editingId && editValue.trim()) {
      onRenameSession(editingId, editValue.trim());
      setEditingId(null);
    } else {
      cancelEditing();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col h-full shadow-xl lg:shadow-none overflow-hidden
          ${isOpen ? 'w-72 translate-x-0' : 'w-0 lg:w-0 -translate-x-full lg:translate-x-0 border-r-0'}
        `}
      >
        <div className="w-72 flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h2 className="font-bold text-gray-800 flex items-center gap-2 truncate">
              <Clock className="w-5 h-5 text-blue-600" />
              {t('sidebar.history')}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={onNewSession}
                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title={t('sidebar.newSession')}
              >
                <PlusCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>{t('sidebar.emptyDesc', 'No sessions yet')}</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => editingId !== session.id && onSelectSession(session.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border
                    ${currentSessionId === session.id && editingId !== session.id
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}
                  `}
                >
                  {editingId === session.id ? (
                    <div className="flex-1 flex items-center gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => saveEditing()}
                        className="flex-1 min-w-0 text-sm p-1.5 bg-white text-gray-900 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className={`text-sm font-bold truncate ${currentSessionId === session.id ? 'text-blue-700' : 'text-gray-700'}`}>
                          {session.name || t('app.untitledSession', 'Untitled Session')}
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                          {formatDate(session.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => startEditing(e, session)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(t('sidebar.deleteConfirm', 'Are you sure you want to delete this session?'))) {
                              onDeleteSession(session.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-50 text-[10px] text-center font-bold text-gray-300 uppercase tracking-widest">
            {sessions.length} {t('sidebar.sessionsStored', 'SESSIONS STORED')}
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionSidebar;
