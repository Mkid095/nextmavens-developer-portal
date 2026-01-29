# Delete User Feature - Implementation Plan

**Story:** US-005 - Implement Delete User
**Step:** Step 1 - Foundation
**Date:** 2026-01-29

---

## Overview

This document outlines the foundation plan for implementing the Delete User feature in the Auth User Manager. The feature allows administrators to permanently remove user accounts from the system.

## Current State Analysis

### Existing API Endpoint
- **Route:** `DELETE /api/admin/users/[userId]`
- **Location:** `/home/ken/developer-portal/src/app/api/admin/users/[userId]/route.ts`
- **Authorization:** Requires admin role (via `requireAdmin`)
- **Audit Logging:** Already integrated using `logUserAction.removed`
- **Safety:** Prevents self-deletion

### Existing Components
- **UserDetail:** `/home/ken/developer-portal/src/features/admin/users/UserDetail.tsx`
  - Displays user information, metadata editor
  - No delete functionality yet
  - Uses standard styling patterns (slate colors, white cards, emerald accents)

### Dependencies Available
- **UI Library:** `lucide-react` for icons
- **Animation:** `framer-motion` for modal transitions
- **Audit Logs:** `@nextmavens/audit-logs-database` package
- **Auth:** `@/lib/middleware` for authentication
- **Authorization:** `@/features/abuse-controls/lib/authorization` for role checks

---

## Component Hierarchy

```
UserDetail (existing)
├── UserInformation (existing section)
├── UserMetadata (existing section)
└── DangerZone (NEW section)
    └── DeleteUserButton (NEW)
        └── DeleteUserConfirmationModal (NEW)
```

---

## Data Flow for Delete Operation

### Step 1: User Initiation
```
User clicks "Delete User" button
  ↓
Show confirmation modal with user email
```

### Step 2: Confirmation
```
User confirms deletion by typing user email
  ↓
Button becomes enabled
  ↓
User clicks "Confirm Delete"
```

### Step 3: API Call
```
DELETE request to /api/admin/users/[userId]
  ↓
Backend validates:
  - User is authenticated (requireAdmin)
  - User is not deleting themselves
  - User exists in database
  ↓
User deleted from database
  ↓
Audit log entry created (logUserAction.removed)
```

### Step 4: UI Update
```
Success response received
  ↓
Show success notification
  ↓
Navigate back to user list
  ↓
User list refreshes (deleted user no longer appears)
```

---

## API Endpoints

### Existing Endpoint (Already Implemented)
```typescript
DELETE /api/admin/users/[userId]
```

**Request:**
- Headers: `Authorization: Bearer <token>`

**Response (Success):**
```json
{
  "success": true,
  "message": "User removed successfully"
}
```

**Response (Error):**
```json
{
  "error": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request (e.g., self-deletion)
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - User not found
- `500` - Server error

---

## Component Design

### 1. DeleteUserButton Component

**File:** `/home/ken/developer-portal/src/features/users/components/DeleteUserButton.tsx`

**Props:**
```typescript
interface DeleteUserButtonProps {
  userId: string;
  userEmail: string;
  userName: string | null;
  onDelete?: () => void; // Optional callback after successful delete
}
```

**Features:**
- Danger button styling (red background, white text)
- Icon: `Trash2` from lucide-react
- Opens confirmation modal on click
- Loading state during deletion
- Disabled state for self-deletion prevention

**Styling:**
```tsx
className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
```

### 2. DeleteUserConfirmationModal Component

**File:** `/home/ken/developer-portal/src/features/users/components/DeleteUserConfirmationModal.tsx`

**Props:**
```typescript
interface DeleteUserConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userEmail: string;
  userName: string | null;
  isLoading: boolean;
}
```

**Features:**
- Modal overlay with backdrop blur
- Warning message with user details
- Email confirmation input (security measure)
- Two buttons: "Cancel" and "Confirm Delete"
- Delete button disabled until email matches
- Loading state during deletion
- Error message display
- Uses framer-motion for smooth transitions

**Styling:**
- Modal: White background, rounded-xl, border-slate-200
- Overlay: bg-slate-900/50 backdrop-blur-sm
- Warning text: red-600 for emphasis
- Input: Standard form input with focus ring

**Safety Measure:**
User must type the user's email to confirm, preventing accidental deletions.

---

## Error Handling Strategy

### Frontend Errors
1. **Network Error:** Show error message in modal, keep modal open
2. **401 Unauthorized:** Redirect to login
3. **403 Forbidden:** Show "Insufficient permissions" message
4. **404 Not Found:** Show "User no longer exists", redirect to list
5. **500 Server Error:** Show generic error message

### Error Display
- Error messages appear in the modal (not alerts)
- Red text with error icon
- Modal remains open for retry or cancel

### Backend Errors (Already Implemented)
The existing API endpoint handles:
- Self-deletion prevention
- User not found
- Authorization failures
- Database errors

---

## Audit Log Integration

### Audit Event Type
The existing endpoint already logs deletions using:

```typescript
await logUserAction.removed(
  userActor(admin.id),
  targetUser.id,
  'Removed by admin',
  {
    request: {
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    },
    metadata: {
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      organization: targetUser.organization,
    },
  }
)
```

### Audit Log Fields Captured
- **Action:** `user.removed`
- **Actor:** Admin user ID
- **Target:** Deleted user ID
- **IP Address:** Client IP
- **User Agent:** Browser/client info
- **Metadata:** Email, name, role, organization

---

## Type Definitions

### New Types to Add

**File:** `/home/ken/developer-portal/src/features/users/types.ts`

```typescript
/**
 * Delete user component props
 */
export interface DeleteUserButtonProps {
  userId: string;
  userEmail: string;
  userName: string | null;
  onDelete?: () => void;
}

/**
 * Delete user confirmation modal props
 */
export interface DeleteUserConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userEmail: string;
  userName: string | null;
  isLoading: boolean;
}

/**
 * Delete user state
 */
export interface DeleteUserState {
  isDeleting: boolean;
  showConfirmation: boolean;
  error: string | null;
}

/**
 * API response for delete user operation
 */
export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

/**
 * Error types for delete operation
 */
export type DeleteUserError =
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';
```

---

## File Structure

```
/home/ken/developer-portal/src/features/users/
├── components/
│   ├── DeleteUserButton.tsx          (NEW - ~80 lines)
│   └── DeleteUserConfirmationModal.tsx (NEW - ~150 lines)
├── types.ts                           (NEW - ~50 lines)
├── index.ts                           (NEW - exports)
└── DELETE-USER-PLAN.md                (NEW - this file)
```

**Total Lines:** ~280 lines (well under 300 line limit per component)

---

## Integration Points

### 1. UserDetail Component Integration

**Location:** `/home/ken/developer-portal/src/features/admin/users/UserDetail.tsx`

**Add to UserDetail:**
```tsx
import { DeleteUserButton } from '@/features/users/components/DeleteUserButton'

// In the component, after UserMetadata section:
<div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
  <div className="px-6 py-4 border-b border-slate-200">
    <h2 className="font-semibold text-red-600">Danger Zone</h2>
  </div>
  <div className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Delete User</h3>
        <p className="text-xs text-slate-500 mt-1">
          Permanently remove this user from the platform. This action cannot be undone.
        </p>
      </div>
      <DeleteUserButton
        userId={user.id}
        userEmail={user.email}
        userName={user.name}
        onDelete={() => {
          // Navigate back to user list
          router.push('/studio/users')
        }}
      />
    </div>
  </div>
</div>
```

### 2. User List Update (Future Story)

When US-002 is implemented, the user list will need to:
- Auto-refresh after a user is deleted
- Show a "User deleted successfully" toast/notification
- Remove the deleted user from the list without full page reload

---

## Security Considerations

### 1. Authorization
- Only admins can delete users (enforced by API)
- Frontend hides button for non-admins

### 2. Self-Deletion Prevention
- API prevents users from deleting themselves
- Frontend can disable button for current user

### 3. Confirmation Required
- Modal requires email confirmation
- Prevents accidental deletions

### 4. Audit Trail
- All deletions logged with actor, target, IP, user agent
- Immutable record for compliance

### 5. Error Messages
- Generic error messages to users
- Detailed errors logged to console for debugging
- No sensitive data leaked in errors

---

## Quality Standards

### TypeScript Compliance
- No `any` types
- All interfaces properly defined
- Proper type guards for error handling

### Import Standards
- Use `@/` aliases for all imports
- No relative imports
- Group imports: React → Third-party → Local

### Styling Standards
- No gradients (use solid colors)
- Follow existing color scheme:
  - Primary: slate-900, slate-700
  - Success: emerald-700
  - Warning: amber-600
  - Danger: red-600, red-700
  - Background: bg-[#F3F5F7], white cards
- Consistent spacing using Tailwind classes
- Responsive design (mobile-first)

### Component Size Limits
- DeleteUserButton: < 100 lines
- DeleteUserConfirmationModal: < 200 lines
- Total per component: < 300 lines ✓

---

## Testing Checklist

### Manual Testing (Step 1 Foundation)
- [ ] Plan document created
- [ ] Component hierarchy designed
- [ ] Data flow documented
- [ ] API endpoints identified
- [ ] Types defined
- [ ] Security considerations documented

### Future Testing (Step 5 Implementation)
- [ ] Delete button appears in UserDetail
- [ ] Confirmation modal opens on click
- [ ] Email confirmation works correctly
- [ ] Delete button disabled until email matches
- [ ] API call succeeds with valid authorization
- [ ] Error messages display correctly
- [ ] Loading states work
- [ ] Success notification appears
- [ ] User is removed from list after deletion
- [ ] Audit log entry created
- [ ] Cannot delete own account
- [ ] Non-admins cannot delete users

### Type Checking
- [ ] `pnpm typecheck` passes
- [ ] No TypeScript errors

### Linting
- [ ] `pnpm lint` passes
- [ ] No ESLint warnings

---

## Implementation Order

### Step 1 (Current - Foundation)
1. ✓ Create this plan document
2. ✓ Design component structure
3. ✓ Define types
4. ✓ Document data flow
5. ✓ Identify security requirements

### Step 2 (Future - Package Manager)
- N/A (already using npm)

### Step 5 (Future - Implementation)
1. Create types.ts file
2. Create DeleteUserConfirmationModal component
3. Create DeleteUserButton component
4. Integrate into UserDetail component
5. Test all user flows
6. Fix any typecheck/lint errors

### Step 7 (Future - Data Layer)
- Verify audit log integration works
- Test API endpoint functionality
- Verify error handling

### Step 10 (Future - Final Testing)
- Full end-to-end testing
- Browser testing with Chrome DevTools
- Security verification
- Audit log verification

---

## Dependencies on Other Stories

### Required Before Implementation
- **US-003:** User Detail View (already exists)
- **US-011:** Auth Service API Integration (endpoint exists)

### Related Future Stories
- **US-002:** User List Component (will need refresh logic)
- **US-004:** Disable User (similar pattern, can reference implementation)
- **US-006:** Reset Password (similar modal pattern)

---

## Success Criteria

### Foundation Complete (Step 1)
- [x] Plan document created with complete design
- [x] Component hierarchy defined
- [x] Data flow documented
- [x] API endpoints identified
- [x] Types defined
- [x] Security considerations documented

### Implementation Complete (Future Steps)
- [ ] All components created
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Delete button visible in UserDetail
- [ ] Confirmation modal works
- [ ] API calls successful
- [ ] User removed from list
- [ ] Audit logs created
- [ ] Error handling works
- [ ] No security vulnerabilities

---

## Notes

### Design Decisions
1. **Email Confirmation:** Required for safety - prevents misclicks
2. **Modal over Alert:** Better UX, allows for confirmation input
3. **Danger Zone Section:** Follows common UI pattern (GitHub, Vercel, etc.)
4. **Separate Components:** Reusable and testable
5. **No Soft Delete:** Permanent deletion per PRD requirements

### Alternatives Considered
1. **Undo Button:** Not implemented due to complexity
2. **Scheduled Deletion:** Not in scope for this story
3. **Cascading Delete:** Not addressed (future consideration)

### Future Enhancements
- Soft delete with recovery
- Bulk delete operations
- Delete reason input
- Email notification to deleted user
- Deletion queue for large organizations

---

**Document Status:** Complete
**Next Step:** Step 5 - Implementation
