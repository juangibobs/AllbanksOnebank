import { useId } from "react";

interface Props {
  className?: string;
}

/**
 * Wordmark "Allbanks&Onebank" para la pantalla de login — texto con
 * degradado verde-azulado y línea inferior con brillo, sobre fondo oscuro.
 * Recreado a partir de la imagen de referencia (fondo transparente: se apoya
 * en el panel oscuro del login).
 */
export default function AOWordmark({ className }: Props) {
  // Ids únicos: esta marca se renderiza dos veces en la misma página (escritorio/móvil).
  const uid = useId();
  const gradId = `ao-wordmark-grad-${uid}`;
  const glowId = `ao-wordmark-glow-${uid}`;

  return (
    <svg viewBox="0 0 640 160" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Allbanks&Onebank">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <text
        x="320"
        y="82"
        textAnchor="middle"
        fontFamily="Montserrat, ui-sans-serif, system-ui, sans-serif"
        fontWeight={800}
        fontSize="50"
        letterSpacing="1"
        textLength="560"
        lengthAdjust="spacingAndGlyphs"
        fill={`url(#${gradId})`}
        filter={`url(#${glowId})`}
      >
        ALLBANKS&amp;ONEBANK
      </text>
      <rect x="60" y="104" width="520" height="4" rx="2" fill="#22D3EE" filter={`url(#${glowId})`} opacity="0.9" />
      <path d="M600 118 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z" fill="#94A3B8" opacity="0.55" />
    </svg>
  );
}
