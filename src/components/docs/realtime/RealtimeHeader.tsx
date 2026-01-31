'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Radio } from 'lucide-react';
import Link from 'next/link';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function RealtimeHeader() {
  return (
    <motion.div variants={itemVariants}>
      <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documentation
          </Link>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Radio className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-100 mb-2">Realtime</h1>
              <p className="text-lg text-slate-400">
                Database-driven realtime subscriptions using Postgres CDC (Change Data Capture)
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
