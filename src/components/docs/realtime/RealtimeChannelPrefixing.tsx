'use client';

import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Shield, Zap } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function RealtimeChannelPrefixing() {
  return (
    <motion.div variants={itemVariants} className="mb-16">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">Channel Prefixing & Isolation</h2>

      <div className="prose prose-invert max-w-none mb-8">
        <p className="text-slate-300 text-lg leading-relaxed mb-4">
          Channel prefixing provides project-level isolation for realtime subscriptions. Each project has a unique
          <code className="text-emerald-400"> project_id:</code> prefix that must be included in all channel names,
          ensuring that clients can only subscribe to their own project's data.
        </p>
      </div>

      {/* Channel Format with Project ID */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          Full Channel Format
        </h3>
        <pre className="bg-slate-900 rounded-lg p-4 mb-4">
          <code className="text-sm text-slate-300">project_id:table_name</code>
        </pre>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-2">project_id (prefix)</p>
            <p className="text-sm text-slate-300">
              Your unique project identifier. This is automatically extracted from your JWT token and used to
              isolate your realtime subscriptions from other projects.
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-2">table_name (suffix)</p>
            <p className="text-sm text-slate-300">
              The database table you want to subscribe to. Can include schema prefix for custom schemas
              (e.g., <code className="text-emerald-400">public.users</code>).
            </p>
          </div>
        </div>
      </div>

      {/* Valid vs Invalid Channel Names */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Valid vs Invalid Channel Names
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Assuming your <code className="text-emerald-400">project_id</code> is <code className="text-emerald-400">abc123xyz</code>:
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-emerald-300 mb-3">✓ Valid Channel Names</p>
            <div className="space-y-2">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <code className="text-xs text-emerald-200">abc123xyz:users</code>
                <p className="text-xs text-emerald-300/70 mt-1">Basic table subscription</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <code className="text-xs text-emerald-200">abc123xyz:public.products</code>
                <p className="text-xs text-emerald-300/70 mt-1">Table with schema prefix</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <code className="text-xs text-emerald-200">abc123xyz:user_notifications</code>
                <p className="text-xs text-emerald-300/70 mt-1">Table with underscore</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-300 mb-3">✗ Invalid Channel Names</p>
            <div className="space-y-2">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <code className="text-xs text-red-200">users</code>
                <p className="text-xs text-red-300/70 mt-1">Missing project_id prefix</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <code className="text-xs text-red-200">def456uvw:orders</code>
                <p className="text-xs text-red-300/70 mt-1">Different project_id (403 error)</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <code className="text-xs text-red-200">abc123xyz:</code>
                <p className="text-xs text-red-300/70 mt-1">Missing table_name suffix</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Project Access */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Cross-Project Access Protection
        </h3>
        <p className="text-amber-200/80 text-sm mb-4">
          Attempting to subscribe to a different project's channels will result in a <strong className="text-amber-300">403 Forbidden</strong> error.
          The project_id is automatically extracted from your JWT token's claims, ensuring strict isolation.
        </p>
        <pre className="bg-slate-900/50 rounded-lg p-4">
          <code className="text-sm text-amber-200/80">{`// JWT token contains project_id: "abc123xyz"
// Attempting to subscribe to different project's channel

{
  event: 'phx_join',
  topic: 'def456uvw:users',  // Different project_id
  payload: { token: 'YOUR_JWT_TOKEN' },
  ref: '1'
}

// Server Response:
{
  event: 'phx_reply',
  ref: '1',
  payload: {
    status: 'error',
    reason: 'Forbidden: Project ID mismatch'
  }
}`}</code>
        </pre>
      </div>

      {/* Auto-Prefix Note */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Automatic Project ID Resolution
        </h3>
        <p className="text-blue-200/80 text-sm">
          In most client libraries, you can omit the <code className="text-blue-300">project_id:</code> prefix from channel names.
          The client SDK automatically extracts the project_id from your JWT token and prepends it to all channel names.
          However, when using raw WebSocket connections, you must include the full <code className="text-blue-300">project_id:table_name</code> format.
        </p>
      </div>
    </motion.div>
  );
}
