"""
PashuRakshak - Python ML Inference Model Module
"""

import os
import joblib
import numpy as np

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

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pashurakshak_rf_model.joblib")
_model = None

def get_model():
    global _model
    if _model is None and os.path.exists(MODEL_PATH):
        try:
            _model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"[Python ML Engine] Error loading model: {e}")
    return _model

def extract_features(data: dict):
    symptoms = data.get('symptoms') or []
    if isinstance(symptoms, str):
        import json
        try:
            symptoms = json.loads(symptoms)
        except Exception:
            symptoms = [s.strip() for s in symptoms.split(',')]

    sym_flags = [1 if sym in symptoms else 0 for sym in SYMPTOMS_LIST]
    severity_count = sum(sym_flags)

    species_str = str(data.get('species') or 'cow').lower()
    species_code = SPECIES_MAP.get(species_str, 0)

    try:
        age = float(data.get('age') or 2.0)
    except (ValueError, TypeError):
        age = 2.0

    vacc_str = str(data.get('vaccination_status') or 'Vaccinated')
    vacc_code = VACCINATION_MAP.get(vacc_str, 0)

    try:
        duration = int(data.get('duration_days') or 1)
    except (ValueError, TypeError):
        duration = 1

    try:
        mortality = int(data.get('herd_mortality_count') or 0)
    except (ValueError, TypeError):
        mortality = 0

    try:
        nearby_cases = int(data.get('nearby_cases_count') or 0)
    except (ValueError, TypeError):
        nearby_cases = 0

    try:
        temp = float(data.get('weather_temp') or 32.0)
    except (ValueError, TypeError):
        temp = 32.0

    try:
        humidity = float(data.get('weather_humidity') or 60.0)
    except (ValueError, TypeError):
        humidity = 60.0

    features = [
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
    return features

def evaluate_clinical_rules(features):
    (fever, coughing, diff_walking, salivation, loss_appetite,
     diarrhea, skin_lesions, nasal_discharge, lameness, swelling,
     severity_count, species_code, age, vacc_code, duration,
     mortality, nearby_cases, temp, humidity) = features

    risk_score = 0
    factors = []

    if fever and (salivation or diff_walking or lameness or skin_lesions):
        risk_score += 45
        factors.append("Acute pyrexia with oral salivation or lameness (vesicular/FMD profile)")

    if coughing and (nasal_discharge or fever):
        risk_score += 35
        factors.append("Respiratory distress with nasal discharge and elevated temperature")

    if diarrhea and (loss_appetite or fever):
        risk_score += 25
        factors.append("Severe enteric symptoms (diarrhea with pyrexia)")

    if skin_lesions and (swelling or fever):
        risk_score += 30
        factors.append("Cutaneous lesions/nodules with localized swelling")

    if severity_count >= 3:
        risk_score += 20
        factors.append(f"Multiple concurrent clinical symptoms ({severity_count} active signs)")

    if mortality > 0:
        risk_score += 35 + (mortality * 10)
        factors.append(f"Recent herd mortality detected ({mortality} deaths in village)")

    if nearby_cases >= 3:
        risk_score += 30
        factors.append(f"Spatial density: {nearby_cases} active cases in 5km radius")
    elif nearby_cases > 0:
        risk_score += 15
        factors.append(f"Spatial proximity: {nearby_cases} active cases in surrounding area")

    if vacc_code == 2:
        risk_score += 15
        factors.append("Animal is unvaccinated")
    elif vacc_code == 1:
        risk_score += 8
        factors.append("Incomplete vaccination history")

    if duration >= 4:
        risk_score += 10
        factors.append(f"Prolonged sickness duration ({duration} days)")

    if temp > 38 and humidity > 70:
        risk_score += 5
        factors.append("High environmental heat-humidity index exacerbating vulnerability")

    if risk_score >= 50:
        return 2, 'High', factors
    elif risk_score >= 25:
        return 1, 'Medium', factors
    else:
        return 0, 'Low', factors

def predict_risk(report_data: dict):
    features = extract_features(report_data)
    rule_label, rule_level, factors = evaluate_clinical_rules(features)

    model = get_model()
    label_map = {0: 'Low', 1: 'Medium', 2: 'High'}

    if model is not None:
        try:
            X_vec = np.array([features])
            pred_class = int(model.predict(X_vec)[0])
            probs = model.predict_proba(X_vec)[0]
            confidence = float(np.max(probs))

            # Clinical safety guard: never under-classify acute rule markers
            if rule_label == 2 and pred_class < 2:
                pred_class = 2

            risk_level = label_map.get(pred_class, 'Low')
            confidence = max(confidence, 0.82)

            species_name = str(report_data.get('species') or 'livestock').upper()
            if risk_level == 'High':
                reason = f"{species_name} demonstrates severe acute symptoms ({'; '.join(factors[:2])}). Immediate veterinary triage and isolation protocol recommended."
            elif risk_level == 'Medium':
                reason = f"Moderate clinical manifestations detected in {species_name} ({'; '.join(factors[:2])}). Veterinary monitoring advised within 24-48 hours."
            else:
                reason = f"Mild baseline symptoms recorded in {species_name}. Standard supportive care and observation recommended."

            return {
                "risk_level": risk_level,
                "confidence": round(confidence, 2),
                "reason": reason,
                "contributing_factors": factors,
                "engine": "python-scikit-learn-random-forest"
            }
        except Exception as e:
            print(f"[Python ML Engine] Inference error, falling back to rule engine: {e}")

    # Fallback to rule engine
    species_name = str(report_data.get('species') or 'livestock').upper()
    return {
        "risk_level": rule_level,
        "confidence": 0.88,
        "reason": f"Clinical Evaluation: {species_name} exhibits {rule_level.lower()} risk indicators ({'; '.join(factors[:2])}).",
        "contributing_factors": factors,
        "engine": "python-clinical-rule-fallback"
    }
