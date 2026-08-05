"""LatticeForge - Startup Script"""
import subprocess
import sys
import os
from pathlib import Path

backend = Path(__file__).parent / "backend"
os.chdir(str(backend))

subprocess.run([
    sys.executable, "-m", "uvicorn",
    "main:app",
    "--host", "0.0.0.0",
    "--port", "8000",
    "--reload"
])
