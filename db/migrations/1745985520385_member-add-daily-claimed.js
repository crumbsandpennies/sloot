export const up = (pgm) => {
  pgm.addColumns('Member', {
    daily_claimed: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    daily_streak: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumns('Member', [ 'daily_claimed', 'daily_streak' ]);
};