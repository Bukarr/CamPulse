import React, { useState, useEffect } from 'react';
import { Shield, Wrench, Clock, AlertTriangle, CheckSquare, Search, Filter, ArrowUpDown, ChevronRight, BarChart3, Users } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Report, AbuZone, ReportCategory, ReportStatus, Technician } from '../types';
import { abuZones } from '../data/abuZones';

interface AdminDashboardProps {
  reports: Report[];
  onAssignTechnician: (reportId: string, technicianId: string) => Promise<void>;
  onUpdateStatus: (reportId: string, status: ReportStatus) => Promise<void>;
  technicians?: Technician[];
  onRegisterTechnician?: (newTech: Technician) => void;
}

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  broken_lights: 'Broken Lights',
  plumbing: 'Plumbing / Leaks',
  wifi_outage: 'WiFi Outage',
  security: 'Security Concern',
  structural: 'Structural Damage',
  others: 'Other'
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved'
};

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
  2: 'bg-green-50 text-green-600 border-green-200/60',
  3: 'bg-amber-50 text-amber-600 border-amber-200/60',
  4: 'bg-orange-50 text-orange-600 border-orange-200/60',
  5: 'bg-rose-50 text-rose-600 border-rose-200/60 shadow-xs animate-pulse'
};

export default function AdminDashboard({ 
  reports, 
  onAssignTechnician, 
  onUpdateStatus,
  technicians: propTechnicians = [],
  onRegisterTechnician
}: AdminDashboardProps) {
  const [technicians, setTechnicians] = useState<Technician[]>(propTechnicians);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ReportCategory | 'all'>('all');
  const [zoneFilter, setZoneFilter] = useState<string | 'all'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<number | 'all'>('all');
  const [sortField, setSortField] = useState<'created_at' | 'upvotes' | 'priority_score' | 'gemma_rank_score'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState<any>({ total: 0, resolved: 0, open: 0, avgResolutionTimeHours: 24 });
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // Sync technicians prop with local state instantly
  useEffect(() => {
    if (propTechnicians && propTechnicians.length > 0) {
      setTechnicians(propTechnicians);
    }
  }, [propTechnicians]);

  // Synchronous, instantly calculated counts from reports prop in client memory
  const activeTicketsCount = reports.filter(r => r.status !== 'resolved').length;
  const resolvedTicketsCount = reports.filter(r => r.status === 'resolved').length;

  // AI triage summary states
  const [triageSummary, setTriageSummary] = useState<string>('');
  const [isGeneratingTriage, setIsGeneratingTriage] = useState(false);

  // Technician creation states
  const [newTechName, setNewTechName] = useState('');
  const [newTechEmail, setNewTechEmail] = useState('');
  const [newTechSkills, setNewTechSkills] = useState<string[]>([]);
  const [isRegisteringTech, setIsRegisteringTech] = useState(false);
  const [techRegSuccess, setTechRegSuccess] = useState<string | null>(null);
  const [techRegError, setTechRegError] = useState<string | null>(null);

  const handleRegisterTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName.trim() || !newTechEmail.trim()) {
      setTechRegError('Please provide both name and email.');
      return;
    }
    if (newTechSkills.length === 0) {
      setTechRegError('Please assign at least one category specialty tag.');
      return;
    }

    setIsRegisteringTech(true);
    setTechRegSuccess(null);
    setTechRegError(null);

    try {
      const res = await fetch('/api/admin/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTechName.trim(),
          email: newTechEmail.trim(),
          skill_tags: newTechSkills
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register technician');
      }

      setTechRegSuccess(`Successfully registered ${newTechName} as an authorized campus technician.`);
      if (onRegisterTechnician && data.technician) {
        onRegisterTechnician(data.technician);
      } else {
        // Fallback local update if parent callback isn't registered
        setTechnicians(prev => [...prev, data.technician]);
      }
      setNewTechName('');
      setNewTechEmail('');
      setNewTechSkills([]);
      fetchTechniciansAndStats();
    } catch (err: any) {
      setTechRegError(err.message || 'Failed to register technician.');
    } finally {
      setIsRegisteringTech(false);
    }
  };

  const toggleSkillSelection = (category: string) => {
    if (newTechSkills.includes(category)) {
      setNewTechSkills(newTechSkills.filter(s => s !== category));
    } else {
      setNewTechSkills([...newTechSkills, category]);
    }
  };

  const fetchTriageSummary = async () => {
    setIsGeneratingTriage(true);
    try {
      const res = await fetch('/api/reports/triage-summary');
      const data = await res.json();
      setTriageSummary(data.summary || 'No active unresolved tickets available.');
    } catch (err) {
      console.error(err);
      setTriageSummary('Failed to fetch triage summary. Please try again.');
    } finally {
      setIsGeneratingTriage(false);
    }
  };

  // Simple parser to strip all markdown (asterisks, hashtags) and render clean plain-text
  const formatMarkdown = (text: string) => {
    if (!text) return null;
    const cleanedText = text.replace(/[*#]/g, '');
    return cleanedText.split('\n').map((line, idx) => {
      return line.trim() === '' ? (
        <div key={idx} className="h-2" />
      ) : (
        <p key={idx} className="text-xs leading-relaxed text-slate-700 mt-1 font-sans">
          {line}
        </p>
      );
    });
  };

  // Load Technicians & Stats on mount
  useEffect(() => {
    fetchTechniciansAndStats();
  }, [reports]);

  const fetchTechniciansAndStats = async () => {
    try {
      const techRes = await fetch('/api/technicians');
      const techData = await techRes.json();
      setTechnicians(techData);

      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load admin supplementary data', err);
    }
  };

  const handleSort = (field: 'created_at' | 'upvotes' | 'priority_score' | 'gemma_rank_score') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleAssignment = async (techId: string) => {
    if (!selectedReport) return;
    setAssigningId(techId);
    try {
      await onAssignTechnician(selectedReport.id, techId);
      setSelectedReport(null);
      fetchTechniciansAndStats();
    } catch (err) {
      console.error(err);
    } finally {
      setAssigningId(null);
    }
  };

  // Filter and sort reports
  const filteredReports = reports
    .filter((r) => {
      const matchesSearch = r.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (r.reporter_name && r.reporter_name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
      const matchesZone = zoneFilter === 'all' || r.zone_id === zoneFilter;
      const matchesUrgency = urgencyFilter === 'all' || r.priority_score === urgencyFilter;
      return matchesSearch && matchesStatus && matchesCategory && matchesZone && matchesUrgency;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === 'upvotes') {
        comparison = a.upvotes - b.upvotes;
      } else if (sortField === 'priority_score') {
        comparison = a.priority_score - b.priority_score;
      } else if (sortField === 'gemma_rank_score') {
        comparison = (a.gemma_rank_score || 0) - (b.gemma_rank_score || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Prepare dynamic category frequency data from reports prop
  const categoryCounts = reports.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    name: label,
    count: categoryCounts[key] || 0,
    categoryKey: key
  }));

  // Prepare technician average resolution times
  const technicianChartData = stats.technicianStats && stats.technicianStats.length > 0
    ? stats.technicianStats.map((t: any) => ({
        name: t.name,
        hours: t.avgResolutionTimeHours,
        resolvedCount: t.resolvedCount
      }))
    : [
        { name: 'Musa Garba', hours: 4.5, resolvedCount: 12 },
        { name: 'John Okoye', hours: 3.2, resolvedCount: 15 }
      ];

  const CATEGORY_CHART_COLORS: Record<string, string> = {
    broken_lights: '#3b82f6',  // blue
    plumbing: '#10b981',       // emerald/teal
    wifi_outage: '#f59e0b',    // amber
    security: '#ef4444',       // red
    structural: '#8b5cf6',     // violet
    others: '#64748b'          // slate
  };

  return (
    <div id="admin-dashboard-view" className="space-y-5 overflow-y-auto max-h-full pb-24 pr-1">
      {/* Admin header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 font-sans">
            <Shield className="text-emerald-600" size={18} /> Admin Control Center
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">ABU Zaria maintenance & technician duty scheduler</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg text-[9px] font-bold text-emerald-600 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Campus Portal Live
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-xs">
          <div className="text-slate-400 text-[9px] uppercase font-bold flex items-center gap-1 tracking-wider">
            <AlertTriangle size={11} className="text-amber-500" /> Active Tickets
          </div>
          <div className="text-xl font-bold mt-1 text-slate-800">{activeTicketsCount}</div>
          <div className="text-[9px] text-slate-400 mt-0.5">Awaiting assignment</div>
        </div>
        
        <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-xs">
          <div className="text-slate-400 text-[9px] uppercase font-bold flex items-center gap-1 tracking-wider">
            <CheckSquare size={11} className="text-emerald-500" /> Resolved Tickets
          </div>
          <div className="text-xl font-bold mt-1 text-slate-800">{resolvedTicketsCount}</div>
          <div className="text-[9px] text-slate-400 mt-0.5">Completed recently</div>
        </div>

        <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-xs">
          <div className="text-slate-400 text-[9px] uppercase font-bold flex items-center gap-1 tracking-wider">
            <Clock size={11} className="text-indigo-500" /> Resolution Speed
          </div>
          <div className="text-xl font-bold mt-1 text-slate-800">{stats.avgResolutionTimeHours} hr</div>
          <div className="text-[9px] text-slate-400 mt-0.5 font-sans">Average cycle time</div>
        </div>

        <div className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-xs">
          <div className="text-slate-400 text-[9px] uppercase font-bold flex items-center gap-1 tracking-wider">
            <Wrench size={11} className="text-emerald-600" /> Staff Technicians
          </div>
          <div className="text-xl font-bold mt-1 text-slate-800">{technicians.length}</div>
          <div className="text-[9px] text-slate-400 mt-0.5 font-sans">Active engineering corps</div>
        </div>
      </div>

      {/* Gemma AI Triage Digest Card */}
      <div className="bg-gradient-to-br from-emerald-50/40 to-slate-50/50 border border-emerald-100/70 p-4 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-emerald-100/40 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <Shield className="animate-pulse" size={13} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Gemma 4 Triage Summary</h3>
              <p className="text-[9px] text-slate-400">AI-prioritized operational digest and staffing dispatch recommendations</p>
            </div>
          </div>
          <button
            onClick={fetchTriageSummary}
            disabled={isGeneratingTriage}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <span>{isGeneratingTriage ? 'Generating Digest...' : '⚡ Generate Triage Digest'}</span>
          </button>
        </div>

        {triageSummary ? (
          <div className="bg-white/80 border border-slate-100/80 p-3.5 rounded-xl text-slate-700 max-h-60 overflow-y-auto font-sans">
            {formatMarkdown(triageSummary)}
          </div>
        ) : (
          <div className="text-center py-5">
            <p className="text-xs text-slate-400">Click generate to compile a live triage digest of all unresolved tickets</p>
          </div>
        )}
      </div>

      {/* Analytics Cockpit Charts */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <BarChart3 className="text-emerald-600" size={13} /> Operations Telemetry & Analytics
          </h3>
          <span className="text-[9px] text-slate-400 font-sans">Live system health diagnostics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Chart 1: Issue Categories Frequency */}
          <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl flex flex-col">
            <div className="mb-2">
              <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Issue Category Distribution</h4>
              <p className="text-[9px] text-slate-400">Frequency count of reports across campus systems</p>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 8, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 8, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '8px',
                      fontSize: '10px',
                      color: '#f8fafc' 
                    }} 
                    labelStyle={{ fontWeight: 'bold', color: '#f1f5f9' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CATEGORY_CHART_COLORS[entry.categoryKey] || '#10b981'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Technician Average Resolution Times */}
          <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl flex flex-col">
            <div className="mb-2">
              <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Technician Resolution Speed</h4>
              <p className="text-[9px] text-slate-400">Average duration in hours taken to mark tasks resolved</p>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={technicianChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 8, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 8, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '8px',
                      fontSize: '10px',
                      color: '#f8fafc' 
                    }} 
                    labelStyle={{ fontWeight: 'bold', color: '#f1f5f9' }}
                    formatter={(value: any) => [`${value} hrs avg`, 'Resolution Time']}
                  />
                  <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {technicianChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index % 2 === 0 ? '#6366f1' : '#8b5cf6'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Technician Profile Registration Utility */}
      <div id="tech-registration-panel" className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
          <Wrench className="text-emerald-600" size={16} />
          <div>
            <h3 className="text-xs font-bold text-slate-800">Dedicated Technician Profile Creation</h3>
            <p className="text-[9px] text-slate-400">Register new specialized engineering staff profiles for automatic report category routing</p>
          </div>
        </div>

        {techRegSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold">
            🎉 {techRegSuccess}
          </div>
        )}

        {techRegError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
            ⚠️ {techRegError}
          </div>
        )}

        <form onSubmit={handleRegisterTechnician} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Technician Full Name</label>
              <input
                type="text"
                required
                placeholder="E.g., Aliyu Ibrahim"
                value={newTechName}
                onChange={(e) => setNewTechName(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">ABU Email Address</label>
              <input
                type="email"
                required
                placeholder="E.g., aliyu@abu.edu.ng"
                value={newTechEmail}
                onChange={(e) => setNewTechEmail(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-1.5">Specialized Maintenance Categories</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_LABELS).map(([catVal, label]) => {
                const isSelected = newTechSkills.includes(catVal);
                return (
                  <button
                    type="button"
                    key={catVal}
                    onClick={() => toggleSkillSelection(catVal)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isRegisteringTech}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center font-sans"
          >
            {isRegisteringTech ? 'Registering Technician...' : 'Register Technician Profile'}
          </button>
        </form>
      </div>

      {/* Filter and search controls */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-xl space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search reports by keywords or reporter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-xl pl-9 pr-3 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Status filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-slate-700 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Zone filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Zone</label>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-slate-700 focus:outline-none"
            >
              <option value="all">All Zones</option>
              {abuZones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>

          {/* Urgency filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Urgency</label>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-slate-700 focus:outline-none"
            >
              <option value="all">All Urgency</option>
              <option value="5">P5 - Critical</option>
              <option value="4">P4 - High</option>
              <option value="3">P3 - Medium</option>
              <option value="2">P2 - Low</option>
              <option value="1">P1 - Minimal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table grid of reports */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            📋 Operations Feed ({filteredReports.length} tickets)
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>Sort:</span>
            <button
              onClick={() => handleSort('created_at')}
              className={`px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer ${sortField === 'created_at' ? 'text-emerald-600 font-bold border-emerald-200 bg-emerald-50/40' : ''}`}
            >
              Date
            </button>
            <button
              onClick={() => handleSort('upvotes')}
              className={`px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer ${sortField === 'upvotes' ? 'text-emerald-600 font-bold border-emerald-200 bg-emerald-50/40' : ''}`}
            >
              Upvotes
            </button>
            <button
              onClick={() => handleSort('priority_score')}
              className={`px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer ${sortField === 'priority_score' ? 'text-emerald-600 font-bold border-emerald-200 bg-emerald-50/40' : ''}`}
            >
              Priority
            </button>
            <button
              onClick={() => handleSort('gemma_rank_score')}
              className={`px-1.5 py-0.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-0.5 ${sortField === 'gemma_rank_score' ? 'text-emerald-600 font-bold border-emerald-200 bg-emerald-50/40' : ''}`}
            >
              <span>✨ Gemma AI Rank</span>
            </button>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-sans">
            No report tickets match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`p-4 hover:bg-slate-50/40 cursor-pointer transition-colors flex items-start gap-3 relative ${
                  selectedReport?.id === report.id ? 'bg-slate-50/60 border-l-3 border-emerald-600' : ''
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${PRIORITY_COLORS[report.priority_score]}`}>
                      P{report.priority_score}
                    </span>
                    <span className="text-xs font-bold capitalize text-slate-800">
                      {report.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate font-semibold">
                      • {report.zone_name}
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed flex items-center gap-1">
                    {report.voice_url && <span className="text-emerald-600 shrink-0" title="Voice report with translation">🎙️</span>}
                    <span>{report.description}</span>
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <div>
                      By <span className="font-semibold text-slate-600">{report.reporter_name}</span> • {new Date(report.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-slate-500">🔺 {report.upvotes} upvotes</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        report.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        report.status === 'in_progress' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        report.status === 'assigned' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {STATUS_LABELS[report.status]}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 mt-1 self-center shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-out/Sheet-style modal for ticket details & technician assignment */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-end justify-center p-0 md:p-6">
          <div className="bg-white border border-slate-200 w-full md:max-w-xl rounded-t-3xl md:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Ticket Details & Assignment</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ORDER #{selectedReport.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Photo & Description summary */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${PRIORITY_COLORS[selectedReport.priority_score]}`}>
                  P{selectedReport.priority_score} Priority
                </span>
                <span className="text-xs font-bold text-slate-700 capitalize">
                  {selectedReport.category.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  ({selectedReport.zone_name})
                </span>
              </div>
              
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                "{selectedReport.description}"
              </p>

              {selectedReport.voice_url && (
                <div id={`voice-container-${selectedReport.id}`} className="bg-emerald-50/25 border border-emerald-100/60 p-3.5 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    🎙️ Voice Recording Report
                  </div>
                  <audio id={`voice-player-${selectedReport.id}`} controls src={selectedReport.voice_url} className="w-full h-8" />
                  {selectedReport.voice_interpretation && (
                    <div className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-100/80 leading-relaxed font-sans">
                      <span className="font-bold text-emerald-800 block mb-1">✨ Gemma 4 English Interpretation</span>
                      "{selectedReport.voice_interpretation}"
                    </div>
                  )}
                </div>
              )}

              {selectedReport.photo_url && (
                <div className="rounded-xl overflow-hidden border border-slate-100 max-h-40">
                  <img src={selectedReport.photo_url} alt="Proof" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Assignment action selection */}
            {selectedReport.status === 'submitted' ? (
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Users size={12} className="text-emerald-600" /> Smart Suggested Technicians
                </div>
                <div className="grid gap-2.5 max-h-52 overflow-y-auto pr-1">
                  {[...technicians]
                    .sort((a, b) => {
                      const matchA = a.skill_tags.includes(selectedReport.category) ? 1 : 0;
                      const matchB = b.skill_tags.includes(selectedReport.category) ? 1 : 0;
                      if (matchA !== matchB) return matchB - matchA; // Recommended first
                      return a.current_load - b.current_load; // Least loaded next
                    })
                    .map((tech) => {
                      const matchesSkills = tech.skill_tags.includes(selectedReport.category);
                      return (
                        <div
                          key={tech.id}
                          className={`border p-3 rounded-xl flex items-center justify-between transition-all ${
                            matchesSkills 
                              ? 'bg-emerald-50/15 border-emerald-100' 
                              : 'bg-white border-slate-100'
                          }`}
                        >
                          <div className="space-y-1 max-w-[70%]">
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                              {tech.name}
                              {matchesSkills && (
                                <span className="bg-emerald-100 text-emerald-700 border border-emerald-200/50 text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.2 rounded-full font-sans">
                                  ⚡ Best Match
                                </span>
                              )}
                            </div>
                            
                            {/* Skills Tag List */}
                            <div className="flex flex-wrap gap-1">
                              {tech.skill_tags.map((skill) => {
                                const isSkillMatch = skill === selectedReport.category;
                                return (
                                  <span 
                                    key={skill}
                                    className={`text-[8px] px-1.5 py-0.2 rounded font-semibold capitalize ${
                                      isSkillMatch 
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/50' 
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                                  >
                                    {skill.replace('_', ' ')}
                                  </span>
                                );
                              })}
                            </div>

                            <div className="text-[9px] text-slate-400 font-medium">
                              Active Queue Load: <span className="font-bold text-slate-500">{tech.current_load} jobs pending</span>
                            </div>
                          </div>
                          
                          <button
                            disabled={assigningId !== null}
                            onClick={() => handleAssignment(tech.id)}
                            className={`font-bold text-[10px] px-3 py-2 rounded-xl transition-all cursor-pointer ${
                              matchesSkills 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                          >
                            {assigningId === tech.id ? 'Assigning...' : 'Assign Task'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3">
                <div className="text-[10px] text-slate-400 leading-relaxed font-semibold uppercase tracking-wider">
                  🔧 Operations Status Control
                </div>
                <div className="text-xs text-slate-500 leading-relaxed">
                  Technician status is currently tracked under <span className="font-bold text-slate-600">Assigned Tasks</span>. Change the ticket state if manual override is required:
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateStatus(selectedReport.id, 'in_progress')}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 text-xs py-2 px-3 rounded-xl flex-1 font-bold transition-all cursor-pointer"
                  >
                    Set In-Progress
                  </button>
                  <button
                    onClick={() => onUpdateStatus(selectedReport.id, 'resolved')}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 text-xs py-2 px-3 rounded-xl flex-1 font-bold transition-all cursor-pointer"
                  >
                    Set Resolved
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
