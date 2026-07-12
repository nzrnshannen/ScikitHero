# ⚡ Scikit Hero

**Scikit Hero** is an end-to-end, highly interactive visual textbook and cheat-sheet application designed to make mastering **Scikit-Learn** and foundational machine learning concepts completely intuitive. 

Instead of reading dry text, **Scikit Hero** lets you manipulate data points, shift boundaries, and tweak parameters inside a live canvas sandbox, watching how the underlying mathematical formulas and written word problems recalculate in real time.

---

## 🚀 Key Features

* **Interactive Math Sandboxes:** Click to plot data points, drag target coordinates, adjust parameters (like $K$ values or regularization factors), and see immediate algorithmic responses.
* **Live Note Synchronization:** The written lesson text, computational equations, and example use-case problems adapt their variables and metrics automatically based on your sandbox interactions.
* **Dual-Layer Precision Export Engine:**
  * **Export Full Chapter (PDF):** Compiles the entire synchronized lesson alongside a snapshot of the chart into a clean, presentation-ready PDF textbook layout (automatically stripping out buttons and UI sliders).
  * **Export Chart Only (PNG):** Instantly downloads a standalone high-resolution image of the 2D grid/canvas for external reports or slide decks.
* **Modular Codebase:** Organized using a clean, scalable component design model separating curriculum text models from core canvas views.

---

## 📚 Machine Learning Curriculum Covered

The platform covers an expansive, chronological data science execution pipeline:

### 1. Data Preprocessing & Hygiene
* **Feature Scaling:** Live visual transformations between `StandardScaler` and `MinMaxScaler`.
* **Data Splitting & Leakage Prevention:** Interactive flowcharts showing proper `train_test_split` routines.

### 2. Supervised Learning (Predictive Models)
* **K-Nearest Neighbors (KNN):** Drag query points to calculate Minkowski/Euclidean distances and see majority vote shifts.
* **Linear & Regularized Regression:** Plot points to calculate Ordinary Least Squares lines, intercept metrics, and Ridge/Lasso L1/L2 penalties.
* **Logistic Regression:** Watch a 3D sigmoidal probability wave adjust classifications live.
* **Tree-Based & Ensemble Models:** Dynamically partition feature spaces with Decision Trees, Random Forests, and Gradient Boosting grids.
* **Support Vector Machines (SVM):** Manipulate margins, tweak the `C` parameter, and highlight core Support Vectors.

### 3. Unsupervised Learning (Pattern Discovery)
* **K-Means Clustering:** Step through centroid shifts and watch the live calculation of internal `inertia_` scores.
* **DBSCAN Clustering:** Adjust density search areas ($\epsilon$ and `MinSamples`) to discover irregular geometries and isolate noise.
* **Principal Component Analysis (PCA):** Rotate axis projection vectors to isolate max explained variance.

### 4. Evaluation & Optimization
* **Performance Metrics:** A dynamic $2 \times 2$ Confusion Matrix running live calculations for Precision, Recall, and F1-Scores.
* **Hyperparameter Optimization:** Animated grid arrays visually mapping the operational search space differences of `GridSearchCV` vs. `RandomizedSearchCV`.

---

## 🛠️ Tech Stack & Architecture

* **Framework:** React 18+ (Functional Hooks & State Architecture)
* **Styling:** Tailwind CSS (Modern, dark-themed developer aesthetic)
* **Icons:** Lucide React
* **Visual Graphics:** HTML5 Canvas API / Scalable Vector Graphics (SVG)
* **Document Compilation:** `html2canvas` + `jsPDF` / `html2pdf.js`

```text
src/
├── components/
│   ├── Layout/
│   │   ├── Dashboard.tsx        # Unified layout container shell
│   │   ├── Sidebar.tsx          # Multi-module routing array
│   │   └── DeveloperCard.tsx    # Bio panel & form interface
│   └── Modules/
│       ├── KNNModule.tsx        # Individual interactive sandboxes
│       └── ...
├── data/
│   └── curriculumData.ts        # Content repository for math text strings
└── hooks/
    └── useExport.ts             # Custom dual-mode image/PDF pipeline
```
