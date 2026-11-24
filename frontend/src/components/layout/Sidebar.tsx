import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Search,
  PlusCircle,
  BarChart3,
  Bot,
  User,
  ShieldCheck,
  Send,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { isCandidate, isRecruiter, isAdmin, isAuthenticated } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
      isActive
        ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
        : 'text-surface-400 hover:text-white hover:bg-surface-800/60'
    }`;

  return (
    <aside className="w-64 border-r border-surface-800 bg-surface-900/50 backdrop-blur-md flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1 space-y-6">
        {/* Public / Common Routes */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 px-3.5 block mb-2 font-mono">
            Platform Discovery
          </span>
          <nav className="space-y-1">
            <NavLink to="/jobs" className={navItemClass}>
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>Job Board & Openings</span>
            </NavLink>
          </nav>
        </div>

        {/* Candidate Workflow */}
        {isAuthenticated && (isCandidate || isAdmin) && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-3.5 block mb-2 font-mono">
              Candidate Workspace
            </span>
            <nav className="space-y-1">
              <NavLink to="/candidate/dashboard" className={navItemClass}>
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Candidate Hub</span>
              </NavLink>
              <NavLink to="/candidate/resumes" className={navItemClass}>
                <FileText className="w-4 h-4 shrink-0" />
                <span>Resume Intelligence</span>
              </NavLink>
              <NavLink to="/candidate/applications" className={navItemClass}>
                <Send className="w-4 h-4 shrink-0" />
                <span>My Applications</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* Recruiter Workflow */}
        {isAuthenticated && (isRecruiter || isAdmin) && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 px-3.5 block mb-2 font-mono">
              Recruiter Operations
            </span>
            <nav className="space-y-1">
              <NavLink to="/recruiter/dashboard" className={navItemClass}>
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Executive Analytics</span>
              </NavLink>
              <NavLink to="/recruiter/jobs" end className={navItemClass}>
                <Briefcase className="w-4 h-4 shrink-0" />
                <span>Job Requisitions</span>
              </NavLink>
              <NavLink to="/recruiter/jobs/new" className={navItemClass}>
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>New Requisition</span>
              </NavLink>
              <NavLink to="/recruiter/search" className={navItemClass}>
                <Search className="w-4 h-4 shrink-0" />
                <span>Vector Semantic Search</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* System & Architecture */}
        {isAuthenticated && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 px-3.5 block mb-2 font-mono">
              Account & Settings
            </span>
            <nav className="space-y-1">
              <NavLink to="/profile" className={navItemClass}>
                <User className="w-4 h-4 shrink-0" />
                <span>Profile & Identity</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Cluster Status Footer Widget */}
      <div className="p-4 border-t border-surface-800/80 bg-surface-950/40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-surface-200">K8s Mesh Online</span>
        </div>
        <p className="text-[11px] text-surface-400 font-mono mt-1">
          HPA Autoscaling: 5 Microservices
        </p>
      </div>
    </aside>
  );
};
