import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [liveBets, setLiveBets] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      newSocket.emit('joinLiveFeed');
      newSocket.emit('joinChat', 'global');
    });

    newSocket.on('onlineCount', (count) => setOnlineCount(count));

    newSocket.on('newBet', (bet) => {
      setLiveBets(prev => [bet, ...prev].slice(0, 50));
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, onlineCount, liveBets }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
