from app.ai.recommendation_engine import generate_recommendations


def test_recommendation_hydration_trigger():
    res = generate_recommendations(
        phase="follicular",
        mood="happy",
        symptoms=[],
        water_intake=1.2,
        energy_level=7,
        stress_level=3,
    )
    categories = [r["category"] for r in res["recommendations"]]
    assert "hydration" in categories
    assert "disclaimer" in res


def test_recommendation_stress_trigger():
    res = generate_recommendations(
        phase="luteal",
        mood="anxious",
        symptoms=["cramps"],
        water_intake=2.5,
        energy_level=4,
        stress_level=8,
    )
    categories = [r["category"] for r in res["recommendations"]]
    assert "stress" in categories
    assert "comfort" in categories
