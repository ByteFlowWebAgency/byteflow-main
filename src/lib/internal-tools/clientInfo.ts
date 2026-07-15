// The client/contact shape shared by every internal tool's document (proposals, audits,
// and whatever comes next). Tool-specific extras (e.g. the proposal's organizationType)
// extend this rather than redefining these fields.

export interface ClientContact {
  /** Client or organization name. */
  clientName: string;
  contactName: string;
  contactEmail: string;
}
