export const SHAPES = {
  Almond: 'M50 4C32 22 26 52 26 92c0 12 10 20 24 20s24-8 24-20C74 52 68 22 50 4z',
  Coffin: 'M34 6h32l10 30v58c0 14-10 20-26 20S24 108 24 94V36z',
  Square: 'M26 8h48v86c0 14-10 20-24 20S26 108 26 94z',
  Stiletto: 'M50 0C42 30 28 60 26 94c0 14 10 20 24 20s24-6 24-20C72 60 58 30 50 0z',
};
export const COLORS = { Blush: '#E9B8C6', 'Cateye plum': '#6B2D5C', 'Milky white': '#F3E9EC', 'Electric blue': '#2D4BE0', 'Chrome silver': '#B9BEC9' };
export const TILES = [
  ['Cateye', '#6B2D5C', '#C98BB0'], ['French tips', '#F1DCE2', '#FFFFFF'], ['Short and cute', '#E9B8C6', '#F7E4EA'],
  ['Press-ons', '#D9D4F0', '#F3F0FF'], ['Marble', '#E7E4EA', '#B7AEC2'], ['Freestyle', '#2D4BE0', '#9FB0FF'],
];

export function Nail({ shape = 'Almond', color = '#E9B8C6', className, style }) {
  return (
    <svg viewBox="0 0 100 116" className={className} style={style} aria-hidden="true">
      <path d={SHAPES[shape] || SHAPES.Almond} fill={color} />
      <path d="M38 30c-4 14-5 30-5 46" stroke="#fff" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Placeholder({ i = 0, label }) {
  const [name, a, b] = TILES[i % TILES.length];
  const dark = ['#6B2D5C', '#2D4BE0'].includes(a);
  return (
    <div className="tile ph" style={{ background: `linear-gradient(160deg,${a},${b})`, color: dark ? '#fff' : '#17131A' }}>
      <span>{label || name}</span>
      <Nail shape={Object.keys(SHAPES)[i % 4]} color="rgba(255,255,255,.55)" />
    </div>
  );
}
