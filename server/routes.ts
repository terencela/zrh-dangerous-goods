import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CATEGORIES_INFO = [
  { id: 'battery_spare', name: 'Spare Battery / Power Bank', keywords: 'power bank, portable charger, spare battery, external battery, battery pack' },
  { id: 'battery_installed', name: 'Battery Installed in Device', keywords: 'laptop battery, phone battery, tablet battery, device with built-in battery' },
  { id: 'liquids_general', name: 'Liquids, Gels & Aerosols', keywords: 'water, perfume, shampoo, lotion, gel, spray, deodorant, toothpaste, cream, drink, juice, oil' },
  { id: 'knife', name: 'Knife', keywords: 'knife, pocket knife, swiss army knife, utility knife, kitchen knife, hunting knife' },
  { id: 'scissors', name: 'Scissors', keywords: 'scissors, shears, craft scissors, nail scissors' },
  { id: 'tools', name: 'Tools', keywords: 'screwdriver, wrench, pliers, hammer tool, multi-tool, spanner' },
  { id: 'lighter', name: 'Lighter', keywords: 'lighter, zippo, gas lighter, cigarette lighter, torch lighter' },
  { id: 'matches', name: 'Matches', keywords: 'matches, matchbox, matchstick' },
  { id: 'e_cigarette', name: 'E-Cigarette / Vape', keywords: 'e-cigarette, vape, vaping device, e-pipe, juul, vape pen' },
  { id: 'electronics', name: 'Laptop / Tablet / Phone / Camera', keywords: 'laptop, tablet, phone, camera, smartphone, macbook, ipad, DSLR, gopro, kindle' },
  { id: 'smart_luggage_removable', name: 'Smart Luggage (removable battery)', keywords: 'smart suitcase, smart luggage with removable battery' },
  { id: 'smart_luggage_fixed', name: 'Smart Luggage (built-in battery)', keywords: 'smart suitcase with permanent battery' },
  { id: 'luggage_tracker', name: 'Luggage Tracker', keywords: 'airtag, tile tracker, luggage tracker, gps tracker' },
  { id: 'blunt_objects', name: 'Blunt Objects', keywords: 'baseball bat, golf club, hammer, cricket bat, hockey stick' },
  { id: 'sports_equipment', name: 'Sports Equipment', keywords: 'tennis racket, badminton racket, ski poles, hiking poles' },
  { id: 'fireworks', name: 'Fireworks / Sparklers', keywords: 'fireworks, sparklers, firecrackers, pyrotechnics' },
  { id: 'fuel_paste', name: 'Fuel Pastes / Flammable Liquids', keywords: 'fuel, gasoline, lighter fluid, flammable liquid' },
  { id: 'toxic_corrosive', name: 'Acids / Toxic / Corrosive', keywords: 'acid, bleach, corrosive, toxic chemical, poison' },
  { id: 'gas_cartridges', name: 'Gas Cartridges / Compressed Gas', keywords: 'gas cartridge, compressed gas, propane, butane, pepper spray' },
  { id: 'paints', name: 'Paints / Solvents', keywords: 'paint, paint thinner, solvent, turpentine, acetone' },
];

const SYSTEM_PROMPT = `Du bist ein Experte für Flughafensicherheit am Flughafen Zürich (ZRH). Deine Aufgabe ist es, Gegenstände auf Fotos zu identifizieren und DIREKT ein vollständiges Urteil (Verdict) über deren Erlaubtheit im Hand- und aufgegebenen Gepäck zu geben.

VERFÜGBARE KATEGORIEN:
${CATEGORIES_INFO.map(c => `- ID: "${c.id}" | Name: "${c.name}" | Keywords: ${c.keywords}`).join('\n')}

ZURICH AIRPORT REGELN:
- Ersatzbatterien/Powerbanks: Unter 100 Wh = Handgepäck erlaubt (Pole abkleben). 100-160 Wh = Max 2, Airline-Genehmigung nötig. Über 160 Wh = Verboten. IMMER im aufgegebenen Gepäck verboten.
- Geräte mit eingebauter Batterie: Unter 100 Wh = erlaubt. 100-160 Wh = erlaubt mit Airline-Genehmigung. Über 160 Wh = verboten. Aufgegebenes Gepäck: Gerät muss ausgeschaltet sein.
- Flüssigkeiten: Handgepäck max 100ml pro Behälter, in transparentem 1-Liter-Beutel. Medikamente/Babynahrung ausgenommen. Aufgegebenes Gepäck: keine Grössenbeschränkung.
- Messer/Scheren/Werkzeuge: Klingen/Werkzeuge unter 6 cm = Handgepäck erlaubt. Ab 6 cm = Nur aufgegebenes Gepäck.
- Feuerzeuge: In Gepäck verboten. Nur 1 am Körper tragen erlaubt.
- Streichhölzer: In Gepäck verboten. Nur 1 Schachtel am Körper erlaubt.
- E-Zigaretten: Nur Handgepäck. Im aufgegebenen Gepäck verboten.
- Smart Luggage mit festem Akku: Verboten. Mit herausnehmbarem Akku: Akku entfernen und im Handgepäck mitnehmen.
- Feuerwerk, Brennstoffe, Gift, Gas, Farben: IMMER verboten.

AUFGABE: Wenn du ein Bild siehst:
1. Identifiziere den Gegenstand
2. Lies ALLE sichtbaren technischen Daten ab (mAh, Wh, ml, cm, Gewicht) – der Nutzer soll NICHTS eingeben müssen
3. Wende die Regeln an und gib das VOLLSTÄNDIGE Urteil direkt zurück
4. Antworte auf DEUTSCH (itemName, summary, verdict texts)

Antworte in diesem exakten JSON-Format (kein Markdown, nur rohes JSON):
{
  "identified": true,
  "itemName": "Beschreibender Name auf Deutsch",
  "categoryId": "eine der Kategorie-IDs oben",
  "confidence": "high" | "medium" | "low",
  "detectedProperties": {
    "mah": number or null,
    "voltage": number or null,
    "wh": number or null,
    "volume_ml": number or null,
    "blade_length_cm": number or null
  },
  "verdict": {
    "handBaggage": {
      "status": "allowed" | "conditional" | "not_allowed",
      "text": "Klare Erklärung auf Deutsch für den Nutzer",
      "tip": "Optional: hilfreicher Tipp auf Deutsch"
    },
    "checkedBaggage": {
      "status": "allowed" | "conditional" | "not_allowed",
      "text": "Klare Erklärung auf Deutsch",
      "tip": "Optional: hilfreicher Tipp auf Deutsch"
    }
  },
  "summary": "Kurze Beschreibung auf Deutsch, was du erkannt hast"
}

Wenn du keinen Gegenstand identifizieren kannst:
{
  "identified": false,
  "summary": "Erklärung auf Deutsch, warum nicht identifizierbar"
}

WICHTIG:
- Gib IMMER ein vollständiges verdict zurück wenn identified=true
- Der Nutzer ist ein normaler Reisender, kein Techniker – schreibe verständlich
- Bei Batterien: Lies mAh/Wh vom Etikett ab und berechne das Urteil selbst
- Bei Flüssigkeiten: Lies ml vom Etikett ab
- Bei Messern/Scheren: Schätze die Klingenlänge`;

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/analyze-image", async (req: Request, res: Response) => {
    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Image data (base64) is required" });
      }

      const base64Data = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: base64Data, detail: "high" },
              },
              {
                type: "text",
                text: "Identifiziere diesen Gegenstand, lies alle sichtbaren technischen Daten ab und gib das vollständige Urteil für die Gepäckkontrolle am Flughafen Zürich.",
              },
            ],
          },
        ],
        max_completion_tokens: 800,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content || '';
      
      let result;
      try {
        const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        result = JSON.parse(cleaned);
      } catch {
        result = { identified: false, summary: "KI-Antwort konnte nicht verarbeitet werden. Bitte wählen Sie den Gegenstand manuell aus." };
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ 
        error: "Failed to analyze image",
        message: error?.message || "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
