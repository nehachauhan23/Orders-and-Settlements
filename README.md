Prerequisites and setup —
Node.js , npm. 

SETUP & RUN - 

1. GIT CLONE 
2. cd backend 
npm i 
add mongodb url in .env 
add mongodb test url in .env.test
npm run seed 

API overview — auth, orders, payments, dashboard endpoints in tables, plus the consistent error shape and status code meanings.

Status derivation rules & edge cases — the four-state derivation logic, the paid-beats-overdue precedence rule with the reasoning behind it, and a table of five other edge cases that were decided explicitly rather than left implicit (total recalculation on edit, locking after payment, the >= vs == defensive margin, due-date changes on overdue orders, concurrent overpayment attempts).

Assumptions and tradeoffs — locking after first payment, delete-only-before-payment, in-app dashboard aggregation, client-supplied idempotency keys, the replica-set requirement, single long-lived JWT, and a note on the test-environment network limitation.

What I'd improve before production — seven concrete items, ordered from most to least urgent.

Deployed URL — 
