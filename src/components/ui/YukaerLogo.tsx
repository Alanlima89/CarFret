import React from 'react';

interface YukaerLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'blue' | 'white';
  showBadge?: boolean;
  badgeText?: string;
  companyName?: string;
}

/**
 * Emblema vetorial oficial da Yukaer
 * Reproduz com máxima fidelidade o símbolo dinâmico gerado:
 * Órbita elíptica azul envolvendo o monograma 'Y' estilizado
 * em vetor ascendente que termina em ponta de seta a 45°.
 */
export const YukaerSymbol: React.FC<{
  className?: string;
  size?: number | string;
  variant?: 'blue' | 'white';
}> = ({ className = 'w-10 h-10', size, variant = 'blue' }) => {
  const isWhite = variant === 'white';
  const gradId = `yukaer-blue-${variant}`;
  const ringGradId = `yukaer-ring-${variant}`;

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Símbolo Yukaer"
    >
      <defs>
        <linearGradient id={gradId} x1="20" y1="90" x2="100" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isWhite ? '#FFFFFF' : '#0F5897'} />
          <stop offset="45%" stopColor={isWhite ? '#FFFFFF' : '#146EBA'} />
          <stop offset="100%" stopColor={isWhite ? '#F8FAFC' : '#1B78C2'} />
        </linearGradient>
        <linearGradient id={ringGradId} x1="15" y1="25" x2="95" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isWhite ? '#FFFFFF' : '#1977C0'} />
          <stop offset="70%" stopColor={isWhite ? '#F1F5F9' : '#1264A6'} />
          <stop offset="100%" stopColor={isWhite ? '#E2E8F0' : '#0D4F85'} />
        </linearGradient>
      </defs>

      {/* 1. ANEL ORBITAL EXTERNO - Segmento Superior Esquerdo */}
      <path
        d="M 23 58 
           C 20 42, 31 27, 47 21 
           C 61 16, 75 19, 84 27 
           L 77 34 
           C 70 28, 59 26, 49 29 
           C 37 33, 29 44, 31 58 
           Z"
        fill={`url(#${ringGradId})`}
      />

      {/* 2. ANEL ORBITAL EXTERNO - Segmento Inferior Direito com retorno */}
      <path
        d="M 88 54 
           C 90 70, 80 86, 64 92 
           C 51 97, 36 94, 27 84 
           L 34 77 
           C 41 84, 52 87, 61 83 
           C 73 79, 81 68, 79 54 
           Z"
        fill={`url(#${ringGradId})`}
      />

      {/* 3. MONOGRAMA 'Y' VETORIAL UNIFICADO COM SETA DIRECIONAL A 45° */}
      <path
        d="
          /* Base inferior esquerda */
          M 19 89
          L 38 89
          L 83 44
          /* Seta Direcional Superior Direita */
          L 92 53
          L 96 20
          L 63 24
          L 72 33
          /* Retorno pela borda superior da haste */
          L 54 51
          /* Canto interno em V do Y */
          L 44 58
          /* Braço esquerdo do Y */
          L 32 44
          C 27 49, 25 56, 27 63
          L 35 63
          L 28 72
          L 19 89
          Z
        "
        fill={`url(#${gradId})`}
      />
    </svg>
  );
};

/**
 * Componente Principal: Logotipo Completo da Yukaer
 * Incorpora o emblema vetorial + Tipografia Oficial "YUKAER"
 */
export const YukaerLogo: React.FC<YukaerLogoProps> = ({
  className = '',
  iconOnly = false,
  size = 'md',
  variant = 'blue',
  showBadge = true,
  badgeText = 'LOGÍSTICA',
  companyName,
}) => {
  const isWhite = variant === 'white';

  const sizeClasses = {
    sm: {
      icon: 'w-7 h-7',
      text: 'text-lg',
      badge: 'text-[9px] px-1.5 py-0.2',
    },
    md: {
      icon: 'w-9 h-9 sm:w-10 sm:h-10',
      text: 'text-xl sm:text-2xl',
      badge: 'text-[10px] px-2 py-0.5',
    },
    lg: {
      icon: 'w-11 h-11 sm:w-12 sm:h-12',
      text: 'text-2xl sm:text-3xl',
      badge: 'text-xs px-2.5 py-0.5',
    },
    xl: {
      icon: 'w-14 h-14 sm:w-16 sm:h-16',
      text: 'text-3xl sm:text-4xl',
      badge: 'text-xs px-3 py-1',
    },
  }[size];

  if (iconOnly) {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <YukaerSymbol className={sizeClasses.icon} variant={variant} />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none min-w-0 ${className}`}>
      {/* Símbolo / Ícone */}
      <div className="relative shrink-0 flex items-center justify-center">
        <YukaerSymbol className={sizeClasses.icon} variant={variant} />
      </div>

      {/* Identidade YUKAER */}
      <div className="flex flex-col justify-center leading-none min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-black tracking-[0.05em] font-sans transition-colors ${
              isWhite ? 'text-white' : 'text-[#1264A6]'
            } ${sizeClasses.text}`}
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              letterSpacing: '0.04em',
            }}
          >
            YUKAER
          </span>

          {showBadge && (
            <span
              className={`font-bold uppercase tracking-wider rounded-md border shrink-0 transition-colors ${sizeClasses.badge} ${
                isWhite
                  ? 'bg-white/15 text-white border-white/30'
                  : 'bg-blue-50 text-[#1264A6] border-blue-200'
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>

        {companyName && (
          <p
            className={`text-xs font-medium truncate mt-1 ${
              isWhite ? 'text-blue-100' : 'text-slate-500'
            }`}
          >
            {companyName}
          </p>
        )}
      </div>
    </div>
  );
};
