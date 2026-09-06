export const SECTIONS = ["featured", "series", "minisodes", "songs"];
export const CATEGORIES = [
  "adventure",
  "folk",
  "friendship",
  "india",
  "language",
  "learning",
  "maths",
  "music",
  "nature",
  "reading",
  "science",
  "singalong",
  "stories",
  "travel",
  "values",
];
export const LANGUAGES = ["en", "hi"];

export function canPublish(role: string | null) {
  return role === "admin" || role === "editor";
}
