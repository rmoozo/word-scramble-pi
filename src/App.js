import { useState, useEffect, useCallback } from 'react';

const WORDS = {
  Animals: ['elephant','dolphin','penguin','giraffe','leopard','hamster','gorilla','cheetah'],
  Food: ['pizza','burger','sushi','pasta','mango','waffle','cookie','salmon'],
  Countries: ['brazil','france','japan','canada','egypt','india','mexico','kenya'],
  Technology: ['python','keyboard','monitor','internet','software','database','network','algorithm']
};

function scramble(word) {
  return word.split('').sort(() => Math.random() - 0.5).join('');
}

function App() {
  const [screen, setScreen] = useState('home');
  const [category, setCategory] = useState('Animals');
  const [piUser, setPiUser] = useState(null);
  const [word, setWord] = useState('');
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [scores, setScores] = useState(() => JSON.parse(localStorage.getItem('scores') || '[]'));
  const [message, setMessage] = useState('');

 const initPi = async () => {
  try {
    await window.Pi.init({ version: "2.0", sandbox: true });
    const auth = await window.Pi.authenticate(['username', 'payments'], () => {});
    setPiUser(auth.user.username);
  } catch (e) {
    console.log('Pi auth failed', e);
  }
};

  useEffect(() => {
    setTimeout(() => {
      window.Pi && initPi();
    }, 300);
  }, []);

  const newWord = useCallback(() => {
    const list = WORDS[category];
    const w = list[Math.floor(Math.random() * list.length)];
    setWord(w);
    setScrambled(scramble(w));
    setInput('');
    setTimer(30);
    setMessage('');
  }, [category]);

  useEffect(() => {
    if (screen === 'game') newWord();
  }, [screen, newWord]);

  useEffect(() => {
    if (screen !== 'game') return;
    if (timer === 0) {
      setLives(l => {
        if (l - 1 <= 0) { setScreen('gameover'); return 0; }
        setMessage('⏰ Time up!');
        setTimeout(newWord, 1000);
        return l - 1;
      });
    }
    const t = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, screen, newWord]);

  const handleGuess = () => {
    if (input.toLowerCase() === word) {
      setScore(s => s + 10);
      setMessage('✅ Correct!');
      setTimeout(newWord, 800);
    } else {
      setLives(l => {
        if (l - 1 <= 0) { setScreen('gameover'); return 0; }
        setMessage('❌ Wrong!');
        setTimeout(newWord, 800);
        return l - 1;
      });
    }
    setInput('');
  };

  const saveScore = useCallback(() => {
    const newScores = [...scores, { name: piUser || 'Guest', score }]
      .sort((a, b) => b.score - a.score).slice(0, 10);
    setScores(newScores);
    localStorage.setItem('scores', JSON.stringify(newScores));
  }, [scores, piUser, score]);

  useEffect(() => {
    if (screen === 'gameover') saveScore();
  }, [screen]);

  const handleTip = () => {
    if (!window.Pi) return alert('Open in Pi Browser');
    window.Pi.createPayment({
      amount: 0.5,
      memo: 'Tip for Word Scramble Pi developer',
      metadata: { type: 'tip' }
    }, {
      onReadyForServerApproval: async (id) => {
        await fetch('/api/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: id }) });
      },
      onReadyForServerCompletion: async (id, txid) => {
        await fetch('/api/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: id, txid }) });
        alert('🎉 Thank you for the tip!');
      },
      onCancel: () => {},
      onError: (e) => console.error(e)
    });
  };

  const buyLives = () => {
    if (!window.Pi) return alert('Open in Pi Browser');
    window.Pi.createPayment({
      amount: 0.1,
      memo: 'Buy 3 lives in Word Scramble Pi',
      metadata: { type: 'lives' }
    }, {
      onReadyForServerApproval: async (id) => {
        await fetch('/api/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: id }) });
      },
      onReadyForServerCompletion: async (id, txid) => {
        await fetch('/api/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: id, txid }) });
        setLives(3);
        setScreen('game');
      },
      onCancel: () => {},
      onError: (e) => console.error(e)
    });
  };

  // HOME SCREEN
  if (screen === 'home') return (
    <div style={{ minHeight: '100vh', background: '#1a0533', color: 'white', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#f59e0b', margin: '20px 0' }}>🔤 Word Scramble Pi</h1>
        {piUser ? (
          <p style={{ color: '#c4b5fd' }}>👤 {piUser}</p>
        ) : (
          <button onClick={initPi}
            style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
            🔑 Sign in with Pi
          </button>
        )}
        <button onClick={handleTip}
          style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px', marginLeft: '10px' }}>
          💰 Tip Developer
        </button>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#c4b5fd', marginBottom: '10px' }}>Choose Category:</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.keys(WORDS).map(c => (
              <button key={c} onClick={() => setCategory(c)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: category === c ? '#f59e0b' : '#3b0764', color: 'white' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => { setScore(0); setLives(3); setScreen('game'); }}
          style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: '30px' }}>
          🎮 Start Game
        </button>

        <div style={{ background: '#2d1054', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ color: '#f59e0b', marginTop: 0 }}>🏆 Leaderboard</h3>
          {scores.length === 0 ? <p style={{ color: '#9ca3af' }}>No scores yet!</p> :
            scores.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #3b0764' }}>
                <span>{i + 1}. {s.name}</span>
                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{s.score} pts</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );

  // GAME SCREEN
  if (screen === 'game') return (
    <div style={{ minHeight: '100vh', background: '#1a0533', color: 'white', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⭐ {score}</span>
          <span>{'❤️'.repeat(lives)}</span>
          <span style={{ color: timer < 10 ? '#ef4444' : '#c4b5fd' }}>⏱ {timer}s</span>
        </div>

        <div style={{ background: '#e0e7ff', borderRadius: '10px', height: '8px', marginBottom: '20px' }}>
          <div style={{ width: `${(timer / 30) * 100}%`, background: timer < 10 ? '#ef4444' : '#4f46e5', height: '8px', borderRadius: '10px', transition: 'width 1s' }} />
        </div>

        <p style={{ color: '#c4b5fd', marginBottom: '5px' }}>Category: {category}</p>

        <div style={{ background: '#2d1054', borderRadius: '16px', padding: '30px', marginBottom: '20px' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>Unscramble this word:</p>
          <h2 style={{ fontSize: '3rem', color: '#f59e0b', letterSpacing: '8px', margin: '10px 0' }}>
            {scrambled.toUpperCase()}
          </h2>
          {message && <p style={{ color: message.includes('✅') ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{message}</p>}
        </div>

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGuess()}
          placeholder="Type your answer..."
          style={{ width: '100%', padding: '14px', borderRadius: '10px', border: 'none', fontSize: '1.1rem', textAlign: 'center', marginBottom: '10px', boxSizing: 'border-box' }}
        />

        <button onClick={handleGuess}
          style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
          ✅ Submit Answer
        </button>
      </div>
    </div>
  );

  // GAME OVER SCREEN
  return (
    <div style={{ minHeight: '100vh', background: '#1a0533', color: 'white', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', paddingTop: '50px' }}>
        <h1 style={{ fontSize: '3rem', color: '#f59e0b' }}>Game Over!</h1>
        <p style={{ fontSize: '1.5rem', color: '#c4b5fd' }}>Final Score: <strong style={{ color: '#f59e0b' }}>{score}</strong></p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '30px' }}>
          <button onClick={buyLives}
            style={{ padding: '16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
            ❤️ Buy 3 Lives for 0.1 Pi
          </button>
          <button onClick={() => { setScore(0); setLives(3); setScreen('game'); }}
            style={{ padding: '16px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
            🔄 Play Again
          </button>
          <button onClick={() => setScreen('home')}
            style={{ padding: '16px', background: '#2d1054', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;