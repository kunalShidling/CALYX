import React from 'react';
import { useAuth } from '../context/AuthContext';
import { getStoredAccessToken, getStoredRefreshToken } from '../api/client';
import { User, Shield, Key, Calendar, Mail, CheckCircle2, Copy } from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success('Copied to Clipboard', `${label} copied.`);
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Identity & Profile</h1>
        <p className="text-xs text-surface-400 mt-1">
          Review your authenticated account claims, role permissions, and active JWT credentials
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-brand-400" />
              User Information
            </h3>
            <Badge variant="brand">{user.role.toUpperCase()}</Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-surface-950 p-4 rounded-xl border border-surface-800">
              <span className="text-[10px] text-surface-400 font-mono uppercase block">Full Legal Name</span>
              <span className="font-semibold text-white text-sm mt-1 block">{user.full_name}</span>
            </div>

            <div className="bg-surface-950 p-4 rounded-xl border border-surface-800">
              <span className="text-[10px] text-surface-400 font-mono uppercase block">Email Address</span>
              <span className="font-semibold text-white text-sm mt-1 block flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-surface-400" />
                {user.email}
              </span>
            </div>

            <div className="bg-surface-950 p-4 rounded-xl border border-surface-800">
              <span className="text-[10px] text-surface-400 font-mono uppercase block">User ID (Subject)</span>
              <span className="font-mono font-bold text-white text-sm mt-1 block">#{user.id}</span>
            </div>

            <div className="bg-surface-950 p-4 rounded-xl border border-surface-800">
              <span className="text-[10px] text-surface-400 font-mono uppercase block">Account Created</span>
              <span className="font-semibold text-white text-sm mt-1 block flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-surface-400" />
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Cryptographic Session Tokens */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            Active Cryptographic Session Tokens
          </h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-surface-300">JWT Bearer Access Token</span>
              {accessToken && (
                <button
                  onClick={() => copyToClipboard(accessToken, 'Access Token')}
                  className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              )}
            </div>
            <pre className="p-3 bg-surface-950 border border-surface-800 rounded-xl text-[11px] font-mono text-surface-300 break-all select-all max-h-24 overflow-y-auto">
              {accessToken || 'No active token'}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-surface-300">Long-Lived Refresh Token</span>
              {refreshToken && (
                <button
                  onClick={() => copyToClipboard(refreshToken, 'Refresh Token')}
                  className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              )}
            </div>
            <pre className="p-3 bg-surface-950 border border-surface-800 rounded-xl text-[11px] font-mono text-surface-300 break-all select-all max-h-24 overflow-y-auto">
              {refreshToken || 'No active refresh token'}
            </pre>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
