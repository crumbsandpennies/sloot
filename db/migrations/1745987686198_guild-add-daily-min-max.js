export const up = (pgm) => {
  pgm.addColumns('Guild', {
    daily_payout_min: {
      type: 'integer',
      notNull: true,
      default: 50,
    },
    daily_payout_max: {
      type: 'integer',
      notNull: true,
      default: 120,
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumns('Member', [ 'daily_payout_min', 'daily_payout_max' ]);
};