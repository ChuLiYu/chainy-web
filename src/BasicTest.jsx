import React from 'react';

function BasicTest() {
    return React.createElement('div', {
        style: {
            padding: '20px',
            backgroundColor: 'purple',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
        }
    },
        React.createElement('h1', null, '🎉 React 基本測試成功！'),
        React.createElement('p', null, '如果你看到這個，React 正在工作！'),
        React.createElement('p', null, 'Google Client ID: 123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com')
    );
}

export default BasicTest;