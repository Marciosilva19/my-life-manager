export type Priority = "baixa" | "media" | "alta";
export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "weekdays";
export type MoneyRecurrence = "none" | "weekly" | "monthly" | "yearly";
export type EventKind = "aula" | "trabalho" | "estudo" | "ginasio" | "outro";
export type ThemeName = "rosa" | "lilas" | "azul" | "neutro" | "escuro";
export type Mode = "light" | "dark";

export type CardId =
  | "tarefas"
  | "proximo"
  | "financas"
  | "conta"
  | "compras"
  | "notas";

export type CardPref = { id: CardId; visible: boolean };

export type Settings = {
  theme: ThemeName;
  mode: Mode;
  weekStart: 0 | 1; // 0 = domingo, 1 = segunda
  cards: CardPref[];
};

export type Workspace = {
  id: string;
  slug: string;
  name: string;
  settings: Partial<Settings> | null;
  created_at: string;
};

export type Task = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: Priority;
  category: string;
  recurrence: Recurrence;
  recurrence_days: number[];
  show_in_calendar: boolean;
  completed_dates: string[];
  is_demo: boolean;
  created_at: string;
};

export type CalendarEvent = {
  id: string;
  workspace_id: string;
  title: string;
  kind: EventKind;
  start_time: string;
  end_time: string;
  weekday: number | null;
  date: string | null;
  repeats_weekly: boolean;
  color: string;
  location: string | null;
  notes: string | null;
  is_demo: boolean;
};

export type Transaction = {
  id: string;
  workspace_id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  description: string | null;
  recurrence: MoneyRecurrence;
  is_demo: boolean;
};

export type Budget = {
  id: string;
  workspace_id: string;
  category: string;
  amount: number;
  is_demo: boolean;
};

export type Bill = {
  id: string;
  workspace_id: string;
  name: string;
  amount: number;
  due_date: string;
  recurrence: MoneyRecurrence;
  paid_dates: string[];
  is_demo: boolean;
};

export type ShoppingList = {
  id: string;
  workspace_id: string;
  name: string;
  is_demo: boolean;
  created_at: string;
};

export type ListShare = {
  id: string;
  list_id: string;
  token: string;
  role: "editor" | "viewer";
  created_at: string;
  revoked_at: string | null;
};

export type ShoppingItem = {
  id: string;
  list_id: string;
  name: string;
  quantity: string | null;
  category: string;
  notes: string | null;
  bought: boolean;
  position: number;
  is_demo: boolean;
};

export type Note = {
  id: string;
  workspace_id: string;
  title: string;
  body: string | null;
  expires_at: string;
  task_id: string | null;
  is_demo: boolean;
  created_at: string;
};

export type ActionState = { ok?: boolean; error?: string };

export const FINANCE_CATEGORIES = [
  "alimentação",
  "transporte",
  "estudos",
  "saúde",
  "lazer",
  "casa",
  "subscrições",
  "outros",
] as const;

export const TASK_CATEGORIES = [
  "pessoal",
  "estudos",
  "trabalho",
  "casa",
  "saúde",
  "outros",
] as const;

export const SHOPPING_CATEGORIES = [
  "fruta e legumes",
  "mercearia",
  "frescos",
  "bebidas",
  "limpeza",
  "higiene",
  "outros",
] as const;

export const EVENT_COLORS = ["rosa", "lilas", "azul", "verde", "ambar", "cinza"] as const;

export const DEFAULT_CARDS: CardPref[] = [
  { id: "tarefas", visible: true },
  { id: "proximo", visible: true },
  { id: "financas", visible: true },
  { id: "conta", visible: true },
  { id: "compras", visible: true },
  { id: "notas", visible: true },
];

export const CARD_LABELS: Record<CardId, string> = {
  tarefas: "Tarefas de hoje",
  proximo: "Próximo compromisso",
  financas: "Resumo financeiro",
  conta: "Próxima conta a pagar",
  compras: "Lista de compras",
  notas: "Notas temporárias",
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "rosa",
  mode: "light",
  weekStart: 1,
  cards: DEFAULT_CARDS,
};
