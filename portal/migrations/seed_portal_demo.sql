-- Demo / sample seed for the client portal.
--
--   npx wrangler d1 execute siari_build --remote --file=./migrations/seed_portal_demo.sql
--
-- Everything created here is flagged is_demo = 1 and the dashboard renders a
-- "Demo / sample content" badge. Delete with:
--   DELETE FROM projects WHERE is_demo = 1;   (cascades to stages/updates/docs)
--
-- NOTE: change the two email addresses below to real inboxes you control before
-- running, otherwise the invite emails go nowhere. No passwords exist — access
-- is granted by emailing an invite link from the admin screen.

-- Users -----------------------------------------------------------------------
INSERT OR IGNORE INTO users (id, email, name, role, status, created_at, updated_at) VALUES
  ('demo-user-pm',     'marcus.reid@example.com',   'Marcus Reid',   'project_manager', 'invited', datetime('now'), datetime('now')),
  ('demo-user-client', 'daniel.harper@example.com', 'Daniel Harper', 'client',          'invited', datetime('now'), datetime('now'));

-- Project ---------------------------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, name, address, suburb, state, project_type, description, client_summary,
  project_manager_user_id, progress_percent, next_milestone_name, next_milestone_confirmed,
  estimated_completion_label, status, is_demo, created_at, updated_at
) VALUES (
  'demo-project-ellis',
  'Ellis Close Residence',
  'Ellis Close',
  'Sanctuary Lakes',
  'VIC',
  'Custom four-bedroom home',
  'A custom four-bedroom family home.',
  'Your slab is down and inspected. Frame delivery is next.',
  'demo-user-pm',
  45,
  'Frame',
  0,                       -- tentative until the admin confirms it
  'Q1 2026',
  'active',
  1,
  datetime('now'), datetime('now')
);

-- Membership: this row is what grants Daniel access to the project.
INSERT OR IGNORE INTO project_members (id, project_id, user_id, member_type, access_level, status, invited_at, created_at) VALUES
  ('demo-member-client', 'demo-project-ellis', 'demo-user-client', 'client', 'owner_client',     'invited', datetime('now'), datetime('now')),
  ('demo-member-pm',     'demo-project-ellis', 'demo-user-pm',     'admin',  'project_manager',  'active',  datetime('now'), datetime('now'));

-- Nine default stages ---------------------------------------------------------
INSERT OR IGNORE INTO project_stages (id, project_id, stage_number, name, client_description, status, sort_order, client_visible, created_at, updated_at) VALUES
  ('demo-stage-1','demo-project-ellis',1,'Consultation & Brief','We agree what you want to build and what it should cost.','complete',1,1,datetime('now'),datetime('now')),
  ('demo-stage-2','demo-project-ellis',2,'Design & Approvals','Plans are drawn and submitted to council.','complete',2,1,datetime('now'),datetime('now')),
  ('demo-stage-3','demo-project-ellis',3,'Contracts & Selections','Contracts signed and your finishes chosen.','complete',3,1,datetime('now'),datetime('now')),
  ('demo-stage-4','demo-project-ellis',4,'Site Preparation','The block is cleared and set out ready to build.','complete',4,1,datetime('now'),datetime('now')),
  ('demo-stage-5','demo-project-ellis',5,'Foundations & Slab','Footings and the concrete slab your house sits on.','in_progress',5,1,datetime('now'),datetime('now')),
  ('demo-stage-6','demo-project-ellis',6,'Frame','The timber skeleton of the house goes up.','not_started',6,1,datetime('now'),datetime('now')),
  ('demo-stage-7','demo-project-ellis',7,'Lock-up','Roof, windows and doors on — the house can be locked.','not_started',7,1,datetime('now'),datetime('now')),
  ('demo-stage-8','demo-project-ellis',8,'Fixing & Fit-out','Inside work: cabinetry, tiling, plumbing and electrical fittings.','not_started',8,1,datetime('now'),datetime('now')),
  ('demo-stage-9','demo-project-ellis',9,'Finishes & Handover','Final finishes, clean, inspection and your keys.','not_started',9,1,datetime('now'),datetime('now'));

UPDATE projects SET current_stage_id = 'demo-stage-5' WHERE id = 'demo-project-ellis';

-- Four published updates (newest last so published_at ordering is obvious) ------
INSERT OR IGNORE INTO project_updates (id, project_id, title, body, stage_id, status, client_visible, published_at, author_user_id, created_at, updated_at) VALUES
  ('demo-update-1','demo-project-ellis','Site cut & set-out complete',
   'The block has been cut to level and the house position is set out and pegged. Everything matches the approved plans.',
   'demo-stage-4','published',1, datetime('now','-28 days'),'demo-user-pm', datetime('now','-28 days'), datetime('now','-28 days')),
  ('demo-update-2','demo-project-ellis','Plumbing & drainage rough-in complete',
   'Underground plumbing and drainage are installed and pressure tested ahead of the slab pour.',
   'demo-stage-5','published',1, datetime('now','-18 days'),'demo-user-pm', datetime('now','-18 days'), datetime('now','-18 days')),
  ('demo-update-3','demo-project-ellis','Slab pour completed',
   'The concrete slab was poured this morning and is now curing. We keep it damp for several days so it reaches full strength.',
   'demo-stage-5','published',1, datetime('now','-9 days'),'demo-user-pm', datetime('now','-9 days'), datetime('now','-9 days')),
  ('demo-update-4','demo-project-ellis','Council slab inspection passed',
   'The building surveyor inspected the slab today and signed it off with no defects. Frame material is booked for delivery.',
   'demo-stage-5','published',1, datetime('now','-2 days'),'demo-user-pm', datetime('now','-2 days'), datetime('now','-2 days'));

-- Contacts --------------------------------------------------------------------
INSERT OR IGNORE INTO project_contacts (id, project_id, name, role, email, phone, client_visible, sort_order, created_at, updated_at) VALUES
  ('demo-contact-pm',    'demo-project-ellis','Marcus Reid','Project Manager','marcus.reid@example.com','0400 000 000',1,1,datetime('now'),datetime('now')),
  ('demo-contact-admin', 'demo-project-ellis','Siari Build Office','Office / Admin','hello@siaribuild.com.au','0400 000 001',1,2,datetime('now'),datetime('now')),
  -- Subcontractors are NOT client-visible by default.
  ('demo-contact-sub',   'demo-project-ellis','Lakeside Concreting','Concreter','info@example.com',NULL,0,3,datetime('now'),datetime('now'));

-- Documents -------------------------------------------------------------------
-- Rows only: there are no files behind them until you upload via the admin screen.
-- They deliberately have NO current_version_id, so they stay invisible to clients
-- (the client query requires a joined, visible version). Upload a file against
-- each to make it appear — that is the honest way to demo the storage path.
INSERT OR IGNORE INTO documents (id, project_id, display_name, document_type, status, client_visible, description, created_at, updated_at) VALUES
  ('demo-doc-1','demo-project-ellis','Building Contract — signed','contract','draft',1,'Awaiting file upload.',datetime('now'),datetime('now')),
  ('demo-doc-2','demo-project-ellis','Architectural Plans','plans','draft',1,'Awaiting file upload (Rev C).',datetime('now'),datetime('now')),
  ('demo-doc-3','demo-project-ellis','Building Permit','permit','draft',1,'Awaiting file upload.',datetime('now'),datetime('now')),
  ('demo-doc-4','demo-project-ellis','Colour & Finishes Schedule','colour_finishes_schedule','draft',1,'Awaiting file upload.',datetime('now'),datetime('now')),
  ('demo-doc-5','demo-project-ellis','Engineering & Soil Report','engineering','draft',1,'Awaiting file upload.',datetime('now'),datetime('now'));
