import { useState, useEffect } from 'react';

function GoogleAuthStatus() {
    const [googleAuthReady, setGoogleAuthReady] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');

    useEffect(() => {
        const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        setDebugInfo(`Client ID: ${googleClientId}`);

        if (googleClientId && googleClientId.trim() !== '') {
            // 模擬Google認證初始化成功
            setTimeout(() => {
                setGoogleAuthReady(true);
                setDebugInfo(prev => prev + ' | Google Auth Ready: true');
            }, 2000);
        }
    }, []);

    return (
        <div style={{
            padding: '20px',
            border: '2px solid blue',
            margin: '20px',
            backgroundColor: 'lightblue',
            color: 'black'
        }}>
            <h2>Google 認證狀態</h2>
            <p>調試信息: {debugInfo}</p>
            <p>Google Auth Ready: {googleAuthReady ? '是' : '否'}</p>

            {googleAuthReady && (
                <div style={{ color: 'green', fontWeight: 'bold' }}>
                    ✅ Google 認證已就緒，登錄按鈕應該顯示
                </div>
            )}

            {!googleAuthReady && (
                <div style={{ color: 'red', fontWeight: 'bold' }}>
                    ❌ Google 認證未就緒，登錄按鈕不會顯示
                </div>
            )}
        </div>
    );
}

export default GoogleAuthStatus;
