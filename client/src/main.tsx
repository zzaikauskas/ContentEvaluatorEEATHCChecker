import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Disable automatic refresh in production mode by removing the WebSocket connection
if (import.meta.env.PROD) {
  // Find and disconnect any existing WebSocket connections to Vite HMR
  const webSocketList = Object.values(window).filter(
    ws => ws && typeof ws === 'object' && ws.constructor && ws.constructor.name === 'WebSocket'
  ) as WebSocket[];
  
  // Close any potential Vite HMR WebSockets
  webSocketList.forEach(ws => {
    if (ws.url && (ws.url.includes('vite') || ws.url.includes('localhost') || ws.url.includes('ws'))) {
      try {
        ws.close();
        console.log('Closed WebSocket connection in production to prevent auto-refresh');
      } catch (err) {
        // Ignore any errors during socket closure
      }
    }
  });
  
  // Disable any future WebSocket connections
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (url && (url.includes('vite') || url.includes('localhost') || url.includes('ws'))) {
      console.log('Blocked WebSocket connection in production to prevent auto-refresh');
      // Return a dummy WebSocket that doesn't actually connect
      return {
        close: () => {},
        send: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
        readyState: 3, // CLOSED
      } as any;
    }
    return new originalWebSocket(url, protocols);
  } as any;
  window.WebSocket.prototype = originalWebSocket.prototype;
}

createRoot(document.getElementById("root")!).render(<App />);
