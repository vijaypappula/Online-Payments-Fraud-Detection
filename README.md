# Global Fraud SecurePay

A modern fraud detection dashboard featuring an intelligent AI assistant powered by Google's Gemini models. This application helps analysts investigate transactions, assess risk scores, and receive real-time insights.

## Features

- **AI Security Companion**: Integrated chat assistant using Google Gemini Pro to analyze transaction context and answer security-related questions.
- **Real-time Risk Analysis**: Visual representation of transaction risk probabilities and reasoning.
- **Modern UI/UX**: Built with React, Tailwind CSS, and Framer Motion for smooth interactions.
- **Secure Architecture**: Best practices for API key management using environment variables.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Python, Flask, Scikit-learn
- **AI Integration**: Google Generative AI SDK (Gemini Pro)

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher. A `.nvmrc` file is included. If you use `nvm`, run `nvm use` in the root directory.
- **Python**: 3.8+
- A Google Gemini API Key (Get one at Google AI Studio)

### Full-Stack Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/2022civr27-cyber/Fraud_Detection1.git
   cd Fraud_Detection1
   ```

2. **Backend Setup (Python/Flask API)**
   - Create and activate a virtual environment:
     ```bash
     python -m venv venv
     # Windows
     venv\Scripts\activate
     # Mac/Linux
     source venv/bin/activate
     ```
   - Install Python dependencies (assuming a `python/` directory with `requirements.txt`):
     ```bash
     pip install -r python/requirements.txt
     ```
   - Train the model (if `model.pkl` is not present):
     ```bash
     python python/train_model.py
     ```
   - Start the Flask API server:
     ```bash
     python python/app.py
     ```
   - The backend will be running at `http://localhost:5000`.

3. **Frontend Setup (React Client)**
   - Navigate to the frontend directory:
     ```bash
     cd frontend
     ```
   - Install frontend dependencies:
     ```bash
     npm install
     ```
   - Create a `.env.local` file in the `frontend` directory.
   - Add your Gemini API key to `.env.local`:
     ```env
     VITE_GEMINI_API_KEY=your_actual_api_key_here
     ```
   - Run the development server:
     ```bash
     npm run dev
     ```
   - The frontend will be running at `http://localhost:5173` (or another port if 5173 is busy).

## Pushing to GitHub

To deploy your application or collaborate with others, you'll need to push your code to a GitHub repository.

1. **Create a new repository on GitHub.** Go to github.com/new and create an empty repository.

2. **Initialize Git and make your first commit** in your local project directory:
    ```bash
    git init -b main
    git add .
    git commit -m "Initial commit"
    ```

3. **Link your local repository to GitHub** and push your code.
    ```bash
    git remote add origin https://github.com/2022civr27-cyber/Fraud_Detection1.git
    # If you see an error "remote origin already exists", you can update the URL with:
    # git remote set-url origin https://github.com/2022civr27-cyber/Fraud_Detection1.git

    git push -u origin main
    ```

## License

MIT

## Deployment

Once your code is on GitHub, the easiest way to deploy this application is using a platform like Vercel or Netlify.

### Vercel
1. Import your project into Vercel from your Git repository.
2. Configure the **Root Directory** to be `frontend`.
3. Add your `VITE_GEMINI_API_KEY` in the Vercel project settings under "Environment Variables".
4. Vercel will automatically detect the build settings and the `.nvmrc` file. Click Deploy.

### Netlify
1. Create a new site from Git in Netlify.
2. Netlify will auto-detect settings. If not, set the **Base directory** to `frontend`, **Build command** to `npm run build`, and **Publish directory** to `frontend/dist`.
3. Add your `VITE_GEMINI_API_KEY` in the site settings under "Build & deploy" -> "Environment variables".
4. Netlify will also use the `.nvmrc` file for the Node.js version. Click Deploy.