export const DEFAULT_LEVELS = [
  { level: 1, name: "새싹",    minPoints: 0 },
  { level: 2, name: "씨앗",    minPoints: 50 },
  { level: 3, name: "나무",    minPoints: 150 },
  { level: 4, name: "빛",      minPoints: 300 },
  { level: 5, name: "별",      minPoints: 500 },
  { level: 6, name: "혜성",    minPoints: 800 },
  { level: 7, name: "행성",    minPoints: 1200 },
  { level: 8, name: "항성",    minPoints: 2000 },
  { level: 9, name: "슈퍼노바", minPoints: 3500 },
];

export function calculateLevel(points: number): number {
  for (let i = DEFAULT_LEVELS.length - 1; i >= 0; i--) {
    if (points >= DEFAULT_LEVELS[i].minPoints) {
      return DEFAULT_LEVELS[i].level;
    }
  }
  return 1;
}
