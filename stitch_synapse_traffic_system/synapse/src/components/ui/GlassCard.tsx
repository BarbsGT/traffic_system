interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function GlassCard({ children, className = "", style, onClick }: GlassCardProps) {
  return (
    <div className={`glass ${className}`} style={style} onClick={onClick}>
      {children}
    </div>
  );
}
