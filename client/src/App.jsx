import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

import { socket } from './socket/socketClient';
import { soundManager } from './audio/SoundSystem';

import Header from './components/Header';
import GameCanvas from './components/GameCanvas';
import CommandDock from './components/CommandDock';
import Sidebar from './components/Sidebar';
import Lobby from './components/Lobby';
import NexusStore from './components/NexusStore';

export default function App() {
  const [roomData, setRoomData] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [timer, setTimer] = useState(30);
  const [combatLogs, setCombatLogs] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [resolutionData, setResolutionData] = useState(null);
  const [isActionsLocked, setIsActionsLocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  
  // Nexus Points do jogador
  const [nexusPoints, setNexusPoints] = useState(150);
  const [unlockedItems, setUnlockedItems] = useState(['palette_synthwave']);

  // Detecta código de sala na URL (Ex: game.com/play/A8F2 ou ?room=A8F2)
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'play') {
      const codeFromUrl = pathParts[2].toUpperCase();
      console.log(`Detectado código de sala via URL: ${codeFromUrl}`);
    }
  }, []);

  // Listeners de Eventos do Socket.io
  useEffect(() => {
    socket.on('room_created', ({ roomCode, player }) => {
      setMyPlayer(player);
    });

    socket.on('room_joined', ({ success, roomCode, player, error }) => {
      if (success) {
        setMyPlayer(player);
      } else {
        alert(error || 'Erro ao entrar na sala.');
      }
    });

    socket.on('room_state_update', (data) => {
      setRoomData(data);
      setTimer(data.timer);

      if (data.chatMessages) setChatMessages(data.chatMessages);

      // Reseta trava de comandos ao entrar na fase de planejamento
      if (data.state === 'PLANNING') {
        setIsActionsLocked(false);
        setResolutionData(null);
        soundManager.startSynthwaveBGM();
      }
    });

    socket.on('timer_tick', ({ timer }) => {
      setTimer(timer);
      soundManager.setBgmTempo(timer);
    });

    socket.on('turn_resolution_data', (data) => {
      setResolutionData(data);
      if (data.combatLogs) {
        setCombatLogs(prev => [...prev, ...data.combatLogs]);
      }

      // Efeito de celebração se houver vencedor
      if (data.isGameOver && data.winner) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        setNexusPoints(pts => pts + (data.winner.id === socket.id ? 100 : 25));
      }
    });

    socket.on('game_error', ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('room_state_update');
      socket.off('timer_tick');
      socket.off('turn_resolution_data');
      socket.off('game_error');
    };
  }, []);

  // Ações do Usuário
  const handleCreateRoom = (playerName, avatarSkin) => {
    socket.emit('create_room', { playerName, avatarSkin });
  };

  const handleJoinRoom = (roomCode, playerName, avatarSkin) => {
    socket.emit('join_room', { roomCode, playerName, avatarSkin });
  };

  const handleStartGame = () => {
    socket.emit('start_game');
  };

  const handleSubmitActions = (actions) => {
    setIsActionsLocked(true);
    socket.emit('submit_actions', { actions });
  };

  const handleSendChat = (text) => {
    socket.emit('send_chat', { text });
  };

  const handleToggleMute = () => {
    soundManager.isMuted = !isMuted;
    setIsMuted(!isMuted);
    if (!isMuted) soundManager.stopBGM();
  };

  const handleUnlockItem = (itemId, cost) => {
    if (nexusPoints >= cost) {
      setNexusPoints(pts => pts - cost);
      setUnlockedItems(items => [...items, itemId]);
    }
  };

  const roomState = roomData ? roomData.state : 'LOBBY';
  const players = roomData ? roomData.players : {};
  const isHost = roomData && myPlayer && roomData.hostId === socket.id;

  return (
    <div className="app-container">
      {/* 1. SE NÃO ESTÁ EM JOGO, EXIBE O LOBBY */}
      {(!roomData || roomState === 'LOBBY') && (
        <Lobby 
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          roomData={roomData}
          onStartGame={handleStartGame}
          isHost={isHost}
        />
      )}

      {/* 2. EM JOGO: HEADER + CANVAS + DOCK + SIDEBAR */}
      {roomData && roomState !== 'LOBBY' && (
        <>
          <Header 
            timer={timer}
            players={players}
            roomCode={roomData.code}
            onOpenStore={() => setIsStoreOpen(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />

          <div className="main-game-area">
            <GameCanvas 
              players={players}
              mines={resolutionData?.mines || []}
              resolutionData={resolutionData}
            />

            <Sidebar 
              combatLogs={combatLogs}
              chatMessages={chatMessages}
              onSendChat={handleSendChat}
            />
          </div>

          <CommandDock 
            onSubmitActions={handleSubmitActions}
            isLocked={isActionsLocked}
            isPlanningPhase={roomState === 'PLANNING'}
            myPlayer={players[socket.id]}
          />
        </>
      )}

      {/* 3. MODAL LOJA NEXUS */}
      {isStoreOpen && (
        <NexusStore 
          nexusPoints={nexusPoints}
          unlockedItems={unlockedItems}
          onClose={() => setIsStoreOpen(false)}
          onUnlockItem={handleUnlockItem}
        />
      )}
    </div>
  );
}
