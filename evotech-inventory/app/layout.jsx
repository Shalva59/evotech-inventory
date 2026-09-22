import { Archivo, JetBrains_Mono, Noto_Sans_Georgian } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

// Archivo has no Georgian glyphs. Without this the whole interface falls back
// to whatever the operating system has lying around, and the shop's own
// language ends up looking worse than the borrowed one.
const georgian = Noto_Sans_Georgian({
  subsets: ["georgian"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-georgian",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata = {
  title: "EVOTECH",
  description: "ERP and point of sale for electronics retail and mobile repair",
};

export const viewport = {
  themeColor: "#0B0F14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ka"
      suppressHydrationWarning
      className={`${archivo.variable} ${georgian.variable} ${jetbrains.variable}`}
    >
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
