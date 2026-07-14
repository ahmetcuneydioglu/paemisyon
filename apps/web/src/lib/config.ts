/**
 * Web uygulaması yapılandırması. Buradaki değerler PUBLIC'tir (Supabase anon
 * anahtarı istemciye gömülmek için tasarlanmıştır — Doc 8). Gizli anahtar YOK.
 * Prod'da env ile ezilir (deneme.paemisyon.com → Faz 8).
 */
export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://yhkiuzevyqdqtofrmroj.supabase.co",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inloa2l1emV2eXFkcXRvZnJtcm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NjU0OTAsImV4cCI6MjA5OTQ0MTQ5MH0.Znv7XODkWl3cA2hcLce2tY5nlOfBp6WEWevRdDbkRDw",
};
