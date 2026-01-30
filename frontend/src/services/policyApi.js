export async function fetchFurniturePolicy() {
  const res = await fetch("/api/policy/furniture/");
  if (!res.ok) {
    throw new Error("Failed to fetch furniture policy");
  }
  return res.json();
}
