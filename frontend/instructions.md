# Setup Instructions: SecurePay Fraud Detection

Follow these steps to get your full-stack application running on your local machine.

## Prerequisites
- **Python 3.8+** installed.
- **VS Code** installed.

---

## Step 1: Backend Setup (Python)

1. **Open VS Code** in the project folder.
2. **Open a Terminal** (Ctrl+` or Cmd+`).
3. **Create a Virtual Environment** (Highly Recommended):
   ```bash
   python -m venv venv
   ```
4. **Activate the Environment**:
   - **Windows**: `venv\Scripts\activate`
   - **Mac/Linux**: `source venv/bin/activate`
5. **Install Dependencies**:
   ```bash
   pip install -r python/requirements.txt
   ```
6. **Train the Model**:
   Run the training script to generate the `model.pkl` file.
   ```bash
   python python/train_model.py
   ```
7. **Start the Flask API**:
   ```bash
   python python/app.py
   ```
   *Your backend is now running at `http://localhost:5000`.*

---

## Step 2: Frontend Setup

The frontend is built with Vanilla JavaScript and imports the `index.tsx` as a module.

1. **API Key**: Ensure you have your Google Gemini API key configured in your environment as `API_KEY`.
2. **Run the App**: Simply open `index.html` in your browser or use the **"Live Server"** extension in VS Code.

---

## How it Works
1. **The Form**: Captures transaction metadata (Amount, Balances, Type).
2. **The Prediction**: Sends data to the Flask API. The API uses a **Scikit-Learn Logistic Regression** model to calculate a "Fraud Probability."
3. **The Insight**: After the model returns the result, the app sends the same metadata to **Gemini AI** to get a natural language explanation of the decision.
4. **The Dashboard**: Displays everything in a beautiful, reactive UI.

## Troubleshooting
- **CORS Error**: Ensure `flask-cors` is installed and initialized in `app.py`.
- **Module Error**: If using a local browser, make sure you are serving via a server (like Live Server) because `type="module"` scripts have CORS restrictions on `file://` protocols.