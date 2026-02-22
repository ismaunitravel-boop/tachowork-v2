import { Construction } from 'lucide-react';
import Header from '../layout/Header';
export default function Placeholder({ title }) {
  return (
    <>
      <Header title={title} />
      <div className="placeholder-module">
        <Construction size={48} strokeWidth={1.5} />
        <h2>{title}</h2>
        <p>Este módulo está en desarrollo</p>
      </div>
    </>
  );
}
