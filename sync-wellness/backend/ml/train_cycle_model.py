from pathlib import Path
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import GroupShuffleSplit
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ============================================================
# 1. PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

PERIOD_FILE = DATA_DIR / "Period_Log.csv"
PROFILE_FILE = DATA_DIR / "User_Profile.csv"


# ============================================================
# 2. LOAD DATA
# ============================================================

print("\nLoading datasets...")

period = pd.read_csv(PERIOD_FILE)
profile = pd.read_csv(PROFILE_FILE)

print(f"Period records: {len(period)}")
print(f"User profiles: {len(profile)}")


# ============================================================
# 3. SORT TEMPORALLY
# ============================================================

period["start_date"] = pd.to_datetime(period["start_date"])

period = period.sort_values(
    ["user_id", "cycle_number"]
).reset_index(drop=True)


# ============================================================
# 4. CREATE TARGET
# ============================================================
# We predict the NEXT cycle length.
#
# Example:
#
# Cycle 1 = 28 days
# Cycle 2 = 30 days
#
# Features from Cycle 1
#        ↓
# Predict Cycle 2 = 30
#
# ============================================================

period["next_cycle_length"] = (
    period.groupby("user_id")["cycle_length_days"]
    .shift(-1)
)

# Last cycle of every user has no future target
period = period.dropna(subset=["next_cycle_length"]).copy()

period["next_cycle_length"] = period["next_cycle_length"].astype(float)


# ============================================================
# 5. HISTORICAL FEATURES
# ============================================================

group = period.groupby("user_id")["cycle_length_days"]

# Previous 3 completed cycles, excluding current cycle
period["rolling_mean_3"] = (
    group.transform(
        lambda s: s.shift(1).rolling(3, min_periods=1).mean()
    )
)

period["rolling_std_3"] = (
    group.transform(
        lambda s: s.shift(1).rolling(3, min_periods=2).std()
    )
)

# Previous 2 completed cycles
period["prev2_mean"] = (
    group.transform(
        lambda s: s.shift(1).rolling(2, min_periods=1).mean()
    )
)

# Difference between current and previous cycle
period["cycle_length_change"] = (
    period["cycle_length_days"]
    - period["prev_cycle_length"]
)


# ============================================================
# 6. MERGE USER PROFILE
# ============================================================

profile_features = profile.drop(columns=["state"], errors="ignore")

data = period.merge(
    profile_features,
    on="user_id",
    how="left",
    suffixes=("", "_profile")
)


# ============================================================
# 7. SELECT FEATURES
# ============================================================

numeric_features = [
    "cycle_number",
    "cycle_length_days",
    "prev_cycle_length",
    "rolling_mean_3",
    "rolling_std_3",
    "prev2_mean",
    "cycle_length_change",

    "pain_level",
    "mood_score",
    "stress_score_cycle",
    "sleep_hours_cycle",
    "energy_level",
    "concentration_score",
    "work_hours_lost",
    "estrogen_pgml",
    "progesterone_ngml",
    "overall_health_score",
    "log_consistency_score",
    "prepared_before_period",

    "age",
    "bmi",
    "sleep_hours",
    "caffeine_intake",
    "water_intake_liters",
    "birth_control_use",
    "pcos_diagnosed",
    "stress_score_baseline",
]

categorical_features = [
    "cycle_phase",
    "flow_level",
    "pms_symptoms",
    "ovulation_result",
    "diet_quality",
    "exercise_frequency",
    "alcohol_consumption",
    "smoking_status",
]

features = numeric_features + categorical_features

# Keep only features that actually exist
features = [col for col in features if col in data.columns]

X = data[features]
y = data["next_cycle_length"]
groups = data["user_id"]


# ============================================================
# 8. TRAIN / TEST SPLIT BY USER
# ============================================================
# Important:
# The same user must NOT appear in both training and testing.
#
# This gives us a much more realistic evaluation.
# ============================================================

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.20,
    random_state=42
)

train_idx, test_idx = next(
    splitter.split(X, y, groups=groups)
)

X_train = X.iloc[train_idx]
X_test = X.iloc[test_idx]

y_train = y.iloc[train_idx]
y_test = y.iloc[test_idx]

train_users = groups.iloc[train_idx]
test_users = groups.iloc[test_idx]

print("\nDataset split:")
print(f"Training rows: {len(X_train)}")
print(f"Testing rows:  {len(X_test)}")
print(f"Training users: {train_users.nunique()}")
print(f"Testing users:  {test_users.nunique()}")

print(
    f"User overlap: "
    f"{len(set(train_users) & set(test_users))}"
)


# ============================================================
# 9. PREPROCESSING
# ============================================================

numeric_transformer = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median")
        )
    ]
)

categorical_transformer = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent")
        ),
        (
            "encoder",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=False
            )
        ),
    ]
)

preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            numeric_transformer,
            [c for c in numeric_features if c in features]
        ),
        (
            "categorical",
            categorical_transformer,
            [c for c in categorical_features if c in features]
        ),
    ]
)


# ============================================================
# 10. RANDOM FOREST MODEL
# ============================================================

model = RandomForestRegressor(
    n_estimators=500,
    random_state=42,
    n_jobs=-1,
    min_samples_leaf=2,
    max_features="sqrt"
)


# ============================================================
# 11. COMPLETE ML PIPELINE
# ============================================================

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model),
    ]
)


# ============================================================
# 12. TRAIN
# ============================================================

print("\nTraining Random Forest...")

pipeline.fit(X_train, y_train)

print("Training completed!")


# ============================================================
# 13. PREDICTION
# ============================================================

predictions = pipeline.predict(X_test)


# ============================================================
# 14. EVALUATION
# ============================================================

mae = mean_absolute_error(y_test, predictions)

rmse = np.sqrt(
    mean_squared_error(y_test, predictions)
)

r2 = r2_score(y_test, predictions)


print("\n========================================")
print("MODEL PERFORMANCE")
print("========================================")

print(f"MAE  : {mae:.3f} days")
print(f"RMSE : {rmse:.3f} days")
print(f"R²   : {r2:.3f}")

print("========================================")


# ============================================================
# 15. NAIVE BASELINE
# ============================================================
# Predict next cycle = current cycle length.
# ============================================================

baseline_predictions = X_test["cycle_length_days"].values

baseline_mae = mean_absolute_error(
    y_test,
    baseline_predictions
)

baseline_rmse = np.sqrt(
    mean_squared_error(
        y_test,
        baseline_predictions
    )
)

baseline_r2 = r2_score(
    y_test,
    baseline_predictions
)

print("\nBASELINE (current cycle length)")
print(f"MAE  : {baseline_mae:.3f} days")
print(f"RMSE : {baseline_rmse:.3f} days")
print(f"R²   : {baseline_r2:.3f}")


# ============================================================
# 16. SAVE MODEL
# ============================================================

model_path = MODEL_DIR / "cycle_predictor.pkl"

joblib.dump(
    pipeline,
    model_path
)

print("\nModel saved successfully:")
print(model_path)


# ============================================================
# 17. SAVE MODEL METADATA
# ============================================================

metadata = {
    "model": "RandomForestRegressor",
    "target": "next_cycle_length",
    "training_rows": int(len(X_train)),
    "testing_rows": int(len(X_test)),
    "training_users": int(train_users.nunique()),
    "testing_users": int(test_users.nunique()),
    "mae_days": float(mae),
    "rmse_days": float(rmse),
    "r2": float(r2),
    "baseline_mae_days": float(baseline_mae),
    "baseline_rmse_days": float(baseline_rmse),
    "baseline_r2": float(baseline_r2),
    "features": features,
}

joblib.dump(
    metadata,
    MODEL_DIR / "cycle_model_metadata.pkl"
)

print("Metadata saved.")
print("\nDONE!")