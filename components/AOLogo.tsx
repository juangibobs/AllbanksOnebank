interface Props {
  className?: string;
}

/** Marca provisional (monograma "AO") — fácil de sustituir por un logo real más adelante. */
export default function AOLogo({ className }: Props) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Allbanks&Onebank">
      <rect width="64" height="64" rx="16" fill="#0F172A" />
      <text
        x="32"
        y="41"
        textAnchor="middle"
        fontFamily="Montserrat, ui-sans-serif, system-ui, sans-serif"
        fontWeight="700"
        fontSize="24"
        fill="#F1F5F9"
      >
        AO
      </text>
    </svg>
  );
}
