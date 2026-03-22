/**
 * Estrutura de input para preenchimento dinâmico do vídeo.
 * Pode ser passado via defaultProps no Studio ou via --props no render (getInputProps).
 */
export type ListingClient = {
  logo_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  design_config?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ListingPrices = {
  Venda?: string;
  Locação?: string;
  [key: string]: string | undefined;
};

/** Item do grid de amenities: string (só nome) ou objeto com name e opcional icon (Material Symbol name) */
export type AmenityItem =
  | string
  | { name: string; icon?: string };

/** Card do grid 2x2 (ex.: quartos, banheiros): label + value + ícone opcional */
export type InfoCard = {
  label: string;
  value: string;
  icon?: string;
};

export type ListingData = {
  client?: ListingClient;
  carousel_images?: string[];
  selected_images?: string[];
  imobname?: string;
  propertyCodes?: string;
  prices?: ListingPrices;
  address?: string;
  city?: string;
  state?: string;
  amenitiesList?: AmenityItem[];
  /** Cards do grid 2x2 (ex.: Quartos, Banheiros, Área, Vagas). Se omitido, usa padrão. */
  infoCards?: InfoCard[];
  [key: string]: unknown;
};

export type ListingInput = {
  listing?: ListingData;
  baseUrl?: string;
  files?: Record<string, unknown>;
};

/** Valores padrão quando listing não fornece dados */
export const DEFAULT_LISTING: ListingData = {
  imobname: "Estate Elite",
  propertyCodes: "REF-001",
  prices: { Venda: "R$ 12.450.000" },
  address: "1230 Summit Ridge Dr",
  city: "Beverly Hills",
  state: "CA",
  infoCards: [
    { label: "Quartos", value: "6", icon: "bed" },
    { label: "Banheiros", value: "8", icon: "bathtub" },
    { label: "Área total", value: "14.200 m²", icon: "square_foot" },
    { label: "Vagas", value: "12", icon: "directions_car" },
  ],
  amenitiesList: [
    { name: "Piscina", icon: "pool" },
    { name: "Academia", icon: "fitness_center" },
    { name: "Cinema", icon: "movie" },
    { name: "Adega", icon: "wine_bar" },
  ],
  client: {
    logo_url: "",
    phone: "+1 234 567 8900",
    email: "contato@estateelite.com",
    website: "www.estateelite.com",
    instagram: "@estateelite",
  },
};

/** Mescla listing do input com defaults (input sobrescreve) */
export function normalizeListing(input?: ListingInput): ListingData {
  const from = input?.listing ?? {};
  return {
    ...DEFAULT_LISTING,
    ...from,
    client: { ...DEFAULT_LISTING.client, ...from.client },
    prices: { ...DEFAULT_LISTING.prices, ...from.prices },
    infoCards: from.infoCards ?? DEFAULT_LISTING.infoCards,
    amenitiesList: from.amenitiesList ?? DEFAULT_LISTING.amenitiesList,
  };
}

/** Endereço completo a partir de address, city, state */
export function fullAddress(listing: ListingData): string {
  const parts = [listing.address, listing.city, listing.state].filter(Boolean);
  return parts.join(", ") || "—";
}

/** Primeiro preço disponível (Venda ou Locação) */
export function displayPrice(listing: ListingData): string {
  const p = listing.prices;
  if (!p) return "—";
  return p.Venda ?? p.Locação ?? Object.values(p)[0] ?? "—";
}

/** Se baseUrl existir e url for relativa, retorna baseUrl + url; senão retorna url */
export function resolveUrl(url: string | undefined, baseUrl: string | undefined): string {
  if (!url) return "";
  if (!baseUrl) return url;
  const b = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
  return url.startsWith("http") ? url : b + url.replace(/^\//, "");
}
