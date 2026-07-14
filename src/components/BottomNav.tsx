import React from 'react';
import { Map, PlusCircle, ListTodo, UserCircle } from 'lucide-react';
import { UserRole, User } from '../types';

interface BottomNavProps {
  currentTab: 'map' | 'report' | 'workspace' | 'profile';
  onTabChange: (tab: 'map' | 'report' | 'workspace' | 'profile') => void;
  currentUser: User | null;
}

export default function BottomNav({ currentTab, onTabChange, currentUser }: BottomNavProps) {
  
  // Tab roles label mapping
  const getWorkspaceLabel = () => {
    if (!currentUser) return 'Feed';
    if (currentUser.role === 'admin') return 'Admin Dashboard';
    if (currentUser.role === 'technician') return 'My Duties';
    return 'Issues Feed';
  };

  const isStudent = currentUser?.role === 'student';

  return (
    <div id="bottom-navigation-bar" className="absolute bottom-4 left-4 right-4 z-40 bg-white/85 backdrop-blur-md border border-slate-200/80 px-4 py-1.5 rounded-2xl shadow-lg flex flex-col gap-1.5 transition-all">
      <div className="flex items-center justify-around h-12">
        
        {/* Map View Tab */}
        <button
          onClick={() => onTabChange('map')}
          className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-all cursor-pointer ${
            currentTab === 'map' ? 'text-emerald-600 scale-105 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Map size={18} className={currentTab === 'map' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
          <span className="text-[9px] tracking-tight">Campus Map</span>
        </button>

        {/* Create Report Tab */}
        <button
          onClick={() => onTabChange('report')}
          className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-all cursor-pointer ${
            currentTab === 'report' ? 'text-emerald-600 scale-105 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <PlusCircle size={18} className={currentTab === 'report' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
          <span className="text-[9px] tracking-tight">Report</span>
        </button>

        {/* Dynamic Workspace Feed Tab */}
        <button
          onClick={() => onTabChange('workspace')}
          className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-all cursor-pointer ${
            currentTab === 'workspace' ? 'text-emerald-600 scale-105 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ListTodo size={18} className={currentTab === 'workspace' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
          <span className="text-[9px] tracking-tight truncate max-w-[80px]">
            {getWorkspaceLabel()}
          </span>
        </button>

        {/* Profile / Roles Tab */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-all cursor-pointer ${
            currentTab === 'profile' ? 'text-emerald-600 scale-105 font-semibold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserCircle size={18} className={currentTab === 'profile' ? 'stroke-[2.5px]' : 'stroke-[1.8px]'} />
          <span className="text-[9px] tracking-tight font-sans">Account</span>
        </button>

      </div>
    </div>
  );
}
