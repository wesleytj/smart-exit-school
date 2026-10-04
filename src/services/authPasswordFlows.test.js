import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPasswordInputProps, togglePasswordVisibility } from './passwordVisibility.js';
import { validateEmail, validatePasswordUpdate } from './authValidation.js';
import { createAuthService } from './authService.js';

describe('PasswordInput visibility toggle and accessibility', () => {
  it('alterna a visibilidade da senha e fornece atributos de acessibilidade corretos', () => {
    // Estado inicial: senha oculta
    const initialProps = getPasswordInputProps(false);
    assert.equal(initialProps.inputType, 'password');
    assert.equal(initialProps.buttonAriaLabel, 'Mostrar senha');
    assert.equal(initialProps.buttonAriaPressed, false);

    // Alternar para visível
    const toggledToVisible = togglePasswordVisibility(false);
    assert.equal(toggledToVisible, true);

    const visibleProps = getPasswordInputProps(toggledToVisible);
    assert.equal(visibleProps.inputType, 'text');
    assert.equal(visibleProps.buttonAriaLabel, 'Ocultar senha');
    assert.equal(visibleProps.buttonAriaPressed, true);

    // Alternar de volta para oculto
    const toggledToHidden = togglePasswordVisibility(true);
    assert.equal(toggledToHidden, false);

    const hiddenAgainProps = getPasswordInputProps(toggledToHidden);
    assert.equal(hiddenAgainProps.inputType, 'password');
    assert.equal(hiddenAgainProps.buttonAriaLabel, 'Mostrar senha');
    assert.equal(hiddenAgainProps.buttonAriaPressed, false);
  });
});

describe('Fluxo "Esqueci minha senha" (Forgot Password)', () => {
  it('valida formatos de e-mail obrigatorio e formato valido', () => {
    assert.deepEqual(validateEmail(''), { valid: false, error: 'Informe seu e-mail.', email: '' });
    assert.deepEqual(validateEmail('   '), { valid: false, error: 'Informe seu e-mail.', email: '' });
    assert.deepEqual(validateEmail(null), { valid: false, error: 'Informe seu e-mail.', email: '' });
    assert.deepEqual(validateEmail('emailinvalido'), { valid: false, error: 'Informe um e-mail válido.', email: 'emailinvalido' });
    assert.deepEqual(validateEmail('email@invalido'), { valid: false, error: 'Informe um e-mail válido.', email: 'email@invalido' });

    const validResult = validateEmail('  usuario@escola.com.br  ');
    assert.equal(validResult.valid, true);
    assert.equal(validResult.error, null);
    assert.equal(validResult.email, 'usuario@escola.com.br');
  });

  it('chama resetPasswordForEmail com redirectTo correto mockando o Supabase Auth', async () => {
    let calledEmail = null;
    let calledOptions = null;

    const mockSupabase = {
      auth: {
        async resetPasswordForEmail(email, options) {
          calledEmail = email;
          calledOptions = options;
          return { data: {}, error: null };
        }
      }
    };

    const service = createAuthService(mockSupabase);

    const response = await service.resetPasswordForEmail('diretoria@escola.com.br', {
      redirectTo: 'https://smart-exit-school.vercel.app/update-password'
    });

    assert.equal(response.error, null);
    assert.equal(calledEmail, 'diretoria@escola.com.br');
    assert.equal(calledOptions.redirectTo, 'https://smart-exit-school.vercel.app/update-password');
  });

  it('usa fallback de redirectTo para /update-password se nao informado', async () => {
    let calledOptions = null;

    const mockSupabase = {
      auth: {
        async resetPasswordForEmail(email, options) {
          calledOptions = options;
          return { data: {}, error: null };
        }
      }
    };

    const service = createAuthService(mockSupabase);
    await service.resetPasswordForEmail('teste@escola.com.br');

    assert.ok(calledOptions.redirectTo.endsWith('/update-password'));
  });

  it('repassa erro retornado pelo Supabase em resetPasswordForEmail sem falhar', async () => {
    const mockSupabase = {
      auth: {
        async resetPasswordForEmail() {
          return { data: null, error: new Error('Rate limit exceeded') };
        }
      }
    };

    const service = createAuthService(mockSupabase);
    const response = await service.resetPasswordForEmail('teste@escola.com.br');

    assert.ok(response.error);
    assert.equal(response.error.message, 'Rate limit exceeded');
  });
});

describe('Fluxo "Definir nova senha" (Update Password)', () => {
  it('valida senhas iguais, obrigatoriedade e tamanho minimo de 6 caracteres', () => {
    assert.deepEqual(validatePasswordUpdate('', ''), {
      valid: false,
      error: 'A nova senha é obrigatória.'
    });

    assert.deepEqual(validatePasswordUpdate('12345', '12345'), {
      valid: false,
      error: 'A nova senha deve ter no mínimo 6 caracteres.'
    });

    assert.deepEqual(validatePasswordUpdate('123456', ''), {
      valid: false,
      error: 'Confirme a nova senha.'
    });

    assert.deepEqual(validatePasswordUpdate('123456', '654321'), {
      valid: false,
      error: 'As senhas não coincidem.'
    });

    assert.deepEqual(validatePasswordUpdate('nova-senha-123', 'nova-senha-123'), {
      valid: true,
      error: null
    });
  });

  it('chama updateUser com a nova senha mockando o Supabase Auth', async () => {
    let calledPayload = null;

    const mockSupabase = {
      auth: {
        async updateUser(payload) {
          calledPayload = payload;
          return { data: { user: { id: 'user-123' } }, error: null };
        }
      }
    };

    const service = createAuthService(mockSupabase);

    const response = await service.updatePassword('novaSenhaSuperSegura123');

    assert.equal(response.error, null);
    assert.deepEqual(calledPayload, { password: 'novaSenhaSuperSegura123' });
  });

  it('repassa erro retornado pelo Supabase em updateUser', async () => {
    const mockSupabase = {
      auth: {
        async updateUser() {
          return { data: null, error: new Error('New password should be different from the old password') };
        }
      }
    };

    const service = createAuthService(mockSupabase);
    const response = await service.updatePassword('mesmaSenhaAntiga');

    assert.ok(response.error);
    assert.equal(response.error.message, 'New password should be different from the old password');
  });

  it('trata getSession e logout corretamente', async () => {
    let signedOut = false;
    let removedKey = null;

    const mockSupabase = {
      auth: {
        async getSession() {
          return { data: { session: { access_token: 'fake-token' } }, error: null };
        },
        async signOut() {
          signedOut = true;
        }
      }
    };

    const mockStorage = {
      async remove(key) {
        removedKey = key;
      }
    };

    const service = createAuthService(mockSupabase, mockStorage);

    const sessionRes = await service.getSession();
    assert.equal(sessionRes.data.session.access_token, 'fake-token');

    await service.logout();
    assert.equal(signedOut, true);
    assert.ok(removedKey);
  });
});
