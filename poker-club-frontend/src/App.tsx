import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Добро пожаловать в Poker Club!</div>} />
      </Routes>
    </Router>
  );
}

export default App;

