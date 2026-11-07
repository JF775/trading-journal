import os

# -------------------------------------------------------------
# 1. Update src/app/login/page.tsx with i18n
# -------------------------------------------------------------
login_path = os.path.join('src', 'app', 'login', 'page.tsx')
with open(login_path, 'r', encoding='utf-8') as f:
    login_c = f.read().replace('\r\n', '\n')

old_login_use_app = "  const { login, loginWithGoogle } = useApp();"
new_login_use_app = "  const { lang, setLang, t, login, loginWithGoogle } = useApp();"
if old_login_use_app in login_c:
    login_c = login_c.replace(old_login_use_app, new_login_use_app, 1)

old_back_button = """      {/* Back to Landing Page Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/landing"
          className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>"""

new_back_button = """      {/* Back to Landing Page & Language Switcher */}
      <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between">
        <Link
          href="/landing"
          className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{lang === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}</span>
        </Link>

        <button
          onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
          className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-bold transition flex items-center gap-1.5"
        >
          <span className="text-emerald-400 font-mono">🌐</span>
          <span>{lang.toUpperCase()}</span>
        </button>
      </div>"""

if old_back_button in login_c:
    login_c = login_c.replace(old_back_button, new_back_button, 1)

login_text_replacements = [
    ("Masuk ke Akun Anda", "{t('loginTitle')}"),
    ("Akses terminal jurnal, pantau transaksi MT5, dan evaluasi performa trading Anda.", "{t('loginSubtitle')}"),
    ("<span>{isGoogleLoading ? 'Menghubungkan ke Google...' : 'Masuk Langsung dengan Google'}</span>", "<span>{isGoogleLoading ? (lang === 'id' ? 'Menghubungkan...' : 'Connecting...') : t('loginWithGoogle')}</span>"),
    ("<span className=\"bg-[#090e1c] px-3 text-slate-500\">atau dengan email</span>", "<span className=\"bg-[#090e1c] px-3 text-slate-500\">{t('orWithEmail')}</span>"),
    ("Alamat Email\n              </label>", "{t('emailLabel')}\n              </label>"),
    ("Kata Sandi\n                </label>", "{t('passwordLabel')}\n                </label>"),
    ("Lupa sandi?\n                </button>", "{t('forgotPassword')}\n                </button>"),
    ("Ingat saya di perangkat ini\n              </label>", "{t('rememberMe')}\n              </label>"),
    ("<span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Terminal'}</span>", "<span>{isLoading ? (lang === 'id' ? 'Memverifikasi...' : 'Verifying...') : t('submitLogin')}</span>"),
    ("<span>Gunakan Akun Demo Pengujian (1-Klik)</span>", "<span>{t('demoQuickFill')}</span>"),
    ("Belum memiliki akun?{' '}", "{t('dontHaveAccount')}{' '}"),
    ("Daftar Gratis di Sini &rarr;", "{t('registerHere')}")
]

for old, new in login_text_replacements:
    if old in login_c:
        login_c = login_c.replace(old, new, 1)

with open(login_path, 'w', encoding='utf-8') as f:
    f.write(login_c)
print("Updated src/app/login/page.tsx with i18n!")


# -------------------------------------------------------------
# 2. Update src/app/register/page.tsx with i18n
# -------------------------------------------------------------
reg_path = os.path.join('src', 'app', 'register', 'page.tsx')
with open(reg_path, 'r', encoding='utf-8') as f:
    reg_c = f.read().replace('\r\n', '\n')

old_reg_use_app = "  const { register, loginWithGoogle } = useApp();"
new_reg_use_app = "  const { lang, setLang, t, register, loginWithGoogle } = useApp();"
if old_reg_use_app in reg_c:
    reg_c = reg_c.replace(old_reg_use_app, new_reg_use_app, 1)

if old_back_button in reg_c:
    reg_c = reg_c.replace(old_back_button, new_back_button, 1)

reg_text_replacements = [
    ("Buat Akun Jurnal Trading", "{t('registerTitle')}"),
    ("Daftar gratis dalam 30 detik. Tanpa kartu kredit, langsung sinkronkan akun MT5 Anda.", "{t('registerSubtitle')}"),
    ("<span>{isGoogleLoading ? 'Menghubungkan...' : 'Daftar Instan dengan Google'}</span>", "<span>{isGoogleLoading ? (lang === 'id' ? 'Menghubungkan...' : 'Connecting...') : t('registerWithGoogle')}</span>"),
    ("<span className=\"bg-[#090e1c] px-3 text-slate-500\">atau dengan email</span>", "<span className=\"bg-[#090e1c] px-3 text-slate-500\">{t('orWithEmail')}</span>"),
    ("Nama Lengkap\n              </label>", "{t('fullNameLabel')}\n              </label>"),
    ("Alamat Email\n              </label>", "{t('emailLabel')}\n              </label>"),
    ("Broker Utama\n              </label>", "{t('preferredBrokerLabel')}\n              </label>"),
    ("Kata Sandi\n              </label>", "{t('passwordLabel')}\n              </label>"),
    ("Konfirmasi Kata Sandi\n              </label>", "{t('confirmPasswordLabel')}\n              </label>"),
    ("Saya menyetujui <span className=\"text-white hover:underline\">Syarat & Ketentuan</span> serta <span className=\"text-white hover:underline\">Kebijakan Privasi</span> JFZLA Journal.", "{t('agreeTerms')}"),
    ("<span>{isLoading ? 'Mendaftarkan Akun...' : 'Daftar Akun Gratis Sekarang'}</span>", "<span>{isLoading ? (lang === 'id' ? 'Mendaftarkan...' : 'Registering...') : t('submitRegister')}</span>"),
    ("Sudah memiliki akun?{' '}", "{t('alreadyHaveAccount')}{' '}"),
    ("Masuk di Sini &rarr;", "{t('loginHere')}")
]

for old, new in reg_text_replacements:
    if old in reg_c:
        reg_c = reg_c.replace(old, new, 1)

with open(reg_path, 'w', encoding='utf-8') as f:
    f.write(reg_c)
print("Updated src/app/register/page.tsx with i18n!")


# -------------------------------------------------------------
# 3. Update src/app/landing/page.tsx with i18n & navbar language button
# -------------------------------------------------------------
landing_path = os.path.join('src', 'app', 'landing', 'page.tsx')
with open(landing_path, 'r', encoding='utf-8') as f:
    landing_c = f.read().replace('\r\n', '\n')

old_landing_nav_links = """          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#fitur" className="hover:text-emerald-400 transition">Fitur Unggulan</a>
            <a href="#demo" className="hover:text-emerald-400 transition">Demo Terminal</a>
            <a href="#broker" className="hover:text-emerald-400 transition">Broker Partner</a>
            <a href="#pricing" className="hover:text-emerald-400 transition">Paket Lisensi</a>
            <a href="#faq" className="hover:text-emerald-400 transition">FAQ Keamanan</a>
          </div>"""

new_landing_nav_links = """          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#demo" className="hover:text-emerald-400 transition">{t('landingNavDemo')}</a>
            <a href="#broker" className="hover:text-emerald-400 transition">{t('landingNavBrokers')}</a>
            <a href="#pricing" className="hover:text-emerald-400 transition">{t('landingNavPricing')}</a>
            <a href="#faq" className="hover:text-emerald-400 transition">{t('landingNavFaq')}</a>
          </div>"""

if old_landing_nav_links in landing_c:
    landing_c = landing_c.replace(old_landing_nav_links, new_landing_nav_links, 1)

# Add language button right in the navbar next to "Buka Terminal"
old_terminal_btn = """            {/* Quick Link to Dashboard / Terminal */}
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] transition flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Buka Terminal</span>
            </Link>"""

new_terminal_btn = """            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="px-2.5 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
              title="Ganti Bahasa / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* Quick Link to Dashboard / Terminal */}
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] transition flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'id' ? 'Buka Terminal' : 'Open Terminal'}</span>
            </Link>"""

if old_terminal_btn in landing_c and 'title="Ganti Bahasa / Switch Language"' not in landing_c:
    landing_c = landing_c.replace(old_terminal_btn, new_terminal_btn, 1)

landing_text_replacements = [
    ("<span>Platform Jurnal Trading Cent & Forex MT5 Pertama di Indonesia</span>", "<span>{t('landingHeroTag')}</span>"),
    ("Kuasai Data Trading Anda. Dari Akun Cent Hingga Skala <span className=\"text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500\">Prop Firm & EA Grid</span>.", "{t('landingHeroTitle')} <span className=\"text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500\">{t('landingHeroTitleHighlight')}</span>."),
    ("Tinggalkan pencatatan Excel yang melelahkan. <strong>JFZLA Journal</strong> otomatis menyinkronkan riwayat posisi, floating PnL, dan eksekusi lot langsung dari terminal MT5 via Investor Password (100% Read-Only). Dirancang khusus untuk trader Cent & Forex yang menuntut disiplin dan profit konsisten.", "{t('landingHeroDesc')}"),
    ("<span>Mulai Gratis Sekarang</span>", "<span>{t('landingStartFree')}</span>"),
    ("<span>{isGoogleLoading ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>", "<span>{isGoogleLoading ? (lang === 'id' ? 'Menghubungkan...' : 'Connecting...') : t('landingGoogleBtn')}</span>"),
    ("<span>100% Investor Password (Read-Only)</span>", "<span>{t('landingReadOnlyBadge')}</span>"),
    ("<span>Auto-Sync Real-Time 5 Detik</span>", "<span>{t('landingSync5s')}</span>"),
    ("<span>Tanpa Akses Eksekusi / WD Dana</span>", "<span>{t('landingNoWdBadge')}</span>"),
    ("Update Terbaru v2.4: Dukungan Live Price TradingView & Sinkronisasi MT5 Tiap 5 Detik Aktif!", "{lang === 'id' ? 'Update Terbaru v2.4: Dukungan Live Price TradingView & Sinkronisasi MT5 Tiap 5 Detik Aktif!' : 'Latest Update v2.4: Live TradingView Quotes & 5-Second MT5 Auto-Sync Active!'}"),
    ("Coba Sekarang &rarr;", "{lang === 'id' ? 'Coba Sekarang →' : 'Try Now →'}"),
    ("Masuk\n                </Link>", "{t('loginLabel')}\n                </Link>"),
    ("<span>Daftar Akun</span>", "<span>{t('registerLabel')}</span>")
]

for old, new in landing_text_replacements:
    if old in landing_c:
        landing_c = landing_c.replace(old, new, 1)

with open(landing_path, 'w', encoding='utf-8') as f:
    f.write(landing_c)
print("Updated src/app/landing/page.tsx with i18n!")
