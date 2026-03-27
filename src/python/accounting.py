"""Single-file Python port of the legacy COBOL account management app.

This module preserves the original menu, data flow, and business rules:
MainProgram -> Operations -> DataProgram.
"""

from __future__ import annotations


INITIAL_BALANCE = 1000.00


def format_amount(value: float) -> str:
    return f"{value:09.2f}"


class DataProgram:
    """In-memory data store equivalent to COBOL DataProgram."""

    def __init__(self) -> None:
        self.storage_balance = INITIAL_BALANCE

    def execute(self, passed_operation: str, balance: float = 0.0) -> float:
        operation_type = passed_operation

        if operation_type == "READ":
            return self.storage_balance

        if operation_type == "WRITE":
            self.storage_balance = round(balance, 2)
            return self.storage_balance

        return self.storage_balance


class Operations:
    """Business logic equivalent to COBOL Operations program."""

    def __init__(self, data_program: DataProgram) -> None:
        self.data_program = data_program

    def execute(self, passed_operation: str) -> None:
        operation_type = passed_operation

        if operation_type == "TOTAL ":
            final_balance = self.data_program.execute("READ")
            print(f"Current balance: {format_amount(final_balance)}")
            return

        if operation_type == "CREDIT":
            print("Enter credit amount: ")
            amount = float(input())
            final_balance = self.data_program.execute("READ")
            final_balance = round(final_balance + amount, 2)
            self.data_program.execute("WRITE", final_balance)
            print(f"Amount credited. New balance: {format_amount(final_balance)}")
            return

        if operation_type == "DEBIT ":
            print("Enter debit amount: ")
            amount = float(input())
            final_balance = self.data_program.execute("READ")

            if final_balance >= amount:
                final_balance = round(final_balance - amount, 2)
                self.data_program.execute("WRITE", final_balance)
                print(f"Amount debited. New balance: {format_amount(final_balance)}")
            else:
                print("Insufficient funds for this debit.")


def run_account_management_app() -> None:
    data_program = DataProgram()
    operations = Operations(data_program)
    continue_flag = "YES"

    while continue_flag != "NO":
        print("--------------------------------")
        print("Account Management System")
        print("1. View Balance")
        print("2. Credit Account")
        print("3. Debit Account")
        print("4. Exit")
        print("--------------------------------")
        print("Enter your choice (1-4): ")

        raw_choice = input().strip()

        try:
            user_choice = int(raw_choice)
        except ValueError:
            user_choice = -1

        if user_choice == 1:
            operations.execute("TOTAL ")
        elif user_choice == 2:
            operations.execute("CREDIT")
        elif user_choice == 3:
            operations.execute("DEBIT ")
        elif user_choice == 4:
            continue_flag = "NO"
        else:
            print("Invalid choice, please select 1-4.")

    print("Exiting the program. Goodbye!")


if __name__ == "__main__":
    run_account_management_app()
