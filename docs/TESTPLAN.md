# Test Plan — Account Management System

**Application:** COBOL Account Management System  
**Target migration:** Node.js  
**Source files:** `src/cobol/main.cob`, `src/cobol/operations.cob`, `src/cobol/data.cob`

---

## Scope

This test plan covers all business logic in the current COBOL implementation. It is intended to be used as the reference for validating behaviour with business stakeholders and for driving unit and integration tests in the future Node.js application.

---

## Test Cases

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-01 | View initial balance | Application freshly started; no prior operations performed | 1. Launch application<br>2. Select option `1` (View Balance)<br>3. Select option `4` (Exit) | Balance displayed is `1000.00` | | | Default balance seeded at `1000.00` in working storage |
| TC-02 | Credit account with a valid positive amount | Application started; current balance is `1000.00` | 1. Select option `2` (Credit Account)<br>2. Enter amount `500.00`<br>3. Select option `1` (View Balance) | New balance displayed is `1500.00` | | | Standard credit flow |
| TC-03 | Debit account with sufficient funds | Application started; current balance is `1000.00` | 1. Select option `3` (Debit Account)<br>2. Enter amount `200.00`<br>3. Select option `1` (View Balance) | New balance displayed is `800.00` | | | Standard debit flow |
| TC-04 | Debit account with insufficient funds | Application started; current balance is `1000.00` | 1. Select option `3` (Debit Account)<br>2. Enter amount `1500.00` | Error message displayed: `"Insufficient funds for this debit."`; balance remains `1000.00` | | | Core business rule: no overdraft allowed |
| TC-05 | Debit exact balance amount (boundary) | Application started; current balance is `1000.00` | 1. Select option `3` (Debit Account)<br>2. Enter amount `1000.00`<br>3. Select option `1` (View Balance) | Debit succeeds; balance displayed is `0.00` | | | Boundary condition: `FINAL-BALANCE >= AMOUNT` must be true when equal |
| TC-06 | Debit amount of zero | Application started; current balance is `1000.00` | 1. Select option `3` (Debit Account)<br>2. Enter amount `0.00`<br>3. Select option `1` (View Balance) | Debit succeeds; balance remains `1000.00` | | | Edge case: zero debit should not affect balance |
| TC-07 | Credit amount of zero | Application started; current balance is `1000.00` | 1. Select option `2` (Credit Account)<br>2. Enter amount `0.00`<br>3. Select option `1` (View Balance) | Credit succeeds; balance remains `1000.00` | | | Edge case: zero credit should not affect balance |
| TC-08 | Multiple credits accumulate correctly | Application started; current balance is `1000.00` | 1. Select option `2`; enter `200.00`<br>2. Select option `2`; enter `300.00`<br>3. Select option `1` (View Balance) | Balance displayed is `1500.00` | | | Validates that repeated credits persist correctly in-memory |
| TC-09 | Credit followed by debit | Application started; current balance is `1000.00` | 1. Select option `2`; enter `500.00`<br>2. Select option `3`; enter `300.00`<br>3. Select option `1` (View Balance) | Balance displayed is `1200.00` | | | Validates correct read-modify-write cycle across operations |
| TC-10 | Debit reducing balance then debit again with insufficient funds | Application started; current balance is `1000.00` | 1. Select option `3`; enter `900.00`<br>2. Select option `3`; enter `200.00` | First debit succeeds; balance is `100.00`. Second debit fails with `"Insufficient funds for this debit."` | | | Validates that balance update persists between operations |
| TC-11 | Maximum balance boundary | Application started; current balance is `1000.00` | 1. Select option `2`; enter `998999.00`<br>2. Select option `1` (View Balance) | Balance displayed is `999999.00` | | | Field is `PIC 9(6)V99`; maximum representable value is `999999.99` |
| TC-12 | Invalid menu choice | Application started | 1. Enter `5` at the menu prompt | Error message displayed: `"Invalid choice, please select 1-4."`; menu is shown again | | | Input validation in `MainProgram` |
| TC-13 | Exit application | Application started | 1. Select option `4` (Exit) | Message displayed: `"Exiting the program. Goodbye!"`; application terminates | | | Normal termination flow |
| TC-14 | Balance does not persist after restart | Application started; credit `500.00` so balance is `1500.00`; application exited | 1. Restart application<br>2. Select option `1` (View Balance) | Balance displayed is `1000.00` (reset to default) | | | Known limitation: no file or database persistence; balance is in-memory only |
| TC-15 | View balance multiple times without modification | Application started; current balance is `1000.00` | 1. Select option `1` three times in a row | Balance displayed as `1000.00` all three times | | | Validates that `READ` via DataProgram does not mutate state |

---

## Business Rules Summary

| Rule ID | Rule Description | Covered By |
|---|---|---|
| BR-01 | A debit is rejected if the debit amount exceeds the current balance | TC-04, TC-10 |
| BR-02 | A debit for exactly the full balance is allowed | TC-05 |
| BR-03 | The initial account balance is `1000.00` | TC-01 |
| BR-04 | Balance is held in-memory only; it resets on application restart | TC-14 |
| BR-05 | Balance field supports up to `999999.99` (6 digits, 2 decimal places) | TC-11 |
| BR-06 | Invalid menu choices are rejected and the menu is re-displayed | TC-12 |
