# Sprint Auto-Creation System Documentation

## Overview
Automatic weekly sprint creation system with intelligent naming protocol: **Sprint N_XXX_MonDD-MonDD**

## Naming Format
- **Sprint 1_WAR_Apr27-May3**
  - `Sprint` — Literal prefix
  - `1` — Sequential number per client (auto-incremented: 1, 2, 3...)
  - `WAR` — First 3 letters of client name (uppercase)
  - `Apr27-May3` — Compact date range (Monday-Saturday)

## Components

### 1. Utility Functions (`/lib/sprint-naming.ts`)
- `generateSprintName(clientName, sequenceNumber, startDate?, endDate?)` — Generates properly formatted sprint name
- `getNextSequenceNumber(sprints)` — Calculates next sequence number from existing sprints
- `getCurrentWeekMonday()`, `getNextWeekMonday()` — Date calculations
- `extractSequenceNumber(sprintName)` — Parses sequence from existing sprint names

### 2. Auto-Create API (`/api/sprints/auto-create/route.ts`)
**POST /api/sprints/auto-create**
- Lists all active clients
- Calculates next sprint sequence for each client
- Creates new sprint with auto-generated name
- Returns: `{ created: [], errors: [], summary: "..." }`

**When to call:**
- Manually via API for testing
- Automatically every Monday 12:00 AM UTC (via Vercel cron)

### 3. Vercel Cron Job (`/api/cron/sprint-auto-create/route.ts`)
**GET /api/cron/sprint-auto-create**
- Runs every Saturday at 12:00 AM UTC
- Calls `/api/sprints/auto-create` endpoint
- Requires `CRON_SECRET` header for authentication

**Environment Variables needed:**
```env
CRON_SECRET=<your-secret-key>
```

### 4. Vercel Configuration (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/cron/sprint-auto-create",
      "schedule": "0 0 * * SAT"  // Saturday midnight UTC
    }
  ]
}
```

### 5. UI Enhancement (`InlineSprintCreator`)
- **Auto-naming toggle** (default enabled with ✨ Sparkles icon)
- **Preview display** — Shows auto-generated name without input field
- **Manual override** — Toggle off to manually enter custom names
- **Smart dates** — Auto-fills Monday-Saturday, respects toggle state

## Setup Instructions

### 1. Set Environment Variables
In your Vercel project settings:
```
CRON_SECRET = <generate-a-secure-random-string>
```

### 2. Deploy
Deploy the updated code to Vercel. Vercel will register the cron job automatically.

### 3. Test Manually
```bash
curl -X POST https://your-app.vercel.app/api/sprints/auto-create \
  -H "Content-Type: application/json"
```

### 4. Verify Cron Job
In Vercel Dashboard → Project Settings → Crons, you should see:
- `/api/cron/sprint-auto-create` scheduled for every Saturday at 00:00 UTC

## Usage

### Auto-Creation (Default)
Every Saturday at 12:00 AM UTC, the system automatically:
1. Fetches all active clients
2. Counts their existing sprints
3. Generates new sprint name: `Sprint N_XXX_MonDD-MonDD`
4. Creates sprint with auto-generated name and dates
5. Logs results (successes + errors)

This gives teams the entire Sunday to plan and organize for the upcoming sprint, with fresh sprint cards ready to populate on Monday morning.

### Manual Creation
Users can toggle **"Auto-generate sprint name"** off in InlineSprintCreator to:
- Enter custom sprint names
- Override default dates
- Create sprints on-demand

## Brand Story
**"Weekly Sprints, Weekly Wins"** — Sequential numbering (Sprint 1, Sprint 2, Sprint 3...) tells the story of cumulative progress over time, while client initials create ownership and identity.

## Edge Cases

### What if a client has no sprints?
- Sequence starts at 1: `Sprint 1_ABC_Jan01-Jan07`

### What if sprint creation fails?
- Error is logged and included in response
- Cron job continues processing other clients
- Failed clients can be retried manually

### What if Monday falls on a holiday?
- Cron still runs on Saturday (no smart holiday detection)
- Manual override available via InlineSprintCreator

### What about clients in different timezones?
- Cron runs at 12:00 AM UTC (fixed)
- All sprints span Monday-Saturday in UTC
- Consider timezone implications when communicating to teams

## Data Schema
Sprints now include optional `auto_created` boolean field:
```sql
ALTER TABLE sprints ADD COLUMN auto_created BOOLEAN DEFAULT FALSE;
```

This helps distinguish auto-generated sprints from manually created ones for reporting/audits.

## Future Enhancements
1. **Timezone-aware sprint dates** — Respect client timezone for date ranges
2. **Holiday detection** — Skip creation on major holidays
3. **Custom cadence** — Some clients might need bi-weekly or monthly sprints
4. **Sprint goals templating** — Pre-populate with default goals/descriptions
5. **Notification system** — Alert team leads when new sprint is created
