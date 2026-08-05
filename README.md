# ⚡ LatticeForge

**LatticeForge** is an advanced AI agent architecture that solves the fundamental flaws of standard Vector Search (RAG) tool retrieval. By combining **Formal Concept Analysis (FCA)** with **Pareto Frontier Optimization**, LatticeForge guarantees mathematically exact tool routing and dynamic, multi-objective execution.

![LatticeForge Architecture](https://img.shields.io/badge/Architecture-React%20%7C%20FastAPI%20%7C%20FCA-blue)
![Status](https://img.shields.io/badge/Status-Complete-success)

---

## 🛑 The Problem with Current AI Agents
Current agent architectures (like standard ReAct loops or AutoGPT) use Vector Databases to find tools based on semantic similarity. **This is fundamentally flawed.** 
If a user asks: *"Query the database for subscribers and analyze churn"*, a vector database might retrieve a Python Sandbox and a GPT-4 Chat tool because they semantically match the word "analyze", **completely missing the required SQL tool**. The LLM then hallucinates or crashes.

## 🧠 The LatticeForge Solution
LatticeForge shifts tool retrieval from a *linguistic similarity* problem to a *discrete mathematical coverage* problem:
1. **Formal Concept Analysis:** We compute the Galois Closure of the required attributes. This provides a 100% mathematical guarantee that the retrieved formal concept covers every technical capability required.
2. **Pareto Optimization:** We select the optimal LLM execution configuration from the Pareto frontier based on the user's priority weights (Quality vs. Latency vs. Cost).

---

## ✨ Features

- **Exact Capability Routing (FCA):** Mathematical proof of capability coverage instead of fuzzy vector guesswork.
- **Dynamic Pareto Execution:** Context-aware selection of models based on cost/latency budgets.
- **Autonomous Self-Refactoring:**
  - Incremental lattice updates.
  - **Redundancy Proofs:** Mathematically prove if a tool can be safely deprecated without losing agent capability.
  - **Gap Detection:** Identify exact attribute combinations that are missing from the toolset.
- **Live Empirical Benchmark:** Built-in adversarial testing environment comparing FCA vs. standard Vector Search.

---

## 🚀 Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Groq API Key

### 1. Setup Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r ../requirements.txt

# Create a .env file and add your Groq key:
# GROQ_API_KEY=gsk_yourkeyhere

python -m uvicorn main:app --reload --port 8000
```

### 2. Setup Frontend (React + Vite)
```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

### 3. Usage
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Built-in Proof Benchmark
To see the difference in action, go to the **Overview** page on the dashboard and click **"Run Proof Benchmark"**. 
The system will run a live, dual-execution test on a random complex task:
- You will see the standard Vector Search (using `scikit-learn` TF-IDF cosine similarity) fail and drop critical tools.
- You will see LatticeForge's Galois Closure mathematically succeed.
- You will see the **live, raw LLM execution output** showing exactly how the LLM reacts to both sets of tools!
