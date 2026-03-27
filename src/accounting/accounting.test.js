'use strict';

jest.mock('readline-sync', () => ({
  question: jest.fn()
}));

const readlineSync = require('readline-sync');
const {
  runAccountManagementApp,
  createDataProgram,
  createOperations
} = require('./index');

function captureLogs() {
  const logs = [];
  const spy = jest.spyOn(console, 'log').mockImplementation((...args) => {
    logs.push(args.join(' '));
  });

  return {
    logs,
    restore() {
      spy.mockRestore();
    }
  };
}

function runWithInputs(inputs) {
  readlineSync.question.mockReset();
  readlineSync.question.mockImplementation(() => {
    if (inputs.length === 0) {
      throw new Error('No more mocked input values available.');
    }

    return String(inputs.shift());
  });

  runAccountManagementApp();
}

describe('COBOL parity test plan scenarios', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    readlineSync.question.mockReset();
  });

  test('TC-01 View initial balance', () => {
    const logger = captureLogs();
    runWithInputs([1, 4]);

    expect(logger.logs).toContain('Current balance: 001000.00');
    logger.restore();
  });

  test('TC-02 Credit account with a valid positive amount', () => {
    const logger = captureLogs();
    runWithInputs([2, 500, 1, 4]);

    expect(logger.logs).toContain('Amount credited. New balance: 001500.00');
    expect(logger.logs).toContain('Current balance: 001500.00');
    logger.restore();
  });

  test('TC-03 Debit account with sufficient funds', () => {
    const logger = captureLogs();
    runWithInputs([3, 200, 1, 4]);

    expect(logger.logs).toContain('Amount debited. New balance: 000800.00');
    expect(logger.logs).toContain('Current balance: 000800.00');
    logger.restore();
  });

  test('TC-04 Debit account with insufficient funds', () => {
    const logger = captureLogs();
    runWithInputs([3, 1500, 1, 4]);

    expect(logger.logs).toContain('Insufficient funds for this debit.');
    expect(logger.logs).toContain('Current balance: 001000.00');
    logger.restore();
  });

  test('TC-05 Debit exact balance amount (boundary)', () => {
    const logger = captureLogs();
    runWithInputs([3, 1000, 1, 4]);

    expect(logger.logs).toContain('Amount debited. New balance: 000000.00');
    expect(logger.logs).toContain('Current balance: 000000.00');
    logger.restore();
  });

  test('TC-06 Debit amount of zero', () => {
    const logger = captureLogs();
    runWithInputs([3, 0, 1, 4]);

    expect(logger.logs).toContain('Amount debited. New balance: 001000.00');
    expect(logger.logs).toContain('Current balance: 001000.00');
    logger.restore();
  });

  test('TC-07 Credit amount of zero', () => {
    const logger = captureLogs();
    runWithInputs([2, 0, 1, 4]);

    expect(logger.logs).toContain('Amount credited. New balance: 001000.00');
    expect(logger.logs).toContain('Current balance: 001000.00');
    logger.restore();
  });

  test('TC-08 Multiple credits accumulate correctly', () => {
    const logger = captureLogs();
    runWithInputs([2, 200, 2, 300, 1, 4]);

    expect(logger.logs).toContain('Amount credited. New balance: 001200.00');
    expect(logger.logs).toContain('Amount credited. New balance: 001500.00');
    expect(logger.logs).toContain('Current balance: 001500.00');
    logger.restore();
  });

  test('TC-09 Credit followed by debit', () => {
    const logger = captureLogs();
    runWithInputs([2, 500, 3, 300, 1, 4]);

    expect(logger.logs).toContain('Amount credited. New balance: 001500.00');
    expect(logger.logs).toContain('Amount debited. New balance: 001200.00');
    expect(logger.logs).toContain('Current balance: 001200.00');
    logger.restore();
  });

  test('TC-10 Debit reducing balance then debit again with insufficient funds', () => {
    const logger = captureLogs();
    runWithInputs([3, 900, 3, 200, 1, 4]);

    expect(logger.logs).toContain('Amount debited. New balance: 000100.00');
    expect(logger.logs).toContain('Insufficient funds for this debit.');
    expect(logger.logs).toContain('Current balance: 000100.00');
    logger.restore();
  });

  test('TC-11 Maximum balance boundary', () => {
    const logger = captureLogs();
    runWithInputs([2, 998999, 1, 4]);

    expect(logger.logs).toContain('Amount credited. New balance: 999999.00');
    expect(logger.logs).toContain('Current balance: 999999.00');
    logger.restore();
  });

  test('TC-12 Invalid menu choice', () => {
    const logger = captureLogs();
    runWithInputs([5, 4]);

    expect(logger.logs).toContain('Invalid choice, please select 1-4.');
    logger.restore();
  });

  test('TC-13 Exit application', () => {
    const logger = captureLogs();
    runWithInputs([4]);

    expect(logger.logs).toContain('Exiting the program. Goodbye!');
    logger.restore();
  });

  test('TC-14 Balance does not persist after restart', () => {
    const firstRunLogger = captureLogs();
    runWithInputs([2, 500, 1, 4]);
    expect(firstRunLogger.logs).toContain('Current balance: 001500.00');
    firstRunLogger.restore();

    const secondRunLogger = captureLogs();
    runWithInputs([1, 4]);
    expect(secondRunLogger.logs).toContain('Current balance: 001000.00');
    secondRunLogger.restore();
  });

  test('TC-15 View balance multiple times without modification', () => {
    const logger = captureLogs();
    runWithInputs([1, 1, 1, 4]);

    const displayedBalances = logger.logs.filter((line) => line === 'Current balance: 001000.00');
    expect(displayedBalances).toHaveLength(3);
    logger.restore();
  });
});

describe('DataProgram and Operations unit checks', () => {
  test('DataProgram READ and WRITE semantics match COBOL flow', () => {
    const dataProgram = createDataProgram();

    expect(dataProgram.execute('READ')).toBe(1000);
    dataProgram.execute('WRITE', 1234.56);
    expect(dataProgram.execute('READ')).toBe(1234.56);
  });

  test('Unknown operation code in Operations performs no action', () => {
    const dataProgram = createDataProgram();
    const operations = createOperations(dataProgram);
    const logger = captureLogs();

    operations.execute('OTHER ');
    expect(dataProgram.execute('READ')).toBe(1000);
    expect(logger.logs).toHaveLength(0);
    logger.restore();
  });
});
