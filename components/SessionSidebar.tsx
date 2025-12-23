import React, { useState, useRef, useEffect } from 'react';
import { SessionMetadata } from '../types';
import { PlusCircle, Clock, Trash2, FileText, Edit2, Check, X } from 'lucide-react';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
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
          className="fixed inset-0 bg-black/20 z-20 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col h-full shadow-xl lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            历史会话
          </h2>
          <button 
            onClick={onNewSession}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="新建会话"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>暂无历史记录</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => editingId !== session.id && onSelectSession(session.id)}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border
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
                      onBlur={() => saveEditing()} // Auto-save on blur
                      className="flex-1 min-w-0 text-sm p-1 bg-white text-gray-900 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button onClick={saveEditing} className="p-1 text-green-600 hover:bg-green-50 rounded">
                      <Check className="w-4 h-4" />
                    </button>
                    {/* Remove cancel button to save space, rely on blur or escape, or keep it if space permits. 
                        Blur handling makes it implicit save which is often better UX for renaming.
                    */}
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className={`text-sm font-medium truncate ${currentSessionId === session.id ? 'text-blue-700' : 'text-gray-700'}`}>
                        {session.name || '未命名会话'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startEditing(e, session)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="重命名"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('确定要删除这个会话吗？')) {
                            onDeleteSession(session.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="删除会话"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info or stats could go here */}
        <div className="p-4 border-t border-gray-100 text-xs text-center text-gray-400">
           {sessions.length} 个保存的会话
        </div>
      </div>
    </>
  );
};

export default SessionSidebar;