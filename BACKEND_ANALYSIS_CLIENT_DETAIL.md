# Backend Requirements for Client Detail Page (/content-visibility/client/[clientId])

## Current Page Features (From Frontend Code)

The client detail page displays:
1. **Hero Section**: Client name, publication target, published count, performance %, days left, top performer, needs improvement posts
2. **Post Performance Timeline**: Individual post metrics with engagement rates
3. **Quick Reviews**: Per-post manual review text
4. **Performance Snapshots**: Multi-day metric tracking (Day 1, 7, 14, 21, 42)
5. **Advanced Views**: Week, Month, Platform breakdowns

---

## Required Backend Tables

### 1. **content_records** ✓ EXISTS
**Purpose**: Store content planning and publishing information

**Current Schema:**
- id, client_id, owner_id, created_by
- title, content_type, platform
- planning_month, planning_week
- planned_date, scheduled_date, published_date
- status, notes, attachments
- created_at, updated_at

**GAPS IDENTIFIED:**
- Missing: `production_started_date` (NEW - needed for production tracking)
- Missing: `production_completed_date` (NEW - needed for production tracking)
- Status enum is limited: only includes "planned", "scheduled", "published", "pending", "missed", "paused"
- Missing status values: "in_production", "production_done" (needed for production flow)

**Needs Migration**: YES - Add 2 new date columns and update status CHECK constraint

---

### 2. **post_reviews** ✓ EXISTS
**Purpose**: Store manual performance reviews for posts

**Current Schema:**
- id, user_id, content_record_id
- review_text, reach_metric, engagement_metric
- likes_metric, comments_metric, shares_metric
- engagement_rate, traction_status
- reviewed_at, created_at, updated_at

**Status**: Fully supports the reviews shown in the detail page

---

### 3. **post_performance_snapshots** ✓ EXISTS
**Purpose**: Track how metrics evolve over time (Day 1, 7, 14, 21, 42)

**Current Schema:**
- id, post_id, client_id
- snapshot_day (1, 3, 7, 14, 21, 42)
- reach_at_snapshot, engagement_at_snapshot, engagement_rate_at_snapshot
- likes_at_snapshot, comments_at_snapshot, shares_at_snapshot
- created_at, updated_at

**GAPS IDENTIFIED:**
- post_id column exists but there's NO FOREIGN KEY relationship defined to content_records table
- Missing: link to content_records.id (should reference content_records, not generic "posts" table)
- Table definition has FOREIGN KEY to "posts" table which doesn't exist in schema

**Needs Fix**: YES - Update FK to reference content_records table

---

### 4. **performance_insights** ✓ EXISTS (But unused)
**Purpose**: Auto-generated insights about post performance

**Current Schema:**
- id, post_id, insight_type
- insight_text, performance_score
- is_high_performer, is_underperformer
- created_at, updated_at

**Status**: Schema exists but UI doesn't consume it - could be used for "Top Performer" insights

---

### 5. **content_targets** ✓ EXISTS
**Purpose**: Store platform-specific publishing targets per client

**Used by**: Platform breakdown feature showing target counts per platform

**Status**: Already integrated with platform metrics display

---

## Data Flow Requirements

### To Populate Client Detail Page:

```
1. Get Client by ID
   └─> Query: content_records WHERE client_id = ? AND planning_month = current_month

2. For each post record:
   ├─> Get post_reviews WHERE content_record_id = ?
   ├─> Get post_performance_snapshots WHERE post_id = ?
   └─> Calculate: engagement_rate = engagement / reach

3. Aggregate metrics:
   ├─> Top performer: Sort by engagement_metric DESC, limit 1
   ├─> Worst performer: Sort by engagement_metric ASC, limit 1
   ├─> Publication progress: COUNT(published_date IS NOT NULL) / COUNT(*)
   └─> Total reach/engagement: SUM()
```

---

## GAPS AND ISSUES SUMMARY

### Critical Issues (Must Fix):

1. **post_performance_snapshots table has broken FK**
   - References non-existent "posts" table
   - Should reference content_records(id)
   - **Fix**: Alter table to correct FK relationship

2. **production_started_date & production_completed_date MISSING**
   - UI displays production flow (Planned → In Progress → Production Done → Scheduled → Published)
   - Backend has no way to record when production starts/completes
   - **Fix**: Add 2 DATE columns to content_records table

3. **Status enum incomplete**
   - Current values: "planned", "scheduled", "published", "pending", "missed", "paused"
   - Missing: "in_production", "production_done"
   - **Fix**: Update CHECK constraint on status column

4. **No relationship between post_performance_snapshots and content_records**
   - Snapshots are orphaned, not linked to actual content records
   - **Fix**: Ensure post_id column properly references content_records(id)

### Nice-to-Have Improvements:

1. **Add computed columns** for:
   - publication_progress_percent
   - days_until_due
   - production_time_hours

2. **Add performance_insights integration**
   - Currently unused but could drive "Top Performer" and "Needs Improvement" logic

3. **Add platform-specific targets validation**
   - Ensure content_records counts match content_targets

---

## Migration Scripts Needed

### 1. Fix post_performance_snapshots FK

```sql
ALTER TABLE post_performance_snapshots
DROP CONSTRAINT post_performance_snapshots_post_id_fkey;

ALTER TABLE post_performance_snapshots
ADD CONSTRAINT post_performance_snapshots_post_id_fkey
  FOREIGN KEY (post_id) REFERENCES content_records(id) ON DELETE CASCADE;
```

### 2. Add production date columns to content_records

```sql
ALTER TABLE content_records
ADD COLUMN IF NOT EXISTS production_started_date DATE,
ADD COLUMN IF NOT EXISTS production_completed_date DATE;
```

### 3. Update status enum

```sql
ALTER TABLE content_records
DROP CONSTRAINT content_records_status_check;

ALTER TABLE content_records
ADD CONSTRAINT content_records_status_check
  CHECK (status IN ('planned', 'in_production', 'production_done', 'scheduled', 'published', 'pending', 'missed', 'paused'));
```

---

## Next Steps

1. Execute the 3 migration scripts above
2. Update ContentRecord type in database.ts to include production dates
3. Update add-content modal to accept production dates
4. Verify post_performance_snapshots loads correctly for client detail page
5. Test complete data flow from recording to display
