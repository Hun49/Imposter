// Shared definitions and schemas for Imposter

export const APP_NAME = 'Imposter';

export type GamePhase = 'LOBBY' | 'ACTIVE' | 'AWAITING_REVEAL' | 'REVEALED' | 'CLOSED';

export interface PlayerPublic {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
}

export interface RevealedRole {
  id: string;
  name: string;
  isImposter: boolean;
}

export interface RoomStatePayload {
  roomCode: string;
  hostId: string;
  phase: GamePhase;
  timerMinutes: number;
  remainingSeconds: number;
  expiresAt: number | null;
  players: PlayerPublic[];
}

export interface YourCardPayload {
  isImposter: boolean;
  secretWord: string | null;
}

export interface AllCardsRevealedPayload {
  secretWord: string;
  imposterId: string;
  roles: RevealedRole[];
}

// Client -> Server messages
export type ClientMessage =
  | { type: 'SET_READY'; isReady: boolean }
  | { type: 'SET_TIMER'; minutes: number }
  | { type: 'START_ROUND' }
  | { type: 'REVEAL_CARDS' }
  | { type: 'NEXT_ROUND' }
  | { type: 'PING' };

// Server -> Client messages
export type ServerMessage =
  | { type: 'ROOM_STATE'; data: RoomStatePayload }
  | { type: 'YOUR_CARD'; data: YourCardPayload }
  | { type: 'ALL_CARDS_REVEALED'; data: AllCardsRevealedPayload }
  | { type: 'ROOM_CLOSED'; reason: string }
  | { type: 'ERROR'; message: string }
  | { type: 'PONG' };

// Game Rules & Bounds
export const MIN_PLAYERS_TO_START = 3;
export const MIN_TIMER_MINUTES = 6;
export const MAX_TIMER_MINUTES = 60;
export const DEFAULT_TIMER_MINUTES = 15;
export const TIMER_PRESETS = [6, 10, 15, 20, 25, 30];

// Curated familiar, medium-difficulty word bank (Spec §7)
export const CURATED_WORD_POOL = [
  'Airplane', 'Airport', 'Ambulance', 'Aquarium', 'Archaeologist',
  'Astronaut', 'Bakery', 'Balcony', 'Bank', 'Barbecue',
  'Baseball', 'Basketball', 'Bathtub', 'Bicycle', 'Binoculars',
  'Blanket', 'Blender', 'Bowling', 'Bridge', 'Bus Stop',
  'Cafeteria', 'Calculator', 'Camera', 'Campfire', 'Castle',
  'Cathedral', 'Cemetery', 'Chandelier', 'Cheeseburger', 'Cinema',
  'Circus', 'Clock Tower', 'Coffee Shop', 'Compass', 'Computer',
  'Concert', 'Cruise Ship', 'Dentist', 'Detective', 'Dinosaur',
  'Doctor', 'Dolphin', 'Elevator', 'Escalator', 'Factory',
  'Ferris Wheel', 'Firefighter', 'Fireplace', 'Flashlight', 'Football',
  'Fountain', 'Garage', 'Garden', 'Gas Station', 'Giraffe',
  'Glacier', 'Gymnasium', 'Haunted House', 'Headphones', 'Helicopter',
  'Hospital', 'Hotel', 'Ice Cream', 'Island', 'Jail',
  'Jukebox', 'Jungle', 'Kangaroo', 'Kitchen', 'Laboratory',
  'Lawyer', 'Library', 'Lighthouse', 'Limousine', 'Luggage',
  'Magic Show', 'Microscope', 'Monastery', 'Monument', 'Mosquito',
  'Motorcycle', 'Mountain', 'Museum', 'Newspaper', 'Nightclub',
  'Observatory', 'Opera', 'Oxygen Tank', 'Painter', 'Parachute',
  'Park', 'Passport', 'Penguin', 'Pharmacy', 'Photographer',
  'Piano', 'Picnic', 'Pilot', 'Pirate Ship', 'Pizza',
  'Planetarium', 'Playground', 'Police Station', 'Popcorn', 'Post Office',
  'Prison', 'Pyramid', 'Radio', 'Rainforest', 'Restaurant',
  'Roller Coaster', 'Sailboat', 'Satellite', 'School', 'Sculpture',
  'Skateboard', 'Ski Resort', 'Skyscraper', 'Sleeping Bag', 'Snowboard',
  'Space Shuttle', 'Stadium', 'Submarine', 'Supermarket', 'Swimming Pool',
  'Taxi', 'Telescope', 'Theater', 'Theme Park', 'Toaster',
  'Tornado', 'Train Station', 'Trampoline', 'Treasure Chest', 'Trolley',
  'Umbrella', 'University', 'Vacuum Cleaner', 'Volcano', 'Waffle',
  'Waterfall', 'Watermelon', 'Windmill', 'Wrench', 'Zoo'
] as const;
