export function Titulo({ t, s }: { t: string; s?: string }) {
  return (
    <div className="tit">
      <div>
        <h1>{t}</h1>
        {s && <p>{s}</p>}
      </div>
    </div>
  );
}
