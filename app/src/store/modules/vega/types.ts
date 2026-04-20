export interface VegaState {
  uri?: string | null;
  baseSpec?: Record<string, any> | null;
  query?: string | null;
  title?: string | null;
  description?: string | null;
  depiction?: string | null;
  downloadUrl?: string | null;
  dataset?: string | null;
}
