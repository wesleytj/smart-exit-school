/**
 * Regras de apresentacao e resolucao de branding institucional.
 * Assegura que o nome real da instituicao seja exibido independentemente do plano contratado,
 * preservando as restricoes de logotipo padrao para o plano Basic (Whitelabel paywall).
 *
 * @param {{ name?: string, plan?: string, customLogo?: string | null } | null} school
 * @returns {{
 *   displayName: string,
 *   plan: string,
 *   planBadge: string,
 *   useCustomLogo: boolean,
 *   logoAlt: string
 * }}
 */
export function resolveSidebarBranding(school) {
  const plan = school?.plan || 'Basic'
  const rawName = school?.name
  const displayName = typeof rawName === 'string' && rawName.trim().length > 0
    ? rawName.trim()
    : 'Smart Exit School'

  const isBasic = plan === 'Basic'
  const useCustomLogo = !isBasic && Boolean(school?.customLogo)
  const logoAlt = useCustomLogo ? 'Logo da Escola' : 'AllTech Solutions'

  return {
    displayName,
    plan,
    planBadge: `Plano ${plan}`,
    useCustomLogo,
    logoAlt
  }
}
