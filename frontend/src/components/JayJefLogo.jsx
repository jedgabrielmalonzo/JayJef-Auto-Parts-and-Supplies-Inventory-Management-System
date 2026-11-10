import React from 'react';

/**
 * High-fidelity vector illustration of the classic 1940 Ford Coupe
 * recreated from the official JayJef Auto Parts & Supplies brand image.
 */
export function FordCoupe1940({ className = 'w-12 h-7', ...props }) {
  return (
    <svg
      viewBox="0 0 520 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      {...props}
    >
      <defs>
        {/* Hubcap chrome shine gradient */}
        <linearGradient id="hubcapGleam" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#94A3B8" />
          <stop offset="70%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        <linearGradient id="bumperShine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>

      {/* Ground Soft Shadow */}
      <ellipse cx="270" cy="245" rx="230" ry="18" fill="#000000" fillOpacity="0.45" />

      {/* Group: Entire Car */}
      <g>
        {/* 1. Main Solid Black Car Body */}
        <path
          d="M80 115 C95 95 140 85 195 82 C200 68 215 40 270 30 C340 18 410 40 435 90 C455 100 475 110 480 130 C485 145 470 165 470 170 C465 175 440 175 435 150 C430 135 415 140 405 165 C395 195 385 210 370 210 C355 210 345 190 355 165 C355 155 330 165 295 175 L285 180 C270 215 250 240 215 240 C185 240 170 215 175 180 L120 175 C100 175 80 170 70 160 C60 150 65 130 80 115 Z"
          fill="#000000"
        />

        {/* 2. Full Sculpted Outer Body Silhouette (Precise Contours) */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M208 36 C255 28 322 34 372 52 C415 67 435 93 448 114 C468 119 486 128 488 142 C490 152 482 159 475 163 C478 165 480 168 476 172 C472 176 462 175 450 173 C448 178 442 195 430 207 C414 222 392 225 382 210 C374 198 376 182 382 171 C335 176 298 184 285 195 C282 212 272 238 248 248 C224 258 200 252 188 234 C178 219 180 198 188 185 C162 183 138 180 124 177 C115 182 102 184 94 180 C84 175 80 165 82 152 C74 150 68 145 66 138 C64 128 72 118 84 110 C92 98 118 90 154 86 C166 84 182 82 196 81 C198 64 200 48 208 36 Z"
          fill="#000000"
        />

        {/* 3. ROOF & WINDOWS (White Fill with Black Framing) */}
        {/* Windshield */}
        <path
          d="M214 47 C250 42 300 48 316 78 L206 82 C204 68 208 55 214 47 Z"
          fill="#E2E8F0"
          stroke="#000000"
          strokeWidth="6"
        />
        {/* Windshield Center Post */}
        <path d="M260 45 L252 80" stroke="#000000" strokeWidth="5" />

        {/* Front Door Window */}
        <path
          d="M328 50 C365 57 375 75 380 92 L332 94 Z"
          fill="#E2E8F0"
          stroke="#000000"
          strokeWidth="6"
        />
        {/* Rear Quarter Window */}
        <path
          d="M386 63 C412 75 425 96 428 108 L388 102 Z"
          fill="#E2E8F0"
          stroke="#000000"
          strokeWidth="6"
        />

        {/* 4. HOOD BULGE / POWER CREASE */}
        <path
          d="M135 110 C145 92 165 92 175 110"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* 5. SIDE CHROME SPEAR & DOOR ACCENTS */}
        {/* Horizontal Body Side Spear */}
        <path
          d="M232 120 C290 115 390 115 470 134"
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Door Handle */}
        <ellipse cx="380" cy="120" rx="5" ry="3" fill="#FFFFFF" />

        {/* 6. HEADLIGHTS */}
        {/* Left Headlight */}
        <ellipse cx="88" cy="138" rx="14" ry="16" fill="#000000" stroke="#000000" strokeWidth="3" />
        <ellipse cx="88" cy="138" rx="12" ry="14" fill="#FFFFFF" />
        <ellipse cx="87" cy="137" rx="9" ry="11" fill="#F8FAFC" stroke="#000000" strokeWidth="1.5" />

        {/* Right Headlight (Center/Main) */}
        <ellipse cx="206" cy="136" rx="17" ry="19" fill="#000000" stroke="#000000" strokeWidth="4" />
        <ellipse cx="206" cy="136" rx="14" ry="16" fill="#FFFFFF" />
        <ellipse cx="205" cy="135" rx="11" ry="13" fill="#F8FAFC" stroke="#000000" strokeWidth="2" />

        {/* 7. FRONT GRILLE (Horizontal Chromed Louvers) */}
        <path
          d="M98 148 C125 142 165 142 192 148 C196 168 190 185 180 194 C150 196 120 196 102 192 C96 182 94 165 98 148 Z"
          fill="#000000"
          stroke="#000000"
          strokeWidth="4"
        />
        {/* Grille Bars */}
        <path d="M112 155 C135 152 158 152 180 155" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <path d="M106 164 C134 160 162 160 186 164" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <path d="M104 173 C132 169 162 169 188 173" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        <path d="M108 182 C132 178 160 178 184 182" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />

        {/* 8. FRONT HEAVY CHROME BUMPER WITH BUMPER GUARDS */}
        {/* Main Lower Bumper Bar */}
        <path
          d="M68 180 C110 185 180 188 248 190 C254 198 250 212 242 215 C175 212 110 205 65 198 C60 190 62 184 68 180 Z"
          fill="url(#bumperShine)"
          stroke="#000000"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Left Bumper Overrider / Guard */}
        <path
          d="M90 166 C93 162 99 162 102 166 L104 212 C101 216 95 216 92 212 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="5"
        />
        {/* Right Bumper Overrider / Guard */}
        <path
          d="M165 174 C168 170 174 170 177 174 L179 226 C176 230 170 230 167 226 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="5"
        />

        {/* Rear Tip Bumper */}
        <path
          d="M482 152 C486 150 492 150 496 154 L494 172 C490 176 484 176 480 172 Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="4"
        />

        {/* 9. FRONT WHITEWALL WHEEL & CHROME HUBCAP */}
        <g id="frontWheel">
          {/* Black Outer Tire */}
          <ellipse cx="264" cy="188" rx="25" ry="34" fill="#000000" />
          {/* Crisp Wide Whitewall Ring */}
          <ellipse cx="262" cy="188" rx="19" ry="26" fill="#FFFFFF" stroke="#000000" strokeWidth="4" />
          {/* Deep Black Inner Rim */}
          <ellipse cx="260" cy="188" rx="13" ry="18" fill="#000000" />
          {/* Gleaming Center Chrome Dome Hubcap */}
          <ellipse cx="259" cy="188" rx="8" ry="12" fill="url(#hubcapGleam)" />
        </g>

        {/* 10. REAR WHITEWALL WHEEL */}
        <g id="rearWheel">
          {/* Black Outer Tire */}
          <ellipse cx="434" cy="165" rx="15" ry="22" fill="#000000" />
          {/* Wide Whitewall */}
          <ellipse cx="433" cy="165" rx="10" ry="15" fill="#FFFFFF" stroke="#000000" strokeWidth="3" />
          {/* Hubcap */}
          <ellipse cx="432" cy="165" rx="5" ry="8" fill="url(#hubcapGleam)" />
        </g>
      </g>
    </svg>
  );
}

/**
 * The signature red "J" character glyph matching the exact JayJef brand styling.
 */
export function BrandLetterJ({ className = 'text-red-600', size = 'text-3xl' }) {
  return (
    <span
      className={`font-black tracking-tight select-none inline-block ${size} ${className}`}
      style={{
        fontFamily: '"Poppins", sans-serif',
        color: '#E60026',
        textShadow: '0 1px 2px rgba(230, 0, 38, 0.25)',
        transform: 'scaleY(1.05)',
      }}
    >
      J
    </span>
  );
}

/**
 * The full JayJef Brand Logo component with 1940 Ford Coupe and signature typography.
 */
export function JayJefLogo({ variant = 'sidebar', className = '' }) {
  if (variant === 'compact' || variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-700 p-2 text-white shadow-lg shadow-red-600/30 border border-red-500/30 ${className}`}>
        <FordCoupe1940 className="w-10 h-7" />
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`flex items-center gap-3.5 group select-none ${className}`}>
        {/* Car Badge Emblem */}
        <div className="relative flex h-11 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-black p-1 shadow-md shadow-slate-900/20 border border-slate-700/50 group-hover:border-red-500/50 transition-all duration-300">
          <FordCoupe1940 className="w-12 h-9 transform group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow-sm ring-2 ring-white">
            J
          </div>
        </div>

        {/* Brand Text */}
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-0.5">
            {/* Jay */}
            <span className="text-2xl font-black text-red-600 tracking-tight" style={{ fontFamily: '"Poppins", sans-serif' }}>
              J
            </span>
            <span className="text-xl font-black text-gray-900 tracking-tight mr-1.5" style={{ fontFamily: '"Poppins", sans-serif' }}>
              ay
            </span>

            {/* Jef */}
            <span className="text-2xl font-black text-red-600 tracking-tight" style={{ fontFamily: '"Poppins", sans-serif' }}>
              J
            </span>
            <span className="text-xl font-black text-gray-900 tracking-tight" style={{ fontFamily: '"Poppins", sans-serif' }}>
              ef
            </span>
          </div>

          {/* Subtitle with Underline Bar */}
          <div className="mt-1 flex flex-col">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-800">
              Auto Parts &amp; Supplies
            </span>
            <span className="h-[2px] w-full bg-gray-900 rounded-full mt-0.5" />
          </div>
        </div>
      </div>
    );
  }

  // Full Banner / Hero variant (for Splash, Login, Invoices)
  return (
    <div className={`flex items-center justify-center gap-5 p-4 rounded-3xl bg-white border border-gray-100 shadow-sm ${className}`}>
      {/* 1940 Ford Coupe Vector */}
      <FordCoupe1940 className="w-32 h-20 drop-shadow-md" />

      {/* Brand Header */}
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span className="text-4xl font-black text-red-600" style={{ fontFamily: '"Poppins", sans-serif' }}>J</span>
          <span className="text-3xl font-black text-gray-900 mr-2" style={{ fontFamily: '"Poppins", sans-serif' }}>ay</span>
          <span className="text-4xl font-black text-red-600" style={{ fontFamily: '"Poppins", sans-serif' }}>J</span>
          <span className="text-3xl font-black text-gray-900" style={{ fontFamily: '"Poppins", sans-serif' }}>ef</span>
        </div>

        {/* 3 Auto Parts Thumbnails */}
        <div className="flex items-center gap-2 my-1.5">
          {/* Condenser Core */}
          <div className="flex h-7 w-9 items-center justify-center rounded-md border border-gray-300 bg-gray-50 px-1 py-0.5 text-[8px] font-bold text-gray-500">
            CORE
          </div>
          {/* Compressor */}
          <div className="flex h-7 w-9 items-center justify-center rounded-md border border-gray-300 bg-gray-50 px-1 py-0.5 text-[8px] font-bold text-gray-500">
            COMP
          </div>
          {/* Valve */}
          <div className="flex h-7 w-9 items-center justify-center rounded-md border border-gray-300 bg-gray-50 px-1 py-0.5 text-[8px] font-bold text-gray-500">
            TXV
          </div>
        </div>

        {/* Auto Parts & Supplies */}
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-widest text-gray-900">
            Auto Parts &amp; Supplies
          </span>
          <span className="h-[2px] w-full bg-gray-900 mt-0.5" />
        </div>
      </div>
    </div>
  );
}

export default JayJefLogo;
