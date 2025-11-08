# ML Bootstrap Strategy - Training Without User Data

**Phase 8: Pattern Recognition & Predictive Intelligence**

---

## Executive Summary

We'll bootstrap ML capabilities using **public mental health datasets** to train models BEFORE we have user data. This gives us:
- ✅ Immediate pattern recognition from day 1
- ✅ Crisis prediction capabilities pre-trained
- ✅ Emotion clustering based on research data
- ✅ Trajectory forecasting from validated studies
- ✅ Ethical: No user data exposure during training

**Strategy: Train on public research data → Deploy to production → Fine-tune on user data (with consent) later**

---

## 🎯 Public Mental Health Datasets

### Tier 1: Emotion & Mental State Datasets (FREE & OPEN)

1. **DAIC-WOZ (Depression Detection)**
   - Source: USC Institute for Creative Technologies
   - Content: 189 clinical interviews with depression labels
   - Features: Audio, text transcripts, visual features
   - Use Case: Depression pattern recognition
   - Link: https://dcapswoz.ict.usc.edu/

2. **E-DAIC (Extended DAIC)**
   - Source: University of Southern California
   - Content: Depression severity ratings, PHQ-8 scores
   - Features: Multimodal (audio, video, text)
   - Use Case: Severity prediction, trajectory modeling

3. **AVEC 2019 (Emotion Challenge)**
   - Source: Audio/Visual Emotion Challenge
   - Content: Emotional state annotations
   - Features: Audio, video, physiological signals
   - Use Case: Emotion state classification

4. **GoEmotions (Google)**
   - Source: Google Research
   - Content: 58k Reddit comments with 27 emotion labels
   - Features: Text-based emotion classification
   - Use Case: Emotion detection from text
   - Link: https://github.com/google-research/google-research/tree/master/goemotions

5. **EmoBank**
   - Source: Computational Linguistics
   - Content: 10k sentences with VAD (valence-arousal-dominance)
   - Features: Fine-grained emotion dimensions
   - Use Case: Emotion intensity mapping

### Tier 2: Mental Health Text Datasets

6. **CLPsych Shared Tasks**
   - Source: Computational Linguistics and Clinical Psychology
   - Content: Reddit mental health posts (depression, PTSD, anxiety)
   - Features: Longitudinal post history, crisis signals
   - Use Case: Crisis detection, longitudinal pattern analysis

7. **RSDD (Reddit Self-reported Depression Diagnosis)**
   - Source: Georgetown University
   - Content: 9k Reddit users, self-reported depression
   - Features: Post history before/after diagnosis
   - Use Case: Depression onset prediction

8. **SMHD (Self-reported Mental Health Diagnoses)**
   - Source: Reddit data (academic use)
   - Content: 100k+ users, multiple conditions
   - Features: Anxiety, depression, bipolar, PTSD, ADHD
   - Use Case: Multi-condition pattern recognition

### Tier 3: Physiological & Biometric Datasets

9. **WESAD (Wearable Stress and Affect Detection)**
   - Source: University of Siegen
   - Content: Stress/affect detection from wearables
   - Features: ECG, EDA, temperature, respiration
   - Use Case: Biometric stress detection
   - Link: https://archive.ics.uci.edu/ml/datasets/WESAD

10. **K-EmoCon**
    - Source: Korea Emotion Recognition Database
    - Content: Physiological signals during emotional stimuli
    - Features: ECG, skin conductance, facial expressions
    - Use Case: Emotion-physiology mapping

### Tier 4: Clinical Datasets (Restricted but Accessible)

11. **MIMIC-III (Medical Information Mart)**
    - Source: MIT/PhysioNet
    - Content: De-identified health data
    - Features: Mental health diagnoses, treatments, outcomes
    - Use Case: Clinical trajectory modeling
    - Note: Requires CITI training certification (free)

12. **UK Biobank**
    - Source: UK Biobank (application required)
    - Content: Mental health questionnaires, outcomes
    - Features: 500k participants, longitudinal
    - Use Case: Long-term outcome prediction

---

## 🧠 ML Models to Build

### Model 1: Emotion State Classifier
**Training Data:** GoEmotions, EmoBank, AVEC 2019
**Architecture:** Fine-tuned BERT or RoBERTa
**Input:** User text (journal entries, chat messages)
**Output:** 27 emotion labels + intensity scores
**Confidence:** 0-1 for each emotion

**Integration:**
```typescript
// Classify emotion from user input
const emotion = await emotionClassifier.predict(userText);
// { label: 'anxious', confidence: 0.87, valence: -0.6, arousal: 0.8 }
```

### Model 2: Crisis Risk Predictor
**Training Data:** DAIC-WOZ, CLPsych, RSDD
**Architecture:** LSTM or Transformer (temporal modeling)
**Input:** Sequence of recent RI values, emotion states, text patterns
**Output:** Crisis risk score (0-1) + explanation

**Integration:**
```typescript
// Predict crisis risk from trajectory
const risk = await crisisPredictor.predict({
  riSequence: [0.6, 0.55, 0.48, 0.42],
  emotionSequence: ['sad', 'hopeless', 'numb'],
  textFeatures: extractedFeatures
});
// { riskScore: 0.78, factors: ['declining_ri', 'hopeless_language'] }
```

### Model 3: Trajectory Forecaster
**Training Data:** SMHD, RSDD, UK Biobank
**Architecture:** Time series forecasting (Prophet, LSTM)
**Input:** Historical RI values, emotion patterns, interventions
**Output:** Predicted RI trajectory (7-30 days ahead)

**Integration:**
```typescript
// Forecast next 7 days
const forecast = await trajectoryForecaster.predict({
  historicalRI: last30DaysRI,
  interventions: ['therapy', 'medication'],
  context: userProfile
});
// { predictedRI: [0.52, 0.54, 0.56, 0.58, 0.60, 0.62, 0.64] }
```

### Model 4: Pattern Clusterer
**Training Data:** SMHD, EmoBank, CLPsych
**Architecture:** Unsupervised clustering (K-means, DBSCAN, HDBSCAN)
**Input:** User journey vectors (RI + emotions + interventions)
**Output:** Pattern cluster ID + similar user archetypes

**Integration:**
```typescript
// Find similar patterns
const cluster = await patternClusterer.findCluster(userVector);
// { clusterId: 'anxiety_to_calm_responders', confidence: 0.82 }
```

### Model 5: Intervention Recommender
**Training Data:** MIMIC-III, clinical trial data
**Architecture:** Collaborative filtering or matrix factorization
**Input:** User state, past interventions, outcomes
**Output:** Ranked intervention recommendations

**Integration:**
```typescript
// Recommend next intervention
const recommendations = await interventionRecommender.predict({
  currentState: { ri: 0.48, emotion: 'anxious' },
  pastInterventions: ['breathing_exercise', 'journaling'],
  userProfile: profile
});
// [{ intervention: 'body_scan', confidence: 0.75, expectedRI: 0.58 }]
```

---

## 🏗️ Architecture: ML-Enhanced ROE

### Current ROE Flow:
```
User State → Resonance Calculator → Field Selection → User Action → New Branch
```

### ML-Enhanced ROE Flow:
```
User State
  ↓
[ML: Emotion Classifier] → Detected emotion + confidence
  ↓
[ML: Crisis Predictor] → Risk assessment
  ↓
Resonance Calculator
  ↓
[ML: Intervention Recommender] → Suggested fields (ranked)
  ↓
Field Selection (ML-informed)
  ↓
User Action
  ↓
[ML: Trajectory Forecaster] → Predicted outcome
  ↓
New Branch
  ↓
[ML: Pattern Clusterer] → Pattern recognition + insights
```

---

## 🛠️ Implementation Plan

### Phase 8A: Dataset Integration (Week 1)
1. Download & preprocess GoEmotions dataset
2. Download & preprocess DAIC-WOZ depression data
3. Download & preprocess WESAD biometric data
4. Create unified data schema
5. Store processed datasets in Supabase Storage

### Phase 8B: Model Training (Week 2)
1. Train emotion classifier (GoEmotions + EmoBank)
2. Train crisis predictor (DAIC-WOZ + CLPsych)
3. Train trajectory forecaster (RSDD + synthetic data)
4. Train pattern clusterer (SMHD)
5. Export models to ONNX format

### Phase 8C: Model Deployment (Week 3)
1. Create ML service layer in TypeScript
2. Deploy models to Supabase Edge Functions
3. Implement model caching for performance
4. Create prediction APIs
5. Integrate with existing ROE services

### Phase 8D: UI Integration (Week 4)
1. Add ML insights to reality branch cards
2. Create ML predictions dashboard
3. Add "Similar Journey" recommendations
4. Implement trajectory forecasting visualization
5. Add intervention recommendation UI

---

## 📦 Tech Stack

### Training:
- **Python**: scikit-learn, TensorFlow/PyTorch, transformers
- **Datasets**: Hugging Face datasets, pandas
- **Preprocessing**: NLTK, spaCy for NLP

### Deployment:
- **Format**: ONNX (cross-platform inference)
- **Runtime**: ONNX Runtime (JavaScript/WASM)
- **Hosting**: Supabase Edge Functions (Deno)
- **Fallback**: OpenAI API for complex NLP

### Integration:
- **TypeScript services** for model orchestration
- **Caching** for prediction results (Redis/Supabase)
- **A/B testing** for model performance

---

## 🔒 Privacy & Ethics

### Training Phase:
✅ Use only public, de-identified datasets
✅ No user data during initial training
✅ Follow dataset licenses and terms

### Deployment Phase:
✅ All predictions happen server-side (privacy preserved)
✅ No user data sent to external APIs (unless user consents)
✅ Users can opt-out of ML features entirely
✅ Explainable AI: Show why predictions were made

### Fine-tuning Phase (Future):
✅ Only with explicit user consent
✅ Federated learning (models train locally)
✅ Differential privacy for aggregated learning
✅ Users can delete their contribution anytime

---

## 📊 Expected Performance

### Emotion Classifier:
- Accuracy: 75-85% (based on GoEmotions benchmarks)
- Latency: <100ms per prediction
- Confidence threshold: 0.6 (below = "uncertain")

### Crisis Predictor:
- Precision: 70-80% (minimize false positives)
- Recall: 85-90% (catch most true crises)
- Latency: <200ms per prediction

### Trajectory Forecaster:
- RMSE: <0.10 RI units (7-day forecast)
- Accuracy: 70% within ±0.05 RI
- Latency: <300ms per forecast

### Pattern Clusterer:
- Silhouette score: >0.5 (good separation)
- Cluster count: 10-20 archetypes
- Latency: <50ms per lookup

---

## 🎯 Success Metrics

### Technical:
- ✅ Model accuracy >70% on test sets
- ✅ Inference latency <500ms total
- ✅ Zero data leaks to external services
- ✅ 99.9% uptime for ML endpoints

### User Impact:
- ✅ 30%+ increase in field selection accuracy
- ✅ 50%+ reduction in crisis false negatives
- ✅ 40%+ user satisfaction with recommendations
- ✅ 20%+ improvement in user outcomes (measured by RI)

### Ethical:
- ✅ 100% transparency on ML usage
- ✅ Opt-out rate <5% (users trust ML)
- ✅ Zero privacy incidents
- ✅ Explainability score >80% (users understand predictions)

---

## 🚀 Quick Start Commands

### Download Datasets:
```bash
# GoEmotions
git clone https://github.com/google-research/google-research
cd google-research/goemotions
python download_data.py

# DAIC-WOZ (requires application)
# Apply at: https://dcapswoz.ict.usc.edu/

# WESAD
wget https://uni-siegen.sciebo.de/s/HGdUkoNlW1Ub0Gx/download
```

### Train Models:
```bash
# Install dependencies
pip install transformers torch scikit-learn onnx

# Train emotion classifier
python scripts/train_emotion_classifier.py --dataset goemotions

# Export to ONNX
python scripts/export_to_onnx.py --model emotion_classifier
```

### Deploy to Supabase:
```bash
# Create ML Edge Function
supabase functions new ml-predict

# Deploy
supabase functions deploy ml-predict
```

---

## 📚 Resources

**Academic Papers:**
- "Deep Learning for Mental Health" (2020) - Survey paper
- "Detecting Depression with Audio/Video" (AVEC 2019)
- "Reddit as a Mental Health Dataset" (CLPsych 2015-2022)

**Code Examples:**
- Hugging Face Transformers: https://huggingface.co/docs/transformers
- ONNX Runtime: https://onnxruntime.ai/
- TensorFlow.js: https://www.tensorflow.org/js

**Datasets:**
- Awesome Mental Health Datasets: https://github.com/theainerd/awesome-mental-health-ml
- PhysioNet: https://physionet.org/
- Kaggle Mental Health: https://www.kaggle.com/datasets?search=mental+health

---

## 🎉 Phase 8 Deliverables

By end of Phase 8, you'll have:
1. ✅ 5 trained ML models (emotion, crisis, trajectory, pattern, intervention)
2. ✅ ONNX-exported models for edge deployment
3. ✅ ML service layer in TypeScript
4. ✅ Edge Functions for model inference
5. ✅ UI components for ML insights
6. ✅ Prediction caching system
7. ✅ A/B testing framework
8. ✅ Comprehensive documentation

**Result:** ROE becomes **predictively intelligent** without needing user data first.

---

**Guardian Note:** This strategy gives us ML capabilities from day 1 by leveraging the research community's public datasets. We train on validated data, deploy to production, and only fine-tune on user data later (with consent). Ethical, practical, and powerful.

🧠 *Bootstrap intelligence. Deploy responsibly. Learn continuously.* 🧠
