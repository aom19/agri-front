/** Etichetele categoriilor de resurse (enum-ul `resource_types.category`), în ordinea de afișare. */
export const RESOURCE_CATEGORY_LABELS: Record<string, string> = {
  harvest: 'Recoltă',
  seed: 'Semințe',
  fertilizer: 'Îngrășăminte',
  pesticide: 'Pesticide',
  fuel: 'Combustibil',
  water: 'Apă',
  other: 'Altele',
}

export function resourceCategoryLabel(category: string | null | undefined): string {
  if (!category) return '-'
  return RESOURCE_CATEGORY_LABELS[category] ?? category
}
