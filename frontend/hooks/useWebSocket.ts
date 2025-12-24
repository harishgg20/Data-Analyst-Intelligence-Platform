import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (url: string) => {
    const [message, setMessage] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Use relative URL if starting with / to support proxying
        const wsUrl = url.startsWith('/')
            ? `ws://${window.location.host}${url}`
            : url;

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('Connected to WebSocket');
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            try {
                const parsedData = JSON.parse(event.data);
                setMessage(parsedData);
            } catch (error) {
                console.error('Error parsing WS message', error);
            }
        };

        ws.current.onclose = () => {
            console.log('Disconnected from WebSocket');
            setIsConnected(false);
        };

        return () => {
            ws.current?.close();
        };
    }, [url]);

    return { message, isConnected };
};
