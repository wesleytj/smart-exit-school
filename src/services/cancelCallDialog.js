/**
 * Máquina de estados pura e determinística para o diálogo de confirmação
 * de cancelamento de chamadas no Monitor Operacional (Ciclo C - Entrega C1).
 *
 * Módulo 100% puro, sem side-effects, sem dependências de DOM/React.
 */

export function initialCancelDialogState() {
  return {
    dialog: null,
    pending: false,
    targetId: null,
    error: null,
    successMessage: null
  };
}

export function openCancelDialog(state = initialCancelDialogState(), call = null) {
  if (state?.pending) {
    return state;
  }

  if (!call || !call.id) {
    return {
      ...state,
      dialog: null,
      targetId: null
    };
  }

  return {
    ...state,
    dialog: {
      id: call.id,
      name: call.name || "",
      grade: call.grade || "",
      gateName: call.gateName || "",
      time: call.time || ""
    },
    targetId: null,
    error: null,
    successMessage: null
  };
}

export function closeCancelDialog(state = initialCancelDialogState()) {
  if (state?.pending) {
    return state;
  }

  return {
    ...state,
    dialog: null,
    pending: false,
    targetId: null
  };
}

export function confirmCancelDialog(state = initialCancelDialogState()) {
  if (!state?.dialog || state.pending) {
    return {
      ...state,
      targetId: null
    };
  }

  return {
    ...state,
    pending: true,
    targetId: state.dialog.id,
    error: null
  };
}

export function cancelSucceeded(state = initialCancelDialogState(), studentName = "") {
  const name = studentName || state?.dialog?.name || "";
  const successMessage = name
    ? `Chamada de ${name} cancelada.`
    : "Chamada cancelada com sucesso.";

  return {
    ...state,
    dialog: null,
    pending: false,
    targetId: null,
    successMessage,
    error: null
  };
}

export function cancelFailed(state = initialCancelDialogState(), mappedError = null) {
  const errorMessage = typeof mappedError === "string"
    ? mappedError
    : mappedError?.message || "Não foi possível cancelar a chamada.";

  return {
    ...state,
    dialog: null,
    pending: false,
    targetId: null,
    error: errorMessage,
    successMessage: null
  };
}

export function dismissCancelFeedback(state = initialCancelDialogState()) {
  return {
    ...state,
    error: null,
    successMessage: null
  };
}
