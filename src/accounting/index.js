'use strict';

const readlineSync = require('readline-sync');

const MIN_BALANCE = 0.0;
const MAX_BALANCE = 999999.99;
const INITIAL_BALANCE = 1000.0;

function formatAmount(value) {
  return value.toFixed(2).padStart(9, '0');
}

function clampToTwoDecimals(value) {
  return Number(value.toFixed(2));
}

// DataProgram equivalent: in-memory data store.
function createDataProgram() {
  let storageBalance = INITIAL_BALANCE;

  return {
    execute(operationType, balanceValue) {
      if (operationType === 'READ') {
        return storageBalance;
      }

      if (operationType === 'WRITE') {
        storageBalance = clampToTwoDecimals(balanceValue);
        return storageBalance;
      }

      return storageBalance;
    }
  };
}

// Operations equivalent: business rules and account operations.
function createOperations(dataProgram) {
  return {
    execute(operationType) {
      if (operationType === 'TOTAL ') {
        const finalBalance = dataProgram.execute('READ');
        console.log(`Current balance: ${formatAmount(finalBalance)}`);
        return;
      }

      if (operationType === 'CREDIT') {
        const amount = Number(readlineSync.question('Enter credit amount: '));

        if (!Number.isFinite(amount) || amount < MIN_BALANCE) {
          console.log('Invalid amount. Please enter a non-negative numeric value.');
          return;
        }

        let finalBalance = dataProgram.execute('READ');
        finalBalance = clampToTwoDecimals(finalBalance + amount);

        if (finalBalance > MAX_BALANCE) {
          console.log('Amount exceeds maximum supported balance (999999.99).');
          return;
        }

        dataProgram.execute('WRITE', finalBalance);
        console.log(`Amount credited. New balance: ${formatAmount(finalBalance)}`);
        return;
      }

      if (operationType === 'DEBIT ') {
        const amount = Number(readlineSync.question('Enter debit amount: '));

        if (!Number.isFinite(amount) || amount < MIN_BALANCE) {
          console.log('Invalid amount. Please enter a non-negative numeric value.');
          return;
        }

        let finalBalance = dataProgram.execute('READ');

        if (finalBalance >= amount) {
          finalBalance = clampToTwoDecimals(finalBalance - amount);
          dataProgram.execute('WRITE', finalBalance);
          console.log(`Amount debited. New balance: ${formatAmount(finalBalance)}`);
        } else {
          console.log('Insufficient funds for this debit.');
        }
      }
    }
  };
}

function runAccountManagementApp() {
  const dataProgram = createDataProgram();
  const operations = createOperations(dataProgram);

  let continueFlag = 'YES';

  while (continueFlag !== 'NO') {
    console.log('--------------------------------');
    console.log('Account Management System');
    console.log('1. View Balance');
    console.log('2. Credit Account');
    console.log('3. Debit Account');
    console.log('4. Exit');
    console.log('--------------------------------');

    const rawChoice = readlineSync.question('Enter your choice (1-4): ');
    const userChoice = Number(rawChoice);

    switch (userChoice) {
      case 1:
        operations.execute('TOTAL ');
        break;
      case 2:
        operations.execute('CREDIT');
        break;
      case 3:
        operations.execute('DEBIT ');
        break;
      case 4:
        continueFlag = 'NO';
        break;
      default:
        console.log('Invalid choice, please select 1-4.');
    }
  }

  console.log('Exiting the program. Goodbye!');
}

if (require.main === module) {
  runAccountManagementApp();
}

module.exports = {
  runAccountManagementApp,
  createDataProgram,
  createOperations
};
