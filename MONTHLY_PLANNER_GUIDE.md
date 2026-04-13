# Monthly Content Planner - Implementation Guide

## Overview
The new Monthly Content Planner allows users to quickly plan content for an entire month by specifying quantities for different platform-content type combinations, instead of entering each individual post.

## UI Changes

### New Component: `monthly-content-planner-modal.tsx`
- **Location**: `/components/monthly-content-planner-modal.tsx`
- **Purpose**: Allows users to input:
  - Client (required)
  - Month & Year (required)
  - Content grid: Platform × Content Type with quantities
  - Notes (optional)
- **Key Features**:
  - Dynamic grid showing all platform-content type combinations
  - +/- buttons to adjust quantities
  - Live total counter showing total items being created
  - Clean, intuitive interface with purple accent color

### Updated Content Tracker Page
- Added "Monthly Plan" button (purple) alongside existing "Add Content" button (blue)
- Button opens the monthly planner modal
- Fetches clients on component mount for the dropdown

### Owner Field Change
- **Owner is no longer mandatory** when creating content via the monthly planner
- `owner_id` is set to `null` when creating bulk content
- Users can still assign ownership after creation via individual edit

## Backend API Changes

### New Endpoint: `POST /api/content/monthly-plans`

**Request Body:**
```json
{
  "clientId": "uuid",
  "month": "01", // MM format
  "year": "2024",
  "items": [
    {
      "platform": "Instagram",
      "contentType": "Reel",
      "quantity": 15
    },
    {
      "platform": "Blog",
      "contentType": "Article",
      "quantity": 4
    }
  ],
  "notes": "Optional notes about the monthly plan"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Created monthly plan with X content items",
  "itemsCreated": 19
}
```

**How it Works:**
1. Takes the monthly plan data
2. Converts it to individual `content_records` entries
3. Distributes dates across the month evenly
4. All records are set to status: "planned"
5. All records have `owner_id: null` and `created_by: current_user_id`

## Database Schema Impact

### Current `content_records` Table
No schema changes required. The new system leverages existing fields:

- `client_id` - Client reference
- `platform` - Platform name
- `content_type` - Type of content
- `planning_month` - Month (01-12)
- `planning_year` - Year (added via this flow, can be null for old data)
- `planned_date` - Auto-calculated distribution across month
- `owner_id` - Set to NULL for bulk created items (can be assigned later)
- `created_by` - Current logged-in user
- `status` - Set to "planned"
- `notes` - Bulk notes for the plan

### Optional Fields to Consider (for future enhancement):
If you want to track which items came from a monthly plan vs individual creation:
- `monthly_plan_flag` (boolean) - Marks items created from a monthly plan
- `monthly_plan_id` (uuid) - Links items back to the original plan (if storing plans separately)

## Workflow Example

**User Input:**
- Client: "Acme Corp"
- Month: "April 2024"
- Content Plan:
  - Instagram Reels: 15
  - Instagram Posts: 10
  - Blog Articles: 4
  - Email Newsletter: 2
  - TikTok Videos: 8

**What Gets Created:**
39 individual `content_records` entries with:
- All linked to "Acme Corp" client
- Distributed dates across April 2024
- Status: "planned"
- Owner: unassigned (can be set later)
- Each with appropriate platform and content type
- All linked to the creating user

## Key Differences from Old Flow

| Aspect | Old Flow | New Flow |
|--------|----------|----------|
| Entry per | Individual post | Monthly quantities |
| Time to Plan 30 posts | ~5-10 minutes | ~1 minute |
| Owner Required | Yes (mandatory) | No (optional, can assign later) |
| Date Precision | Specific date required | Auto-distributed across month |
| Bulk Operations | Not supported | Full monthly plan at once |

## Frontend Integration Points

1. **Content Tracker Page** - Added monthly planner modal trigger
2. **Modal Component** - Handles UI and submission
3. **API Call** - Sends plan to backend, triggers refresh
4. **Content Visibility Table** - Automatically shows new records after refresh

## No Breaking Changes

- Existing "Add Content" button remains unchanged
- Old individual entry method still works
- All data compatibility maintained
- Can mix and match both approaches

## Future Enhancements

1. Store monthly plans separately for editing/re-planning
2. Template monthly plans for recurring clients
3. Export/import plans
4. Auto-assign owners based on platform preferences
5. Drag-and-drop date distribution instead of automatic
6. Copy previous month's plan as starting point
