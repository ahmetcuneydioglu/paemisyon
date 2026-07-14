/** Alt bilgi — eski footer: ortalanmış yasal linkler + telif (Doc 18 §4.1). */
export function SiteFooter() {
  return (
    <footer className="border-t border-(--color-border) bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center">
        <ul className="mb-2 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[13px]">
          <li><a className="hover:underline" href="https://paemisyon.com" target="_blank" rel="noreferrer">Paemisyon Hakkında</a></li>
          <li><a className="hover:underline" href="https://paemisyon.com" target="_blank" rel="noreferrer">Gizlilik Sözleşmesi</a></li>
          <li><a className="hover:underline" href="https://paemisyon.com" target="_blank" rel="noreferrer">Kullanım Koşulları</a></li>
        </ul>
        <p className="text-[12px] text-neutral-500">© {new Date().getFullYear()} Paemisyon — Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
}
