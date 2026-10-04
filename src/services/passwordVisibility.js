export function getPasswordInputProps(show) {
  return {
    inputType: show ? 'text' : 'password',
    buttonAriaLabel: show ? 'Ocultar senha' : 'Mostrar senha',
    buttonAriaPressed: Boolean(show),
  };
}

export function togglePasswordVisibility(current) {
  return !current;
}
