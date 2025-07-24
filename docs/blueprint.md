# **App Name**: Hotel Supply Hub

## Core Features:

- S/4 Hana Fiori-like Request Interface: Configurable interface for hotels to request product supplies, mirroring the S/4 Hana Fiori UI5 style, and integration within the Geslop2 workspace.
- Dynamic Recipient Selection: Allows the selection of a recipient for product requests based on the connected Center and Storage. This includes dynamic updates to selectors based on hotel and storage selections. This area of the screen must come first and be pre-eminent.
- Date selection control: Presents a dual calendar view for selecting request dates, restricting date selection based on predefined rules that are dependant on the 'catalog' which is connected to the Hotel and storage.
- SAP Material Filtering: Enable a catalog filtered based on hotel selection, consisting of Código de producto, Descripción de producto, Código de familia, Descripción de familia. Each should provide filtering. Additionally:Favoritos, Última solicitud and Solicitar
- Product table: Material selection table displaying product details and quantity input with validation.
- Order Submission: Submission of orders based on the current view of the data in the product table. An entry should only be submitted for items that have a count greater than zero. The other should provide a valid entry.

## Style Guidelines:

- Primary color: #3498DB (RGB) a vibrant blue, emulating Fiori's clean interface, symbolizing trust and efficiency in operations.
- Background color: #F0F8FF (RGB), a light, desaturated blue to maintain a professional yet approachable aesthetic.
- Accent color: #2ECC71 (RGB), a lively green, for actionable elements like buttons, drawing user attention in a subtle manner.
- Font pairing: 'Inter' (sans-serif) for both headings and body text, chosen for its modern, neutral appearance that ensures readability and consistency across the application.
- Simple, clean icons from a Fiori icon set, using filled icons for active states and outlined icons for inactive, ensuring clarity and ease of use.
- Maintain consistent padding and margins, aligning to a grid system inspired by Fiori's UI, ensuring each section of the app is logically arranged and visually pleasing.
- Subtle transitions for changes, like selectors and table updates, enhancing user engagement and giving real-time feedback on actions.