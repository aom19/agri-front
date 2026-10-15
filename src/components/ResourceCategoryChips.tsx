import { Chip, Stack } from '@mui/material'
import type { CategoryCounts } from '../api/resource.api'
import { RESOURCE_CATEGORY_LABELS, resourceCategoryLabel } from '../utils/resourceCategories'

type Props = {
  /** Categoria selectată; '' = toate. */
  value: string
  onChange: (category: string) => void
  /** Numărul de rânduri pe categorie (din API); categoriile fără rânduri nu apar. */
  counts: CategoryCounts | undefined
}

/**
 * Butoane de filtrare pe categoria resursei (recoltă, semințe, combustibil…), cu numărul de
 * rânduri din fiecare. Folosite în paginile Resurse și Stocuri, peste căutarea după text.
 */
export default function ResourceCategoryChips({ value, onChange, counts }: Props) {
  if (!counts) return null
  const byCategory = Object.fromEntries(counts.by_category.map((c) => [c.category, c.count]))
  const total = counts.total
  const categories = [
    ...Object.keys(RESOURCE_CATEGORY_LABELS),
    ...Object.keys(byCategory).filter((c) => !(c in RESOURCE_CATEGORY_LABELS)),
  ].filter((c) => (byCategory[c] ?? 0) > 0)
  if (categories.length <= 1) return null

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ flexWrap: 'wrap', rowGap: 1 }}
      aria-label="Filtru categorie"
    >
      <Chip
        label={`Toate (${total})`}
        color={value === '' ? 'primary' : 'default'}
        variant={value === '' ? 'filled' : 'outlined'}
        onClick={() => onChange('')}
      />
      {categories.map((category) => (
        <Chip
          key={category}
          label={`${resourceCategoryLabel(category)} (${byCategory[category]})`}
          color={value === category ? 'primary' : 'default'}
          variant={value === category ? 'filled' : 'outlined'}
          onClick={() => onChange(value === category ? '' : category)}
        />
      ))}
    </Stack>
  )
}
