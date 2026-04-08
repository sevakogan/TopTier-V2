export function Footer() {
  return (
    <footer
      className="border-t px-6 py-10"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between">
        <p
          className="font-serif text-[13px]"
          style={{ color: "rgba(245,245,240,0.2)" }}
        >
          &copy; 2026 Top Tier Miami Club. All rights reserved.
        </p>

        <div className="flex items-center gap-4">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/toptiermiamiclub/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#C9A84C]"
            style={{ color: "rgba(245,245,240,0.25)" }}
            aria-label="Instagram"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </a>

          {/* Telegram */}
          <a
            href="https://t.me"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#C9A84C]"
            style={{ color: "rgba(245,245,240,0.25)" }}
            aria-label="Telegram"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.012-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-[1200px] text-center">
        <a
          href="mailto:memberships@toptiermiamiclub.com"
          className="text-[15px] tracking-[2px] text-[rgba(245,245,240,0.2)] transition-colors hover:text-[#C9A84C]"
        >
          memberships@toptiermiamiclub.com
        </a>
      </div>
    </footer>
  );
}
