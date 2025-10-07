import { useState } from 'react';
import './App.css';
import './styles.css';

// Debug: Test if App component is loading
console.log('App component is loading...');

function App() {
    console.log('App function is executing...');

    // Minimal state for testing
    const [testState, setTestState] = useState('test');

    console.log('App state initialized:', testState);

    return (
        <div className="App">
            <h1>CHAINY - Debug Test</h1>
            <p>Test State: {testState}</p>
            <button onClick={() => setTestState('clicked')}>
                Test Button
            </button>
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'rgba(2, 6, 23, 0.6)', borderRadius: '12px' }}>
                <p>Google Login Button Test:</p>
                <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 24px',
                    backgroundColor: 'white',
                    border: '1px solid #dadce0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#3c4043'
                }}>
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}

export default App;
