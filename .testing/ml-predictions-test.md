# ML Predictions Testing Checklist

## Manual Testing Steps

### 1. Navigate to ML Predictions

- URL: <http://localhost:8080/ml-predictions>
- Expected: Page loads without errors

### 2. Visual Verification

- [ ] "Production" badge visible (green)
- [ ] "Browser-Powered" badge with lightning icon
- [ ] Header shows "ML Predictions" with Brain icon
- [ ] Blue info alert about browser-based ML
- [ ] Two tabs: "Make Prediction" and "Model Info"

### 3. Test Churn Model Prediction

Fill in these values:

- Usage Frequency: 45
- Support Tickets: 5
- Tenure (months): 12
- Monthly Spend: 150
- Feature Usage %: 60

Click "Get Prediction" button

**Expected Results:**

- Prediction appears (Will Churn / Will Stay)
- Confidence score shows with progress bar
- Feature importance list displays
- No console errors

### 4. Test Revenue Model

- Switch model dropdown to "Revenue Forecaster"
- Fill in:
  - Number of Customers: 250
  - Avg Deal Size: 2500
  - Marketing Spend: 15000
  - Sales Team Size: 10
  - Market Growth %: 5
- Click "Get Prediction"

**Expected Results:**

- Revenue prediction shows (e.g., $25,000)
- Confidence and importance display
- No errors

### 5. Check Model Info Tab

- Click "Model Info" tab
- Verify models listed with:
  - Name, description
  - Type badge
  - Version badge
  - Accuracy badge

### 6. Console Check

Open Browser DevTools (F12) and check:

- [ ] No red errors
- [ ] TensorFlow.js loads successfully
- [ ] Models create/load without issues

### 7. Performance Check

- [ ] Predictions complete in < 1 second
- [ ] Page is responsive
- [ ] No loading spinners stuck

## Known Issues to Watch For

- If models don't exist: createDemoModels() should auto-create them
- If TensorFlow.js doesn't load: Check network tab
- If predictions fail: Check browser console for errors

## Success Criteria

✅ Page loads with production badges
✅ Predictions work for both models
✅ Results display correctly
✅ No console errors
✅ Fast performance (< 1s predictions)
