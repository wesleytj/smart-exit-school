export function validateEmail(email) {
  const trimmed = String(email ?? '').trim();

  if (!trimmed) {
    return { valid: false, error: 'Informe seu e-mail.', email: '' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Informe um e-mail válido.', email: trimmed };
  }

  return { valid: true, error: null, email: trimmed };
}

export function validatePasswordUpdate(password, confirmPassword) {
  if (!password) {
    return { valid: false, error: 'A nova senha é obrigatória.' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
  }

  if (!confirmPassword) {
    return { valid: false, error: 'Confirme a nova senha.' };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: 'As senhas não coincidem.' };
  }

  return { valid: true, error: null };
}
