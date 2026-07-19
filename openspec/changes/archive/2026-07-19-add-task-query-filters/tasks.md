## 1. Spec & design

- [x] 1.1 Confirm delta spec scenarios for unfiltered / status / priority / AND / invalid-value
- [x] 1.2 Confirm invalid-value contract matches PROP-DEC-001 (400 Bad Request)

## 2. Implementation

- [x] 2.1 Bind optional `status` and `priority` query params on `GET /tasks`
- [x] 2.2 Parse values to `TaskState`/`TaskPriority`; return `400` on an unrecognized value (PROP-DEC-001)
- [x] 2.3 Add a domain-owned `TaskStore` query method applying AND filtering (R-004)
- [x] 2.4 Delegate from the endpoint to the domain query method (keep the endpoint thin)

## 3. Tests

- [x] 3.1 Test: filter by status returns only matching tasks
- [x] 3.2 Test: filter by priority returns only matching tasks
- [x] 3.3 Test: combined status+priority uses AND
- [x] 3.4 Test: invalid status value returns 400
- [x] 3.5 Test: unfiltered `GET /tasks` still returns all tasks (baseline preserved, R-003)
- [x] 3.6 Test: invalid priority value returns 400          # added by REV-DEC-001
