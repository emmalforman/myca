"use client";

import { useState } from "react";

export default function Header({
  onSyncClick,
  memberCount,
}: {
  onSyncClick: () => void;
  memberCount: number;
}) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSyncClick();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Myca</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </span>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {syncing ? "Syncing..." : "Sync with Notion"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
