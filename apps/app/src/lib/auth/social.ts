import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";

/**
 * Apple ve Google ile giriş (gys-mobil kalıbı; Supabase `signInWithIdToken`, tarayıcı yok).
 * Supabase'in sağlayıcı ayarlarında Client IDs listesi: Google için Web + iOS kimlikleri,
 * Apple için bundle id `com.paemisyon.paemisyon` (Flutter ile aynı, zaten kayıtlı).
 */
export type SocialProvider = "apple" | "google";

export class SocialSignInCancelled extends Error {
  constructor() {
    super("cancelled");
    this.name = "SocialSignInCancelled";
  }
}

let googleConfigured = false;
function configureGoogle() {
  if (googleConfigured) return;
  if (!env?.googleWebClientId) throw new Error("Google ile giriş bu derlemede yapılandırılmadı.");
  GoogleSignin.configure({
    webClientId: env.googleWebClientId,
    iosClientId: Platform.OS === "ios" ? env.googleIosClientId || undefined : undefined,
    scopes: ["email", "profile"],
  });
  googleConfigured = true;
}

function describeIdTokenError(message: string) {
  const l = message.toLowerCase();
  if (l.includes("audience") || l.includes("client id") || l.includes("aud")) return "Bu uygulama kimliği Supabase'de tanımlı değil.";
  if (l.includes("nonce")) return "Kimlik belirteci nonce denetimine takıldı.";
  if (l.includes("provider") && l.includes("enabled")) return "Bu giriş yöntemi sunucuda kapalı.";
  return message || "Giriş tamamlanamadı.";
}

async function signInWithGoogle() {
  configureGoogle();
  if (Platform.OS === "android") await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  let response: Awaited<ReturnType<typeof GoogleSignin.signIn>>;
  try {
    response = await GoogleSignin.signIn();
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) throw new SocialSignInCancelled();
      if (error.code === statusCodes.IN_PROGRESS) throw new Error("Google girişi zaten sürüyor.");
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw new Error("Bu cihazda Google Play Hizmetleri yok; e-posta ile giriş yap.");
      throw new Error(`Google girişi başarısız (${error.code}).`);
    }
    throw error;
  }
  if (!isSuccessResponse(response)) throw new SocialSignInCancelled();
  const idToken = response.data.idToken;
  if (!idToken) throw new Error("Google kimlik belirteci alınamadı.");
  const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken });
  if (error) {
    await GoogleSignin.signOut().catch(() => {});
    throw new Error(describeIdTokenError(error.message));
  }
}

async function signInWithApple() {
  if (Platform.OS !== "ios") throw new Error("Apple ile giriş yalnız iPhone ve iPad'de kullanılabilir.");
  if (!(await AppleAuthentication.isAvailableAsync())) throw new Error("Bu cihazda Apple ile giriş kullanılamıyor.");
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashedNonce,
    });
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "ERR_REQUEST_CANCELED") throw new SocialSignInCancelled();
    throw new Error("Apple ile giriş tamamlanamadı. Yeniden dene ya da e-posta ile giriş yap.");
  }
  if (!credential.identityToken) throw new Error("Apple kimlik belirteci alınamadı.");
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: credential.identityToken, nonce: rawNonce });
  if (error) throw new Error(describeIdTokenError(error.message));
  const givenName = credential.fullName?.givenName?.trim();
  const familyName = credential.fullName?.familyName?.trim();
  const fullName = [givenName, familyName].filter(Boolean).join(" ");
  if (fullName && data.user && !data.user.user_metadata?.full_name) {
    await supabase.auth.updateUser({ data: { full_name: fullName } }).catch(() => {});
  }
}

export async function signInWithProvider(provider: SocialProvider): Promise<void> {
  if (provider === "google") return signInWithGoogle();
  return signInWithApple();
}

export async function signOutFromProviders() {
  if (!googleConfigured) return;
  await GoogleSignin.signOut().catch(() => {});
}
