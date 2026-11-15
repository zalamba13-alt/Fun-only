/*
 * TOBI QUIZ — QUESTION BANK
 * -------------------------
 * Each question looks like this:
 *
 *   { q: "The question?", options: ["A", "B", "C", "D"], answer: 0 }
 *
 * `answer` is the INDEX of the correct option (0 = first option).
 * To change a question, edit the text, the options, or the number.
 *
 * Questions 1-10 come from Tobi directly.
 * Questions 11-20 were added as placeholders — replace the answers with
 * the real ones whenever you get a chance.
 */

const QUESTIONS = [
  /* ---------- 1-10 : confirmed by Tobi ---------- */
  {
    q: "What is my favourite colour?",
    options: ["Red", "Blue", "Green", "Black"],
    answer: 1
  },
  {
    q: "Besides Cristiano Ronaldo, which other footballer do I like a lot?",
    options: ["Kylian Mbappe", "Lionel Messi", "Jude Bellingham", "Erling Haaland"],
    answer: 2
  },
  {
    q: "If every person on earth stood in one room, would I call myself the smartest one there?",
    options: ["No, not at all", "Only if the room was empty", "Yes, without question", "I would not answer that"],
    answer: 2
  },
  {
    q: "What is the source of my knowledge?",
    options: ["Books", "The internet", "Experience", "God"],
    answer: 3
  },
  {
    q: "What is my favourite hobby?",
    options: ["Football", "Gaming", "Music", "Reading"],
    answer: 0
  },
  {
    q: "Who is my favourite person to hug?",
    options: ["My mum", "My best friend", "My girlfriend ", "Nobody"],
    answer: 2
  },
  {
    q: "Which country was I born in? (not as easy as it seems)",
    options: ["Zambia", "Malawi", "Tanzania", "Mozambique"],
    answer: 1
  },
  {
    q: "Am I in love?",
    options: ["Yes, deeply", "No", "It's complicated", "Not exactly"],
    answer: 0
  },
  {
    q: "How long do I want to live for?",
    options: ["Until 50", "Until 70", "Until 90", "Forever"],
    answer: 0
  },
  {
    q: "Out of all the girls in this world, which one do I love the most?",
    options: ["My ex", "My girl", "My sister", "My friend"],
    answer: 1
  },

  /* ---------- 11-20 : placeholders, edit freely ---------- */
  {
    q: "Which club do I support?",
    options: ["Manchester United", "Barcelona", "Real Madrid", "Bayern Munich"],
    answer: 2
  },
  {
    q: "What is my dream job?",
    options: ["Professional footballer", "Sports journalist", "Coach", "President"],
    answer: 3
  },
  {
    q: "What is the first thing I do when something goes wrong?",
    options: ["Call a friend", "Leave it", "Sleep on it", "Get angry"],
    answer: 0
  },
  {
    q: "What is my favourite food?",
    options: ["Nsima and chicken", "Pizza", "Rice and beans", "Burgers"],
    answer: 0
  },
  {
    q: "Which language do I speak besides English?",
    options: ["Swahili", "Chichewa", "Zulu", "French"],
    answer: 1
  },
  {
    q: "Am I a morning person or a night guy?",
    options: ["Morning person", "Night guy", "Neither", "Depends on the day"],
    answer: 0
  },
  {
    q: "What is the one thing I never leave the house without?",
    options: ["My phone", "My girlfriend", "Headphones", "A football"],
    answer: 0
  },
  {
    q: "What kind of music do I listen to most?",
    options: ["British hip-hop", "Afro-beats", "R&B", "Amapiano"],
    answer: 0
  },
  {
    q: "What is my biggest fear?",
    options: ["Heights", "Losing my family", "Being average", "Failure"],
    answer: 2
  },
  {
    q: "How many siblings do I have?",
    options: ["One", "Two", "Three", "Four"],
    answer: 1
  }
];
