import type { CommerceState } from '../types/app';

const STORAGE_KEY = 'chell-commerce-state-v2';

const defaultCommerce: CommerceState = {
  freeJsonRemaining: 3,
  paidJsonCredits: 0,
  recordingUnlocked: false,
  totalRevenue: 0
};

export function loadCommerceState(): CommerceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultCommerce, ...JSON.parse(raw) } : defaultCommerce;
  } catch {
    return defaultCommerce;
  }
}

export function saveCommerceState(state: CommerceState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function canExportJson(state: CommerceState): boolean {
  return state.freeJsonRemaining > 0 || state.paidJsonCredits > 0;
}

export function consumeJsonExport(state: CommerceState): CommerceState {
  if (state.freeJsonRemaining > 0) {
    return { ...state, freeJsonRemaining: state.freeJsonRemaining - 1 };
  }
  if (state.paidJsonCredits > 0) {
    return { ...state, paidJsonCredits: state.paidJsonCredits - 1 };
  }
  return state;
}

export function unlockJsonPack(state: CommerceState): CommerceState {
  return {
    ...state,
    paidJsonCredits: state.paidJsonCredits + 4,
    totalRevenue: Number((state.totalRevenue + 3).toFixed(2))
  };
}

export function unlockRecording(state: CommerceState): CommerceState {
  if (state.recordingUnlocked) return state;
  return {
    ...state,
    recordingUnlocked: true,
    totalRevenue: Number((state.totalRevenue + 9.99).toFixed(2))
  };
}
