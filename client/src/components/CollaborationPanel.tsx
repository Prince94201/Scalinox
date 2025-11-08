import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Users, Copy, Check, MessageSquare, UserPlus, Circle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

interface CollaborationPanelProps {
  onClose: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
}

interface Collaborator {
  id: string;
  name: string;
  color: string;
  status: 'active' | 'idle' | 'offline';
  initials: string;
}

const mockCollaborators: Collaborator[] = [
  { id: '1', name: 'You', color: '#3B82F6', status: 'active', initials: 'YO' },
];

export function CollaborationPanel({ onClose, onToggleChat, isChatOpen }: CollaborationPanelProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>(mockCollaborators);
  const [inviteEmail, setInviteEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareLink] = useState('https://drawcanvas.ai/room/abc123xyz');

  const handleCopyLink = async () => {
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback method for environments where clipboard API is blocked
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopied(true);
          toast.success('Link copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        } else {
          toast.error('Failed to copy link');
        }
      } catch (fallbackErr) {
        // If all else fails, show the link to copy manually
        toast.error('Please copy the link manually');
      }
    }
  };

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    toast.success(`Invitation sent to ${inviteEmail}!`);
    setInviteEmail('');
    
    // Add mock collaborator after a delay
    setTimeout(() => {
      const newCollaborator: Collaborator = {
        id: Date.now().toString(),
        name: inviteEmail.split('@')[0],
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        status: 'active',
        initials: inviteEmail.substring(0, 2).toUpperCase(),
      };
      setCollaborators([...collaborators, newCollaborator]);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="absolute right-0 top-0 bottom-0 w-[380px] bg-white border-l border-gray-200 shadow-2xl flex flex-col z-20"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <span className="text-gray-900">Collaboration</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-gray-100 transition-all hover:-translate-y-0.5"
        >
          <X className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Share Link */}
        <div>
          <label className="text-sm text-gray-700 mb-2 block">
            Share Room Link
          </label>
          <div className="flex gap-2">
            <Input
              value={shareLink}
              readOnly
              className="flex-1 rounded-xl text-sm"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="rounded-xl px-4"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Invite by Email */}
        <div>
          <label className="text-sm text-gray-700 mb-2 block">
            Invite by Email
          </label>
          <div className="flex gap-2">
            <Input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 rounded-xl"
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            />
            <Button
              onClick={handleInvite}
              className="rounded-xl px-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Active Collaborators */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-gray-700">
              Active Users ({collaborators.length})
            </label>
          </div>
          <div className="space-y-2">
            {collaborators.map((collaborator) => (
              <motion.div
                key={collaborator.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="relative">
                  <Avatar
                    className="w-10 h-10"
                    style={{ backgroundColor: collaborator.color }}
                  >
                    <AvatarFallback className="text-white text-sm">
                      {collaborator.initials}
                    </AvatarFallback>
                  </Avatar>
                  <Circle
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(collaborator.status)} rounded-full border-2 border-white`}
                    fill="currentColor"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{collaborator.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{collaborator.status}</p>
                </div>
                {collaborator.name === 'You' && (
                  <Badge variant="secondary" className="text-xs">You</Badge>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Chat Toggle */}
        <div>
          <Button
            onClick={onToggleChat}
            variant={isChatOpen ? 'default' : 'outline'}
            className="w-full rounded-xl"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {isChatOpen ? 'Hide Chat' : 'Open Chat'}
          </Button>
        </div>

        {/* Collaboration Tips */}
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-1">
                  Real-time Drawing
                </p>
                <p className="text-xs text-gray-600">
                  See changes from all collaborators instantly
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-1">
                  Team Chat
                </p>
                <p className="text-xs text-gray-600">
                  Communicate with your team in real-time
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-1">
                  Invite Friends
                </p>
                <p className="text-xs text-gray-600">
                  Share the link or send email invitations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
