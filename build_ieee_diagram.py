import os
import subprocess
from pathlib import Path
from PIL import Image

def generate_ieee_style_diagram():
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Figure 1. Proposed methodology & system workflow</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #FFFFFF;
    font-family: Arial, Helvetica, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    width: 1040px;
    margin: 0 auto;
    overflow: hidden;
  }
  
  .canvas-container {
    width: 990px;
    background: #FFFFFF;
    position: relative;
    padding-bottom: 8px;
  }

  svg {
    display: block;
    width: 100%;
    height: 640px;
  }

  .caption {
    font-family: 'Times New Roman', Times, serif;
    font-size: 14px;
    color: #000000;
    text-align: center;
    margin-top: 14px;
  }
</style>
</head>
<body>

<div class="canvas-container">
  <svg viewBox="0 0 990 620" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Arrow marker -->
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9 z" fill="#000000" />
      </marker>
      
      <!-- Subtle shadow for key hub -->
      <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
        <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.10"/>
      </filter>
    </defs>

    <!-- ==================== TOP ROW: INGESTION ==================== -->
    
    <!-- 1. User / Client Icon (Left) -->
    <g transform="translate(18, 28)">
      <!-- Circle Head -->
      <circle cx="25" cy="20" r="14" fill="#FCA5A5" stroke="#000000" stroke-width="1.5"/>
      <!-- Body -->
      <path d="M 5 54 C 5 36, 45 36, 45 54 Z" fill="#93C5FD" stroke="#000000" stroke-width="1.5"/>
      <!-- Document in hand -->
      <rect x="36" y="24" width="18" height="24" rx="2" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
      <line x1="40" y1="30" x2="50" y2="30" stroke="#000000" stroke-width="1.2"/>
      <line x1="40" y1="35" x2="50" y2="35" stroke="#000000" stroke-width="1.2"/>
      <line x1="40" y1="40" x2="48" y2="40" stroke="#000000" stroke-width="1.2"/>
      <text x="25" y="-6" font-size="12" font-weight="bold" text-anchor="middle" fill="#000000">User / Client</text>
    </g>

    <!-- Arrow User -> Ingestion Box -->
    <path d="M 78 58 L 115 58" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

    <!-- Group Box: Task Ingestion & Capability Extraction -->
    <rect x="115" y="24" width="430" height="68" rx="14" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
    
    <!-- Sub-box 1: Natural Language Task -->
    <g transform="translate(125, 33)">
      <rect x="0" y="0" width="195" height="50" rx="8" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <!-- Icon Chat / Prompt -->
      <path d="M 12 14 L 32 14 C 35 14, 37 16, 37 19 L 37 32 C 37 35, 35 37, 32 37 L 22 37 L 16 42 L 16 37 L 12 37 C 9 37, 7 35, 7 32 L 7 19 C 7 16, 9 14, 12 14 Z" fill="#BFDBFE" stroke="#000000" stroke-width="1.2"/>
      <text x="116" y="22" font-size="11" font-weight="bold" text-anchor="middle" fill="#000000">Natural Language Task</text>
      <text x="116" y="38" font-size="9.5" text-anchor="middle" fill="#475569">(Task String & Weights w)</text>
    </g>

    <!-- Arrow inside Ingestion Box -->
    <path d="M 320 58 L 340 58" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>

    <!-- Sub-box 2: Capability Extractor -->
    <g transform="translate(340, 33)">
      <rect x="0" y="0" width="195" height="50" rx="8" fill="#F8FAFC" stroke="#000000" stroke-width="1.2"/>
      <!-- Icon Filter / Matrix -->
      <rect x="10" y="13" width="22" height="24" rx="3" fill="#FDE68A" stroke="#000000" stroke-width="1.2"/>
      <line x1="14" y1="20" x2="28" y2="20" stroke="#000000" stroke-width="1.2"/>
      <line x1="14" y1="25" x2="28" y2="25" stroke="#000000" stroke-width="1.2"/>
      <line x1="14" y1="30" x2="24" y2="30" stroke="#000000" stroke-width="1.2"/>
      <text x="116" y="22" font-size="11" font-weight="bold" text-anchor="middle" fill="#000000">Capability Extractor</text>
      <text x="116" y="38" font-size="9.5" text-anchor="middle" fill="#475569">Extracts Attributes B_req</text>
    </g>

    <!-- Arrow Ingestion Box -> Central Hub -->
    <path d="M 545 58 L 680 58" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="612" y="50" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#000000">Required B_req</text>

    <!-- CENTRAL HUB: Formal Concept Lattice & Registry (Top Right) -->
    <g transform="translate(680, 10)">
      <rect x="0" y="0" width="240" height="126" rx="10" fill="#FFFFFF" stroke="#000000" stroke-width="1.5" filter="url(#shadow)"/>
      <text x="120" y="-6" font-size="12" font-weight="bold" text-anchor="middle" fill="#000000">Formal Concept Lattice</text>
      <text x="120" y="8" font-size="10" text-anchor="middle" fill="#475569">& Tool Registry</text>

      <!-- Lattice / Network Hexagon Icon -->
      <g transform="translate(75, 20)">
        <polygon points="45,4 78,22 78,58 45,76 12,58 12,22" fill="#FEF3C7" stroke="#000000" stroke-width="1.5"/>
        <circle cx="45" cy="40" r="14" fill="#F59E0B" stroke="#000000" stroke-width="1.5"/>
        
        <!-- Nodes & Edges -->
        <circle cx="45" cy="18" r="4" fill="#3B82F6" stroke="#000000" stroke-width="1"/>
        <circle cx="28" cy="34" r="4" fill="#10B981" stroke="#000000" stroke-width="1"/>
        <circle cx="62" cy="34" r="4" fill="#10B981" stroke="#000000" stroke-width="1"/>
        <circle cx="45" cy="58" r="4" fill="#8B5CF6" stroke="#000000" stroke-width="1"/>
        
        <line x1="45" y1="18" x2="28" y2="34" stroke="#000000" stroke-width="1.2"/>
        <line x1="45" y1="18" x2="62" y2="34" stroke="#000000" stroke-width="1.2"/>
        <line x1="28" y1="34" x2="45" y2="58" stroke="#000000" stroke-width="1.2"/>
        <line x1="62" y1="34" x2="45" y2="58" stroke="#000000" stroke-width="1.2"/>
      </g>
      
      <text x="120" y="112" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#000000">Formal Context K = (G, M, I)</text>
    </g>


    <!-- ==================== CONNECTOR: HUB -> GALOIS CLOSURE ==================== -->
    <!-- Routes cleanly below top box at y=135, no intersection! -->
    <path d="M 700 136 L 700 148 L 180 148 L 180 185" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="440" y="142" font-size="9" font-weight="bold" text-anchor="middle" fill="#000000">Derivation Query (B')</text>


    <!-- ==================== MIDDLE ROW: ENGINES & DISPATCH ==================== -->

    <!-- Module A: Discrete Galois Closure Engine -->
    <g transform="translate(90, 185)">
      <rect x="0" y="0" width="180" height="54" rx="10" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
      <!-- Icon Math/Lattice -->
      <g transform="translate(8, 13)">
        <rect x="0" y="0" width="28" height="28" rx="4" fill="#BBF7D0" stroke="#000000" stroke-width="1"/>
        <text x="14" y="20" font-size="15" font-weight="bold" text-anchor="middle" fill="#000000">B''</text>
      </g>
      <text x="108" y="23" font-size="11" font-weight="bold" text-anchor="middle" fill="#000000">Galois Closure Engine</text>
      <text x="108" y="39" font-size="9.5" text-anchor="middle" fill="#334155">B''_req = (B'_req)'</text>
    </g>

    <!-- Module B: Multi-Objective Pareto Frontier Engine -->
    <g transform="translate(300, 185)">
      <rect x="0" y="0" width="180" height="54" rx="10" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
      <!-- Icon Pareto Graph -->
      <g transform="translate(8, 13)">
        <rect x="0" y="0" width="28" height="28" rx="4" fill="#E9D5FF" stroke="#000000" stroke-width="1"/>
        <path d="M 5 22 Q 13 18 22 6" fill="none" stroke="#000000" stroke-width="1.8"/>
        <circle cx="10" cy="16" r="2.5" fill="#7C3AED"/>
        <circle cx="17" cy="10" r="2.5" fill="#7C3AED"/>
      </g>
      <text x="108" y="23" font-size="11" font-weight="bold" text-anchor="middle" fill="#000000">Pareto Frontier Engine</text>
      <text x="108" y="39" font-size="9.5" text-anchor="middle" fill="#334155">Min L2 to Ideal Z*(1,0,0)</text>
    </g>

    <!-- Connector: Central Hub -> Pareto Engine -->
    <path d="M 740 136 L 740 212 L 480 212" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="610" y="206" font-size="9" text-anchor="middle" fill="#000000">Configs C & Telemetry</text>

    <!-- Module C: Dynamic Dispatch & Model Adapter -->
    <g transform="translate(490, 272)">
      <rect x="0" y="0" width="170" height="54" rx="10" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
      <!-- Icon Microchip/Server -->
      <g transform="translate(8, 13)">
        <rect x="0" y="0" width="28" height="28" rx="4" fill="#FED7AA" stroke="#000000" stroke-width="1"/>
        <rect x="8" y="8" width="12" height="12" fill="#EA580C"/>
      </g>
      <text x="104" y="23" font-size="11" font-weight="bold" text-anchor="middle" fill="#000000">Model Dispatcher</text>
      <text x="104" y="39" font-size="9.5" text-anchor="middle" fill="#334155">Groq Llama-3.3 / GPT-4o</text>
    </g>

    <!-- Arrow Pareto -> Dispatcher -->
    <path d="M 390 239 L 390 299 L 490 299" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="435" y="293" font-size="9" font-weight="bold" fill="#000000">c* (optimal)</text>

    <!-- Arrow Galois -> Dispatcher / Sandbox (Covering Concept Extent A*) -->
    <path d="M 180 239 L 180 340 L 490 340" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="330" y="334" font-size="9" font-weight="bold" text-anchor="middle" fill="#000000">Exact Covering Tools A*</text>

    <!-- Module D: Heterogeneous Tool Sandbox (Center Right) -->
    <g transform="translate(710, 225)">
      <rect x="0" y="0" width="210" height="106" rx="10" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
      <text x="105" y="20" font-size="11" font-weight="bold" text-anchor="middle" fill="#000000">Tool Sandbox & Schemas</text>
      
      <!-- 4 Tools inside -->
      <g transform="translate(10, 30)">
        <rect x="0" y="0" width="90" height="30" rx="5" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
        <text x="45" y="19" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#000000">SQL_Analytics</text>
      </g>
      <g transform="translate(110, 30)">
        <rect x="0" y="0" width="90" height="30" rx="5" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
        <text x="45" y="19" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#000000">Python_Sandbox</text>
      </g>
      <g transform="translate(10, 66)">
        <rect x="0" y="0" width="90" height="30" rx="5" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
        <text x="45" y="19" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#000000">Web_Scraper</text>
      </g>
      <g transform="translate(110, 66)">
        <rect x="0" y="0" width="90" height="30" rx="5" fill="#F1F5F9" stroke="#000000" stroke-width="1"/>
        <text x="45" y="19" font-size="8.5" font-weight="bold" text-anchor="middle" fill="#000000">PDF_Analyzer</text>
      </g>
    </g>

    <!-- Connector: Central Hub -> Tool Sandbox -->
    <path d="M 815 136 L 815 225" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="855" y="180" font-size="9" text-anchor="middle" fill="#000000">Tool Extent A*</text>

    <!-- Arrow Dispatcher -> Tool Sandbox -->
    <path d="M 660 299 L 710 299" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="685" y="291" font-size="9" font-weight="bold" text-anchor="middle" fill="#000000">Execute</text>


    <!-- ==================== LOWER ROW: VERIFICATION & OUTCOMES ==================== -->

    <!-- Branch Node: Capability Verification & Audit -->
    <g transform="translate(490, 395)">
      <rect x="0" y="0" width="170" height="54" rx="10" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
      <text x="85" y="23" font-size="11" font-weight="bold" text-anchor="middle" fill="#000000">Capability Verifier</text>
      <text x="85" y="39" font-size="9.5" text-anchor="middle" fill="#334155">& Runtime Guardrail</text>
    </g>

    <!-- Arrow Sandbox -> Capability Verifier (Clean route via y=365) -->
    <path d="M 740 331 L 740 365 L 575 365 L 575 395" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="655" y="358" font-size="9" font-weight="bold" text-anchor="middle" fill="#000000">Agent Action Traces</text>

    <!-- Outcome 1: Successful Execution (Bottom Left) -->
    <g transform="translate(90, 395)">
      <rect x="0" y="0" width="180" height="54" rx="10" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
      <!-- Green Check Icon -->
      <g transform="translate(10, 14)">
        <circle cx="13" cy="13" r="12" fill="#DCFCE7" stroke="#000000" stroke-width="1.2"/>
        <path d="M 7 13 L 11 17 L 19 9" fill="none" stroke="#16A34A" stroke-width="2.5"/>
      </g>
      <text x="108" y="23" font-size="11" font-weight="bold" text-anchor="middle" fill="#000000">Verified Task Output</text>
      <text x="108" y="39" font-size="9.5" text-anchor="middle" fill="#166534">100% Covered (Success)</text>
    </g>

    <!-- Arrow Verifier -> Success Output -->
    <path d="M 490 422 L 270 422" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="380" y="414" font-size="9.5" font-weight="bold" text-anchor="middle" fill="#16A34A">CoverageError = 0</text>

    <!-- Outcome 2: Execution Failure / Rejection (Circle-Slash Icon) -->
    <g transform="translate(490, 505)">
      <rect x="0" y="0" width="170" height="54" rx="10" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
      <!-- Circle-Slash Icon (Exactly like ABSC reference diagram!) -->
      <g transform="translate(10, 14)">
        <circle cx="13" cy="13" r="12" fill="#FEE2E2" stroke="#000000" stroke-width="1.2"/>
        <line x1="5" y1="5" x2="21" y2="21" stroke="#DC2626" stroke-width="2.5"/>
      </g>
      <text x="104" y="23" font-size="11" font-weight="bold" text-anchor="middle" fill="#000000">Halt / Refusal Error</text>
      <text x="104" y="39" font-size="9.5" text-anchor="middle" fill="#991B1B">Missing Tool Flagged</text>
    </g>

    <!-- Arrow Verifier -> Failure Output -->
    <path d="M 575 449 L 575 505" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="618" y="480" font-size="9" font-weight="bold" text-anchor="middle" fill="#DC2626">Tool Missing</text>

    <!-- Module E: Telemetry & Autonomous Self-Refactoring (Bottom Right) -->
    <g transform="translate(710, 395)">
      <rect x="0" y="0" width="210" height="116" rx="10" fill="#FFFFFF" stroke="#000000" stroke-width="1.5"/>
      <text x="105" y="20" font-size="11" font-weight="bold" text-anchor="middle" fill="#000000">Telemetry & Self-Refactoring</text>
      
      <!-- 2 Boxes inside -->
      <g transform="translate(10, 30)">
        <rect x="0" y="0" width="190" height="34" rx="5" fill="#F8FAFC" stroke="#000000" stroke-width="1"/>
        <text x="95" y="16" font-size="9" font-weight="bold" text-anchor="middle" fill="#000000">Telemetry Profiler (SQLite)</text>
        <text x="95" y="28" font-size="8.5" text-anchor="middle" fill="#64748B">Logs latency, cost, and quality</text>
      </g>
      <g transform="translate(10, 70)">
        <rect x="0" y="0" width="190" height="36" rx="5" fill="#F8FAFC" stroke="#000000" stroke-width="1"/>
        <text x="95" y="16" font-size="9" font-weight="bold" text-anchor="middle" fill="#000000">Redundancy & Gap Verifier</text>
        <text x="95" y="29" font-size="8.5" text-anchor="middle" fill="#64748B">Proves deprecation; flags B' = Ø</text>
      </g>
    </g>

    <!-- Arrow Capability Verifier -> Telemetry -->
    <path d="M 660 435 L 710 435" fill="none" stroke="#000000" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="685" y="427" font-size="8.5" text-anchor="middle" fill="#475569">Metrics</text>

    <!-- CLOSED-LOOP FEEDBACK: Telemetry -> Central Concept Lattice -->
    <!-- Routes on far right margin (x=940), completely outside all boxes! -->
    <path d="M 920 453 L 945 453 L 945 73 L 920 73" fill="none" stroke="#000000" stroke-width="1.5" stroke-dasharray="5,4" marker-end="url(#arrow)"/>
    <text x="958" y="260" font-size="9" font-weight="bold" fill="#000000" transform="rotate(90, 958, 260)">Closed-Loop Context Update</text>

  </svg>

  <div class="caption">
    <strong>Figure 1.</strong> Proposed LatticeForge methodology & system workflow
  </div>
</div>

</body>
</html>
"""
    html_path = Path("c:/Users/bhamr/anti/GenAIMAJOR/option1/latticeforge_workflow_ieee.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"HTML generated: {html_path}")

    # Render PNG via Chrome
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    png_path = Path("c:/Users/bhamr/anti/GenAIMAJOR/option1/latticeforge_workflow_ieee.png")
    
    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=2",
        f"--screenshot={png_path}",
        "--window-size=1040,730",
        f"file:///{html_path}"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    print(f"Chrome exit: {res.returncode}, PNG exists: {png_path.exists()} ({png_path.stat().st_size if png_path.exists() else 0} bytes)")

    # Copy to root
    root_png = Path("c:/Users/bhamr/anti/GenAIMAJOR/latticeforge_workflow_ieee.png")
    import shutil
    shutil.copy(png_path, root_png)
    
    # Save PDF
    img = Image.open(png_path)
    pdf_path = Path("c:/Users/bhamr/anti/GenAIMAJOR/latticeforge_workflow_ieee.pdf")
    img.save(pdf_path, "PDF", resolution=300.0)
    print("PDF generated successfully.")

if __name__ == "__main__":
    generate_ieee_style_diagram()
