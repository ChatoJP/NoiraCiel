function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/['']/g, "'");
}

export function validateAnswer(
  input: string,
  correct: string,
  altAnswers: string[] = []
): boolean {
  const normInput = normalize(input);
  const normCorrect = normalize(correct);
  if (!normInput) return false;

  if (normInput === normCorrect) return true;
  for (const alt of altAnswers) {
    if (normInput === normalize(alt)) return true;
  }

  // Fuzzy match for single-word answers longer than 4 chars
  const allAnswers = [normCorrect, ...altAnswers.map(normalize)];
  for (const ans of allAnswers) {
    const words = ans.split(' ');
    if (words.length === 1 && ans.length > 4) {
      if (levenshtein(normInput, ans) <= 1) return true;
    }
  }

  return false;
}
