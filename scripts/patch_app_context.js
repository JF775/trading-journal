const fs = require('fs');

let c = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// 1. Add imports from types
c = c.replace(
  "  BrokerName,\n  User\n} from '@/lib/types';",
  "  BrokerName,\n  User,\n  UserRole,\n  RolePackageDetails,\n  getRolePackageDetails\n} from '@/lib/types';"
);
c = c.replace(
  "  BrokerName,\r\n  User\r\n} from '@/lib/types';",
  "  BrokerName,\r\n  User,\r\n  UserRole,\r\n  RolePackageDetails,\r\n  getRolePackageDetails\r\n} from '@/lib/types';"
);

// 2. Add properties to AppContextType
const oldContextTypeClosing = `  // Authentication State & Actions
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, broker?: BrokerName) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (customData?: { email?: string; name?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}`;

const newContextTypeClosing = `  // Authentication State & Actions
  user: User | null;
  authLoading: boolean;
  previewRole: UserRole | null;
  setPreviewRole: (role: UserRole | null) => void;
  effectiveRole: UserRole;
  packageDetails: RolePackageDetails;
  canTest: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, broker?: BrokerName) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (customData?: { email?: string; name?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}`;

c = c.replace(oldContextTypeClosing, newContextTypeClosing);

// 3. Add authLoading and previewRole states in AppProvider
const oldUserStates = `  // User Authentication State
  const [user, setUser] = useState<User | null>(null);

  // Initialize user from localStorage or API on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('jfzla_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Fallback fetch initial demo user
        fetch('/api/auth/me')
          .then(res => res.json())
          .then(data => {
            if (data?.user) {
              setUser(data.user);
              localStorage.setItem('jfzla_user', JSON.stringify(data.user));
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      // ignore SSR
    }
  }, []);`;

const newUserStates = `  // User Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);

  // Determine effective role and RBAC package rules
  const effectiveRole = (user?.role === 'admin' && previewRole ? previewRole : user?.role || 'client_starter') as UserRole;
  const packageDetails = getRolePackageDetails(effectiveRole);
  const canTest = user?.role === 'admin' && !previewRole;

  // Initialize user from localStorage or active session on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('jfzla_user');
      if (stored) {
        setUser(JSON.parse(stored));
        setAuthLoading(false);
      } else {
        // Check active session cookie from server without auto-logging into demo
        fetch('/api/auth/me')
          .then(res => {
            if (res.ok) return res.json();
            return { user: null };
          })
          .then(data => {
            if (data?.user) {
              setUser(data.user);
              localStorage.setItem('jfzla_user', JSON.stringify(data.user));
            } else {
              setUser(null);
            }
          })
          .catch(() => setUser(null))
          .finally(() => setAuthLoading(false));
      }
    } catch (e) {
      setAuthLoading(false);
    }
  }, []);`;

c = c.replace(oldUserStates, newUserStates);

// 4. Update refreshData to pass user id and headers
const oldRefreshData = `  const refreshData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const ts = Date.now();
      const accParam = selectedAccountId !== 'all' ? \`&account_id=\${selectedAccountId}\` : '';
      const [resAnalytics, resTrades, resAccounts, resPlan, resLicense] = await Promise.all([
        fetch(\`/api/analytics?_t=\${ts}\${accParam}\`, { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch(\`/api/trades?_t=\${ts}&limit=500\${accParam}\`, { cache: 'no-store' }).then(r => r.json()).catch(() => []),
        fetch(\`/api/accounts?_t=\${ts}\`, { cache: 'no-store' }).then(r => r.json()).catch(() => []),
        fetch(\`/api/trading-plan?_t=\${ts}\`, { cache: 'no-store' }).then(r => r.json()).catch(() => null),
        fetch(\`/api/license?_t=\${ts}\`, { cache: 'no-store' }).then(r => r.json()).catch(() => null)
      ]);`;

const newRefreshData = `  const refreshData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const ts = Date.now();
      const currentUserId = user?.id || '';
      const headers: Record<string, string> = currentUserId ? { 'x-user-id': currentUserId } : {};
      const userParam = currentUserId ? \`&userId=\${currentUserId}\` : '';
      const accParam = selectedAccountId !== 'all' ? \`&account_id=\${selectedAccountId}\` : '';
      const [resAnalytics, resTrades, resAccounts, resPlan, resLicense] = await Promise.all([
        fetch(\`/api/analytics?_t=\${ts}\${accParam}\${userParam}\`, { cache: 'no-store', headers }).then(r => r.json()).catch(() => null),
        fetch(\`/api/trades?_t=\${ts}&limit=500\${accParam}\${userParam}\`, { cache: 'no-store', headers }).then(r => r.json()).catch(() => []),
        fetch(\`/api/accounts?_t=\${ts}\${userParam}\`, { cache: 'no-store', headers }).then(r => r.json()).catch(() => []),
        fetch(\`/api/trading-plan?_t=\${ts}\${userParam}\`, { cache: 'no-store', headers }).then(r => r.json()).catch(() => null),
        fetch(\`/api/license?_t=\${ts}\${userParam}\`, { cache: 'no-store', headers }).then(r => r.json()).catch(() => null)
      ]);`;

c = c.replace(oldRefreshData, newRefreshData);

// Update dependency array of refreshData
c = c.replace(
  "}, [selectedAccountId]);",
  "}, [selectedAccountId, user?.id]);"
);

// 5. Update triggerManualSyncAll to send user header
const oldSyncAll = `  const triggerManualSyncAll = useCallback(async () => {
    try {
      setIsAutoSyncing(true);
      const res = await fetch('/api/accounts/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });`;

const newSyncAll = `  const triggerManualSyncAll = useCallback(async () => {
    try {
      setIsAutoSyncing(true);
      const currentUserId = user?.id || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(currentUserId ? { 'x-user-id': currentUserId } : {})
      };
      const res = await fetch('/api/accounts/sync-all', {
        method: 'POST',
        headers,
        body: JSON.stringify({ force: true })
      });`;

c = c.replace(oldSyncAll, newSyncAll);

// Update dependency array of triggerManualSyncAll
c = c.replace(
  "}, [refreshData]);",
  "}, [refreshData, user?.id]);"
);

// 6. Update context provider value to include new fields
const oldProviderValue = `        activeReviewTrade,
        setActiveReviewTrade,
        user,
        login,`;

const newProviderValue = `        activeReviewTrade,
        setActiveReviewTrade,
        user,
        authLoading,
        previewRole,
        setPreviewRole,
        effectiveRole,
        packageDetails,
        canTest,
        login,`;

c = c.replace(oldProviderValue, newProviderValue);

fs.writeFileSync('src/context/AppContext.tsx', c, 'utf8');
console.log('Successfully patched AppContext.tsx with RBAC and Auth Guard state');
