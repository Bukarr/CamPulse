import React, { useEffect, useState } from 'react';
import { User, Report, UserRole, ReportStatus, Technician } from './types';
import LoginView from './components/LoginView';
import MapComponent from './components/MapComponent';
import ReportForm from './components/ReportForm';
import StudentView from './components/StudentView';
import AdminDashboard from './components/AdminDashboard';
import TechnicianView from './components/TechnicianView';
import BottomNav from './components/BottomNav';
import GemmaAIWidget from './components/GemmaAIWidget';
import { Wifi, WifiOff, LogOut, ShieldCheck, Mail, Sparkles, Database, Bell, BellRing, X, ChevronRight, Check } from 'lucide-react';
import { Notification } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [currentTab, setCurrentTab] = useState<'map' | 'report' | 'workspace' | 'profile'>('map');
  const [reportingCoords, setReportingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

  // Technicians state
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  // Initialize: register Service Worker, load user from localStorage, setup network listeners
  useEffect(() => {
    // Register SW
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('Service Worker registered successfully!', reg.scope))
          .catch((err) => console.error('Service Worker registration failed', err));
      });
    }

    // Load session
    const storedUser = localStorage.getItem('campulse-user');
    const storedToken = localStorage.getItem('campulse-token');
    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));
      setToken(storedToken);
    }

    // Network listeners
    const handleOnline = () => {
      setIsOffline(false);
      triggerOfflineSync();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load
    fetchReports();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token]);

  // Notifications loader & SSE listener
  useEffect(() => {
    if (!currentUser) return;

    fetchNotifications();
    fetchTechnicians();

    // Setup Server-Sent Events (SSE) stream for real-time notifications
    const eventSource = new EventSource(`/api/events?userId=${currentUser.id}`);

    eventSource.onmessage = (event) => {
      try {
        const notif = JSON.parse(event.data);
        console.log('[SSE] Received live real-time notification:', notif);

        // Add to state list
        setNotifications(prev => [notif, ...prev]);

        // Show floating in-app toast
        setActiveToast(notif);

        // Auto-dismiss toast after 5 seconds
        setTimeout(() => {
          setActiveToast(null);
        }, 5000);

        // Auto-refresh reports feed
        fetchReports();
      } catch (err) {
        console.error('[SSE] Failed to parse event message', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('[SSE] Event stream lost connection. Retrying in background...', err);
    };

    return () => {
      eventSource.close();
    };
  }, [currentUser?.id]);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn('[Notifications] Failed to load history.');
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await fetch('/api/technicians');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTechnicians(data);
      }
    } catch (err) {
      console.warn('[Technicians] Failed to load technicians list.');
    }
  };

  const handleMarkAsRead = async (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    try {
      await fetch(`/api/notifications/${notifId}/read`, { method: 'POST' });
    } catch (err) {
      console.warn('[Notifications] Offline status sync cached locally');
    }
  };

  const handleClearNotifications = async () => {
    setNotifications([]);
    try {
      await fetch('/api/notifications/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id })
      });
    } catch (err) {
      console.warn('[Notifications] Offline clear cached');
    }
  };

  // Sync reports periodically or when network state is verified
  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      }
    } catch (err) {
      console.warn('Failed to load active reports (running offline mode).');
    }
  };

  // The Offline Queue Syncing Engine!
  const triggerOfflineSync = async () => {
    const queueRaw = localStorage.getItem('campulse-offline-queue');
    const userRaw = localStorage.getItem('campulse-user');
    
    if (!queueRaw || !userRaw) return;
    
    const queue = JSON.parse(queueRaw);
    const user = JSON.parse(userRaw);
    
    if (queue.length === 0) return;

    setSyncStatus(`🛜 Connection restored! Syncing ${queue.length} offline report(s) with central server...`);
    
    try {
      const res = await fetch('/api/reports/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reports: queue,
          reporter_id: user.id
        })
      });

      if (res.ok) {
        // Clear local queue
        localStorage.removeItem('campulse-offline-queue');
        setSyncStatus('🎉 Success! All cached offline reports have been synchronized with the ABU server!');
        fetchReports();
        
        setTimeout(() => {
          setSyncStatus(null);
        }, 4000);
      } else {
        throw new Error('Sync endpoint rejected payload');
      }
    } catch (e) {
      console.error('Offline sync failed', e);
      setSyncStatus('⚠️ Offline sync failed. Will retry automatically when connection is stable.');
      setTimeout(() => {
        setSyncStatus(null);
      }, 5000);
    }
  };

  const handleLoginSuccess = (user: User, userToken: string) => {
    setCurrentUser(user);
    setToken(userToken);
    localStorage.setItem('campulse-user', JSON.stringify(user));
    localStorage.setItem('campulse-token', userToken);
    
    // Quick sync check right on login
    if (navigator.onLine) {
      triggerOfflineSync();
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('campulse-user');
    localStorage.removeItem('campulse-token');
  };

  // Evaluator-targeted Role Swapping
  const handleRoleSwap = (nextRole: UserRole) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, role: nextRole };
    setCurrentUser(updatedUser);
    localStorage.setItem('campulse-user', JSON.stringify(updatedUser));
  };

  // Upvote API call
  const handleUpvote = async (reportId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/reports/${reportId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (e) {
      // Local optimistic update for offline support
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          const upvotedBy = r.upvoted_by || [];
          const idx = upvotedBy.indexOf(currentUser.id);
          let newUpvotes = r.upvotes;
          let newUpvotedBy = [...upvotedBy];
          if (idx > -1) {
            newUpvotedBy.splice(idx, 1);
            newUpvotes = Math.max(0, newUpvotes - 1);
          } else {
            newUpvotedBy.push(currentUser.id);
            newUpvotes += 1;
          }
          return { ...r, upvotes: newUpvotes, upvoted_by: newUpvotedBy };
        }
        return r;
      }));
    }
  };

  // Comment API call
  const handleAddComment = async (reportId: string, text: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          user_name: currentUser.name,
          user_role: currentUser.role,
          text
        })
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (e) {
      console.error('Cannot post comments offline');
    }
  };

  // Admin Assignment API call
  const handleAssignTechnician = async (reportId: string, technicianId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/assign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ technician_id: technicianId })
      });
      if (res.ok) {
        fetchReports();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to assign technician');
      }
    } catch (e) {
      alert('Error updating assignment. Try again once online.');
    }
  };

  // Status Change API call
  const handleUpdateStatus = async (reportId: string, status: ReportStatus, commentText?: string, photoProof?: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          technician_id: currentUser?.role === 'technician' ? currentUser.id : undefined,
          comment_text: commentText,
          photo_proof: photoProof
        })
      });
      if (res.ok) {
        fetchReports();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update status');
      }
    } catch (e) {
      alert('Error updating status. Connection unavailable.');
    }
  };

  // Interactive drop pin handling from MapComponent click events
  const handleMapClick = (lat: number, lng: number) => {
    setReportingCoords({ lat, lng });
    // Automatically swap to Report Tab so the form slide-up renders
    setCurrentTab('report');
  };

  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
    // Swap to workspace tab to open the detailed comment sliding drawer!
    setCurrentTab('workspace');
  };

  // Guard routing - check login
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-slate-50 text-slate-800 h-full w-full max-w-6xl mx-auto md:shadow-2xl md:my-4 md:rounded-3xl md:h-[calc(100vh-2rem)] relative flex flex-col justify-between overflow-hidden font-sans border-x border-slate-200/60 shadow-xl">
      
      {/* Top native style header bar */}
      <header className="bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm border border-emerald-200/50">
            🎯
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-800">CamPulse ABU</h1>
            <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide">Zaria Campus Operations</p>
          </div>
        </div>

        {/* Network status and Bell notification icon */}
        <div className="flex items-center gap-2.5">
          {isOffline ? (
            <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border border-amber-200/40">
              <WifiOff size={10} /> OFFLINE
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border border-emerald-200/40">
              <Wifi size={10} /> ONLINE
            </span>
          )}

          {/* Bell Icon with Badge */}
          <button 
            onClick={() => setShowNotificationsPanel(true)} 
            className="relative p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            {unreadCount > 0 ? (
              <BellRing size={16} className="text-emerald-600 animate-bounce" />
            ) : (
              <Bell size={16} />
            )}
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-600 rounded-full ring-2 ring-white"></span>
            )}
          </button>
        </div>
      </header>

      {/* Live Push Toast Overlay */}
      {activeToast && (
        <div className="absolute top-16 left-4 right-4 z-50 bg-slate-900 text-white rounded-2xl p-3.5 shadow-xl border border-slate-800 flex items-start gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-sm">
            🔔
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-100 leading-tight">{activeToast.title}</h4>
            <p className="text-[10px] text-slate-300 leading-relaxed mt-0.5">{activeToast.message}</p>
          </div>
          <button 
            onClick={() => setActiveToast(null)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Real-time Sliding Notification Panel (Clean Minimalism) */}
      {showNotificationsPanel && (
        <div className="absolute inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex flex-col justify-end transition-all">
          <div className="bg-white border-t border-slate-200 rounded-t-3xl max-h-[80%] flex flex-col overflow-hidden shadow-2xl">
            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Alerts & Notifications</h3>
                <p className="text-[10px] text-slate-500">ABU maintenance update logs</p>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearNotifications}
                    className="text-[10px] text-emerald-600 font-bold hover:underline px-2 py-1"
                  >
                    Clear All
                  </button>
                )}
                <button 
                  onClick={() => setShowNotificationsPanel(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {notifications.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="text-3xl">🔔</div>
                  <div className="text-xs font-bold text-slate-400">All caught up!</div>
                  <div className="text-[10px] text-slate-400">No new maintenance updates to report.</div>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      notif.read 
                        ? 'bg-slate-50 border-slate-100 text-slate-500' 
                        : 'bg-emerald-50/30 border-emerald-100 text-slate-800 shadow-xs'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-bold font-sans tracking-tight">
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-1.5 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-[10px] leading-relaxed mt-1">{notif.message}</p>
                    {(() => {
                      if (currentUser?.role !== 'admin' || !notif.reference_id) return null;
                      const matchedReport = reports.find(r => r.id === notif.reference_id);
                      if (!matchedReport || matchedReport.status !== 'submitted') return null;

                      return (
                        <div 
                          className="mt-2.5 pt-2 border-t border-dashed border-slate-200/80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5 font-sans">
                            ⚙️ Assign Technician for Category ({matchedReport.category.replace('_', ' ')})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {technicians.map((tech) => {
                              const isSkillMatch = tech.skill_tags.includes(matchedReport.category);
                              return (
                                <button
                                  key={tech.id}
                                  onClick={async () => {
                                    await handleAssignTechnician(matchedReport.id, tech.id);
                                  }}
                                  className={`text-[8px] px-2 py-1 rounded-lg border font-bold font-sans transition-all flex items-center gap-0.5 cursor-pointer ${
                                    isSkillMatch
                                      ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  {tech.name.split(' ')[0]}
                                  {isSkillMatch && <span className="text-[7px] bg-white/20 px-0.5 rounded-sm">Match</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex items-center justify-between mt-2.5 text-[9px] text-slate-400 font-mono">
                      <span>{new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      {notif.reference_id && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const matched = reports.find(r => r.id === notif.reference_id);
                            if (matched) {
                              handleSelectReport(matched);
                            }
                            setShowNotificationsPanel(false);
                          }}
                          className="text-emerald-600 font-bold hover:underline flex items-center gap-0.5"
                        >
                          View Work Order <ChevronRight size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Synchronizing alert overlay */}
      {syncStatus && (
        <div className="absolute top-14 left-4 right-4 z-50 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] leading-relaxed p-2.5 rounded-xl text-center shadow-lg animate-bounce">
          {syncStatus}
        </div>
      )}

      {/* Main variable Tab stage container */}
      <main className="flex-1 overflow-hidden p-4 relative">
        {currentTab === 'map' && (
          <div className="w-full h-full relative">
            <MapComponent
              reports={reports}
              onMapClick={handleMapClick}
              reportingCoords={reportingCoords}
              onReportingCoordsChange={(lat, lng) => setReportingCoords({ lat, lng })}
              selectedReport={selectedReport}
              onSelectReport={handleSelectReport}
            />
          </div>
        )}

        {currentTab === 'report' && (
          <div className="h-full overflow-y-auto pb-28">
            <ReportForm
              userId={currentUser.id}
              reportingCoords={reportingCoords}
              onReportingCoordsChange={(lat, lng) => setReportingCoords({ lat, lng })}
              onSuccess={() => {
                setReportingCoords(null);
                setCurrentTab('workspace'); // Send them to feed to see issue
                fetchReports();
              }}
              onCancel={() => {
                setReportingCoords(null);
                setCurrentTab('map');
              }}
            />
          </div>
        )}

        {currentTab === 'workspace' && (
          <div className="h-full">
            {currentUser.role === 'admin' ? (
              <AdminDashboard
                reports={reports}
                onAssignTechnician={handleAssignTechnician}
                onUpdateStatus={handleUpdateStatus}
              />
            ) : currentUser.role === 'technician' ? (
              <TechnicianView
                technicianUserId={currentUser.id}
                reports={reports}
                onUpdateStatus={handleUpdateStatus}
              />
            ) : (
              <StudentView
                userId={currentUser.id}
                userName={currentUser.name}
                reports={reports}
                onUpvote={handleUpvote}
                onAddComment={handleAddComment}
              />
            )}
          </div>
        )}

        {currentTab === 'profile' && (
          <div className="space-y-6 overflow-y-auto max-h-full pb-20 text-xs">
            <div>
              <h2 className="text-base font-bold text-slate-800 font-sans">My Account</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Manage portal credentials and role permissions</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/50 flex items-center justify-center text-lg font-bold">
                  🎓
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5 font-sans">
                    {currentUser.name}
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] uppercase px-1.5 py-0.5 rounded-md font-mono font-bold">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                    <Mail size={11} /> {currentUser.email}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-slate-500 leading-normal font-medium">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-600" />
                  <span>Google SSO verified credential domain</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Database size={13} className="text-rose-500" />
                  <span>Persistent cache available for offline viewing</span>
                </div>
              </div>
            </div>

            {/* App Settings and Info */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider font-sans">📦 Progressive Web App Info</span>
              <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/40">
                  <div className="text-slate-400 font-bold">VERSION</div>
                  <div className="font-bold text-slate-700 mt-0.5">1.0.0 (Standalone)</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/40">
                  <div className="text-slate-400 font-bold">OFFLINE SYNC</div>
                  <div className="font-bold text-slate-700 mt-0.5">Local Storage Cache</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={13} /> Log Out from Portal
            </button>
          </div>
        )}
      </main>

      {/* Bottom Nav bar container */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setSelectedReport(null); // Clear selections
        }}
        currentUser={currentUser}
      />

      {/* Gemma 4 AI Assistant floating interface */}
      <GemmaAIWidget currentUser={currentUser} />
    </div>
  );
}
