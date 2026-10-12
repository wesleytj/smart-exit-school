import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  cancelFailed,
  cancelSucceeded,
  closeCancelDialog,
  confirmCancelDialog,
  dismissCancelFeedback,
  initialCancelDialogState,
  openCancelDialog
} from './cancelCallDialog.js';

describe('cancelCallDialog state machine', () => {
  const sampleCall = {
    id: 'event-42',
    name: 'Bernardo Silva',
    grade: '3º Ano B',
    gateName: 'Portão Principal',
    time: '14:32'
  };

  it('initialCancelDialogState provides a clean closed state', () => {
    const state = initialCancelDialogState();
    assert.deepEqual(state, {
      dialog: null,
      pending: false,
      targetId: null,
      error: null,
      successMessage: null
    });
  });

  describe('openCancelDialog', () => {
    it('receives a call and only updates state without side-effects or cancellation', () => {
      const state = initialCancelDialogState();
      const next = openCancelDialog(state, sampleCall);

      assert.equal(state.dialog, null, 'Original state remains unmodified (pure function)');
      assert.deepEqual(next.dialog, {
        id: 'event-42',
        name: 'Bernardo Silva',
        grade: '3º Ano B',
        gateName: 'Portão Principal',
        time: '14:32'
      });
      assert.equal(next.pending, false);
      assert.equal(next.targetId, null);
      assert.equal(next.error, null);
      assert.equal(next.successMessage, null);
    });

    it('clears previous errors and success messages when opening for a new call', () => {
      const state = {
        ...initialCancelDialogState(),
        error: 'Erro anterior',
        successMessage: 'Mensagem antiga'
      };

      const next = openCancelDialog(state, sampleCall);
      assert.equal(next.error, null);
      assert.equal(next.successMessage, null);
      assert.equal(next.dialog.id, 'event-42');
    });

    it('handles empty or invalid call objects safely', () => {
      const state = initialCancelDialogState();
      assert.equal(openCancelDialog(state, null).dialog, null);
      assert.equal(openCancelDialog(state, {}).dialog, null);
    });

    it('ignores open request if an operation is currently pending', () => {
      const pendingState = {
        dialog: { ...sampleCall },
        pending: true,
        targetId: 'event-42',
        error: null,
        successMessage: null
      };

      const otherCall = { id: 'event-99', name: 'Outro Aluno' };
      const next = openCancelDialog(pendingState, otherCall);

      assert.equal(next.dialog.id, 'event-42');
      assert.equal(next.pending, true);
    });
  });

  describe('confirmCancelDialog', () => {
    it('marks pending: true and returns the target call id', () => {
      const state = openCancelDialog(initialCancelDialogState(), sampleCall);
      const next = confirmCancelDialog(state);

      assert.equal(next.pending, true);
      assert.equal(next.targetId, 'event-42');
      assert.deepEqual(next.dialog, state.dialog);
    });

    it('returns targetId: null and does not change state if no dialog is open', () => {
      const state = initialCancelDialogState();
      const next = confirmCancelDialog(state);

      assert.equal(next.pending, false);
      assert.equal(next.targetId, null);
    });

    it('prevents duplicate confirmation if already pending', () => {
      const state = openCancelDialog(initialCancelDialogState(), sampleCall);
      const confirmed = confirmCancelDialog(state);
      const doubleConfirmed = confirmCancelDialog(confirmed);

      assert.equal(doubleConfirmed.targetId, null);
      assert.equal(doubleConfirmed.pending, true);
    });
  });

  describe('closeCancelDialog', () => {
    it('closes the dialog without changing cancellation state or executing cancellation', () => {
      const state = openCancelDialog(initialCancelDialogState(), sampleCall);
      const next = closeCancelDialog(state);

      assert.equal(next.dialog, null);
      assert.equal(next.pending, false);
      assert.equal(next.targetId, null);
    });

    it('preserves existing messages when user backs out', () => {
      const state = {
        ...openCancelDialog(initialCancelDialogState(), sampleCall),
        successMessage: 'Operação anterior bem sucedida'
      };

      const next = closeCancelDialog(state);
      assert.equal(next.dialog, null);
      assert.equal(next.successMessage, 'Operação anterior bem sucedida');
    });

    it('prevents closing while cancellation request is in flight (pending: true)', () => {
      const state = {
        dialog: { ...sampleCall },
        pending: true,
        targetId: 'event-42',
        error: null,
        successMessage: null
      };

      const next = closeCancelDialog(state);
      assert.equal(next.dialog.id, 'event-42');
      assert.equal(next.pending, true);
    });
  });

  describe('cancelSucceeded', () => {
    it('closes the dialog and builds a clear success message with student name', () => {
      const state = confirmCancelDialog(openCancelDialog(initialCancelDialogState(), sampleCall));
      const next = cancelSucceeded(state, sampleCall.name);

      assert.equal(next.dialog, null);
      assert.equal(next.pending, false);
      assert.equal(next.targetId, null);
      assert.equal(next.successMessage, 'Chamada de Bernardo Silva cancelada.');
      assert.equal(next.error, null);
    });

    it('falls back to dialog name if explicit student name is not passed', () => {
      const state = confirmCancelDialog(openCancelDialog(initialCancelDialogState(), sampleCall));
      const next = cancelSucceeded(state);

      assert.equal(next.successMessage, 'Chamada de Bernardo Silva cancelada.');
    });

    it('falls back to generic message when no name is available', () => {
      const state = initialCancelDialogState();
      const next = cancelSucceeded(state);

      assert.equal(next.successMessage, 'Chamada cancelada com sucesso.');
    });
  });

  describe('cancelFailed', () => {
    it('closes the dialog, resets pending, and retains friendly error message from mapPickupError', () => {
      const state = confirmCancelDialog(openCancelDialog(initialCancelDialogState(), sampleCall));
      const mappedErrorMessage = 'Esta chamada já foi confirmada ou não está mais ativa.';
      const next = cancelFailed(state, mappedErrorMessage);

      assert.equal(next.dialog, null);
      assert.equal(next.pending, false);
      assert.equal(next.targetId, null);
      assert.equal(next.error, 'Esta chamada já foi confirmada ou não está mais ativa.');
      assert.equal(next.successMessage, null);
    });

    it('extracts message property when Error instance is passed', () => {
      const state = confirmCancelDialog(openCancelDialog(initialCancelDialogState(), sampleCall));
      const errorObj = new Error('Esta chamada já foi cancelada ou não está mais ativa.');
      const next = cancelFailed(state, errorObj);

      assert.equal(next.error, 'Esta chamada já foi cancelada ou não está mais ativa.');
    });
  });

  describe('dismissCancelFeedback', () => {
    it('clears active feedback banner messages', () => {
      const state = {
        ...initialCancelDialogState(),
        error: 'Erro ativo',
        successMessage: 'Sucesso ativo'
      };

      const next = dismissCancelFeedback(state);
      assert.equal(next.error, null);
      assert.equal(next.successMessage, null);
    });
  });
});
