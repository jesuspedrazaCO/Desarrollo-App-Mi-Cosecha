import api from './api'

// Solo para el administrador de la finca
export const getMembers = () => api.get('/members')
export const inviteMember = (data) => api.post('/members/invite', data)
export const revokeInvitation = (id) => api.delete(`/members/invitations/${id}`)
export const setMemberActive = (id, active) => api.patch(`/members/${id}`, { active })
export const setMemberRole = (id, role) => api.patch(`/members/${id}`, { role })
export const removeMember = (id) => api.delete(`/members/${id}`)