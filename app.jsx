/* FOR HOUSE — Main App shell (with Supabase auth + DB)
   ============================================================ */
const { useState: _useState, useEffect: _useEffect, useMemo: _useMemo, useCallback: _useCallback, useRef: _useRef } = React;
var useState = _useState, useEffect = _useEffect, useMemo = _useMemo, useCallback = _useCallback, useRef = _useRef;

/* ═══════════════════════════════════════════════════════
   LOADING OVERLAY
══════════════════════════════════════════════════════════ */
function LoadingOverlay({ text }) {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg-0)', flexDirection:'column', gap:'16px'
    }}>
      <div style={{
        width:'36px', height:'36px', border:'3px solid var(--border)',
        borderTopColor:'var(--brand-bright)', borderRadius:'50%',
        animation:'spin .7s linear infinite'
      }}/>
      <div style={{fontSize:'14px', color:'var(--text-3)'}}>{text || 'กำลังโหลด...'}</div>
      <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LOGIN SCREEN  (แสดงเฉพาะเมื่อ Supabase พร้อม)
══════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [info, setInfo]         = useState('');

  function submit(e) {
    e.preventDefault();
    setError(''); setInfo('');
    if (!email || !password) { setError('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
    setLoading(true);
    if (mode === 'login') {
      window.db.auth.signIn(email, password)
        .catch(function(err) { setError(err.message || 'เกิดข้อผิดพลาด'); setLoading(false); });
    } else {
      if (!name.trim()) { setError('กรุณากรอกชื่อ'); setLoading(false); return; }
      window.db.auth.signUp(email, password, name.trim())
        .then(function() {
          setInfo('ส่งอีเมลยืนยันแล้ว — กรุณาตรวจสอบกล่องเมลแล้วกลับมาเข้าสู่ระบบ');
          setMode('login'); setLoading(false);
        })
        .catch(function(err) { setError(err.message || 'เกิดข้อผิดพลาด'); setLoading(false); });
    }
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg-0)', padding:'24px'
    }}>
      <div style={{width:'100%', maxWidth:'400px'}}>
        <div style={{textAlign:'center', marginBottom:'32px'}}>
          <img src="assets/forhouse-logo.jpg" alt="FOR HOUSE"
            style={{width:'72px', height:'72px', borderRadius:'16px', objectFit:'cover', marginBottom:'16px'}}/>
          <div style={{fontSize:'22px', fontWeight:700, letterSpacing:'0.05em', color:'var(--text-1)'}}>FOR HOUSE</div>
          <div style={{fontSize:'13px', color:'var(--text-3)', marginTop:'4px'}}>ระบบควบคุมต้นทุนงานรับเหมาก่อสร้าง</div>
        </div>

        <div style={{background:'var(--bg-1)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'28px', boxShadow:'var(--shadow-lg)'}}>
          <div style={{display:'flex', gap:'4px', marginBottom:'24px', background:'var(--bg-0)', borderRadius:'var(--r-sm)', padding:'4px'}}>
            {[['login','เข้าสู่ระบบ'],['register','สมัครสมาชิก']].map(function(item) {
              var m = item[0], label = item[1];
              return (
                <button key={m} onClick={function() { setMode(m); setError(''); setInfo(''); }}
                  style={{
                    flex:1, padding:'8px', borderRadius:'var(--r-sm)',
                    background: mode === m ? 'var(--bg-2)' : 'transparent',
                    color: mode === m ? 'var(--text-1)' : 'var(--text-3)',
                    fontWeight: mode === m ? 600 : 400, fontSize:'13px',
                    border:'none', cursor:'pointer'
                  }}>{label}</button>
              );
            })}
          </div>

          <form onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:'14px'}}>
            {mode === 'register' && (
              <div className="field" style={{gap:'6px', margin:0}}>
                <label style={{fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-3)'}}>ชื่อ-นามสกุล</label>
                <input className="input-base" placeholder="คุณชื่อ นามสกุล" value={name} onChange={function(e){setName(e.target.value);}} autoFocus/>
              </div>
            )}
            <div className="field" style={{gap:'6px', margin:0}}>
              <label style={{fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-3)'}}>อีเมล</label>
              <input className="input-base" type="email" placeholder="email@example.com"
                value={email} onChange={function(e){setEmail(e.target.value);}} autoFocus={mode==='login'}/>
            </div>
            <div className="field" style={{gap:'6px', margin:0}}>
              <label style={{fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-3)'}}>รหัสผ่าน</label>
              <input className="input-base" type="password" placeholder="••••••••" value={password} onChange={function(e){setPassword(e.target.value);}}/>
            </div>

            {error ? <div style={{background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.3)', borderRadius:'var(--r-sm)', padding:'10px 12px', fontSize:'13px', color:'#f87171'}}>{error}</div> : null}
            {info  ? <div style={{background:'rgba(34,197,94,.12)',  border:'1px solid rgba(34,197,94,.3)',  borderRadius:'var(--r-sm)', padding:'10px 12px', fontSize:'13px', color:'#4ade80'}}>{info}</div>  : null}

            <button className="btn primary" type="submit" disabled={loading}
              style={{marginTop:'4px', width:'100%', justifyContent:'center', padding:'12px'}}>
              {loading ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>

          <div style={{marginTop:'20px', paddingTop:'16px', borderTop:'1px solid var(--border)', textAlign:'center'}}>
            <div style={{fontSize:'11px', color:'var(--text-3)', marginBottom:'10px', lineHeight:1.6}}>
              ยังไม่ได้เชื่อม Supabase? กดเพื่อทดลองใช้ก่อน
            </div>
            <button className="btn ghost" onClick={onLogin}
              style={{width:'100%', justifyContent:'center', fontSize:'12px', padding:'8px'}}>
              ทดลองใช้งาน (ไม่บันทึกข้อมูล)
            </button>
          </div>
        </div>

        <div style={{marginTop:'16px', textAlign:'center', fontSize:'11px', color:'var(--text-3)', lineHeight:1.8}}>
          เชื่อม Supabase: แก้ไข <code style={{color:'var(--brand-bright)', background:'var(--bg-1)', padding:'1px 5px', borderRadius:'4px'}}>config.js</code>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════════ */
function App() {
  // ── Auth state ──────────────────────────────────────
  var _dbReady = window.db.isReady();

  var [user,        setUser]        = useState(null);
  var [profile,     setProfile]     = useState(null);
  var [authLoading, setAuthLoading] = useState(_dbReady); // only loading if Supabase configured
  var [liveMode,    setLiveMode]    = useState(false);    // true = Supabase connected & logged in

  // ── App state ───────────────────────────────────────
  var [projects,        setProjects]        = useState(function() {
    // Demo mode: start with sample data immediately
    if (!_dbReady) {
      window.CURRENT_USER = { id: 'demo', name: 'ผู้ใช้ Demo', role: 'executive', canApprove: true, canViewBalance: true };
      return JSON.parse(JSON.stringify(window.SAMPLE_PROJECTS));
    }
    return [];
  });
  var [projectsLoading,    setProjectsLoading]    = useState(false);
  var _initialLoadDone = React.useRef(false); // ป้องกัน loading overlay ซ้ำเมื่อ INITIAL_SESSION ยิงใหม่
  var [view,               setView]               = useState({ name: 'dashboard' });
  var [theme,              setTheme]              = useState('a');
  var [sidebarOpen,        setSidebarOpen]        = useState(false);
  var [newProjOpen,        setNewProjOpen]        = useState(false);
  var [search,             setSearch]             = useState('');
  var [currentRole,        setCurrentRole]        = useState('executive');
  var [syncError,          setSyncError]          = useState('');
  var [toasts,             setToasts]             = useState([]);
  var [showLogin,          setShowLogin]          = useState(false);
  var [qrOpen,             setQrOpen]             = useState(false); // quick-receipt FAB modal
  // ── Global settings (shared across all projects) ─
  var [globalWorkers,  setGlobalWorkers]  = useState([]);
  var [globalPresets,  setGlobalPresets]  = useState([]);

  // ── Toast notifications ──────────────────────────────
  var notify = useCallback(function(message, type) {
    var id = Date.now() + '_' + Math.random().toString(36).slice(2,7);
    var t  = { id: id, message: message, type: type || 'success' };
    setToasts(function(arr) { return arr.concat([t]); });
    setTimeout(function() {
      setToasts(function(arr) { return arr.filter(function(x) { return x.id !== id; }); });
    }, 4200);
  }, []);
  useEffect(function() { window.notify = notify; }, [notify]);

  // ── Auth init (only when Supabase is configured) ─────
  useEffect(function() {
    if (!_dbReady) return;

    // Check existing session
    window.db.auth.getSession().then(function(session) {
      if (session && session.user) {
        _loadProfile(session.user);
      } else {
        setAuthLoading(false);
        setShowLogin(true);
      }
    }).catch(function() { setAuthLoading(false); setShowLogin(true); });

    // Listen for auth state changes
    var sub = window.db.auth.onAuthChange(function(event, session) {
      if (!session || !session.user) {
        setUser(null); setProfile(null);
        setProjects([]);
        setLiveMode(false);
        setShowLogin(true);
        window.CURRENT_USER = null;
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        // Only reload everything on real login — not TOKEN_REFRESHED / USER_UPDATED
        _loadProfile(session.user);
      }
    });
    return function() {
      if (sub && sub.data && sub.data.subscription) sub.data.subscription.unsubscribe();
    };
  }, []);

  function _loadProfile(authUser) {
    setUser(authUser);
    window.db.auth.getProfile(authUser.id)
      .then(function(p) {
        if (p) {
          setProfile(p);
          var role = p.role || 'staff';
          window.CURRENT_USER = {
            id:             authUser.id,
            name:           p.display_name || authUser.email,
            role:           role,
            canApprove:     ['owner','admin','manager'].includes(role),
            canViewBalance: ['owner','admin','executive'].includes(role)
          };
          setCurrentRole(role === 'owner' || role === 'admin' ? 'executive' : role === 'manager' ? 'manager' : 'staff');
          // Load global settings from profile
          if (Array.isArray(p.global_workers) && p.global_workers.length > 0) {
            setGlobalWorkers(p.global_workers);
          }
          if (Array.isArray(p.global_presets) && p.global_presets.length > 0) {
            setGlobalPresets(p.global_presets);
          } else if (p.global_categories && Object.keys(p.global_categories).length > 0) {
            // Migrate legacy global_categories → a single preset
            setGlobalPresets([{
              id: 'preset-default',
              name: 'Preset เริ่มต้น',
              categories:    p.global_categories,
              categoryCosts: p.global_category_costs || {}
            }]);
          } else {
            // First-time user — seed one preset from DEFAULT_CATS
            setGlobalPresets([{
              id: 'preset-default',
              name: 'Preset เริ่มต้น',
              categories:    JSON.parse(JSON.stringify(window.DEFAULT_CATS)),
              categoryCosts: {}
            }]);
          }
        } else {
          // No profile yet — seed one preset from defaults
          setGlobalPresets([{
            id: 'preset-default',
            name: 'Preset เริ่มต้น',
            categories:    JSON.parse(JSON.stringify(window.DEFAULT_CATS)),
            categoryCosts: {}
          }]);
        }
        setAuthLoading(false);
        setLiveMode(true);
        setShowLogin(false);
        // โชว์ loading เฉพาะครั้งแรก — ป้องกัน INITIAL_SESSION ทำหน้าจอขาว
        if (!_initialLoadDone.current) setProjectsLoading(true);
        return window.db.projects.getProjects();
      })
      .then(function(ps) {
        // Merge fresh metadata with existing loaded transactions — prevent data loss
        // when auth events (SIGNED_IN, INITIAL_SESSION) re-trigger this function
        setProjects(function(existing) {
          return ps.map(function(newP) {
            var old = existing.find(function(e) { return e.id === newP.id; });
            if (old && old._fullLoaded) {
              // Keep transactions + members from fully-loaded project, update metadata
              return Object.assign({}, newP, {
                transactions: old.transactions,
                members:      old.members || [],
                _fullLoaded:  true
              });
            }
            return newP;
          });
        });
        _initialLoadDone.current = true;
        setProjectsLoading(false);
      })
      .catch(function(err) {
        console.error('Auth/profile error:', err);
        setAuthLoading(false);
        setLiveMode(true);
        setShowLogin(false);
        _initialLoadDone.current = true;
        setProjectsLoading(false);
      });
  }

  // ── Demo login (from LoginScreen button) ─────────────
  function handleDemoLogin() {
    window.CURRENT_USER = { id: 'demo', name: 'ผู้ใช้ Demo', role: 'executive', canApprove: true, canViewBalance: true };
    setProjects(JSON.parse(JSON.stringify(window.SAMPLE_PROJECTS)));
    // Seed one default preset in demo mode
    setGlobalPresets([{
      id: 'preset-default',
      name: 'Preset เริ่มต้น',
      categories:    JSON.parse(JSON.stringify(window.DEFAULT_CATS)),
      categoryCosts: {}
    }]);
    setShowLogin(false);
    setAuthLoading(false);
  }

  // ── Load full project on open ─────────────────────────
  function ensureProjectFull(projectId) {
    if (!liveMode || !_dbReady) return;
    var p = projects.find(function(pr) { return pr.id === projectId; });
    if (p && p._fullLoaded) return;
    window.db.projects.getProjectFull(projectId)
      .then(function(full) {
        setProjects(function(arr) {
          return arr.map(function(pr) { return pr.id === projectId ? Object.assign({}, full, {_fullLoaded: true}) : pr; });
        });
      })
      .catch(function(err) { console.error('Load project error:', err); });
  }

  useEffect(function() {
    if (view.name === 'project' && view.projectId) ensureProjectFull(view.projectId);
  }, [view]);

  // Auto-load all unloaded projects when deposit tracking view is opened
  useEffect(function() {
    if (view.name !== 'depositTracking') return;
    if (!liveMode || !_dbReady) return;
    projects.forEach(function(p) {
      if (!p._fullLoaded) ensureProjectFull(p.id);
    });
  }, [view.name, liveMode, projects.length]);

  // Auto-load all projects when quick receipts view is opened
  useEffect(function() {
    if (view.name !== 'quickReceipts') return;
    if (!liveMode || !_dbReady) return;
    projects.forEach(function(p) {
      if (!p._fullLoaded) ensureProjectFull(p.id);
    });
  }, [view.name, liveMode, projects.length]);

  // ── Visibility refresh — restore data after tab regains focus ────────
  // Re-merges project metadata (without losing existing full-loaded transactions)
  // and force-refreshes the open project if one is active.
  useEffect(function() {
    if (!liveMode || !_dbReady) return;
    var vName = view.name;
    var vId   = view.projectId;

    function onVisible() {
      if (document.visibilityState !== 'visible') return;
      // Refresh project list metadata (preserving loaded transactions)
      window.db.projects.getProjects().then(function(ps) {
        setProjects(function(existing) {
          return ps.map(function(newP) {
            var old = existing.find(function(e) { return e.id === newP.id; });
            if (old && old._fullLoaded) {
              return Object.assign({}, newP, {
                transactions: old.transactions,
                members:      old.members || [],
                _fullLoaded:  true
              });
            }
            return newP;
          });
        });
      }).catch(function(e) { console.warn('[vis] getProjects error:', e); });

      // Force re-fetch full project if one is open
      if (vName === 'project' && vId) {
        window.db.projects.getProjectFull(vId).then(function(full) {
          setProjects(function(arr) {
            return arr.map(function(p) {
              return p.id === vId ? Object.assign({}, full, { _fullLoaded: true }) : p;
            });
          });
        }).catch(function(e) { console.warn('[vis] getProjectFull error:', e); });
      }
    }

    document.addEventListener('visibilitychange', onVisible);
    return function() { document.removeEventListener('visibilitychange', onVisible); };
  }, [liveMode, view.name, view.projectId]);

  // ── Realtime subscription for the open project ───────
  useEffect(function() {
    if (view.name !== 'project' || !view.projectId || !liveMode || !_dbReady) return;
    var projectId = view.projectId;

    var channel = window.db.projects.subscribeToProject(
      projectId,
      function onPO(eventType, poId, mappedPO) {
        setProjects(function(arr) {
          return arr.map(function(p) {
            if (p.id !== projectId) return p;
            var txs = p.transactions || [];
            if (eventType === 'DELETE') {
              return Object.assign({}, p, { transactions: txs.filter(function(t) { return t.id !== poId; }) });
            }
            var exists = txs.some(function(t) { return t.id === mappedPO.id; });
            return Object.assign({}, p, {
              transactions: exists
                ? txs.map(function(t) { return t.id === mappedPO.id ? mappedPO : t; })
                : [mappedPO].concat(txs)
            });
          });
        });
      },
      function onIncome(eventType, txId, mappedTx) {
        setProjects(function(arr) {
          return arr.map(function(p) {
            if (p.id !== projectId) return p;
            var txs = p.transactions || [];
            if (eventType === 'DELETE') {
              return Object.assign({}, p, { transactions: txs.filter(function(t) { return t.id !== txId; }) });
            }
            var exists = txs.some(function(t) { return t.id === mappedTx.id; });
            return Object.assign({}, p, {
              transactions: exists
                ? txs.map(function(t) { return t.id === mappedTx.id ? mappedTx : t; })
                : [mappedTx].concat(txs)
            });
          });
        });
      }
    );

    return function() {
      window.db.projects.unsubscribeProject(channel);
    };
  }, [view.name, view.projectId, liveMode]);

  // Track tx ids that were locally modified — protect from polling overwrites
  // while DB save is in-flight
  var pendingTxIds = useRef({});

  // ── Polling fallback (every 5s) — runs alongside realtime ─────
  // Guarantees eventual consistency even if Realtime is misconfigured
  useEffect(function() {
    if (view.name !== 'project' || !view.projectId || !liveMode || !_dbReady) return;
    var projectId = view.projectId;
    var stopped = false;

    function tick() {
      if (stopped) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      window.db.projects.getProjectTransactions(projectId)
        .then(function(serverTxs) {
          if (stopped) return;
          var serverIds = {};
          serverTxs.forEach(function(t) { serverIds[t.id] = t; });
          var now = Date.now();
          setProjects(function(arr) {
            return arr.map(function(p) {
              if (p.id !== projectId) return p;
              var localTxs = p.transactions || [];
              var localIds = {};
              localTxs.forEach(function(t) { localIds[t.id] = t; });

              // Build merged list: for each server tx, prefer local version
              // if the local tx was modified within the last 8 seconds
              // (DB save may not have landed yet — don't overwrite local edits)
              var merged = serverTxs.map(function(s) {
                var pendingTs = pendingTxIds.current[s.id];
                if (pendingTs && (now - pendingTs) < 8000 && localIds[s.id]) {
                  return localIds[s.id];
                }
                return s;
              });
              localTxs.forEach(function(l) {
                if (!serverIds[l.id]) merged.push(l);
              });

              if (JSON.stringify(merged) === JSON.stringify(localTxs)) return p;
              return Object.assign({}, p, { transactions: merged });
            });
          });
        })
        .catch(function(err) { console.warn('[poll] transaction fetch error:', err); });
    }

    var iv = setInterval(tick, 5000);
    return function() { stopped = true; clearInterval(iv); };
  }, [view.name, view.projectId, liveMode]);

  // ── Mutations ────────────────────────────────────────
  var updateProject = useCallback(function(np) {
    var oldP = projects.find(function(p) { return p.id === np.id; });
    setProjects(function(arr) { return arr.map(function(p) { return p.id === np.id ? np : p; }); });
    // Mark any new/changed tx ids so polling won't overwrite them
    var nowTs = Date.now();
    var oldMap = {};
    (oldP && oldP.transactions || []).forEach(function(t) { oldMap[t.id] = t; });
    (np.transactions || []).forEach(function(t) {
      if (!oldMap[t.id] || JSON.stringify(oldMap[t.id]) !== JSON.stringify(t)) {
        pendingTxIds.current[t.id] = nowTs;
      }
    });
    if (liveMode && _dbReady && user) {
      window.db.projects.syncProject(oldP, np, user.id)
        .then(function() {
          // Clear pending markers — DB has the latest
          (np.transactions || []).forEach(function(t) { delete pendingTxIds.current[t.id]; });
        })
        .catch(function(err) {
          console.error('[sync] error:', err);
          setSyncError('บันทึกไม่สำเร็จ: ' + (err.message || err));
          setTimeout(function() { setSyncError(''); }, 12000);
        });
    }
  }, [projects, user, liveMode]);

  var removeProject = useCallback(function(projectId) {
    var p = projects.find(function(pr) { return pr.id === projectId; });
    setProjects(function(arr) { return arr.filter(function(pr) { return pr.id !== projectId; }); });
    if (liveMode && _dbReady) {
      window.db.projects.deleteProject(projectId)
        .catch(function(err) {
          console.error('Delete project error:', err);
          setSyncError('ลบโครงการไม่สำเร็จ: ' + (err.message || err));
          setTimeout(function() { setSyncError(''); }, 5000);
          if (p) setProjects(function(arr) { return [p, ...arr]; });
        });
    }
  }, [projects, liveMode]);

  var addProject = useCallback(function(proj) {
    if (!liveMode || !_dbReady || !user) {
      setProjects(function(arr) { return [Object.assign({}, proj, { id: uid('p'), transactions: [] }), ...arr]; });
      if (window.notify) window.notify('สร้างโครงการ "' + proj.name + '" เรียบร้อย (Demo)', 'success');
      return;
    }
    window.db.projects.createProject(proj, user.id)
      .then(function(created) {
        setProjects(function(arr) { return [created, ...arr]; });
        if (window.notify) window.notify('สร้างโครงการ "' + proj.name + '" เรียบร้อย', 'success');
      })
      .catch(function(err) {
        console.error('Create project error:', err);
        setSyncError('สร้างโครงการไม่สำเร็จ: ' + (err.message || err));
        setTimeout(function() { setSyncError(''); }, 12000);
      });
  }, [user, liveMode]);

  // ── Global settings mutations ────────────────────
  var updateGlobalWorkers = useCallback(function(newWorkers) {
    setGlobalWorkers(newWorkers);
    if (liveMode && _dbReady && user) {
      window.db.auth.saveGlobalSettings(user.id, { global_workers: newWorkers })
        .catch(function(err) {
          console.error('[global] save workers error:', err);
          setSyncError('บันทึกทีมช่างไม่สำเร็จ: ' + (err.message || err));
          setTimeout(function() { setSyncError(''); }, 8000);
        });
    }
  }, [user, liveMode]);

  var updateGlobalPresets = useCallback(function(newPresets) {
    setGlobalPresets(newPresets);
    if (liveMode && _dbReady && user) {
      window.db.auth.saveGlobalSettings(user.id, {
        global_presets: newPresets
      }).catch(function(err) {
        console.error('[global] save presets error:', err);
        setSyncError('บันทึก preset ไม่สำเร็จ: ' + (err.message || err));
        setTimeout(function() { setSyncError(''); }, 8000);
      });
    }
  }, [user, liveMode]);

  function handleSignOut() {
    if (liveMode && _dbReady) {
      window.db.auth.signOut().catch(function(err) { console.error(err); });
    } else {
      window.location.reload();
    }
  }

  var currentProject = view.projectId ? projects.find(function(p) { return p.id === view.projectId; }) : null;

  // Overlay global workers onto the current project so POEditor / TransactionModal
  // can pick from the global workers list transparently. Categories stay per-project.
  var currentProjectWithGlobal = useMemo(function() {
    if (!currentProject) return null;
    return Object.assign({}, currentProject, {
      workers: globalWorkers.length > 0 ? globalWorkers : (currentProject.workers || [])
    });
  }, [currentProject, globalWorkers]);

  var goto = function(v) { setView(v); setSidebarOpen(false); };

  var filteredProjects = useMemo(function() {
    var q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(function(p) {
      return (p.name||'').toLowerCase().includes(q) ||
             (p.code||'').toLowerCase().includes(q) ||
             (p.client||'').toLowerCase().includes(q);
    });
  }, [projects, search]);

  // Badge count for the deposit tracking sidebar item
  var pendingDepositCount = useMemo(function() {
    var cnt = 0;
    projects.forEach(function(p) {
      if (!Array.isArray(p.transactions)) return;
      p.transactions.forEach(function(po) {
        if ((po.kind === 'labor' || po.kind === 'subcontract') &&
            (po.retentionAmount || 0) > 0 &&
            !(po.retentionReturn && po.retentionReturn.returnedDate)) cnt++;
        if ((po.kind === 'material' || po.kind === 'machine') &&
            po.deposit && (po.deposit.amount || 0) > 0 &&
            po.deposit.status !== 'returned') cnt++;
      });
    });
    return cnt;
  }, [projects]);

  // Badge count for quick receipts sidebar item
  var quickReceiptCount = useMemo(function() {
    var cnt = 0;
    projects.forEach(function(p) { cnt += (p.quickReceipts || []).length; });
    return cnt;
  }, [projects]);

  // ── Quick receipt handlers ─────────────────────────────
  var handleSaveReceipt = useCallback(function(projectId, receipt) {
    var proj = projects.find(function(p) { return p.id === projectId; });
    if (!proj) return;
    var newReceipts = (proj.quickReceipts || []).concat([receipt]);
    setProjects(function(arr) {
      return arr.map(function(p) {
        return p.id === projectId ? Object.assign({}, p, { quickReceipts: newReceipts }) : p;
      });
    });
    if (liveMode && _dbReady) {
      window.db.projects.saveQuickReceipts(projectId, newReceipts)
        .catch(function(err) {
          console.error('[receipt] save error:', err);
          setSyncError('บันทึกบิลไม่สำเร็จ: ' + (err.message || err));
          setTimeout(function() { setSyncError(''); }, 8000);
        });
    }
  }, [projects, liveMode]);

  var handleDeleteReceipt = useCallback(function(projectId, receiptId) {
    var proj = projects.find(function(p) { return p.id === projectId; });
    if (!proj) return;
    var newReceipts = (proj.quickReceipts || []).filter(function(r) { return r.id !== receiptId; });
    setProjects(function(arr) {
      return arr.map(function(p) {
        return p.id === projectId ? Object.assign({}, p, { quickReceipts: newReceipts }) : p;
      });
    });
    if (liveMode && _dbReady) {
      window.db.projects.saveQuickReceipts(projectId, newReceipts)
        .catch(function(err) {
          console.error('[receipt] delete error:', err);
          setSyncError('ลบบิลไม่สำเร็จ: ' + (err.message || err));
          setTimeout(function() { setSyncError(''); }, 8000);
        });
    }
  }, [projects, liveMode]);

  // ── Render guards ─────────────────────────────────────
  if (authLoading) return <LoadingOverlay text="กำลังตรวจสอบสิทธิ์..."/>;
  if (showLogin)   return <LoginScreen onLogin={handleDemoLogin}/>;
  if (projectsLoading) return <LoadingOverlay text="กำลังโหลดโครงการ..."/>;

  // ── Main UI ───────────────────────────────────────────
  var cu = window.CURRENT_USER || {};
  var displayName = cu.name || 'FH';
  var initials = displayName.replace(/[^ก-๙a-zA-Z\s]/g,'').trim().split(/\s+/).map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase() || 'FH';

  return (
    <div className={'app layout-' + theme}>
      <ChartDefs/>

      {/* Sync error toast */}
      {syncError ? (
        <div style={{position:'fixed',top:'16px',right:'16px',zIndex:999,background:'rgba(239,68,68,.15)',border:'1px solid rgba(239,68,68,.4)',borderRadius:'var(--r)',padding:'12px 16px',fontSize:'13px',color:'#f87171',maxWidth:'320px',boxShadow:'var(--shadow-lg)'}}>
          <Icon name="warn" size={14} style={{marginRight:'8px',verticalAlign:'middle'}}/>
          {syncError}
        </div>
      ) : null}

      {/* Notification toasts */}
      {toasts.length ? (
        <div style={{position:'fixed', top: syncError ? '70px' : '16px', right:'16px', zIndex:998, display:'flex', flexDirection:'column', gap:'8px', maxWidth:'340px'}}>
          {toasts.map(function(t) {
            var tone = t.type === 'error' ? { bg:'rgba(239,68,68,.15)', bd:'rgba(239,68,68,.4)', fg:'#f87171', ic:'warn' }
                     : t.type === 'warn'  ? { bg:'rgba(251,191,36,.15)', bd:'rgba(251,191,36,.4)', fg:'#fbbf24', ic:'warn' }
                     : t.type === 'info'  ? { bg:'rgba(96,165,250,.15)', bd:'rgba(96,165,250,.4)', fg:'#60a5fa', ic:'info' }
                     : { bg:'rgba(34,197,94,.15)', bd:'rgba(34,197,94,.4)', fg:'#22c55e', ic:'check' };
            return (
              <div key={t.id} style={{
                background: tone.bg, border:'1px solid '+tone.bd, borderRadius:'var(--r)',
                padding:'10px 14px', fontSize:'13px', color: tone.fg,
                boxShadow:'var(--shadow-lg)', display:'flex', alignItems:'flex-start', gap:'10px',
                animation:'fh-toast-slide 240ms ease'
              }}>
                <Icon name={tone.ic} size={14} style={{marginTop:'2px', flexShrink:0}}/>
                <span style={{flex:1, lineHeight:1.5, color:'var(--text-1)'}}>{t.message}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Demo mode banner */}
      {!liveMode ? (
        <div style={{position:'fixed',bottom:'16px',left:'50%',transform:'translateX(-50%)',background:'rgba(251,191,36,.12)',border:'1px solid rgba(251,191,36,.3)',borderRadius:'var(--r)',padding:'8px 16px',fontSize:'12px',color:'#fbbf24',zIndex:100,whiteSpace:'nowrap',boxShadow:'var(--shadow-lg)'}}>
          <Icon name="info" size={12} style={{marginRight:'6px',verticalAlign:'middle'}}/>
          Demo Mode — ข้อมูลไม่ถูกบันทึก · แก้ไข config.js เพื่อเชื่อม Supabase
        </div>
      ) : null}

      {/* === LAYOUT A: Sidebar === */}
      {theme === 'a' ? (
        <aside className={'sidebar ' + (sidebarOpen ? 'open' : '')}>
          <div className="sidebar-brand">
            <div className="logo"><img src="assets/forhouse-logo.jpg" alt="FOR HOUSE"/></div>
            <div className="word"><strong>FOR HOUSE</strong><small>Cost Control</small></div>
          </div>
          <div className="sidebar-nav">
            <button className={'nav-item ' + (view.name === 'dashboard' ? 'active' : '')} onClick={function(){goto({name:'dashboard'});}}>
              <Icon name="dashboard" size={16}/> <span>แดชบอร์ดรวม</span>
            </button>
            <div className="sidebar-section-label">โครงการ ({projects.length})</div>
            {filteredProjects.map(function(p) {
              return (
                <button key={p.id}
                  className={'nav-item ' + (view.name !== 'dashboard' && view.projectId === p.id ? 'active' : '')}
                  onClick={function(){goto({name:'project', projectId: p.id});}}>
                  <Icon name="projects" size={16}/>
                  <span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</span>
                </button>
              );
            })}
            {filteredProjects.length === 0 ? <div className="dim" style={{padding:'8px 12px',fontSize:'12px'}}>ไม่พบโครงการ</div> : null}
            <div className="sidebar-section-label">ข้อมูลส่วนกลาง</div>
            <button className={'nav-item ' + (view.name === 'globalCategories' ? 'active' : '')}
              onClick={function(){goto({name:'globalCategories'});}}>
              <Icon name="tags" size={16}/> <span>หมวดหมู่งาน (Preset)</span>
            </button>
            <button className={'nav-item ' + (view.name === 'globalWorkers' ? 'active' : '')}
              onClick={function(){goto({name:'globalWorkers'});}}>
              <Icon name="users" size={16}/> <span>ทีมช่าง</span>
            </button>
            <button className={'nav-item ' + (view.name === 'depositTracking' ? 'active' : '')}
              onClick={function(){goto({name:'depositTracking'});}}>
              <Icon name="clock" size={16}/>
              <span>ประกันผลงานค้างจ่าย</span>
              {pendingDepositCount > 0
                ? <span className="nav-badge" style={{marginLeft:'auto',background:'var(--warn)',color:'#000',borderRadius:'10px',padding:'1px 6px',fontSize:'10px',fontWeight:700,flexShrink:0}}>{pendingDepositCount}</span>
                : null}
            </button>
            <button className={'nav-item ' + (view.name === 'quickReceipts' ? 'active' : '')}
              onClick={function(){goto({name:'quickReceipts'});}}>
              <Icon name="receipt" size={16}/>
              <span>บิลค้างลงบัญชี</span>
              {quickReceiptCount > 0
                ? <span className="nav-badge" style={{marginLeft:'auto',background:'var(--info)',color:'#fff',borderRadius:'10px',padding:'1px 6px',fontSize:'10px',fontWeight:700,flexShrink:0}}>{quickReceiptCount}</span>
                : null}
            </button>
            <div className="sidebar-section-label">เครื่องมือ</div>
            <button className="nav-item" onClick={function(){setNewProjOpen(true);}}>
              <Icon name="plus" size={16}/> <span>เพิ่มโครงการใหม่</span>
            </button>
          </div>
          <div className="sidebar-footer">
            <div className="sidebar-user" style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',marginBottom:'8px',borderRadius:'var(--r-sm)',background:'var(--bg-hover)'}}>
              <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'var(--brand)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,flexShrink:0}}>{initials}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'12px',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{displayName}</div>
                <div className="dim" style={{fontSize:'10px'}}>{!liveMode ? 'Demo' : (cu.role || 'staff')}</div>
              </div>
              <button onClick={handleSignOut} title="ออกจากระบบ"
                style={{background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',padding:'4px',borderRadius:'var(--r-sm)'}}>
                <Icon name="arrow-right" size={14}/>
              </button>
            </div>
            <div className="uppercase dim" style={{padding:'4px 8px',fontSize:'10px'}}>สไตล์การแสดงผล</div>
            <div className="style-switch">
              <button className={theme==='a'?'on':''} onClick={function(){setTheme('a');}}>A · Compact</button>
              <button className={theme==='b'?'on':''} onClick={function(){setTheme('b');}}>B · Spacious</button>
            </div>
          </div>
        </aside>
      ) : null}

      {/* Mobile sidebar overlay — tap to close */}
      {sidebarOpen && theme === 'a' ? (
        <div className="sidebar-overlay" onClick={function(){setSidebarOpen(false);}} aria-hidden="true"/>
      ) : null}

      <div className="main">
        {theme === 'a' ? (
          <header className="topbar">
            <button className="icon-btn menu-toggle" onClick={function(){setSidebarOpen(function(v){return !v;});}} aria-label="เมนู">
              <Icon name="menu" size={20}/>
            </button>
            <div className="crumbs">
              <button onClick={function(){goto({name:'dashboard'});}}>หน้าแรก</button>
              {view.name === 'project' && currentProjectWithGlobal ? (<>
                <span className="sep">/</span>
                <strong className="ellipsis">{currentProjectWithGlobal.name}</strong>
              </>) : view.name === 'balance' && currentProjectWithGlobal ? (<>
                <span className="sep">/</span>
                <button onClick={function(){goto({name:'project',projectId:currentProjectWithGlobal.id});}}>{currentProjectWithGlobal.name}</button>
                <span className="sep">/</span>
                <strong>งบดุล</strong>
              </>) : view.name === 'allBalance' ? (<>
                <span className="sep">/</span>
                <strong>งบดุลรวมทุกโครงการ</strong>
              </>) : view.name === 'monthlyPlan' ? (<>
                <span className="sep">/</span>
                <strong>แผนรายรับรายเดือน</strong>
              </>) : view.name === 'globalCategories' ? (<>
                <span className="sep">/</span>
                <strong>หมวดหมู่งาน (Preset)</strong>
              </>) : view.name === 'globalWorkers' ? (<>
                <span className="sep">/</span>
                <strong>ทีมช่าง</strong>
              </>) : view.name === 'depositTracking' ? (<>
                <span className="sep">/</span>
                <strong>ประกันผลงานค้างจ่าย</strong>
              </>) : view.name === 'quickReceipts' ? (<>
                <span className="sep">/</span>
                <strong>บิลค้างลงบัญชี</strong>
              </>) : null}
            </div>
            <div className="spacer"></div>
            <div className="search">
              <Icon name="search" size={14}/>
              <input placeholder="ค้นหาโครงการ / รหัส / เจ้าของงาน..." value={search} onChange={function(e){setSearch(e.target.value);}}/>
            </div>
            {!liveMode ? <RoleSwitcher currentRole={currentRole} onChange={setCurrentRole}/> : null}
            <div className="avatar" title={displayName}>{initials}</div>
          </header>
        ) : (
          <header className="topnav">
            <div className="topnav-row">
              <div className="topnav-brand">
                <div className="logo"><img src="assets/forhouse-logo.jpg" alt="FOR HOUSE"/></div>
                <div className="word"><strong>FOR HOUSE</strong></div>
              </div>
              <div className="topnav-tabs">
                <button className={view.name==='dashboard'?'on':''} onClick={function(){goto({name:'dashboard'});}}>
                  <Icon name="dashboard" size={14}/> แดชบอร์ด
                </button>
                {projects.slice(0,4).map(function(p) {
                  return (
                    <button key={p.id} className={view.projectId===p.id && view.name!=='dashboard'?'on':''}
                      onClick={function(){goto({name:'project',projectId:p.id});}}>
                      <Icon name="projects" size={14}/> {p.name.length>22?p.name.slice(0,22)+'...':p.name}
                    </button>
                  );
                })}
              </div>
              <div className="spacer" style={{flex:1}}></div>
              <div className="style-switch" style={{maxWidth:'220px'}}>
                <button className={theme==='a'?'on':''} onClick={function(){setTheme('a');}}>A · Compact</button>
                <button className={theme==='b'?'on':''} onClick={function(){setTheme('b');}}>B · Spacious</button>
              </div>
              {!liveMode ? <RoleSwitcher currentRole={currentRole} onChange={setCurrentRole}/> : null}
              <div className="avatar" title={displayName}>{initials}</div>
            </div>
          </header>
        )}

        <main className="content">
          {view.name === 'dashboard' ? (
            <Dashboard
              projects={projects}
              onOpenProject={function(id){goto({name:'project',projectId:id});}}
              onNewProject={function(){setNewProjOpen(true);}}
              onOpenAllBalance={function(){goto({name:'allBalance'});}}
              onOpenMonthlyPlan={function(){goto({name:'monthlyPlan'});}}
              currentRole={currentRole}
            />
          ) : view.name === 'monthlyPlan' ? (
            <MonthlyIncomePlan
              projects={projects}
              onBack={function(){goto({name:'dashboard'});}}
              currentRole={currentRole}
            />
          ) : view.name === 'allBalance' ? (
            <AllBalance
              projects={projects}
              onBack={function(){goto({name:'dashboard'});}}
              currentRole={currentRole}
            />
          ) : view.name === 'project' && currentProjectWithGlobal ? (
            <ProjectView
              project={currentProjectWithGlobal}
              onBack={function(){goto({name:'dashboard'});}}
              onUpdate={updateProject}
              onDelete={function(){ removeProject(currentProjectWithGlobal.id); goto({name:'dashboard'}); }}
              onOpenBalance={function(){goto({name:'balance',projectId:currentProjectWithGlobal.id});}}
              currentRole={getEffectiveRole(currentProjectWithGlobal, cu.name, currentRole)}
              presets={globalPresets}
            />
          ) : view.name === 'balance' && currentProjectWithGlobal ? (
            <BalanceSheet
              project={currentProjectWithGlobal}
              onBack={function(){goto({name:'project',projectId:currentProjectWithGlobal.id});}}
              currentRole={getEffectiveRole(currentProjectWithGlobal, cu.name, currentRole)}
            />
          ) : view.name === 'globalCategories' ? (
            <GlobalPresetsScreen
              presets={globalPresets}
              onUpdate={updateGlobalPresets}
              currentRole={currentRole}
            />
          ) : view.name === 'globalWorkers' ? (
            <GlobalWorkersScreen
              workers={globalWorkers}
              onUpdate={updateGlobalWorkers}
              currentRole={currentRole}
            />
          ) : view.name === 'depositTracking' ? (
            <DepositTrackingScreen
              projects={projects}
              onUpdateProject={updateProject}
              currentRole={currentRole}
            />
          ) : view.name === 'quickReceipts' ? (
            <QuickReceiptsScreen
              projects={projects}
              onDeleteReceipt={handleDeleteReceipt}
            />
          ) : (
            <Empty title="ไม่พบหน้าที่ต้องการ" icon="warn"
              action={<button className="btn primary" onClick={function(){goto({name:'dashboard'});}}>กลับแดชบอร์ด</button>}/>
          )}
        </main>
      </div>

      {newProjOpen ? (
        <NewProjectModal
          onClose={function(){setNewProjOpen(false);}}
          onSubmit={function(p){ addProject(p); setNewProjOpen(false); goto({name:'dashboard'}); }}
        />
      ) : null}

      {/* ── Camera FAB ── */}
      <button className="fab" onClick={function(){setQrOpen(true);}}
        title="ถ่ายรูปบิล / ใบเสร็จ" aria-label="ถ่ายรูปบิล">
        <Icon name="camera" size={22}/>
      </button>

      {qrOpen ? (
        <QuickReceiptModal
          projects={projects}
          liveMode={liveMode}
          user={user}
          onClose={function(){setQrOpen(false);}}
          onSave={function(projectId, receipt){
            handleSaveReceipt(projectId, receipt);
            setQrOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

/* ========== Quick Receipt Modal ========== */
function QuickReceiptModal({ projects, liveMode, user, onClose, onSave }) {
  var openProjects = projects.filter(function(p){ return p.status !== 'completed'; });
  var firstId = openProjects.length > 0 ? openProjects[0].id : (projects.length > 0 ? projects[0].id : '');

  var [projectId,    setProjectId]    = useState(firstId);
  var [date,         setDate]         = useState(new Date().toISOString().slice(0,10));
  var [imagePreview, setImagePreview] = useState(null); // data URL for preview
  var [imageFile,    setImageFile]    = useState(null); // File object
  var [note,         setNote]         = useState('');
  var [saving,       setSaving]       = useState(false);
  var fileRef = useRef(null);

  function handleFileChange(e) {
    var file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    var reader = new FileReader();
    reader.onload = function(ev) { setImagePreview(ev.target.result); };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!projectId) return;
    setSaving(true);

    function finish(imageUrl) {
      var receipt = {
        id:        genId(),
        date:      date,
        imageUrl:  imageUrl || null,
        note:      note.trim(),
        createdAt: new Date().toISOString()
      };
      onSave(projectId, receipt);
      setSaving(false);
      if (window.notify) window.notify('บันทึกบิลเรียบร้อย', 'success');
    }

    // Live mode: try uploading to Supabase Storage
    if (imageFile && liveMode && window.db.isReady()) {
      var uid = user && user.id ? user.id : 'demo';
      var path = 'quick-receipts/' + uid + '/' + genId() + '-' + imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      window.db.files.uploadFile('po-images', path, imageFile)
        .then(function(url) { finish(url); })
        .catch(function(err) {
          console.warn('[receipt] upload failed, using data URL:', err);
          finish(imagePreview); // fallback to local preview
        });
    } else {
      finish(imagePreview); // demo mode: use data URL
    }
  }

  var canSave = !saving && !!projectId && !!date;

  return (
    <Modal open={true} onClose={onClose} title="ถ่ายรูปบิล / ใบเสร็จ"
      footer={<>
        <button className="btn ghost" onClick={onClose}>ยกเลิก</button>
        <button className="btn primary" onClick={handleSave} disabled={!canSave}>
          {saving
            ? <><Icon name="clock" size={14}/> กำลังบันทึก...</>
            : <><Icon name="check" size={14}/> บันทึกบิล</>}
        </button>
      </>}>

      <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>

        {/* Project selector */}
        <div className="field" style={{margin:0}}>
          <label>โครงการ <span className="req">*</span></label>
          <select className="input-base" value={projectId} onChange={function(e){setProjectId(e.target.value);}}>
            {(openProjects.length > 0 ? openProjects : projects).map(function(p) {
              return <option key={p.id} value={p.id}>{p.name}</option>;
            })}
          </select>
        </div>

        {/* Date */}
        <div className="field" style={{margin:0}}>
          <label>วันที่บิล</label>
          <input className="input-base" type="date" value={date} onChange={function(e){setDate(e.target.value);}}/>
        </div>

        {/* Camera capture */}
        <div className="field" style={{margin:0}}>
          <label>รูปบิล / ใบเสร็จ</label>

          {imagePreview ? (
            <div style={{position:'relative', marginBottom:'10px'}}>
              <img src={imagePreview} alt="ตัวอย่างบิล"
                style={{width:'100%', maxHeight:'300px', objectFit:'contain',
                        borderRadius:'var(--r)', border:'1px solid var(--border)',
                        background:'var(--bg-2)', display:'block'}}/>
              <button className="btn ghost sm"
                onClick={function(){setImagePreview(null); setImageFile(null);}}
                style={{position:'absolute', top:'8px', right:'8px',
                        background:'rgba(0,0,0,0.65)', borderColor:'transparent',
                        color:'#fff', padding:'4px 10px'}}>
                <Icon name="close" size={13}/> เปลี่ยน
              </button>
            </div>
          ) : null}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{display:'none'}}
            onChange={handleFileChange}
          />
          <button className="btn" onClick={function(){fileRef.current && fileRef.current.click();}}>
            <Icon name="camera" size={16}/>
            {imagePreview ? 'ถ่ายใหม่ / เปลี่ยนรูป' : 'ถ่ายรูป / เลือกรูปภาพ'}
          </button>
          <div className="hint" style={{marginTop:'6px'}}>
            กดปุ่มนี้เพื่อเปิดกล้องถ่ายรูปบิล หรือเลือกรูปจากอัลบั้ม
          </div>
        </div>

        {/* Optional note */}
        <div className="field" style={{margin:0}}>
          <label>หมายเหตุ <span className="dim" style={{fontWeight:400}}>(ไม่บังคับ)</span></label>
          <input className="input-base" placeholder="เช่น วัสดุผนังงวด 3 / ค่าแรงคนงาน"
            value={note} onChange={function(e){setNote(e.target.value);}}/>
        </div>

      </div>
    </Modal>
  );
}

/* ========== Role switcher ========== */
function RoleSwitcher({ currentRole, onChange }) {
  var [open, setOpen] = useState(false);
  var ref = useRef(null);
  useEffect(function() {
    if (!open) return;
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return function() { document.removeEventListener('mousedown', onClick); };
  }, [open]);
  var role = window.ROLES[currentRole] || window.ROLES.staff;
  return (
    <div ref={ref} style={{position:'relative'}}>
      <button className={'role-badge ' + role.key} onClick={function(){setOpen(function(v){return !v;});}}
        style={{cursor:'pointer',padding:'6px 12px',fontSize:'11px',lineHeight:1.2}}>
        <Icon name="shield-check" size={11}/>
        <span>{role.short}</span>
        <Icon name="chevron-down" size={10}/>
      </button>
      {open ? (
        <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:'var(--bg-1)',border:'1px solid var(--border-strong)',borderRadius:'var(--r)',boxShadow:'var(--shadow-lg)',padding:'6px',minWidth:'240px',zIndex:50}}>
          <div className="dim uppercase" style={{padding:'8px 10px 6px',fontSize:'10.5px',borderBottom:'1px solid var(--border)',marginBottom:'4px'}}>
            สลับสิทธิ (View Mode)
          </div>
          {Object.values(window.ROLES).map(function(r) {
            return (
              <button key={r.key} onClick={function(){onChange(r.key); setOpen(false);}}
                style={{display:'flex',alignItems:'center',gap:'10px',width:'100%',padding:'10px 12px',textAlign:'left',background:r.key===currentRole?'var(--bg-hover)':'transparent',borderRadius:'var(--r-sm)',cursor:'pointer',border:'none',color:'var(--text-1)',fontSize:'13px'}}
                onMouseEnter={function(e){if(r.key!==currentRole)e.currentTarget.style.background='var(--bg-hover)';}}
                onMouseLeave={function(e){if(r.key!==currentRole)e.currentTarget.style.background='transparent';}}>
                <span className={'role-badge ' + r.key} style={{padding:'2px 8px',fontSize:'10px'}}>{r.short}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:500}}>{r.label}</div>
                  <div className="dim" style={{fontSize:'11px',marginTop:'1px'}}>
                    {r.canViewBalance?'✓ ดูงบดุลได้':'✗ ดูงบดุลไม่ได้'} · {r.canApprove?'✓ อนุมัติ PO':'✗ อนุมัติไม่ได้'}
                  </div>
                </div>
                {r.key===currentRole?<Icon name="check" size={14} style={{color:'var(--brand-bright)'}}/>:null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* ========== New project modal ========== */
function NewProjectModal({ onClose, onSubmit }) {
  var [name, setName]              = useState('');
  var [code, setCode]              = useState('FH-' + new Date().getFullYear() + '-' + genId().split('-')[0].toUpperCase().slice(0,6));
  var [client, setClient]          = useState('');
  var [location, setLocation]      = useState('');
  var [contractValue, setContract] = useState('');
  var [start, setStart]            = useState(new Date().toISOString().slice(0,10));
  var [end, setEnd]                = useState('');
  var [budgets, setBudgets]        = useState({ material:'', labor:'', subcontract:'', machine:'', other:'' });

  var cv = parseFloat(contractValue.replace(/,/g,'')) || 0;
  var totalBudget = Object.values(budgets).reduce(function(s,v){return s+(parseFloat(String(v).replace(/,/g,''))||0);}, 0);
  var can = name.trim() && cv > 0;

  function submit() {
    if (!can) return;
    onSubmit({
      code: code, name: name.trim(), client: client.trim(), location: location.trim(),
      contractValue: cv, startDate: start, endDate: end,
      status: 'progress', progress: 0,
      budgets: {
        material:    parseFloat(String(budgets.material).replace(/,/g,''))    || 0,
        labor:       parseFloat(String(budgets.labor).replace(/,/g,''))       || 0,
        subcontract: parseFloat(String(budgets.subcontract).replace(/,/g,'')) || 0,
        machine:     parseFloat(String(budgets.machine).replace(/,/g,''))     || 0,
        other:       parseFloat(String(budgets.other).replace(/,/g,''))       || 0
      },
      categories: JSON.parse(JSON.stringify(window.DEFAULT_CATS)),
      transactions: []
    });
  }

  return (
    <Modal open={true} onClose={onClose} title="เพิ่มโครงการใหม่" wide
      footer={<>
        <button className="btn ghost" onClick={onClose}>ยกเลิก</button>
        {!can ? (
          <span style={{fontSize:'12px', color:'var(--warn-bright)', alignSelf:'center'}}>
            <Icon name="warn" size={12}/> กรอก{!name.trim() ? 'ชื่อโครงการ' : ''}{!name.trim() && !(cv > 0) ? ' และ' : ''}{!(cv > 0) ? 'มูลค่าสัญญา' : ''}ก่อนสร้าง
          </span>
        ) : null}
        <button className="btn primary" disabled={!can} onClick={submit}><Icon name="check" size={14}/> สร้างโครงการ</button>
      </>}>
      <div className="form-grid">
        <div className="field">
          <label>รหัสโครงการ</label>
          <input className="input-base mono" value={code} onChange={function(e){setCode(e.target.value);}}/>
        </div>
        <div className="field">
          <label>มูลค่าสัญญา (บาท) <span className="req">*</span></label>
          <div className="with-suffix">
            <input className="input-base num-input" inputMode="decimal" placeholder="0"
              value={contractValue} onChange={function(e){setContract(formatNumberInput(e.target.value));}}/>
            <span className="suffix">บาท</span>
          </div>
        </div>
        <div className="field full">
          <label>ชื่อโครงการ <span className="req">*</span></label>
          <input className="input-base" placeholder="เช่น บ้านพักอาศัย 2 ชั้น คุณสมชาย" value={name} onChange={function(e){setName(e.target.value);}}/>
        </div>
        <div className="field">
          <label>เจ้าของงาน</label>
          <input className="input-base" placeholder="ชื่อลูกค้า / บริษัท" value={client} onChange={function(e){setClient(e.target.value);}}/>
        </div>
        <div className="field">
          <label>ที่ตั้ง</label>
          <input className="input-base" placeholder="ตำบล / อำเภอ / จังหวัด" value={location} onChange={function(e){setLocation(e.target.value);}}/>
        </div>
        <div className="field">
          <label>วันที่เริ่มงาน</label>
          <input className="input-base" type="date" value={start} onChange={function(e){setStart(e.target.value);}}/>
        </div>
        <div className="field">
          <label>วันที่สิ้นสุดสัญญา</label>
          <input className="input-base" type="date" value={end} onChange={function(e){setEnd(e.target.value);}}/>
        </div>
        <div className="field full">
          <label>งบประมาณตั้งไว้แต่ละหมวด</label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:'10px'}}>
            {EXPENSE_KINDS.map(function(k) {
              return (
                <div key={k} className="field" style={{gap:'4px'}}>
                  <label style={{display:'flex',alignItems:'center',gap:'6px',textTransform:'none',letterSpacing:0,fontSize:'12px',color:'var(--text-2)'}}>
                    <KindIcon kind={k} size={12}/> {KINDS[k].short}
                  </label>
                  <div className="with-suffix">
                    <input className="input-base num-input" inputMode="decimal" placeholder="0"
                      value={budgets[k]} onChange={function(e){setBudgets(Object.assign({},budgets,{[k]:formatNumberInput(e.target.value)}));}}/>
                    <span className="suffix">บ.</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hint">
            รวมงบ <strong className="mono">{formatBaht(totalBudget)}</strong> บาท
            {cv > 0 ? <> · คาดกำไร <strong className={'mono ' + (cv-totalBudget>=0?'pos':'neg')}>{formatBaht(cv-totalBudget)}</strong> บาท ({((cv-totalBudget)/cv*100).toFixed(1)}%)</> : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* Mount */
var rootEl = document.getElementById('root');
ReactDOM.createRoot(rootEl).render(<App/>);
