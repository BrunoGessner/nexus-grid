/**
 * Nexus Grid - Constantes do Jogo
 */

const GRID_SIZE = 10; // Tabuleiro 10x10

const TURN_TIME_LIMIT = 30; // 30 segundos por fase de planejamento

const MAX_PLAYERS_PER_ROOM = 4;
const MIN_PLAYERS_TO_START = 2;

const MAX_HEALTH = 100;

// Tipos de Ação
const ACTION_TYPES = {
  MOVE_NORTH: 'MOVE_NORTH',
  MOVE_SOUTH: 'MOVE_SOUTH',
  MOVE_EAST: 'MOVE_EAST',
  MOVE_WEST: 'MOVE_WEST',
  
  ATTACK_NORTH: 'ATTACK_NORTH',
  ATTACK_SOUTH: 'ATTACK_SOUTH',
  ATTACK_EAST: 'ATTACK_EAST',
  ATTACK_WEST: 'ATTACK_WEST',
  
  DEFEND: 'DEFEND', // Escudo reduz dano em 60% e reflete 30%
  SABOTAGE: 'SABOTAGE', // Planta mina na célula atual / atordoa célula
  IDLE: 'IDLE'
};

// Estatísticas de Dano e Efeitos
const GAME_BALANCING = {
  ATTACK_DAMAGE: 35,
  ATTACK_RANGE: 3, // Alcance do laser em células
  DEFEND_DAMAGE_REDUCTION: 0.6, // 60% de redução
  DEFEND_REFLECT_RATIO: 0.3, // 30% de reflexão de dano
  MINE_DAMAGE: 40,
  COLLISION_DAMAGE: 15, // Dano se dois jogadores tentarem mover para o mesmo espaço
  NEXUS_POINTS_WIN: 100,
  NEXUS_POINTS_PARTICIPATION: 25
};

// Posições de Spawn iniciais para 4 cantos do tabuleiro 10x10
const SPAWN_POSITIONS = [
  { x: 1, y: 1, direction: 'SOUTH' }, // Jogador 1 (Top-Left)
  { x: 8, y: 8, direction: 'NORTH' }, // Jogador 2 (Bottom-Right)
  { x: 8, y: 1, direction: 'WEST' },  // Jogador 3 (Top-Right)
  { x: 1, y: 8, direction: 'EAST' }   // Jogador 4 (Bottom-Left)
];

// Paletas de Cores Neons Cyber-Táticas para Jogadores
const PLAYER_COLORS = [
  { name: 'Ciano Tático', hex: '#00F0FF', secondary: '#007799' },
  { name: 'Rosa Magenta', hex: '#FF0055', secondary: '#990033' },
  { name: 'Verde Tóxico', hex: '#39FF14', secondary: '#1f990a' },
  { name: 'Amarelo Volt', hex: '#FFE600', secondary: '#998a00' }
];

// Estados da Sala
const ROOM_STATES = {
  LOBBY: 'LOBBY',
  PLANNING: 'PLANNING',
  RESOLVING: 'RESOLVING',
  GAME_OVER: 'GAME_OVER'
};

module.exports = {
  GRID_SIZE,
  TURN_TIME_LIMIT,
  MAX_PLAYERS_PER_ROOM,
  MIN_PLAYERS_TO_START,
  MAX_HEALTH,
  ACTION_TYPES,
  GAME_BALANCING,
  SPAWN_POSITIONS,
  PLAYER_COLORS,
  ROOM_STATES
};
