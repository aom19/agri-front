import { describe, expect, it } from 'vitest'
import { findNavLabel, isNavPathActive, navConfig } from '../routeConfig'

describe('routeConfig', () => {
  it('isNavPathActive tratează rădăcina exact și sub-paginile prin prefix', () => {
    expect(isNavPathActive('/', '/')).toBe(true)
    expect(isNavPathActive('/machines', '/')).toBe(false)
    expect(isNavPathActive('/machines', '/machines')).toBe(true)
    expect(isNavPathActive('/machines/12', '/machines')).toBe(true)
    expect(isNavPathActive('/machinesx', '/machines')).toBe(false)
  })

  it('findNavLabel alege cea mai lungă potrivire, inclusiv din grupuri', () => {
    expect(findNavLabel('/')).toBe('Tablou de bord')
    expect(findNavLabel('/admin/users/5')).toBe('Utilizatori')
    expect(findNavLabel('/admin/resource-types')).toBe('Categorii de resurse')
    expect(findNavLabel('/weather-map')).toBe('Hartă meteo')
    expect(findNavLabel('/necunoscut')).toBeUndefined()
  })

  it('configurația meniului are secțiuni cu frunze și grupuri', () => {
    expect(navConfig[0].label).toBeUndefined()
    const groups = navConfig.flatMap((s) => s.items).filter((i) => i.type === 'group')
    expect(groups.map((g) => g.label)).toEqual(['Nomenclatoare', 'Administrare'])
  })
})
