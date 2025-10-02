import React from 'react';

function HelloWorld() {
    return React.createElement('div', {
        style: { padding: '20px', backgroundColor: 'blue', color: 'white' }
    },
        React.createElement('h1', null, 'Hello World!'),
        React.createElement('p', null, 'React is working!')
    );
}

export default HelloWorld;
