import { useState, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

/**
 * İçeriği kalan yüksekliğe sığdırır: sığıyorsa olduğu gibi ortalar, sığmıyorsa orantılı küçültür
 * (kırpmaz, kaydırmaz). `minScale`'in altına inmek gerekirse içerik gizlenir: kırpık önizleme
 * yerine boş alan (en büyük yazı boylarında okunacak metne yer kalır). Tanıtım kahramanı gibi
 * süs/önizleme alanları içindir; okunması gereken içerikte kullanılmaz.
 */
export function ScaleToFit({ children, style, minScale = 0.6 }: { children: ReactNode; style?: StyleProp<ViewStyle>; minScale?: number }) {
  const [box, setBox] = useState(0);
  const [content, setContent] = useState(0);
  const fit = box > 0 && content > box ? box / content : 1;
  const hidden = fit < minScale;
  return (
    <View style={[{ flex: 1, justifyContent: "center", overflow: "hidden" }, style]} onLayout={(e) => setBox(e.nativeEvent.layout.height)}>
      <View onLayout={(e) => setContent(e.nativeEvent.layout.height)} style={{ transform: [{ scale: hidden ? 1 : fit }], opacity: hidden ? 0 : 1 }}>
        {children}
      </View>
    </View>
  );
}
