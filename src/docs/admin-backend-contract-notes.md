# Admin Backend Contract Notes

This frontend intentionally mirrors current backend behavior, including inconsistent response and error shapes.

## Response Shape Constraints
- Some endpoints return `{ success, message, data }`.
- Some endpoints return `{ message, token }`.
- Some endpoints return `{ vendor: ... }`.
- Some mutation endpoints return success message only.
- Frontend behavior:
  - Always normalize response payloads.
  - Treat message-only mutations as successful when HTTP status is successful.
  - Refetch resources after mutations that may not return the updated entity.

## Error Shape Constraints
- Errors may return:
  - `{ message }`
  - `{ success:false, message, data:{} }`
- Frontend behavior:
  - Parse message from multiple known paths.
  - Fall back to status-aware defaults for 400/401/403/404/409/500.

## Auth Constraints
- Admin uses vendor auth only:
  - `Authorization: Bearer <vendorToken>`
- Explicitly not used in Admin:
  - `x-user-authorization`
  - `x-user-token`
  - `/user/register`
  - `/user/login`

## Item and Option Group Constraints
- Photo upload must be multipart.
- File key must be exactly `photo`.
- Non-image files and files larger than 5MB are rejected by frontend before request.
- Option groups support two update modes:
  - `replace`: full payload with no IDs.
  - `patch`: payload with `group_id`, `option_id`, `is_deleted` where needed.

## Table Constraints
- Public QR image endpoint:
  - `GET /tables/:table_id/qr`
- Table mutation responses can omit expected fields.
- Frontend behavior:
  - Refetch list/detail after create/update/toggle/availability.
  - Surface `409 table_number already exists for this vendor` as conflict.

## Order Constraints
- Status enum:
  - `0=pending`
  - `1=accepted`
  - `2=completed`
- Allowed transitions:
  - `0->1`
  - `1->2`
- Frontend behavior:
  - Invalid transitions blocked in UI.
  - Refresh order and table data after status change.

## Manual QA Checklist
1. Vendor login succeeds and token persists across refresh.
2. Expired/invalid token triggers logout flow on 401.
3. Profile update rejects empty/no-change payload and succeeds with valid change.
4. Razorpay key update works and success message is shown.
5. Category create/update/delete works with status `0/1`.
6. Category filter/search/pagination state is preserved after mutation.
7. Item create works with photo upload using multipart and `photo` key.
8. Item create/edit validates non-image file rejection and 5MB limit.
9. Item option group replace mode sends full payload and succeeds.
10. Item option group patch mode supports update/delete via IDs and succeeds.
11. Table create/update/toggle/availability each refetch and reflect latest state.
12. Table duplicate number returns conflict message (409 handling).
13. QR preview loads from public endpoint and QR download works.
14. Order list and detail load correctly.
15. Order status buttons allow only `0->1` and `1->2`.
16. After order status update, table/order data are refreshed.

