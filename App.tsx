import React, { useState, useEffect, useCallback } from 'react';
import { CardData, GameState } from './types';
import { fetchCharacters, generateCharacterImage } from './services/geminiService';
import Card from './components/Card';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    isGameWon: false,
    loading: true,
    error: null,
    loadingStep: 'מאתחל...',
    scores: [0, 0],
    currentPlayer: 0
  });

  const [flippedCards, setFlippedCards] = useState<CardData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const shuffleCards = (cards: CardData[]) => {
    return [...cards].sort(() => Math.random() - 0.5);
  };

  const initializeGame = useCallback(async () => {
    setGameState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null, 
        cards: [], 
        isGameWon: false, 
        loadingStep: 'מזמין את הדמויות...',
        scores: [0, 0],
        currentPlayer: 0
    }));

    try {
      // 1. Fetch Characters (10 distinct)
      const characters = await fetchCharacters();
      
      setGameState(prev => ({ ...prev, loadingStep: 'יוצר קלפים צבעוניים...' }));
      
      // 2. Generate Images
      const charactersWithImages = await Promise.all(
        characters.map(async (char) => {
            try {
                const image = await generateCharacterImage(char);
                return { character: char, image };
            } catch (err) {
                console.error(`Error gen image for ${char.name}`, err);
                return { character: char, image: `https://via.placeholder.com/400x400?text=${encodeURIComponent(char.name)}` };
            }
        })
      );

      // 3. Create 20 Cards (10 pairs)
      let generatedCards: CardData[] = [];
      charactersWithImages.forEach(({ character, image }, index) => {
        generatedCards.push({
          id: `card-${index}-a`,
          pairId: character.name,
          image,
          character,
          isFlipped: false,
          isMatched: false
        });
        generatedCards.push({
          id: `card-${index}-b`,
          pairId: character.name,
          image,
          character,
          isFlipped: false,
          isMatched: false
        });
      });

      setGameState(prev => ({
        ...prev,
        cards: shuffleCards(generatedCards),
        loading: false,
        loadingStep: 'מוכן!'
      }));

    } catch (error: any) {
      console.error(error);
      setGameState(prev => ({
        ...prev,
        loading: false,
        error: 'משהו השתבש... נסו לרענן את הדף.'
      }));
    }
  }, []);

  useEffect(() => {
    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCardClick = (clickedCard: CardData) => {
    if (isProcessing || clickedCard.isMatched || clickedCard.isFlipped) return;

    // Flip logic
    const updatedCards = gameState.cards.map(c => 
      c.id === clickedCard.id ? { ...c, isFlipped: true } : c
    );
    
    setGameState(prev => ({ ...prev, cards: updatedCards }));
    
    const newFlippedCards = [...flippedCards, clickedCard];
    setFlippedCards(newFlippedCards);

    // Check Match
    if (newFlippedCards.length === 2) {
      setIsProcessing(true);
      
      const [firstCard, secondCard] = newFlippedCards;
      
      if (firstCard.pairId === secondCard.pairId) {
        // MATCH FOUND
        setTimeout(() => {
          setGameState(prev => {
            const matchedCards = prev.cards.map(c => 
              c.pairId === firstCard.pairId ? { ...c, isMatched: true, isFlipped: true } : c
            );
            
            // Increment score for current player
            const newScores: [number, number] = [prev.scores[0], prev.scores[1]];
            newScores[prev.currentPlayer] += 1;

            const allMatched = matchedCards.every(c => c.isMatched);
            
            return {
              ...prev,
              cards: matchedCards,
              isGameWon: allMatched,
              scores: newScores
              // Player keeps turn on match!
            };
          });
          setFlippedCards([]);
          setIsProcessing(false);
        }, 500);
      } else {
        // NO MATCH
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            cards: prev.cards.map(c => 
              (c.id === firstCard.id || c.id === secondCard.id) 
                ? { ...c, isFlipped: false } 
                : c
            ),
            // Switch Player
            currentPlayer: prev.currentPlayer === 0 ? 1 : 0
          }));
          setFlippedCards([]);
          setIsProcessing(false);
        }, 1500);
      }
    }
  };

  // Loading Screen
  if (gameState.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FFDEE9] bg-gradient-to-b from-[#FFDEE9] to-[#B5FFFC]">
        <div className="w-20 h-20 border-8 border-pink-400 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-3xl font-black text-pink-600 mb-2 animate-bounce">טוען משחק...</h2>
        <p className="text-xl text-purple-600 font-bold">{gameState.loadingStep}</p>
      </div>
    );
  }

  // Error Screen
  if (gameState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">אופס! תקלה</h2>
          <p className="mb-6">{gameState.error}</p>
          <button onClick={initializeGame} className="px-6 py-2 bg-pink-500 rounded-xl font-bold">נסה שוב</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E0F7FA] p-4 flex flex-col items-center font-sans">
      
      {/* Header & Scoreboard */}
      <header className="w-full max-w-5xl mb-6">
        <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 drop-shadow-sm">
            🧸 גיבורי הילדות
            </h1>
        </div>
        
        {/* Score Board */}
        <div className="flex justify-between items-center bg-white rounded-3xl p-2 shadow-xl border-4 border-white mx-auto max-w-2xl">
            {/* Player 1 */}
            <div className={`flex-1 flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${gameState.currentPlayer === 0 ? 'bg-blue-100 ring-4 ring-blue-400 scale-105 shadow-md' : 'opacity-70'}`}>
                <span className="text-lg font-bold text-blue-600">שחקן 1</span>
                <span className="text-4xl font-black text-slate-800">{gameState.scores[0]}</span>
            </div>

            <div className="px-4 text-slate-300 font-bold text-xl">VS</div>

            {/* Player 2 */}
            <div className={`flex-1 flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${gameState.currentPlayer === 1 ? 'bg-pink-100 ring-4 ring-pink-400 scale-105 shadow-md' : 'opacity-70'}`}>
                <span className="text-lg font-bold text-pink-600">שחקן 2</span>
                <span className="text-4xl font-black text-slate-800">{gameState.scores[1]}</span>
            </div>
        </div>
      </header>

      {/* Game Area */}
      {gameState.isGameWon ? (
        <div className="flex-1 flex flex-col items-center justify-center w-full animate-bounce-in">
            <div className="text-9xl mb-4">👑</div>
            <h2 className="text-5xl font-black text-purple-600 mb-4">המשחק נגמר!</h2>
            
            <div className="text-2xl mb-8 font-bold text-slate-700">
                {gameState.scores[0] > gameState.scores[1] ? (
                    <span className="text-blue-600">שחקן 1 ניצח! 🎉</span>
                ) : gameState.scores[1] > gameState.scores[0] ? (
                    <span className="text-pink-600">שחקן 2 ניצח! 🎉</span>
                ) : (
                    <span className="text-purple-600">תיקו! 🤝</span>
                )}
            </div>

            <button 
                onClick={initializeGame}
                className="text-xl bg-yellow-400 hover:bg-yellow-300 text-yellow-900 px-10 py-4 rounded-full font-black shadow-lg transform transition hover:scale-110 active:scale-95 border-b-8 border-yellow-600"
            >
                משחק חדש
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-4 w-full max-w-5xl mx-auto">
          {gameState.cards.map((card) => (
            <Card 
              key={card.id} 
              card={card} 
              onClick={handleCardClick} 
            />
          ))}
        </div>
      )}

      {/* Turn Indicator (Floating) */}
      {!gameState.isGameWon && (
          <div className={`fixed bottom-6 px-6 py-3 rounded-full font-bold shadow-2xl text-white animate-pulse z-50 ${gameState.currentPlayer === 0 ? 'bg-blue-500' : 'bg-pink-500'}`}>
              תור: {gameState.currentPlayer === 0 ? 'שחקן 1' : 'שחקן 2'}
          </div>
      )}

    </div>
  );
};

export default App;