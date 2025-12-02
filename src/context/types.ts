import type {
  AutoState,
  Category,
  Credentials,
  ScreenType,
  ServerConfig,
  UserInfo,
  VpnStatus,
} from '../types';

export interface VpnContextType {
  status: VpnStatus;
  config: ServerConfig | null;
  categorias: Category[];
  selectedCategory: Category | null;
  user: UserInfo | null;
  creds: Credentials;
  auto: AutoState;
  screen: ScreenType;
  termsAccepted: boolean;
  needsUpdate: boolean;
  autoMode: boolean;

  setScreen: (screen: ScreenType) => void;
  setConfig: (config: ServerConfig) => void;
  setCreds: (creds: Partial<Credentials>) => void;
  setSelectedCategory: (category: Category | null) => void;
  setAutoMode: (on: boolean) => void;
  connect: () => void;
  disconnect: () => void;
  cancelConnecting: () => void;
  startAutoConnect: (category?: Category) => void;
  loadCategorias: () => void;
  acceptTerms: () => void;

  topInfo: { op: string; ip: string; ver: string };
  pingMs: number | null;
}
