import {
  GitBranch,
  TrendingUp,
  Hexagon,
  Compass,
  SlidersHorizontal,
  Scissors,
  Activity,
  Shield,
  Network,
  Target,
  Layers,
  CircleDot,
  Sliders,
} from 'lucide-react'

import KNNModule from '../components/Modules/KNNModule.jsx'
import LinearRegressionModule from '../components/Modules/LinearRegressionModule.jsx'
import KMeansModule from '../components/Modules/KMeansModule.jsx'
import PCAModule from '../components/Modules/PCAModule.jsx'
import PreprocessingModule from '../components/Modules/PreprocessingModule.jsx'
import DataSplittingModule from '../components/Modules/DataSplittingModule.jsx'
import LogisticRegressionModule from '../components/Modules/LogisticRegressionModule.jsx'
import RegularizationModule from '../components/Modules/RegularizationModule.jsx'
import TreeEnsembleModule from '../components/Modules/TreeEnsembleModule.jsx'
import EvaluationModule from '../components/Modules/EvaluationModule.jsx'
import SVMModule from '../components/Modules/SVMModule.jsx'
import DBSCANModule from '../components/Modules/DBSCANModule.jsx'
import TuningModule from '../components/Modules/TuningModule.jsx'

export const GROUPS = [
  {
    label: 'SUPERVISED LEARNING',
    items: [
      { id: 'knn', label: 'K-Nearest Neighbors', short: 'KNN', icon: GitBranch, color: '#a78bfa' },
      { id: 'linear_regression', label: 'Linear Regression', short: 'LinReg', icon: TrendingUp, color: '#34d399' },
      { id: 'ridge_lasso', label: 'Regularized Linear Models', short: 'Reg', icon: Shield, color: '#8b5cf6' },
      { id: 'logistic_regression', label: 'Logistic Regression', short: 'LogReg', icon: Activity, color: '#f43f5e' },
      { id: 'decision_trees', label: 'Tree & Ensemble Models', short: 'Trees', icon: Network, color: '#f59e0b' },
      { id: 'svm', label: 'Support Vector Machines', short: 'SVM', icon: Layers, color: '#6366f1' },
    ],
  },
  {
    label: 'UNSUPERVISED LEARNING',
    items: [
      { id: 'kmeans', label: 'K-Means Clustering', short: 'K-Means', icon: Hexagon, color: '#fbbf24' },
      { id: 'dbscan', label: 'DBSCAN Clustering', short: 'DBSCAN', icon: CircleDot, color: '#10b981' },
      { id: 'pca', label: 'Principal Component Analysis', short: 'PCA', icon: Compass, color: '#22d3ee' },
    ],
  },
  {
    label: 'DATA PREPROCESSING',
    items: [
      { id: 'preprocessing', label: 'Data Preprocessing Basics', short: 'Preprocess', icon: SlidersHorizontal, color: '#f472b6' },
      { id: 'data_splitting', label: 'Data Splitting & Leakage Prevention', short: 'Split', icon: Scissors, color: '#f43f5e' },
    ],
  },
  {
    label: 'EVALUATION & SELECTION',
    items: [
      { id: 'metrics', label: 'Performance Metrics & Confusion Matrix', short: 'Metrics', icon: Target, color: '#3b82f6' },
      { id: 'tuning', label: 'Hyperparameter Optimization', short: 'Tuning', icon: Sliders, color: '#ec4899' },
    ],
  },
]

export const MODULE_COMPONENTS = {
  knn: KNNModule,
  linear_regression: LinearRegressionModule,
  ridge_lasso: RegularizationModule,
  logistic_regression: LogisticRegressionModule,
  decision_trees: TreeEnsembleModule,
  svm: SVMModule,
  kmeans: KMeansModule,
  dbscan: DBSCANModule,
  pca: PCAModule,
  preprocessing: PreprocessingModule,
  data_splitting: DataSplittingModule,
  metrics: EvaluationModule,
  tuning: TuningModule,
}
