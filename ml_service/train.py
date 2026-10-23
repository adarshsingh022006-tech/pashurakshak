"""
PashuRakshak - Python AI Risk Classification Engine
Algorithm: Scikit-Learn Random Forest Classifier (100 Estimators)
Features: 19-Dimensional Epidemiological Clinical Vector
"""

import os
import random
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

SYMPTOMS_LIST = [
    'fever',
    'coughing',
    'difficulty_walking',
    'salivation',
    'loss_of_appetite',
    'diarrhea',
    'skin_lesions',
    'nasal_discharge',
    'lameness',
    'swelling'
]

SPECIES_MAP = {
    'cow': 0,
    'buffalo': 1,
    'goat': 2,
    'sheep': 3,
    'pig': 4,
    'poultry': 5
}

VACCINATION_MAP = {
    'Vaccinated': 0,
    'Partially Vaccinated': 1,
    'Unvaccinated': 2
}

def evaluate_clinical_rules(features):
    """
    Veterinary rule tree used to calibrate training targets:
    0 = Low, 1 = Medium, 2 = High
    """
    (fever, coughing, diff_walking, salivation, loss_appetite,
     diarrhea, skin_lesions, nasal_discharge, lameness, swelling,
     severity_count, species_code, age, vacc_code, duration,
     mortality, nearby_cases, temp, humidity) = features

    risk_score = 0
    factors = []

    # FMD / vesicular triad
    if fever and (salivation or diff_walking or lameness or skin_lesions):
        risk_score += 45
        factors.append("Acute pyrexia accompanied by oral salivation or lameness (vesicular/FMD profile)")

    # Severe respiratory syndrome (HS / Contagious Pleuropneumonia / Ranikhet)
    if coughing and (nasal_discharge or fever):
        risk_score += 35
        factors.append("Respiratory distress with nasal discharge and elevated temperature")

    # Enteric distress
    if diarrhea and (loss_appetite or fever):
        risk_score += 25
        factors.append("Enteric distress with systemic anorexia/pyrexia")

    # Skin lesions / Pox / Lumpy Skin
    if skin_lesions and (swelling or fever):
        risk_score += 30
        factors.append("Cutaneous lesions or nodules with localized swelling")

    if severity_count >= 3:
        risk_score += 20
        factors.append(f"Multiple concurrent clinical symptoms ({severity_count} active signs)")

    if mortality > 0:
        risk_score += 35 + (mortality * 10)
        factors.append(f"Recent herd mortality detected ({mortality} deaths)")

    if nearby_cases >= 3:
        risk_score += 30
        factors.append(f"Spatial density: {nearby_cases} active cases in 5km radius")
    elif nearby_cases > 0:
        risk_score += 15
        factors.append(f"Spatial proximity: {nearby_cases} cases in vicinity")

    if vacc_code == 2:
        risk_score += 15
        factors.append("Animal is unvaccinated")
    elif vacc_code == 1:
        risk_score += 8
        factors.append("Animal is partially vaccinated")

    if duration >= 4:
        risk_score += 10
        factors.append(f"Prolonged symptomatic duration ({duration} days)")

    if temp > 38 and humidity > 70:
        risk_score += 5
        factors.append("Elevated environmental heat-humidity index")

    if risk_score >= 50:
        label = 2  # High
        level = 'High'
    elif risk_score >= 25:
        label = 1  # Medium
        level = 'Medium'
    else:
        label = 0  # Low
        level = 'Low'

    return label, level, factors

def generate_dataset(n_samples=2500, random_seed=42):
    random.seed(random_seed)
    np.random.seed(random_seed)

    X = []
    y = []

    for _ in range(n_samples):
        fever = 1 if random.random() < 0.35 else 0
        coughing = 1 if random.random() < 0.25 else 0
        diff_walking = 1 if random.random() < 0.20 else 0
        salivation = 1 if random.random() < 0.18 else 0
        loss_appetite = 1 if random.random() < 0.40 else 0
        diarrhea = 1 if random.random() < 0.22 else 0
        skin_lesions = 1 if random.random() < 0.15 else 0
        nasal_discharge = 1 if random.random() < 0.20 else 0
        lameness = 1 if random.random() < 0.22 else 0
        swelling = 1 if random.random() < 0.18 else 0

        sym_flags = [fever, coughing, diff_walking, salivation, loss_appetite,
                     diarrhea, skin_lesions, nasal_discharge, lameness, swelling]
        severity_count = sum(sym_flags)

        species_code = random.randint(0, 5)
        age = round(random.uniform(0.5, 15.0), 1)
        vacc_code = 0 if random.random() < 0.55 else (1 if random.random() < 0.5 else 2)
        duration = random.randint(1, 8)
        mortality = random.randint(1, 4) if random.random() < 0.12 else 0
        nearby_cases = random.randint(1, 10) if random.random() < 0.35 else 0
        temp = round(random.uniform(24.0, 42.0), 1)
        humidity = round(random.uniform(40.0, 85.0), 1)

        feature_vector = [
            *sym_flags,
            severity_count,
            species_code,
            age,
            vacc_code,
            duration,
            mortality,
            nearby_cases,
            temp,
            humidity
        ]

        label, _, _ = evaluate_clinical_rules(feature_vector)
        X.append(feature_vector)
        y.append(label)

    return np.array(X), np.array(y)

def train_and_save():
    print("=" * 60)
    print("🌿 PashuRakshak - Training Scikit-Learn Random Forest Classifier")
    print("=" * 60)

    print("[1/4] Generating clinical veterinary training dataset (2,500 samples)...")
    X, y = generate_dataset(n_samples=2500)

    print("[2/4] Performing 80/20 Train-Test split...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("[3/4] Fitting RandomForestClassifier (n_estimators=100, max_depth=8)...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_split=4,
        random_state=42,
        class_weight='balanced'
    )
    model.fit(X_train, y_train)

    # Evaluation
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n✅ Model Evaluation on Hold-Out Test Set:")
    print(f"🎯 Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Low Risk', 'Medium Risk', 'High Risk']))

    # Save
    out_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(out_dir, "pashurakshak_rf_model.joblib")
    joblib.dump(model, model_path)
    print(f"[4/4] Model serialized and saved to: {model_path}")
    print("=" * 60)

if __name__ == "__main__":
    train_and_save()
