from __future__ import annotations

import builtins
from collections.abc import Iterable

from accounting import run_account_management_app


def run_app_with_inputs(monkeypatch, capsys, inputs: Iterable[str]) -> str:
    values = iter(inputs)
    monkeypatch.setattr(builtins, "input", lambda: next(values))
    run_account_management_app()
    return capsys.readouterr().out


def test_tc_01_view_initial_balance(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["1", "4"])
    assert "Current balance: 001000.00" in output


def test_tc_02_credit_valid_positive_amount(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["2", "500.00", "1", "4"])
    assert "Amount credited. New balance: 001500.00" in output
    assert "Current balance: 001500.00" in output


def test_tc_03_debit_with_sufficient_funds(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["3", "200.00", "1", "4"])
    assert "Amount debited. New balance: 000800.00" in output
    assert "Current balance: 000800.00" in output


def test_tc_04_debit_with_insufficient_funds(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["3", "1500.00", "1", "4"])
    assert "Insufficient funds for this debit." in output
    assert "Current balance: 001000.00" in output


def test_tc_05_debit_exact_balance_boundary(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["3", "1000.00", "1", "4"])
    assert "Amount debited. New balance: 000000.00" in output
    assert "Current balance: 000000.00" in output


def test_tc_06_debit_zero_amount(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["3", "0.00", "1", "4"])
    assert "Amount debited. New balance: 001000.00" in output
    assert "Current balance: 001000.00" in output


def test_tc_07_credit_zero_amount(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["2", "0.00", "1", "4"])
    assert "Amount credited. New balance: 001000.00" in output
    assert "Current balance: 001000.00" in output


def test_tc_08_multiple_credits_accumulate(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["2", "200.00", "2", "300.00", "1", "4"])
    assert "Amount credited. New balance: 001200.00" in output
    assert "Amount credited. New balance: 001500.00" in output
    assert "Current balance: 001500.00" in output


def test_tc_09_credit_then_debit(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["2", "500.00", "3", "300.00", "1", "4"])
    assert "Amount credited. New balance: 001500.00" in output
    assert "Amount debited. New balance: 001200.00" in output
    assert "Current balance: 001200.00" in output


def test_tc_10_debit_then_insufficient_second_debit(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["3", "900.00", "3", "200.00", "1", "4"])
    assert "Amount debited. New balance: 000100.00" in output
    assert "Insufficient funds for this debit." in output
    assert "Current balance: 000100.00" in output


def test_tc_11_maximum_balance_boundary(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["2", "998999.00", "1", "4"])
    assert "Amount credited. New balance: 999999.00" in output
    assert "Current balance: 999999.00" in output


def test_tc_12_invalid_menu_choice(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["5", "4"])
    assert "Invalid choice, please select 1-4." in output


def test_tc_13_exit_application(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["4"])
    assert "Exiting the program. Goodbye!" in output


def test_tc_14_balance_does_not_persist_after_restart(monkeypatch, capsys):
    first_run = run_app_with_inputs(monkeypatch, capsys, ["2", "500.00", "1", "4"])
    assert "Current balance: 001500.00" in first_run

    second_run = run_app_with_inputs(monkeypatch, capsys, ["1", "4"])
    assert "Current balance: 001000.00" in second_run


def test_tc_15_view_balance_multiple_times_without_modification(monkeypatch, capsys):
    output = run_app_with_inputs(monkeypatch, capsys, ["1", "1", "1", "4"])
    assert output.count("Current balance: 001000.00") == 3
