"use client";

import type { ComponentProps } from "react";
import { CMDK_EVENT } from "./command-palette";

/** Komut paletini açan görünür tetik (sunucu bileşenlerinden kullanılabilir). */
export function CmdkButton(
  props: Omit<ComponentProps<"button">, "onClick" | "type">,
) {
  return (
    <button
      type="button"
      aria-label="Ara — komut paleti"
      onClick={() => window.dispatchEvent(new CustomEvent(CMDK_EVENT))}
      {...props}
    />
  );
}
