export interface Angel {
  id: string;
  name: string;
  title: string;
  energyType: string;
  bio: string;
  image: string;
  traits: string[];
}

export const ANGELS: Angel[] = [
  {
    id: 'michael',
    name: 'Archangel Michael',
    title: 'The Protector of Light',
    energyType: 'Solar Protection',
    bio: 'Michael is the prince of the Archangels and the leader of the heavenly hosts. He provides strength, courage, and protection to those who feel lost or afraid. His presence is like a shield of golden light, cutting through darkness and doubt.',
    image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800&h=800',
    traits: ['Strength', 'Protection', 'Courage', 'Justice']
  },
  {
    id: 'gabriel',
    name: 'Archangel Gabriel',
    title: 'The Divine Messenger',
    energyType: 'Lunar Clarity',
    bio: 'Gabriel is the angel of revelation and communication. She helps you find your true voice and express your inner truth with grace. Gabriel brings clarity to your path and inspires creative expression in all its forms.',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800&h=800',
    traits: ['Communication', 'Creativity', 'Clarity', 'Hope']
  },
  {
    id: 'raphael',
    name: 'Archangel Raphael',
    title: 'The Divine Healer',
    energyType: 'Emerald Renewal',
    bio: 'Raphael is the angel of healing, both physical and emotional. He guides those on a journey of recovery and helps restore balance to the mind, body, and spirit. His energy is a soothing emerald light that mends what is broken.',
    image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=800&h=800',
    traits: ['Healing', 'Balance', 'Harmony', 'Travel']
  },
  {
    id: 'uriel',
    name: 'Archangel Uriel',
    title: 'The Light of Wisdom',
    energyType: 'Amber Insight',
    bio: 'Uriel is the angel of wisdom and intellectual illumination. He brings light to complex situations and helps you find practical solutions through divine insight. He is the fire of God that warms the heart and clears the mind.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800&h=800',
    traits: ['Wisdom', 'Insight', 'Stability', 'Peace']
  },
  {
    id: 'chamuel',
    name: 'Archangel Chamuel',
    title: 'The Angel of Love',
    energyType: 'Rose Compassion',
    bio: 'Chamuel is the angel of pure love and peaceful relationships. He helps you find what you are looking for—be it a lost object, a career path, or a soul connection. His energy is a soft pink light that heals the heart.',
    image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800&h=800',
    traits: ['Love', 'Compassion', 'Peace', 'Finding']
  }
];

export interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    trait: string;
  }[];
}

export const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "When you close your eyes and seek peace, what do you see?",
    options: [
      { text: "A vast, protective golden shield", trait: "Strength" },
      { text: "A clear, moonlit path through the woods", trait: "Clarity" },
      { text: "A lush, emerald garden of healing", trait: "Healing" },
      { text: "A warm, flickering flame of knowledge", trait: "Wisdom" }
    ]
  },
  {
    id: 2,
    text: "What is the greatest challenge you currently face?",
    options: [
      { text: "Finding the courage to stand my ground", trait: "Protection" },
      { text: "Expressing my true self to the world", trait: "Communication" },
      { text: "Mending a broken heart or spirit", trait: "Harmony" },
      { text: "Finding clarity in a confusing situation", trait: "Insight" }
    ]
  },
  {
    id: 3,
    text: "Which element do you feel most connected to?",
    options: [
      { text: "Fire - Transformative and powerful", trait: "Strength" },
      { text: "Air - Free and communicative", trait: "Hope" },
      { text: "Water - Flowing and restorative", trait: "Balance" },
      { text: "Earth - Grounded and wise", trait: "Stability" }
    ]
  },
  {
    id: 4,
    text: "How do you most often help others?",
    options: [
      { text: "By protecting them from harm", trait: "Justice" },
      { text: "By offering words of inspiration", trait: "Hope" },
      { text: "By listening and offering comfort", trait: "Compassion" },
      { text: "By providing practical advice", trait: "Wisdom" }
    ]
  },
  {
    id: 5,
    text: "What does your soul crave most right now?",
    options: [
      { text: "A sense of safety and belonging", trait: "Protection" },
      { text: "A creative spark or new beginning", trait: "Creativity" },
      { text: "Physical or emotional renewal", trait: "Healing" },
      { text: "Deep understanding and truth", trait: "Insight" }
    ]
  }
];
