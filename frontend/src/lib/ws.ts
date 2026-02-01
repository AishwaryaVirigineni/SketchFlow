let socket: WebSocket | null = null;
let messageQueue: string[] = [];

type MessageHandler = (data: any) => void;
type OpenHandler = () => void;

const messageHandlers = new Set<MessageHandler>();
const openHandlers = new Set<OpenHandler>();

function getWsUrl() {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (typeof window === "undefined") return "ws://localhost:4000/ws";
  return `ws://${window.location.hostname}:4000/ws`;
}

function wireSocket(sock: WebSocket) {
  sock.addEventListener("open", () => {
    // flush queued messages
    for (const msg of messageQueue) sock.send(msg);
    messageQueue = [];

    for (const fn of openHandlers) fn();
  });

  sock.addEventListener("message", (event) => {
    let data: any;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    for (const fn of messageHandlers) fn(data);
  });

  sock.addEventListener("error", (err) => {
    console.error("WebSocket error:", err);
  });

  sock.addEventListener("close", () => {
    socket = null;
  });
}

export function getSocket() {
  if (typeof window === "undefined") return null as any;

  if (!socket || socket.readyState === WebSocket.CLOSED) {
    const url = getWsUrl();
    socket = new WebSocket(url);
    wireSocket(socket);
  }

  return socket;
}

export function onWSMessage(fn: MessageHandler) {
  messageHandlers.add(fn);
  return () => messageHandlers.delete(fn);
}

export function onWSOpen(fn: OpenHandler) {
  openHandlers.add(fn);
  return () => openHandlers.delete(fn);
}

export function sendWS(data: any) {
  const sock = getSocket();
  const msg = JSON.stringify(data);

  if (sock.readyState === WebSocket.OPEN) sock.send(msg);
  else messageQueue.push(msg);
}
