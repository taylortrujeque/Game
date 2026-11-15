export type FilmWorldId = "jungle" | "galaxy" | "castle";
export type WorldId = "hub" | FilmWorldId;

export interface Question {
  id: string;
  title: string;
  prompt: string;
  options: string[];
  answer: number;
  fact: string;
  x: number;
  y: number;
}

export interface FilmWorld {
  id: FilmWorldId;
  number: string;
  name: string;
  subtitle: string;
  genre: string;
  color: string;
  dark: string;
  description: string;
  questions: Question[];
}

export const worlds: FilmWorld[] = [
  {
    id: "jungle",
    number: "01",
    name: "Jurassic Jungle",
    subtitle: "Life finds a way.",
    genre: "ADVENTURE",
    color: "#c8d89b",
    dark: "#244c39",
    description:
      "Follow the footprints. Something big is hiding beyond the palms.",
    questions: [
      {
        id: "jungle-1",
        title: "Name that movie",
        x: 360,
        y: 380,
        prompt:
          "An island theme park. DNA trapped in amber. And a very, very bad day for the visitors. Which movie is this?",
        options: ["Jumanji", "King Kong", "Jurassic Park", "Avatar"],
        answer: 2,
        fact: "Welcome to Jurassic Park! The 1993 adventure brought dinosaurs to life with a mix of animatronics and computer effects.",
      },
      {
        id: "jungle-2",
        title: "Behind the camera",
        x: 890,
        y: 330,
        prompt: "Who directed the original Jurassic Park (1993)?",
        options: [
          "George Lucas",
          "Steven Spielberg",
          "James Cameron",
          "Peter Jackson",
        ],
        answer: 1,
        fact: "Steven Spielberg directed Jurassic Park and Schindler’s List in the same year: 1993.",
      },
      {
        id: "jungle-3",
        title: "Clever girl",
        x: 870,
        y: 640,
        prompt:
          "Which dinosaurs stalk Lex and Tim through the restaurant kitchen?",
        options: [
          "Velociraptors",
          "Triceratops",
          "Brachiosaurus",
          "Dilophosaurus",
        ],
        answer: 0,
        fact: "The velociraptors turn a quiet kitchen into one of the film’s most memorable scenes. Clever girls, indeed.",
      },
    ],
  },
  {
    id: "galaxy",
    number: "02",
    name: "Galactic Outpost",
    subtitle: "A galaxy of possibilities.",
    genre: "SCI-FI",
    color: "#c7c9ee",
    dark: "#413b6e",
    description:
      "A desert outpost, a mysterious droid, and an adventure written in the stars.",
    questions: [
      {
        id: "galaxy-1",
        title: "Name that movie",
        x: 360,
        y: 380,
        prompt:
          "A farm boy meets two droids, learns about the Force, and joins a rebellion. Which 1977 movie begins this adventure?",
        options: [
          "Star Trek: The Motion Picture",
          "Star Wars (A New Hope)",
          "Dune",
          "The Fifth Element",
        ],
        answer: 1,
        fact: "Released as Star Wars in 1977, the film later received the subtitle Episode IV — A New Hope.",
      },
      {
        id: "galaxy-2",
        title: "A long way from home",
        x: 890,
        y: 330,
        prompt: "What is the name of Luke Skywalker’s desert home planet?",
        options: ["Hoth", "Naboo", "Alderaan", "Tatooine"],
        answer: 3,
        fact: "Tatooine has two suns. Its iconic desert scenes were filmed in Tunisia.",
      },
      {
        id: "galaxy-3",
        title: "Trust your instincts",
        x: 870,
        y: 640,
        prompt:
          "Who fires the shot that destroys the first Death Star in A New Hope?",
        options: [
          "Han Solo",
          "Princess Leia",
          "Luke Skywalker",
          "Obi-Wan Kenobi",
        ],
        answer: 2,
        fact: "Luke switches off his targeting computer and trusts the Force. Han returns just in time to clear his path.",
      },
    ],
  },
  {
    id: "castle",
    number: "03",
    name: "Enchanted Castle",
    subtitle: "You’re in for a spell.",
    genre: "FANTASY",
    color: "#e6cadb",
    dark: "#69455f",
    description:
      "Follow the floating candles. There’s more to this castle than meets the eye.",
    questions: [
      {
        id: "castle-1",
        title: "Name that movie",
        x: 360,
        y: 380,
        prompt:
          "On his eleventh birthday, a boy discovers he is a wizard and boards a train to a magical school. Which film is this?",
        options: [
          "The Chronicles of Narnia",
          "The NeverEnding Story",
          "Harry Potter and the Sorcerer’s Stone",
          "The Wizard of Oz",
        ],
        answer: 2,
        fact: "The first Harry Potter film is also called Harry Potter and the Philosopher’s Stone in many countries.",
      },
      {
        id: "castle-2",
        title: "The Sorting Hat",
        x: 890,
        y: 330,
        prompt: "Which Hogwarts house does Harry join in his first year?",
        options: ["Gryffindor", "Ravenclaw", "Hufflepuff", "Slytherin"],
        answer: 0,
        fact: "The Sorting Hat considers Slytherin, but Harry’s own choice helps place him in Gryffindor.",
      },
      {
        id: "castle-3",
        title: "Who’s a good dog?",
        x: 870,
        y: 640,
        prompt:
          "What is the name of the three-headed dog guarding the trapdoor at Hogwarts?",
        options: ["Fang", "Norbert", "Aragog", "Fluffy"],
        answer: 3,
        fact: "Hagrid named the enormous three-headed dog Fluffy. Music is the secret to sending him to sleep.",
      },
    ],
  },
];

export const worldById = (id: FilmWorldId) =>
  worlds.find((world) => world.id === id)!;
export const questionIds = new Set(
  worlds.flatMap((world) => world.questions.map((question) => question.id)),
);
export const portals: { world: FilmWorldId; x: number; y: number }[] = [
  { world: "jungle", x: 300, y: 406 },
  { world: "galaxy", x: 980, y: 406 },
  { world: "castle", x: 300, y: 672 },
];

export interface Coin {
  id: string;
  x: number;
  y: number;
}
export function coinsForWorld(world: WorldId): Coin[] {
  const positions =
    world === "hub"
      ? [
          [530, 680],
          [470, 680],
          [410, 680],
          [640, 600],
          [640, 548],
          [780, 452],
          [840, 452],
          [900, 452],
          [480, 452],
          [420, 452],
          [360, 452],
          [810, 680],
        ]
      : [
          [560, 695],
          [500, 695],
          [440, 695],
          [380, 640],
          [360, 570],
          [360, 505],
          [360, 445],
          [475, 385],
          [535, 385],
          [605, 385],
          [680, 385],
          [760, 350],
          [820, 350],
          [890, 435],
          [890, 495],
          [890, 555],
          [800, 645],
          [730, 645],
        ];
  return positions.map(([x, y], index) => ({
    id: `${world}-coin-${index}`,
    x,
    y,
  }));
}

export const allCoinIds = new Set(
  (["hub", "jungle", "galaxy", "castle"] as WorldId[]).flatMap((id) =>
    coinsForWorld(id).map((coin) => coin.id),
  ),
);
