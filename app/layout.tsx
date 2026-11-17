import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"PhotoPrinter Pro — License Admin",description:"Panel administrator lisensi PhotoPrinter Pro"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
