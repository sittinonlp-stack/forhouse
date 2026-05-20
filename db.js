/* FOR HOUSE — Database layer (Supabase)
   Maps between Supabase DB rows ↔ App data model
   ============================================================ */
(function () {
  'use strict';

  var cfg = window.FORHOUSE_CONFIG || {};
  var supabaseUrl = cfg.supabaseUrl || '';
  var supabaseKey = cfg.supabaseKey || '';

  // Supabase client (loaded via CDN)
  var client = null;
  if (supabaseUrl && supabaseUrl !== 'https://YOUR_PROJECT_ID.supabase.co' && window.supabase) {
    client = window.supabase.createClient(supabaseUrl, supabaseKey);
  }

  // ─────────────────────────────────────────────
  // MAPPERS: DB row → App object
  // ─────────────────────────────────────────────

  function mapProjectRow(row, budgets, cats, incomes, pos, members) {
    return {
      id:            row.id,
      code:          row.code,
      name:          row.name,
      location:      row.location || '',
      client:        row.client   || '',
      contractValue: Number(row.contract_value || 0),
      startDate:     row.start_date || '',
      endDate:       row.end_date   || '',
      status:        row.status,
      progress:      Number(row.progress || 0),
      budgets: (budgets || []).reduce(function (acc, b) {
        acc[b.kind] = Number(b.amount);
        return acc;
      }, { material: 0, labor: 0, subcontract: 0, machine: 0, other: 0 }),
      categories: (cats || []).reduce(function (acc, c) {
        if (!acc[c.kind]) acc[c.kind] = [];
        acc[c.kind].push(c.name);
        return acc;
      }, { income: [], material: [], labor: [], subcontract: [], machine: [], other: [] }),
      categoryCosts: (cats || []).reduce(function (acc, c) {
        if (!acc[c.kind]) acc[c.kind] = {};
        acc[c.kind][c.name] = Number(c.cost_price || 0);
        return acc;
      }, { income: {}, material: {}, labor: {}, subcontract: {}, machine: {}, other: {} }),
      transactions: [].concat(
        (incomes || []).map(mapIncomeRow),
        (pos    || []).map(mapPORow)
      ).sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); }),
      members: (members || []).map(function (m) {
        var p = m.profiles || {};
        return {
          id:          m.id,
          userId:      m.user_id,
          role:        mapDbRoleToUi(m.role),
          dbRole:      m.role,
          addedAt:     m.added_at || '',
          displayName: p.display_name || '',
          email:       p.email || '',
          isOwner:     m.role === 'owner'
        };
      })
    };
  }

  function mapDbRoleToUi(dbRole) {
    if (dbRole === 'owner' || dbRole === 'admin') return 'executive';
    if (dbRole === 'manager') return 'manager';
    return 'staff';
  }

  function mapUiRoleToDb(uiRole) {
    if (uiRole === 'executive') return 'admin';
    if (uiRole === 'manager')   return 'manager';
    return 'staff';
  }

  function mapIncomeRow(row) {
    if (!('deduction_pct' in row)) {
      console.warn('[db] mapIncomeRow: row missing deduction_pct column — migration 009 may not be applied. Row keys:', Object.keys(row));
    }
    return {
      id:            row.id,
      kind:          'income',
      date:          row.date,
      category:      row.category,
      description:   row.description || '',
      amount:        Number(row.amount || 0),
      vat:           !!row.vat,
      vatIncluded:   !!row.vat_included,
      vatAmount:     Number(row.vat_amount || 0),
      vendor:        row.vendor || '',
      attachment:    row.attachment_url || null,
      taxInvoiceUrl: row.tax_invoice_url || '',
      deductionPct:  Number(row.deduction_pct || 0),
      deductionNote: row.deduction_note || '',
      _dbSource:     'income'
    };
  }

  function mapPORow(row) {
    var items = (row.po_items || [])
      .slice()
      .sort(function (a, b) { return a.sort_order - b.sort_order; })
      .map(function (it) {
        return {
          id:          it.id,
          category:    it.category,
          description: it.description,
          qty:         Number(it.qty),
          unit:        it.unit,
          unitPrice:   Number(it.unit_price),
          amount:      Number(it.amount)
        };
      });
    return {
      id:              row.id,
      kind:            row.kind,
      code:            row.code,
      date:            row.date,
      vendor:          row.vendor || '',
      description:     row.description || '',
      category:        items.length ? items[0].category : '',
      items:           items,
      subtotal:        Number(row.subtotal || 0),
      vat:             !!row.vat,
      vatAmount:       Number(row.vat_amount || 0),
      withholding:     Number(row.withholding || 0),
      whtAmount:       Number(row.withholding_amt || 0),
      retentionAmount: Number(row.retention_amount || 0),
      advanceDeduct:   Number(row.advance_deduct || 0),
      amount:          Number(row.amount || 0),
      status:          row.status || 'draft',
      createdBy:       row.created_by_name || '',
      createdAt:       row.created_at || row.date,
      notes:           row.notes || '',
      approvedBy:      row.approved_by_name || '',
      approvedAt:      row.approved_at || null,
      approvalNote:    row.approval_note || '',
      paidBy:          row.paid_by_name || '',
      paidAt:          row.paid_at || null,
      paymentSlip:     row.payment_slip_url || null,
      attachment:      row.payment_slip_url || null,
      images:          Array.isArray(row.images) ? row.images : (row.images ? JSON.parse(row.images) : []),
      deposit:         row.deposit
                         ? (typeof row.deposit === 'string' ? JSON.parse(row.deposit) : row.deposit)
                         : null,
      vatIncluded:     !!row.vat_included,
      taxInvoiceUrl:   row.tax_invoice_url || '',
      _dbSource:       'po'
    };
  }

  // ─────────────────────────────────────────────
  // MAPPERS: App object → DB row
  // ─────────────────────────────────────────────

  function incomeToRow(tx, projectId, userId) {
    var row = {
      id:              tx.id,
      project_id:      projectId,
      date:            tx.date,
      category:        tx.category,
      description:     tx.description || '',
      amount:          tx.amount || 0,
      vat:             !!tx.vat,
      vat_included:    !!tx.vatIncluded,
      vat_amount:      tx.vatAmount || 0,
      vendor:          tx.vendor || '',
      attachment_url:  tx.attachment || null,
      tax_invoice_url: tx.taxInvoiceUrl || null,
      deduction_pct:   tx.deductionPct || 0,
      deduction_note:  tx.deductionNote || '',
      created_by:      userId || null
    };
    console.log('[db] incomeToRow → deduction_pct=' + row.deduction_pct + ', tx.deductionPct=' + tx.deductionPct, row);
    return row;
  }

  function poToRow(po, projectId, userId) {
    return {
      id:              po.id,
      project_id:      projectId,
      code:            po.code || ('PO-' + Date.now()),
      kind:            po.kind,
      date:            po.date,
      vendor:          po.vendor || '',
      description:     po.description || '',
      subtotal:        po.subtotal || 0,
      vat:             !!po.vat,
      vat_amount:      po.vatAmount || 0,
      withholding:     po.withholding || 0,
      withholding_amt: po.whtAmount || 0,
      retention_amount:po.retentionAmount || 0,
      advance_deduct:  po.advanceDeduct || 0,
      amount:          po.amount || po.subtotal || 0,
      status:          po.status || 'draft',
      created_by:      userId || null,
      created_by_name: po.createdBy || '',
      notes:           po.notes || '',
      approved_by_name:po.approvedBy || '',
      approved_at:     po.approvedAt || null,
      approval_note:   po.approvalNote || '',
      paid_by_name:    po.paidBy || '',
      paid_at:         po.paidAt || null,
      payment_slip_url:po.paymentSlip || null,
      images:          Array.isArray(po.images) ? po.images : [],
      deposit:         po.deposit && po.deposit.amount > 0 ? po.deposit : null,
      vat_included:    !!po.vatIncluded,
      tax_invoice_url: po.taxInvoiceUrl || null,
      updated_at:      new Date().toISOString()
    };
  }

  function poItemToRow(item, poId, idx) {
    return {
      id:          item.id,
      po_id:       poId,
      category:    item.category || '',
      description: item.description || '',
      qty:         item.qty || 1,
      unit:        item.unit || 'รายการ',
      unit_price:  item.unitPrice || 0,
      amount:      item.amount || (item.qty * item.unitPrice) || 0,
      sort_order:  idx
    };
  }

  // ─────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────

  function signIn(email, password) {
    return client.auth.signInWithPassword({ email: email, password: password })
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data;
      });
  }

  function signUp(email, password, displayName) {
    return client.auth.signUp({
      email: email,
      password: password,
      options: { data: { display_name: displayName } }
    }).then(function (res) {
      if (res.error) throw res.error;
      return res.data;
    });
  }

  function signOut() {
    return client.auth.signOut().then(function (res) {
      if (res.error) throw res.error;
    });
  }

  function getSession() {
    return client.auth.getSession().then(function (res) {
      return res.data.session;
    });
  }

  function onAuthChange(callback) {
    return client.auth.onAuthStateChange(callback);
  }

  function getProfile(userId) {
    return client.from('profiles').select('*').eq('id', userId).single()
      .then(function (res) {
        if (res.error && res.error.code !== 'PGRST116') throw res.error;
        return res.data;
      });
  }

  function upsertProfile(userId, fields) {
    var row = Object.assign({ id: userId, updated_at: new Date().toISOString() }, fields);
    return client.from('profiles').upsert(row)
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data;
      });
  }

  // ─────────────────────────────────────────────
  // PROJECTS — list (no transactions for dashboard)
  // ─────────────────────────────────────────────

  function getProjects() {
    var projects, ids;
    return client.from('projects').select('*').order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) throw res.error;
        projects = res.data || [];
        if (!projects.length) return [null, null, null];
        ids = projects.map(function (p) { return p.id; });
        return Promise.all([
          client.from('project_budgets').select('*').in('project_id', ids),
          client.from('categories').select('*').in('project_id', ids).order('sort_order'),
          client.from('purchase_orders').select('project_id, status, kind').in('project_id', ids).eq('status', 'pending')
        ]);
      })
      .then(function (results) {
        if (!results) return [];
        var budgetsAll = (results[0] && results[0].data) || [];
        var catsAll    = (results[1] && results[1].data) || [];
        var pendingPOs = (results[2] && results[2].data) || [];
        // count pending POs per project + per kind
        var pendingMap = {};
        var pendingByKindMap = {};
        pendingPOs.forEach(function (r) {
          pendingMap[r.project_id] = (pendingMap[r.project_id] || 0) + 1;
          if (!pendingByKindMap[r.project_id]) pendingByKindMap[r.project_id] = {};
          pendingByKindMap[r.project_id][r.kind] = (pendingByKindMap[r.project_id][r.kind] || 0) + 1;
        });
        return projects.map(function (p) {
          var proj = mapProjectRow(
            p,
            budgetsAll.filter(function (b) { return b.project_id === p.id; }),
            catsAll.filter(function (c) { return c.project_id === p.id; }),
            [], []
          );
          proj.pendingPOCount = pendingMap[p.id] || 0;
          proj.pendingPOByKind = pendingByKindMap[p.id] || {};
          return proj;
        });
      });
  }

  // Load a single project with all transactions + members
  function getProjectFull(projectId) {
    // Members fetch wrapped to be resilient: if profiles join fails
    // (e.g., migration 002 not applied yet), still return the project.
    var membersPromise = client.from('project_members')
      .select('*, profiles!project_members_user_id_fkey(id, display_name, email)')
      .eq('project_id', projectId)
      .then(function (r) {
        if (r.error) {
          console.warn('[db] members fetch failed, retrying without profiles join:', r.error.message);
          return client.from('project_members').select('*').eq('project_id', projectId)
            .then(function (r2) { return { data: r2.data || [], error: r2.error }; });
        }
        return r;
      })
      .catch(function (err) {
        console.error('[db] members fetch error:', err);
        return { data: [], error: err };
      });

    return Promise.all([
      client.from('projects').select('*').eq('id', projectId).single(),
      client.from('project_budgets').select('*').eq('project_id', projectId),
      client.from('categories').select('*').eq('project_id', projectId).order('sort_order'),
      client.from('income_records').select('*').eq('project_id', projectId).order('date', { ascending: false }),
      client.from('purchase_orders')
        .select('*, po_items(*)')
        .eq('project_id', projectId)
        .order('date', { ascending: false }),
      membersPromise
    ]).then(function (results) {
      var pRes  = results[0];
      if (pRes.error) throw pRes.error;
      return mapProjectRow(
        pRes.data,
        (results[1].data) || [],
        (results[2].data) || [],
        (results[3].data) || [],
        (results[4].data) || [],
        (results[5].data) || []
      );
    });
  }

  // ─────────────────────────────────────────────
  // CREATE PROJECT
  // ─────────────────────────────────────────────

  function createProject(proj, userId) {
    var newId;
    return client.from('projects').insert({
      code:           proj.code,
      name:           proj.name,
      location:       proj.location || '',
      client:         proj.client   || '',
      contract_value: proj.contractValue || 0,
      start_date:     proj.startDate || null,
      end_date:       proj.endDate   || null,
      status:         proj.status    || 'progress',
      progress:       proj.progress  || 0,
      created_by:     userId || null
    }).select().single()
      .then(function (res) {
        if (res.error) throw res.error;
        newId = res.data.id;

        var budgetRows = Object.entries(proj.budgets || {}).map(function (kv) {
          return { project_id: newId, kind: kv[0], amount: kv[1] || 0 };
        });
        var catRows = [];
        Object.entries(proj.categories || {}).forEach(function (kv) {
          (kv[1] || []).forEach(function (name, i) {
            catRows.push({ project_id: newId, kind: kv[0], name: name, sort_order: i });
          });
        });
        var memberRow = { project_id: newId, user_id: userId, role: 'owner', added_by: userId };

        return Promise.all([
          budgetRows.length ? client.from('project_budgets').insert(budgetRows) : Promise.resolve(),
          catRows.length    ? client.from('categories').insert(catRows)         : Promise.resolve(),
          client.from('project_members').insert(memberRow)
        ]);
      })
      .then(function () {
        return Object.assign({}, proj, { id: newId, transactions: [] });
      });
  }

  // ─────────────────────────────────────────────
  // SYNC PROJECT (diff & apply changes)
  // ─────────────────────────────────────────────

  function updateProjectMeta(proj) {
    return client.from('projects').update({
      code:           proj.code,
      name:           proj.name,
      location:       proj.location,
      client:         proj.client,
      contract_value: proj.contractValue,
      start_date:     proj.startDate || null,
      end_date:       proj.endDate   || null,
      status:         proj.status,
      progress:       proj.progress,
      updated_at:     new Date().toISOString()
    }).eq('id', proj.id)
      .then(function (res) { if (res.error) throw res.error; });
  }

  function syncBudgets(projectId, budgets) {
    var rows = Object.entries(budgets || {}).map(function (kv) {
      return { project_id: projectId, kind: kv[0], amount: kv[1] || 0 };
    });
    return client.from('project_budgets').upsert(rows, { onConflict: 'project_id,kind' })
      .then(function (res) { if (res.error) throw res.error; });
  }

  function syncCategories(projectId, kind, names, costs) {
    // names: string[], costs: optional { [name]: cost }
    var costMap = costs || {};
    return client.from('categories').delete().eq('project_id', projectId).eq('kind', kind)
      .then(function (res) {
        if (res.error) throw res.error;
        if (!names || !names.length) return;
        var rows = names.map(function (name, i) {
          return { project_id: projectId, kind: kind, name: name, cost_price: Number(costMap[name] || 0), sort_order: i };
        });
        return client.from('categories').insert(rows)
          .then(function (r) { if (r.error) throw r.error; });
      });
  }

  function syncTransactions(projectId, oldTxs, newTxs, userId) {
    var oldMap = {};
    (oldTxs || []).forEach(function (t) { oldMap[t.id] = t; });
    var newMap = {};
    (newTxs || []).forEach(function (t) { newMap[t.id] = t; });

    var added   = (newTxs || []).filter(function (t) { return !oldMap[t.id]; });
    var removed = (oldTxs || []).filter(function (t) { return !newMap[t.id]; });
    var updated = (newTxs || []).filter(function (t) {
      return oldMap[t.id] && JSON.stringify(oldMap[t.id]) !== JSON.stringify(t);
    });

    var ops = [];

    // ── Adds ───────────────────────────────────
    added.forEach(function (tx) {
      if (tx.kind === 'income') {
        ops.push(
          client.from('income_records').insert(incomeToRow(tx, projectId, userId))
            .then(function (r) { if (r.error) throw r.error; })
        );
      } else {
        ops.push(
          client.from('purchase_orders').insert(poToRow(tx, projectId, userId))
            .then(function (r) {
              if (r.error) throw r.error;
              if (!(tx.items && tx.items.length)) return;
              var itemRows = tx.items.map(function (it, i) { return poItemToRow(it, tx.id, i); });
              return client.from('po_items').insert(itemRows)
                .then(function (r2) { if (r2.error) throw r2.error; });
            })
        );
      }
    });

    // ── Removes ────────────────────────────────
    var rmIncome = removed.filter(function (t) { return t.kind === 'income'; }).map(function (t) { return t.id; });
    var rmPO     = removed.filter(function (t) { return t.kind !== 'income'; }).map(function (t) { return t.id; });
    if (rmIncome.length) {
      ops.push(client.from('income_records').delete().in('id', rmIncome)
        .then(function (r) { if (r.error) throw r.error; }));
    }
    if (rmPO.length) {
      ops.push(client.from('purchase_orders').delete().in('id', rmPO)
        .then(function (r) { if (r.error) throw r.error; }));
    }

    // ── Updates ────────────────────────────────
    updated.forEach(function (tx) {
      if (tx.kind === 'income') {
        ops.push(
          client.from('income_records').update(incomeToRow(tx, projectId, userId)).eq('id', tx.id)
            .then(function (r) { if (r.error) throw r.error; })
        );
      } else {
        ops.push(
          client.from('purchase_orders').update(poToRow(tx, projectId, userId)).eq('id', tx.id)
            .then(function (r) {
              if (r.error) throw r.error;
              // Re-sync items: delete + re-insert
              return client.from('po_items').delete().eq('po_id', tx.id)
                .then(function (r2) {
                  if (r2.error) throw r2.error;
                  if (!(tx.items && tx.items.length)) return;
                  var itemRows = tx.items.map(function (it, i) { return poItemToRow(it, tx.id, i); });
                  return client.from('po_items').insert(itemRows)
                    .then(function (r3) { if (r3.error) throw r3.error; });
                });
            })
        );
      }
    });

    return Promise.all(ops);
  }

  function syncProject(oldProject, newProject, userId) {
    if (!oldProject || !client) return Promise.resolve();
    var pid  = newProject.id;
    var ops  = [];

    // Project meta
    var metaFields = ['code','name','location','client','contractValue','startDate','endDate','status','progress'];
    var metaChanged = metaFields.some(function (f) { return oldProject[f] !== newProject[f]; });
    if (metaChanged) ops.push(updateProjectMeta(newProject));

    // Budgets
    if (JSON.stringify(oldProject.budgets) !== JSON.stringify(newProject.budgets)) {
      ops.push(syncBudgets(pid, newProject.budgets));
    }

    // Categories (per kind) — sync if names OR costs changed
    var allKinds = ['income','material','labor','subcontract','machine','other'];
    allKinds.forEach(function (kind) {
      var oldNames = (oldProject.categories || {})[kind] || [];
      var newNames = (newProject.categories || {})[kind] || [];
      var oldCosts = ((oldProject.categoryCosts || {})[kind]) || {};
      var newCosts = ((newProject.categoryCosts || {})[kind]) || {};
      var changedNames = JSON.stringify(oldNames) !== JSON.stringify(newNames);
      var changedCosts = JSON.stringify(oldCosts) !== JSON.stringify(newCosts);
      if (changedNames || changedCosts) {
        ops.push(syncCategories(pid, kind, newNames, newCosts));
      }
    });

    // Transactions
    ops.push(syncTransactions(pid, oldProject.transactions || [], newProject.transactions || [], userId));

    return Promise.all(ops);
  }

  // ─────────────────────────────────────────────
  // DELETE PROJECT (cascades to all related rows)
  // ─────────────────────────────────────────────

  function deleteProject(projectId) {
    return client.from('projects').delete().eq('id', projectId)
      .then(function (res) { if (res.error) throw res.error; });
  }

  // ─────────────────────────────────────────────
  // PROJECT MEMBERS
  // ─────────────────────────────────────────────

  function getMembersOfProject(projectId) {
    function mapRows(rows) {
      return (rows || []).map(function (m) {
        var p = m.profiles || {};
        return {
          id:          m.id,
          userId:      m.user_id,
          role:        mapDbRoleToUi(m.role),
          dbRole:      m.role,
          addedAt:     m.added_at || '',
          displayName: p.display_name || '',
          email:       p.email || '',
          isOwner:     m.role === 'owner'
        };
      });
    }
    return client.from('project_members')
      .select('*, profiles(id, display_name, email)')
      .eq('project_id', projectId)
      .then(function (res) {
        if (res.error) {
          console.warn('[db] getMembersOfProject join failed, falling back:', res.error.message);
          return client.from('project_members').select('*').eq('project_id', projectId)
            .then(function (r2) {
              if (r2.error) throw r2.error;
              return mapRows(r2.data);
            });
        }
        return mapRows(res.data);
      });
  }

  function findUserByEmail(email) {
    return client.from('profiles')
      .select('id, display_name, email')
      .ilike('email', email.trim())
      .maybeSingle()
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data;
      });
  }

  function addProjectMember(projectId, userId, uiRole, addedBy) {
    var dbRole = mapUiRoleToDb(uiRole);
    return client.from('project_members')
      .insert({ project_id: projectId, user_id: userId, role: dbRole, added_by: addedBy })
      .then(function (res) { if (res.error) throw res.error; });
  }

  function updateMemberRole(projectId, userId, uiRole) {
    var dbRole = mapUiRoleToDb(uiRole);
    return client.from('project_members')
      .update({ role: dbRole })
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .then(function (res) { if (res.error) throw res.error; });
  }

  function removeProjectMember(projectId, userId) {
    return client.from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .then(function (res) { if (res.error) throw res.error; });
  }

  // ─────────────────────────────────────────────
  // FILE UPLOAD
  // ─────────────────────────────────────────────

  function uploadFile(bucket, path, file) {
    return client.storage.from(bucket).upload(path, file, { upsert: true })
      .then(function (res) {
        if (res.error) throw res.error;
        var urlRes = client.storage.from(bucket).getPublicUrl(path);
        return urlRes.data.publicUrl;
      });
  }

  // ─────────────────────────────────────────────
  // LIGHTWEIGHT — fetch transactions only (for polling)
  // ─────────────────────────────────────────────
  function getProjectTransactions(projectId) {
    return Promise.all([
      client.from('income_records').select('*').eq('project_id', projectId).order('date', { ascending: false }),
      client.from('purchase_orders').select('*, po_items(*)').eq('project_id', projectId).order('date', { ascending: false })
    ]).then(function (results) {
      if (results[0].error) throw results[0].error;
      if (results[1].error) throw results[1].error;
      var incomes = (results[0].data || []).map(mapIncomeRow);
      var pos     = (results[1].data || []).map(mapPORow);
      return incomes.concat(pos);
    });
  }

  // ─────────────────────────────────────────────
  // REALTIME — live project sync across clients
  // ─────────────────────────────────────────────

  // Fetch a single PO with its items (used after a realtime UPDATE event)
  function getPOFull(poId) {
    return client.from('purchase_orders')
      .select('*, po_items(*)')
      .eq('id', poId)
      .single()
      .then(function(res) {
        if (res.error) throw res.error;
        return mapPORow(res.data);
      });
  }

  // Subscribe to all PO + income changes for one project.
  // onPO(eventType, poId, mappedPO | null)
  // onIncome(eventType, txId, mappedTx | null)
  function subscribeToProject(projectId, onPO, onIncome) {
    if (!client) return null;

    var channel = client
      .channel('forhouse-proj-' + projectId)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'purchase_orders',
        filter: 'project_id=eq.' + projectId
      }, function(payload) {
        var ev = payload.eventType;
        if (ev === 'DELETE') {
          var did = payload.old && payload.old.id;
          if (did) onPO('DELETE', did, null);
          return;
        }
        var newId = payload.new && payload.new.id;
        if (!newId) return;
        // Re-fetch to include po_items
        getPOFull(newId)
          .then(function(po) { onPO(ev, newId, po); })
          .catch(function(e) { console.warn('[RT] PO fetch error:', e); });
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'income_records',
        filter: 'project_id=eq.' + projectId
      }, function(payload) {
        var ev = payload.eventType;
        if (ev === 'DELETE') {
          var did = payload.old && payload.old.id;
          if (did) onIncome('DELETE', did, null);
          return;
        }
        var row = payload.new;
        if (!row) return;
        onIncome(ev, row.id, mapIncomeRow(row));
      })
      .subscribe(function(status) {
        console.log('[RT] channel status for', projectId, '=', status);
      });

    return channel;
  }

  function unsubscribeProject(channel) {
    if (!client || !channel) return;
    try { client.removeChannel(channel); } catch (e) {}
  }

  // ─────────────────────────────────────────────
  // isReady — check if config has been filled in
  // ─────────────────────────────────────────────

  function isReady() {
    return !!(client && supabaseUrl && supabaseUrl !== 'https://YOUR_PROJECT_ID.supabase.co');
  }

  // ─────────────────────────────────────────────
  // EXPORT
  // ─────────────────────────────────────────────

  window.db = {
    isReady:  isReady,
    client:   client,
    auth: {
      signIn:        signIn,
      signUp:        signUp,
      signOut:       signOut,
      getSession:    getSession,
      onAuthChange:  onAuthChange,
      getProfile:    getProfile,
      upsertProfile: upsertProfile
    },
    projects: {
      getProjects:         getProjects,
      getProjectFull:      getProjectFull,
      createProject:       createProject,
      deleteProject:       deleteProject,
      syncProject:         syncProject,
      updateProjectMeta:   updateProjectMeta,
      syncBudgets:         syncBudgets,
      syncCategories:      syncCategories,
      subscribeToProject:  subscribeToProject,
      unsubscribeProject:  unsubscribeProject,
      getProjectTransactions: getProjectTransactions
    },
    files:   { uploadFile: uploadFile },
    members: {
      getProjectMembers: getMembersOfProject,
      findUserByEmail:   findUserByEmail,
      addMember:         addProjectMember,
      updateMemberRole:  updateMemberRole,
      removeMember:      removeProjectMember
    }
  };

})();
