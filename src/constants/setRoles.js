export const SET_ROLE = {
  PARTICIPANT: 0,
  ADMIN: 1,
}

export function getSetRoleLabel(role) {
  return Number(role) === SET_ROLE.ADMIN ? 'ADMIN' : 'PARTICIPANTE'
}
