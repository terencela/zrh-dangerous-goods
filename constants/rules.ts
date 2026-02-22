export type QuestionType = 'select';

export interface QuestionOption {
  label: { de: string; en: string };
  value: string;
}

export interface Question {
  id: string;
  text: { de: string; en: string };
  type: QuestionType;
  options: QuestionOption[];
}

export type VerdictStatus = 'allowed' | 'conditional' | 'not_allowed';

export interface Verdict {
  handBaggage: { status: VerdictStatus; text: string; tip?: string };
  checkedBaggage: { status: VerdictStatus; text: string; tip?: string };
}

export interface ItemCategory {
  id: string;
  name: { de: string; en: string };
  group: { de: string; en: string };
  icon: string;
  questions: Question[];
  getVerdict: (answers: Record<string, string>, lang: 'de' | 'en') => Verdict;
}

export const ITEM_CATEGORIES: ItemCategory[] = [
  {
    id: 'battery_spare',
    name: { de: 'Ersatzbatterie / Powerbank', en: 'Spare Battery / Power Bank' },
    group: { de: 'Batterien & Powerbanks', en: 'Batteries & Power Banks' },
    icon: 'battery-charging',
    questions: [
      {
        id: 'size',
        text: {
          de: 'Welche Art Powerbank / Ersatzbatterie haben Sie?',
          en: 'What kind of power bank / spare battery do you have?',
        },
        type: 'select',
        options: [
          { label: { de: 'Standard (z.B. Handy-Ladegerät, kleine Powerbank)', en: 'Standard (e.g. phone charger, small power bank)' }, value: 'small' },
          { label: { de: 'Gross (z.B. Laptop-Powerbank, grosse Kapazität)', en: 'Large (e.g. laptop power bank, high capacity)' }, value: 'large' },
          { label: { de: 'Sehr gross / Industriell', en: 'Very large / Industrial' }, value: 'xlarge' },
        ],
      },
    ],
    getVerdict: (answers, lang) => {
      const size = answers.size || 'small';
      if (size === 'xlarge') {
        return {
          handBaggage: {
            status: 'not_allowed',
            text: lang === 'de' ? 'Sehr grosse Batterien (über 160 Wh) sind in allen Gepäckarten verboten.' : 'Very large batteries (over 160 Wh) are prohibited in all baggage.',
            tip: lang === 'de' ? 'Lassen Sie diesen Gegenstand zu Hause.' : 'Leave this item at home.',
          },
          checkedBaggage: {
            status: 'not_allowed',
            text: lang === 'de' ? 'Sehr grosse Batterien sind in allen Gepäckarten verboten.' : 'Very large batteries are prohibited in all baggage.',
          },
        };
      }
      if (size === 'large') {
        return {
          handBaggage: {
            status: 'conditional',
            text: lang === 'de' ? 'Grosse Powerbanks (100–160 Wh) sind im Handgepäck erlaubt. Max. 2 Stück. Genehmigung der Fluggesellschaft erforderlich. Pole müssen abgeklebt sein.' : 'Large power banks (100–160 Wh) are allowed in hand baggage. Max 2 units. Airline approval required. Terminals must be taped.',
            tip: lang === 'de' ? 'Kontaktieren Sie Ihre Fluggesellschaft vor der Reise.' : 'Contact your airline before travelling.',
          },
          checkedBaggage: {
            status: 'not_allowed',
            text: lang === 'de' ? 'Ersatzbatterien sind im aufgegebenen Gepäck nie erlaubt.' : 'Spare batteries are never allowed in checked baggage.',
            tip: lang === 'de' ? 'Muss im Handgepäck mitgeführt werden.' : 'Must be carried in hand baggage.',
          },
        };
      }
      return {
        handBaggage: {
          status: 'conditional',
          text: lang === 'de' ? 'Standard-Powerbanks (unter 100 Wh) sind im Handgepäck erlaubt. Pole müssen abgeklebt oder einzeln geschützt sein.' : 'Standard power banks (under 100 Wh) are allowed in hand baggage. Terminals must be taped or individually protected.',
        },
        checkedBaggage: {
          status: 'not_allowed',
          text: lang === 'de' ? 'Ersatzbatterien sind im aufgegebenen Gepäck nie erlaubt.' : 'Spare batteries are never allowed in checked baggage.',
          tip: lang === 'de' ? 'Muss im Handgepäck mitgeführt werden.' : 'Must be carried in hand baggage.',
        },
      };
    },
  },
  {
    id: 'battery_installed',
    name: { de: 'Batterie im Gerät verbaut', en: 'Battery Installed in Device' },
    group: { de: 'Batterien & Powerbanks', en: 'Batteries & Power Banks' },
    icon: 'smartphone',
    questions: [
      {
        id: 'device_type',
        text: {
          de: 'Was für ein Gerät ist es?',
          en: 'What kind of device is it?',
        },
        type: 'select',
        options: [
          { label: { de: 'Handy, Tablet, Kamera oder ähnlich', en: 'Phone, tablet, camera or similar' }, value: 'small' },
          { label: { de: 'Laptop oder grösseres Gerät', en: 'Laptop or larger device' }, value: 'medium' },
          { label: { de: 'Sehr grosses Gerät (E-Bike-Akku, etc.)', en: 'Very large device (e-bike battery, etc.)' }, value: 'large' },
        ],
      },
    ],
    getVerdict: (answers, lang) => {
      const type = answers.device_type || 'small';
      if (type === 'large') {
        return {
          handBaggage: {
            status: 'not_allowed',
            text: lang === 'de' ? 'Geräte mit sehr grossen Batterien (über 160 Wh) sind verboten.' : 'Devices with very large batteries (over 160 Wh) are prohibited.',
          },
          checkedBaggage: {
            status: 'not_allowed',
            text: lang === 'de' ? 'Geräte mit sehr grossen Batterien sind verboten.' : 'Devices with very large batteries are prohibited.',
          },
        };
      }
      if (type === 'medium') {
        return {
          handBaggage: {
            status: 'allowed',
            text: lang === 'de' ? 'Laptops sind im Handgepäck erlaubt. Muss bei der Sicherheitskontrolle separat in eine Schale gelegt werden.' : 'Laptops are allowed in hand baggage. Must be placed separately in a tray at security.',
          },
          checkedBaggage: {
            status: 'allowed',
            text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt. Gerät muss vollständig ausgeschaltet sein.' : 'Allowed in checked baggage. Device must be completely switched off.',
          },
        };
      }
      return {
        handBaggage: {
          status: 'allowed',
          text: lang === 'de' ? 'Handys, Tablets und Kameras sind im Handgepäck erlaubt.' : 'Phones, tablets and cameras are allowed in hand baggage.',
        },
        checkedBaggage: {
          status: 'allowed',
          text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt. Gerät muss ausgeschaltet sein.' : 'Allowed in checked baggage. Device must be switched off.',
        },
      };
    },
  },
  {
    id: 'liquids_general',
    name: { de: 'Flüssigkeiten, Gels & Aerosole', en: 'Liquids, Gels & Aerosols' },
    group: { de: 'Flüssigkeiten', en: 'Liquids' },
    icon: 'droplet',
    questions: [
      {
        id: 'container_size',
        text: {
          de: 'Ist der Behälter Reisegrösse (100 ml oder kleiner)?',
          en: 'Is the container travel-sized (100 ml or smaller)?',
        },
        type: 'select',
        options: [
          { label: { de: 'Ja, 100 ml oder kleiner', en: 'Yes, 100 ml or smaller' }, value: 'small' },
          { label: { de: 'Nein, grösser als 100 ml', en: 'No, larger than 100 ml' }, value: 'large' },
        ],
      },
      {
        id: 'liquid_type',
        text: {
          de: 'Um was für eine Flüssigkeit handelt es sich?',
          en: 'What type of liquid is it?',
        },
        type: 'select',
        options: [
          { label: { de: 'Normale Flüssigkeit (Parfüm, Shampoo, etc.)', en: 'Regular liquid (perfume, shampoo, etc.)' }, value: 'regular' },
          { label: { de: 'Medikament', en: 'Medication' }, value: 'medication' },
          { label: { de: 'Babynahrung / Spezialdiät', en: 'Baby food / Special diet' }, value: 'baby_food' },
          { label: { de: 'Duty-Free-Kauf', en: 'Duty-free purchase' }, value: 'duty_free' },
        ],
      },
    ],
    getVerdict: (answers, lang) => {
      const size = answers.container_size || 'small';
      const type = answers.liquid_type || 'regular';

      if (type === 'medication' || type === 'baby_food') {
        return {
          handBaggage: {
            status: 'allowed',
            text: lang === 'de'
              ? 'Medikamente und Babynahrung dürfen 100 ml überschreiten. Nachweis mitführen (Rezept, etc.).'
              : 'Medication and baby food may exceed 100 ml. Carry proof (prescription, etc.).',
          },
          checkedBaggage: {
            status: 'allowed',
            text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt.' : 'Allowed in checked baggage.',
          },
        };
      }
      if (type === 'duty_free' && size === 'large') {
        return {
          handBaggage: {
            status: 'conditional',
            text: lang === 'de'
              ? 'Duty-Free-Flüssigkeiten über 100 ml sind nur mit Kaufbeleg in einem versiegelten Sicherheitsbeutel erlaubt.'
              : 'Duty-free liquids over 100 ml are only allowed with receipt in a sealed security bag.',
            tip: lang === 'de' ? 'Beleg und Beutel bis zum Zielort aufbewahren.' : 'Keep receipt and sealed bag until destination.',
          },
          checkedBaggage: {
            status: 'allowed',
            text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt.' : 'Allowed in checked baggage.',
          },
        };
      }
      if (size === 'large') {
        return {
          handBaggage: {
            status: 'not_allowed',
            text: lang === 'de'
              ? 'Behälter über 100 ml sind im Handgepäck nicht erlaubt.'
              : 'Containers over 100 ml are not allowed in hand baggage.',
            tip: lang === 'de' ? 'In einen kleineren Behälter umfüllen oder im aufgegebenen Gepäck verpacken.' : 'Transfer to a smaller container or pack in checked baggage.',
          },
          checkedBaggage: {
            status: 'allowed',
            text: lang === 'de' ? 'Im aufgegebenen Gepäck ohne Grössenbeschränkung erlaubt.' : 'Allowed in checked baggage without size restriction.',
          },
        };
      }
      return {
        handBaggage: {
          status: 'conditional',
          text: lang === 'de'
            ? 'Im Handgepäck erlaubt. Muss in einem transparenten, wiederverschliessbaren Plastikbeutel (max. 1 Liter) verpackt sein.'
            : 'Allowed in hand baggage. Must be packed in a transparent, resealable plastic bag (max 1 litre).',
        },
        checkedBaggage: {
          status: 'allowed',
          text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt.' : 'Allowed in checked baggage.',
        },
      };
    },
  },
  {
    id: 'knife',
    name: { de: 'Messer', en: 'Knife' },
    group: { de: 'Scharfe Gegenstände', en: 'Sharp Objects' },
    icon: 'minus',
    questions: [
      {
        id: 'blade_size',
        text: {
          de: 'Ist die Klinge kürzer als 6 cm?',
          en: 'Is the blade shorter than 6 cm?',
        },
        type: 'select',
        options: [
          { label: { de: 'Ja, kürzer als 6 cm', en: 'Yes, shorter than 6 cm' }, value: 'short' },
          { label: { de: 'Nein, 6 cm oder länger', en: 'No, 6 cm or longer' }, value: 'long' },
        ],
      },
    ],
    getVerdict: (answers, lang) => {
      if (answers.blade_size === 'long') {
        return {
          handBaggage: {
            status: 'not_allowed',
            text: lang === 'de' ? 'Messer mit Klingen ab 6 cm sind im Handgepäck verboten.' : 'Knives with blades 6 cm or longer are prohibited in hand baggage.',
            tip: lang === 'de' ? 'Im aufgegebenen Gepäck verpacken.' : 'Pack in checked baggage.',
          },
          checkedBaggage: {
            status: 'allowed',
            text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt.' : 'Allowed in checked baggage.',
          },
        };
      }
      return {
        handBaggage: {
          status: 'allowed',
          text: lang === 'de' ? 'Messer mit Klingen unter 6 cm sind im Handgepäck erlaubt.' : 'Knives with blades under 6 cm are allowed in hand baggage.',
        },
        checkedBaggage: {
          status: 'allowed',
          text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt.' : 'Allowed in checked baggage.',
        },
      };
    },
  },
  {
    id: 'scissors',
    name: { de: 'Schere', en: 'Scissors' },
    group: { de: 'Scharfe Gegenstände', en: 'Sharp Objects' },
    icon: 'scissors',
    questions: [
      {
        id: 'blade_size',
        text: {
          de: 'Ist die Klinge kürzer als 6 cm?',
          en: 'Is the blade shorter than 6 cm?',
        },
        type: 'select',
        options: [
          { label: { de: 'Ja, kürzer als 6 cm (z.B. Nagelschere)', en: 'Yes, shorter than 6 cm (e.g. nail scissors)' }, value: 'short' },
          { label: { de: 'Nein, 6 cm oder länger', en: 'No, 6 cm or longer' }, value: 'long' },
        ],
      },
    ],
    getVerdict: (answers, lang) => {
      if (answers.blade_size === 'long') {
        return {
          handBaggage: {
            status: 'not_allowed',
            text: lang === 'de' ? 'Scheren mit Klingen ab 6 cm sind im Handgepäck verboten.' : 'Scissors with blades 6 cm or longer are prohibited in hand baggage.',
            tip: lang === 'de' ? 'Im aufgegebenen Gepäck verpacken.' : 'Pack in checked baggage.',
          },
          checkedBaggage: {
            status: 'allowed',
            text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt.' : 'Allowed in checked baggage.',
          },
        };
      }
      return {
        handBaggage: {
          status: 'allowed',
          text: lang === 'de' ? 'Kleine Scheren (unter 6 cm) sind im Handgepäck erlaubt.' : 'Small scissors (under 6 cm) are allowed in hand baggage.',
        },
        checkedBaggage: {
          status: 'allowed',
          text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt.' : 'Allowed in checked baggage.',
        },
      };
    },
  },
  {
    id: 'tools',
    name: { de: 'Werkzeuge (Schraubenzieher, etc.)', en: 'Tools (screwdrivers, etc.)' },
    group: { de: 'Scharfe Gegenstände', en: 'Sharp Objects' },
    icon: 'tool',
    questions: [
      {
        id: 'tool_size',
        text: {
          de: 'Ist das Werkzeug kürzer als 6 cm?',
          en: 'Is the tool shorter than 6 cm?',
        },
        type: 'select',
        options: [
          { label: { de: 'Ja, kürzer als 6 cm', en: 'Yes, shorter than 6 cm' }, value: 'short' },
          { label: { de: 'Nein, 6 cm oder länger', en: 'No, 6 cm or longer' }, value: 'long' },
        ],
      },
    ],
    getVerdict: (answers, lang) => {
      if (answers.tool_size === 'long') {
        return {
          handBaggage: {
            status: 'not_allowed',
            text: lang === 'de' ? 'Werkzeuge ab 6 cm Länge sind im Handgepäck nicht erlaubt.' : 'Tools 6 cm or longer are not allowed in hand baggage.',
            tip: lang === 'de' ? 'Im aufgegebenen Gepäck verpacken.' : 'Pack in checked baggage.',
          },
          checkedBaggage: {
            status: 'allowed',
            text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt.' : 'Allowed in checked baggage.',
          },
        };
      }
      return {
        handBaggage: {
          status: 'allowed',
          text: lang === 'de' ? 'Kleine Werkzeuge (unter 6 cm) sind im Handgepäck erlaubt.' : 'Small tools (under 6 cm) are allowed in hand baggage.',
        },
        checkedBaggage: {
          status: 'allowed',
          text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt.' : 'Allowed in checked baggage.',
        },
      };
    },
  },
  {
    id: 'lighter',
    name: { de: 'Feuerzeug', en: 'Lighter' },
    group: { de: 'Feuer & Brennbar', en: 'Fire & Flammable' },
    icon: 'zap',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Feuerzeuge sind im Handgepäck verboten.' : 'Lighters are prohibited in hand baggage.',
        tip: lang === 'de' ? 'Sie dürfen ein Feuerzeug am Körper tragen (z.B. in der Hosentasche).' : 'You may carry one lighter on your person (e.g. in your pocket).',
      },
      checkedBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Feuerzeuge sind im aufgegebenen Gepäck verboten. Sie dürfen EIN Feuerzeug am Körper tragen.' : 'Lighters are prohibited in checked baggage. You may carry ONE lighter on your person.',
      },
    }),
  },
  {
    id: 'matches',
    name: { de: 'Streichhölzer', en: 'Matches' },
    group: { de: 'Feuer & Brennbar', en: 'Fire & Flammable' },
    icon: 'zap',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Streichhölzer sind im Handgepäck verboten.' : 'Matches are prohibited in hand baggage.',
        tip: lang === 'de' ? 'Sie dürfen eine Schachtel Streichhölzer am Körper tragen.' : 'You may carry one box of matches on your person.',
      },
      checkedBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Streichhölzer sind im aufgegebenen Gepäck verboten.' : 'Matches are prohibited in checked baggage.',
      },
    }),
  },
  {
    id: 'e_cigarette',
    name: { de: 'E-Zigarette / Vape', en: 'E-Cigarette / Vape' },
    group: { de: 'Elektronik', en: 'Electronics' },
    icon: 'wind',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'allowed',
        text: lang === 'de' ? 'E-Zigaretten und Vapes sind nur im Handgepäck erlaubt.' : 'E-cigarettes and vapes are only allowed in hand baggage.',
      },
      checkedBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Im aufgegebenen Gepäck wegen Brandgefahr nie erlaubt.' : 'Never allowed in checked baggage due to fire risk.',
        tip: lang === 'de' ? 'Immer im Handgepäck mitführen.' : 'Always carry in hand baggage.',
      },
    }),
  },
  {
    id: 'electronics',
    name: { de: 'Laptop / Tablet / Handy / Kamera', en: 'Laptop / Tablet / Phone / Camera' },
    group: { de: 'Elektronik', en: 'Electronics' },
    icon: 'monitor',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'allowed',
        text: lang === 'de' ? 'Elektronische Geräte sind erlaubt. Bei der Sicherheitskontrolle separat in eine Schale legen.' : 'Electronic devices are allowed. Place separately in a tray at security.',
      },
      checkedBaggage: {
        status: 'allowed',
        text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt. Gerät muss vollständig ausgeschaltet sein.' : 'Allowed in checked baggage. Device must be completely switched off.',
      },
    }),
  },
  {
    id: 'smart_luggage_removable',
    name: { de: 'Smart Luggage (Akku herausnehmbar)', en: 'Smart Luggage (removable battery)' },
    group: { de: 'Elektronik', en: 'Electronics' },
    icon: 'briefcase',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'allowed',
        text: lang === 'de' ? 'Smart Luggage als Handgepäck erlaubt.' : 'Smart luggage allowed as hand baggage.',
      },
      checkedBaggage: {
        status: 'conditional',
        text: lang === 'de'
          ? 'Der Akku muss entfernt und im Handgepäck mitgeführt werden. Pole abkleben.'
          : 'Battery must be removed and carried in hand baggage. Tape the terminals.',
        tip: lang === 'de' ? 'Akku vor dem Einchecken entfernen.' : 'Remove battery before check-in.',
      },
    }),
  },
  {
    id: 'smart_luggage_fixed',
    name: { de: 'Smart Luggage (Akku fest verbaut)', en: 'Smart Luggage (built-in battery)' },
    group: { de: 'Elektronik', en: 'Electronics' },
    icon: 'briefcase',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Smart Luggage mit fest verbauter Batterie ist nicht erlaubt.' : 'Smart luggage with a built-in battery is not allowed.',
        tip: lang === 'de' ? 'Verwenden Sie Gepäck mit herausnehmbarem Akku.' : 'Use luggage with a removable battery.',
      },
      checkedBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Smart Luggage mit fest verbauter Batterie ist nicht erlaubt.' : 'Smart luggage with a built-in battery is not allowed.',
      },
    }),
  },
  {
    id: 'luggage_tracker',
    name: { de: 'Gepäcktracker (AirTag, etc.)', en: 'Luggage Tracker (AirTag, etc.)' },
    group: { de: 'Elektronik', en: 'Electronics' },
    icon: 'map-pin',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'allowed',
        text: lang === 'de' ? 'Gepäcktracker sind im Handgepäck erlaubt.' : 'Luggage trackers are allowed in hand baggage.',
      },
      checkedBaggage: {
        status: 'allowed',
        text: lang === 'de' ? 'Gepäcktracker sind im aufgegebenen Gepäck erlaubt.' : 'Luggage trackers are allowed in checked baggage.',
      },
    }),
  },
  {
    id: 'blunt_objects',
    name: { de: 'Stumpfe Gegenstände (Schläger, Hämmer)', en: 'Blunt Objects (bats, hammers)' },
    group: { de: 'Sport & Stumpfe Gegenstände', en: 'Sports & Blunt Objects' },
    icon: 'target',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Schläger, Hämmer und ähnliche stumpfe Gegenstände sind im Handgepäck verboten.' : 'Bats, hammers and similar blunt objects are prohibited in hand baggage.',
        tip: lang === 'de' ? 'Im aufgegebenen Gepäck verpacken.' : 'Pack in checked baggage.',
      },
      checkedBaggage: {
        status: 'allowed',
        text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt.' : 'Allowed in checked baggage.',
      },
    }),
  },
  {
    id: 'sports_equipment',
    name: { de: 'Sportausrüstung (Schläger, Stöcke)', en: 'Sports Equipment (rackets, poles)' },
    group: { de: 'Sport & Stumpfe Gegenstände', en: 'Sports & Blunt Objects' },
    icon: 'activity',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Sportausrüstung ist im Handgepäck nicht erlaubt.' : 'Sports equipment is not allowed in hand baggage.',
        tip: lang === 'de' ? 'Im aufgegebenen Gepäck verpacken.' : 'Pack in checked baggage.',
      },
      checkedBaggage: {
        status: 'allowed',
        text: lang === 'de' ? 'Im aufgegebenen Gepäck erlaubt. Grössen-/Gewichtslimits der Fluggesellschaft beachten.' : 'Allowed in checked baggage. Check airline size/weight limits.',
      },
    }),
  },
  {
    id: 'fireworks',
    name: { de: 'Feuerwerk / Wunderkerzen', en: 'Fireworks / Sparklers' },
    group: { de: 'Verboten', en: 'Prohibited' },
    icon: 'alert-triangle',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Feuerwerk ist in allen Gepäckarten verboten.' : 'Fireworks are prohibited in all baggage.',
        tip: lang === 'de' ? 'Darf nicht per Flugzeug transportiert werden.' : 'Cannot be transported by air.',
      },
      checkedBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Feuerwerk ist in allen Gepäckarten verboten.' : 'Fireworks are prohibited in all baggage.',
      },
    }),
  },
  {
    id: 'fuel_paste',
    name: { de: 'Brennpasten / Brennbare Flüssigkeiten', en: 'Fuel Paste / Flammable Liquids' },
    group: { de: 'Verboten', en: 'Prohibited' },
    icon: 'alert-triangle',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Brennpasten und brennbare Flüssigkeiten sind verboten.' : 'Fuel paste and flammable liquids are prohibited.',
      },
      checkedBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'In allen Gepäckarten verboten.' : 'Prohibited in all baggage.',
      },
    }),
  },
  {
    id: 'toxic_corrosive',
    name: { de: 'Säuren / Giftige / Ätzende Stoffe', en: 'Acids / Toxic / Corrosive Substances' },
    group: { de: 'Verboten', en: 'Prohibited' },
    icon: 'alert-triangle',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Giftige und ätzende Stoffe sind verboten.' : 'Toxic and corrosive substances are prohibited.',
      },
      checkedBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'In allen Gepäckarten verboten.' : 'Prohibited in all baggage.',
      },
    }),
  },
  {
    id: 'gas_cartridges',
    name: { de: 'Gaskartuschen / Druckgas', en: 'Gas Cartridges / Compressed Gas' },
    group: { de: 'Verboten', en: 'Prohibited' },
    icon: 'alert-triangle',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Gaskartuschen und Druckgas sind verboten.' : 'Gas cartridges and compressed gas are prohibited.',
      },
      checkedBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'In allen Gepäckarten verboten.' : 'Prohibited in all baggage.',
      },
    }),
  },
  {
    id: 'paints',
    name: { de: 'Farben / Lösungsmittel', en: 'Paints / Solvents' },
    group: { de: 'Verboten', en: 'Prohibited' },
    icon: 'alert-triangle',
    questions: [],
    getVerdict: (_answers, lang) => ({
      handBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'Farben und Lösungsmittel sind verboten.' : 'Paints and solvents are prohibited.',
      },
      checkedBaggage: {
        status: 'not_allowed',
        text: lang === 'de' ? 'In allen Gepäckarten verboten.' : 'Prohibited in all baggage.',
      },
    }),
  },
];

export const GROUPS_DE = [...new Set(ITEM_CATEGORIES.map(c => c.group.de))];
export const GROUPS_EN = [...new Set(ITEM_CATEGORIES.map(c => c.group.en))];
export function getGroups(lang: 'de' | 'en') {
  return [...new Set(ITEM_CATEGORIES.map(c => c.group[lang]))];
}
