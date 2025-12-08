/**
 * Architectural Decision Detector
 *
 * Determines if a change or decision qualifies as an architectural decision
 * based on scope, impact, and pattern analysis.
 */

export interface ChangeAnalysis {
  affectedFiles: string[];
  affectedConcepts: string[];
  scope: "file" | "module" | "project";
  patternChanges: string[];
  dependentsCount: number;
  breakingChanges: boolean;
  configurationChanges: boolean;
}

export interface ArchitecturalDecisionCriteria {
  isArchitectural: boolean;
  confidence: number;
  reasons: string[];
  recommendation: "record" | "skip" | "use_project_decision";
}

/**
 * Determine if a change qualifies as an architectural decision
 *
 * @param analysis Change analysis data
 * @returns Criteria assessment with recommendation
 */
export function assessArchitecturalDecision(
  analysis: ChangeAnalysis
): ArchitecturalDecisionCriteria {
  const reasons: string[] = [];
  let confidence = 0.0;

  // Criterion 1: File Impact (3+ files)
  if (analysis.affectedFiles.length >= 3) {
    reasons.push(`Affects ${analysis.affectedFiles.length} files`);
    confidence += 0.3;
  }

  // Criterion 2: Concept Impact (10+ concepts)
  if (analysis.affectedConcepts.length >= 10) {
    reasons.push(
      `Affects ${analysis.affectedConcepts.length} semantic concepts`
    );
    confidence += 0.25;
  }

  // Criterion 3: Project Scope
  if (analysis.scope === "project") {
    reasons.push("Project-wide scope detected");
    confidence += 0.3;
  } else if (analysis.scope === "module") {
    reasons.push("Module-wide scope detected");
    confidence += 0.15;
  }

  // Criterion 4: Dependency Impact (5+ dependents)
  if (analysis.dependentsCount >= 5) {
    reasons.push(`Affects ${analysis.dependentsCount} dependent files`);
    confidence += 0.2;
  }

  // Criterion 5: Pattern Changes
  if (analysis.patternChanges.length > 0) {
    reasons.push(
      `Introduces ${analysis.patternChanges.length} pattern changes`
    );
    confidence += 0.25;
  }

  // Criterion 6: Breaking Changes
  if (analysis.breakingChanges) {
    reasons.push("Contains breaking changes");
    confidence += 0.2;
  }

  // Criterion 7: Configuration Changes
  if (analysis.configurationChanges) {
    reasons.push("Modifies project configuration");
    confidence += 0.15;
  }

  // Determine recommendation
  const isArchitectural = confidence >= 0.4; // Threshold: 40% confidence

  let recommendation: "record" | "skip" | "use_project_decision";
  if (isArchitectural) {
    recommendation = "record";
  } else if (confidence >= 0.2) {
    // Medium impact - might be a project decision
    recommendation = "use_project_decision";
  } else {
    recommendation = "skip";
  }

  return {
    isArchitectural,
    confidence: Math.min(1.0, confidence),
    reasons,
    recommendation,
  };
}

/**
 * Check if file path indicates architectural significance
 */
export function isArchitecturallySignificantFile(filePath: string): boolean {
  const architecturalIndicators = [
    // Configuration files
    "package.json",
    "tsconfig.json",
    "Cargo.toml",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "pyproject.toml",

    // Entry points
    "main.ts",
    "main.js",
    "index.ts",
    "index.js",
    "app.py",
    "main.rs",
    "main.go",

    // Architecture files
    "architecture.md",
    "adr/",
    "docs/architecture",

    // Core infrastructure
    "src/core/",
    "src/infrastructure/",
    "src/framework/",
    "lib/core/",
  ];

  return architecturalIndicators.some(
    (indicator) => filePath.includes(indicator) || filePath.endsWith(indicator)
  );
}

/**
 * Extract architectural decision context from change analysis
 */
export function extractDecisionContext(analysis: ChangeAnalysis): {
  decisionContext: string;
  suggestedRationale: string;
  suggestedAlternatives: Record<string, string>;
} {
  let decisionContext = "";
  let suggestedRationale = "";
  const suggestedAlternatives: Record<string, string> = {};

  // Build context from analysis
  if (analysis.patternChanges.length > 0) {
    decisionContext = `Adopted ${analysis.patternChanges.join(
      ", "
    )} pattern(s)`;
    suggestedRationale = `Pattern detected across ${analysis.affectedFiles.length} files`;
  } else if (analysis.scope === "project") {
    decisionContext = `Project-wide change affecting ${analysis.affectedFiles.length} files`;
    suggestedRationale = `Change impacts multiple modules and ${analysis.affectedConcepts.length} concepts`;
  } else if (analysis.breakingChanges) {
    decisionContext = "Breaking change introduced";
    suggestedRationale = `Change affects ${analysis.dependentsCount} dependent files`;
  } else {
    decisionContext = `Structural change affecting ${analysis.affectedFiles.length} files`;
    suggestedRationale = `Change impacts ${analysis.affectedConcepts.length} semantic concepts`;
  }

  return {
    decisionContext,
    suggestedRationale,
    suggestedAlternatives,
  };
}

/**
 * Quick check: Is this likely an architectural decision?
 *
 * Simplified version for quick assessment
 */
export function isLikelyArchitectural(
  analysis: Partial<ChangeAnalysis>
): boolean {
  return !!(
    (analysis.affectedFiles && analysis.affectedFiles.length >= 3) ||
    (analysis.affectedConcepts && analysis.affectedConcepts.length >= 10) ||
    analysis.scope === "project" ||
    (analysis.dependentsCount && analysis.dependentsCount >= 5) ||
    (analysis.patternChanges && analysis.patternChanges.length > 0) ||
    analysis.breakingChanges
  );
}
