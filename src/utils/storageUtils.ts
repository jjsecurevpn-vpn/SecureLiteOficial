// Utilidades de almacenamiento local
import { LS_KEYS } from '../constants';

export function loadCredentials() {
  return {
    user: localStorage.getItem(LS_KEYS.user) || '',
    pass: localStorage.getItem(LS_KEYS.pass) || '',
    uuid: localStorage.getItem(LS_KEYS.uuid) || '',
  };
}

export function saveCredentials(user: string, pass: string, uuid: string) {
  localStorage.setItem(LS_KEYS.user, user);
  localStorage.setItem(LS_KEYS.pass, pass);
  localStorage.setItem(LS_KEYS.uuid, uuid);
}

export function loadAutoMode(): boolean {
  return localStorage.getItem(LS_KEYS.auto) === '1';
}

export function saveAutoMode(on: boolean) {
  localStorage.setItem(LS_KEYS.auto, on ? '1' : '0');
}

export function isTermsAccepted(): boolean {
  return localStorage.getItem(LS_KEYS.terms) === '1';
}

export function acceptTerms() {
  localStorage.setItem(LS_KEYS.terms, '1');
}
