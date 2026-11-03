import { useEffect, useState } from 'react';

let push = () => {};
export const toast = (message, type = 'ok') => push(message, type);

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    push = (message, type) => {
      const id = Math.random();
      setItems((a) => [...a, { id, message, type }]);
      setTimeout(() => setItems((a) => a.filter((x) => x.id !== id)), 3200);
    };
    return () => { push = () => {}; };
  }, []);
  return <div className="toasts" aria-live="polite">{items.map((x) => <div key={x.id} className={`toast ${x.type}`}>{x.message}</div>)}</div>;
}
