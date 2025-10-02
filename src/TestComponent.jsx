import React from 'react';

function TestComponent() {
    return (
        <div style={{
            padding: '20px',
            backgroundColor: 'red',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center'
        }}>
            <h1>🎉 React 測試成功！</h1>
            <p>如果你看到這個，React 正在工作！</p>
            <p>Google Client ID: {import.meta.env.VITE_GOOGLE_CLIENT_ID || '未設置'}</p>
        </div>
    );
}

export default TestComponent;
