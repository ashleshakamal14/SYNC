from datetime import date, timedelta
from app.ai.cycle_engine import calculate_cycle_metrics, get_phase_for_day, predict_next_cycle_ml


def test_phase_calculation():
    # Day 1 should be menstrual
    assert get_phase_for_day(1, 28) == "menstrual"
    assert get_phase_for_day(5, 28) == "menstrual"

    # Day 8 should be follicular
    assert get_phase_for_day(8, 28) == "follicular"

    # Day 14 should be ovulation
    assert get_phase_for_day(14, 28) == "ovulation"

    # Day 22 should be luteal
    assert get_phase_for_day(22, 28) == "luteal"


def test_cycle_metrics():
    today = date.today()
    metrics = calculate_cycle_metrics(period_start=today, cycle_length=28, period_length=5)
    assert metrics["cycle_day"] == 1
    assert metrics["current_phase"] == "menstrual"
    assert metrics["days_until_next_period"] == 28


def test_ml_cycle_prediction():
    history = [
        {"cycle_length": 28},
        {"cycle_length": 29},
        {"cycle_length": 28},
    ]
    predicted = predict_next_cycle_ml(history)
    assert predicted is not None
    assert 27 <= predicted <= 30
