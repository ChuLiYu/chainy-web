import React from 'react';

function MinimalTest() {
    return React.createElement('div', {
        style: { padding: '20px', backgroundColor: 'red', color: 'white' }
    },
        React.createElement('h1', null, 'Minimal React Test'),
        React.createElement('p', null, 'If you see this, React is working!')
    );
}

export default MinimalTest;
