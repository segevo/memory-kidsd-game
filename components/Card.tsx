import React from 'react';
import { CardData } from '../types';

interface CardProps {
  card: CardData;
  onClick: (card: CardData) => void;
}

const Card: React.FC<CardProps> = ({ card, onClick }) => {
  const handleClick = () => {
    if (!card.isFlipped && !card.isMatched) {
      onClick(card);
    }
  };

  return (
    <div 
      className={`relative w-full aspect-[3/4] cursor-pointer perspective-1000 group`}
      onClick={handleClick}
    >
      <div
        className={`w-full h-full transition-all duration-500 transform-style-3d ${
          card.isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Back of card (visible when not flipped) - More colorful for kids */}
        <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-tr from-orange-400 to-pink-500 rounded-xl shadow-xl border-4 border-white flex items-center justify-center">
            <div className="text-4xl text-white transform rotate-12 select-none filter drop-shadow-md">
                🎮
            </div>
            <div className="absolute inset-1 border-2 border-dashed border-white/40 rounded-lg"></div>
        </div>

        {/* Front of card (visible when flipped) */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white rounded-xl shadow-xl overflow-hidden border-4 border-yellow-300">
          <img 
            src={card.image} 
            alt={card.character.name} 
            className="w-full h-3/4 object-cover bg-sky-100"
            loading="lazy"
          />
          <div className="h-1/4 p-1 flex flex-col items-center justify-center text-center bg-yellow-50">
            <h3 className="text-xs sm:text-sm font-black text-pink-600 leading-none">
              {card.character.name}
            </h3>
          </div>
          {card.isMatched && (
            <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center z-10">
              <span className="text-5xl animate-bounce filter drop-shadow-lg">🌟</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
