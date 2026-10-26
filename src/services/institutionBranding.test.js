import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolveSidebarBranding } from './institutionBranding.js'

describe('institutionBranding - resolveSidebarBranding', () => {
  it('exibe o nome proprio de uma instituicao no plano Basic', () => {
    const school = {
      id: 'sch-basic-01',
      name: 'Colégio Adventista de Esteio',
      plan: 'Basic',
      customLogo: null
    }

    const branding = resolveSidebarBranding(school)

    assert.equal(branding.displayName, 'Colégio Adventista de Esteio')
    assert.equal(branding.plan, 'Basic')
    assert.equal(branding.planBadge, 'Plano Basic')
    assert.equal(branding.useCustomLogo, false)
    assert.equal(branding.logoAlt, 'AllTech Solutions')
  })

  it('preserva a regra de logotipo padrao para o plano Basic mesmo com customLogo fornecido (paywall whitelabel)', () => {
    const school = {
      id: 'sch-basic-02',
      name: 'Escola Modelo Básica',
      plan: 'Basic',
      customLogo: 'data:image/png;base64,fakecustomlogo'
    }

    const branding = resolveSidebarBranding(school)

    assert.equal(branding.displayName, 'Escola Modelo Básica')
    assert.equal(branding.plan, 'Basic')
    assert.equal(branding.useCustomLogo, false)
    assert.equal(branding.logoAlt, 'AllTech Solutions')
  })

  it('exibe o nome proprio de instituicoes nos planos Premium e Diamond', () => {
    const premiumSchool = {
      id: 'sch-premium-01',
      name: 'Colégio São Francisco Premium',
      plan: 'Premium',
      customLogo: 'data:image/png;base64,premiumlogo'
    }

    const diamondSchool = {
      id: 'sch-diamond-01',
      name: 'Instituto Internacional Diamond',
      plan: 'Diamond',
      customLogo: 'data:image/png;base64,diamondlogo'
    }

    const premiumBranding = resolveSidebarBranding(premiumSchool)
    assert.equal(premiumBranding.displayName, 'Colégio São Francisco Premium')
    assert.equal(premiumBranding.plan, 'Premium')
    assert.equal(premiumBranding.planBadge, 'Plano Premium')
    assert.equal(premiumBranding.useCustomLogo, true)
    assert.equal(premiumBranding.logoAlt, 'Logo da Escola')

    const diamondBranding = resolveSidebarBranding(diamondSchool)
    assert.equal(diamondBranding.displayName, 'Instituto Internacional Diamond')
    assert.equal(diamondBranding.plan, 'Diamond')
    assert.equal(diamondBranding.planBadge, 'Plano Diamond')
    assert.equal(diamondBranding.useCustomLogo, true)
    assert.equal(diamondBranding.logoAlt, 'Logo da Escola')
  })

  it('utiliza Smart Exit School como fallback seguro quando o nome institucional estiver ausente ou vazio', () => {
    assert.equal(resolveSidebarBranding(null).displayName, 'Smart Exit School')
    assert.equal(resolveSidebarBranding({}).displayName, 'Smart Exit School')
    assert.equal(resolveSidebarBranding({ name: '' }).displayName, 'Smart Exit School')
    assert.equal(resolveSidebarBranding({ name: '   ' }).displayName, 'Smart Exit School')
    assert.equal(resolveSidebarBranding({ name: null }).displayName, 'Smart Exit School')
  })

  it('garante que InstitutionPanel.jsx nao contenha a substituicao defeituosa por AllTech Solutions', () => {
    const panelSource = readFileSync(new URL('../pages/InstitutionPanel.jsx', import.meta.url), 'utf8')

    assert.equal(
      panelSource.includes('school.plan !== "Basic" && school.name ? school.name : "AllTech Solutions"'),
      false,
      'InstitutionPanel.jsx nao deve rebaixar o nome da instituicao Basic para AllTech Solutions'
    )
    assert.equal(
      panelSource.includes('resolveSidebarBranding'),
      true,
      'InstitutionPanel.jsx deve consumir resolveSidebarBranding'
    )
  })
})
