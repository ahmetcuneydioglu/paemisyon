/// İstek boyunca taşınan kimliği doğrulanmış kullanıcı (req.user).
export interface AuthenticatedUser {
  /** Uygulama kullanıcı id'si (= Supabase auth uid). */
  id: string;
  email: string;
  roles: string[];
  isPremium: boolean;
}
