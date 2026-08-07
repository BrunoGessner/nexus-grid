/**
 * Gerador de Códigos Únicos de Sala (Ex: NEX-A8F2)
 */

function generateRoomCode(length = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem caracteres confusos como O, 0, I, 1
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars.charAt(randomIndex);
  }
  return code;
}

module.exports = { generateRoomCode };
