import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
      <div className="w-16 h-16 rounded-2xl bg-surface-900 border border-surface-800 flex items-center justify-center text-rose-400 mb-4 shadow-lg">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-white tracking-tight">404 — Page Not Found</h1>
      <p className="text-xs text-surface-400 max-w-sm mt-2 mb-6 leading-relaxed">
        The route you requested does not exist on the CALYX platform. Please verify your URL or navigate back to the workspace.
      </p>
      <Link to="/">
        <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
