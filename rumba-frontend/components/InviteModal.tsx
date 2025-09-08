'use client';

import { useState } from 'react';
import { X, Copy, Users, Share2, AlertCircle, CheckCircle } from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameCode: string;
  onCopyCode: () => void;
  isCreatingGame?: boolean;
}

export default function InviteModal({
  isOpen,
  onClose,
  gameCode,
  onCopyCode,
  isCreatingGame = false,
}: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameCode);
      setCopied(true);
      onCopyCode();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const shareUrl = `${window.location.origin}?join=${gameCode}`;

  const handleShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isCreatingGame ? 'Creating Game...' : 'Invite Players'}
              </h2>
              <p className="text-sm text-gray-500">Share your game with friends</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {isCreatingGame ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            <span className="ml-3 text-gray-600">Setting up multiplayer game...</span>
          </div>
        ) : (
          <>
            {/* Game Code */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game Code
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-2xl text-center text-gray-900 tracking-wider">
                  {gameCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors"
                  title="Copy code"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Friends can use this code to join your game
              </p>
            </div>

            {/* Share URL */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share Link
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700 truncate">
                  {shareUrl}
                </div>
                <button
                  onClick={handleShareUrl}
                  className="p-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-colors"
                  title="Copy link"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Or share this direct link
              </p>
            </div>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-1">
                    How to play together:
                  </p>
                  <ol className="text-amber-700 space-y-1 list-decimal list-inside">
                    <li>Share the game code or link with friends</li>
                    <li>They click "Join Game" and enter the code</li>
                    <li>Play simultaneously and see each other's progress</li>
                    <li>First to complete wins!</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
              >
                Start Playing
              </button>
              <button
                onClick={handleCopyCode}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}