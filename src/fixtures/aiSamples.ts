// Sample content returned by the stubbed generateFile(). Replace nothing here —
// the teammate swaps generateFile's body; these stay as demo fixtures.

export const sampleQuiz = {
  questions: [
    {
      question: 'What is the time complexity of inserting into a binary heap?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      answerIndex: 1,
      explanation: 'An insert bubbles the new element up the tree, which has height log n.',
    },
    {
      question: 'Which data structure uses FIFO ordering?',
      options: ['Stack', 'Queue', 'Tree', 'Heap'],
      answerIndex: 1,
      explanation: 'A queue removes the earliest-added element first (first in, first out).',
    },
    {
      question: 'A hash map offers average-case lookup of:',
      options: ['O(log n)', 'O(n)', 'O(1)', 'O(n^2)'],
      answerIndex: 2,
      explanation: 'With a good hash function and load factor, lookups are amortised O(1).',
    },
  ],
}

export const sampleFlashcards = {
  cards: [
    { front: 'Binary heap', back: 'A complete binary tree where each parent is ordered before its children.' },
    { front: 'Stack', back: 'A LIFO collection: the last element pushed is the first popped.' },
    { front: 'Big-O notation', back: 'An upper bound on how an algorithm scales with input size.' },
    { front: 'Hash collision', back: 'When two keys hash to the same bucket; resolved by chaining or probing.' },
  ],
}

export const sampleNotes = `# Key ideas

These notes were generated from your selected material.

## Heaps
A **heap** is a complete binary tree. In a min-heap every parent is smaller than
its children.

- \`insert\` — O(log n)
- \`extract-min\` — O(log n)
- \`peek\` — O(1)

## Hashing
A hash map maps keys to buckets for average O(1) lookup. Collisions are handled
by chaining or open addressing.
`

export const sampleCheatsheet = `# Cheat sheet

| Structure | Lookup | Insert | Notes |
|-----------|--------|--------|-------|
| Array | O(1) index | O(n) | contiguous |
| Hash map | O(1) avg | O(1) avg | collisions → chaining |
| Binary heap | O(1) peek | O(log n) | complete tree |
| BST (balanced) | O(log n) | O(log n) | in-order = sorted |

**Remember:** big-O describes growth, not wall-clock time.
`
