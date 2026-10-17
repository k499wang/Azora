export interface TaskSupport {
  steps: readonly string[];
  smaller: string;
  specific: boolean;
}

const HOUSEHOLD_SUPPORT: Record<string, Omit<TaskSupport, 'specific'>> = {
  'wash three dishes': {
    steps: ['Choose three dishes you need soon.', 'Wash, rinse, and put those three aside. Leave the rest for another time.'],
    smaller: 'Wash just one dish. You can stop after that one.',
  },
  'put dirty clothes in the laundry basket': {
    steps: ['Bring the basket close to the clothes.', 'Gather the dirty clothes you can see and put them in. Sorting and washing can wait.'],
    smaller: 'Put one item of dirty clothing in the basket.',
  },
  'clear one small surface': {
    steps: ['Choose a small area, such as one corner of a table.', 'Put away things with a known home. Set undecided items together for later. Stop when that area is usable.'],
    smaller: 'Put away one thing from the surface.',
  },
  'put five things back where they belong': {
    steps: ['Choose five things whose homes you already know.', 'Put those five away. Leave anything that needs a decision for later.'],
    smaller: 'Put one thing back where it belongs.',
  },
  'wipe one kitchen surface': {
    steps: ['Choose one clear area of the counter or table.', 'Wipe that area using your usual surface-safe method. Follow any product instructions.'],
    smaller: 'Wipe one small, clear patch of the surface.',
  },
  'clear my desk before i start work': {
    steps: ['Choose the space you need for your next piece of work.', 'Put away items with a known home. Set other items aside together so you can start.'],
    smaller: 'Move one item out of your working space.',
  },
  'write down the one thing that matters today': {
    steps: ['Think of one thing that would make today feel worthwhile.', 'Write it in one sentence, then name the first action you could take.'],
    smaller: 'Write just a few words naming one priority.',
  },
  'write down one thing i did well': {
    steps: ['Think of one thing you did today, however ordinary.', 'Write down what you did and what you appreciate about the effort.'],
    smaller: 'Write a few words about one effort you made.',
  },
};

// Exact matches keep advice for authored tasks out of unrelated custom tasks.
export function taskSupport(title: string): TaskSupport {
  const key = title.trim().toLowerCase();
  const authored = Object.hasOwn(HOUSEHOLD_SUPPORT, key) ? HOUSEHOLD_SUPPORT[key] : undefined;
  if (authored) return { ...authored, specific: true };
  return {
    specific: false,
    steps: [
      'Decide what “done” means for this task.',
      'Name the first step. Check what you need before you begin.',
    ],
    smaller: 'For a smaller starting point, write down the first step and gather what you need. Keep any health or safety instructions unchanged.',
  };
}
