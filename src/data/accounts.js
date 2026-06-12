// 12 accounts from the Pulse 2.0 spreadsheet (including parent-child).
// Each account carries mock location info used by the Home Info tab:
//   • address           — physical/main address
//   • shippingAddress   — where replacement devices ship to (may differ)
//   • contacts          — list of { name, email, phone }. NO role per PRD.
//   • notes             — freeform operator/site notes (can be multi-line)
// In a real product these would live at the location level (per L4 building),
// not at the account level. Account-level is a stand-in for the mockup.
export const ACCOUNTS = [
  { id: 'sc', name: 'Suffolk Construction', shortName: 'Suffolk', industry: 'Construction & Property', color: '#04ADEF', parentId: null,
    address: '65 Allerton Street, Boston, MA 02119, USA',
    shippingAddress: '12 Logistics Way, Quincy, MA 02169, USA',
    contacts: [
      { name: 'Michael Tan',  email: 'm.tan@suffolk.com',  phone: '+1 617 555 0144' },
      { name: 'Yara Saleh',   email: 'y.saleh@suffolk.com', phone: '+1 617 555 0178' },
    ],
    notes: 'Primary site contact is Michael Tan. After-hours route through site office. Service vehicle access via Gate 4 only.',
  },
  { id: 'ha', name: 'Heathrow Airport Authority', shortName: 'Heathrow', industry: 'Aviation & Infrastructure', color: '#7C3AED', parentId: null,
    address: 'The Compass Centre, Nelson Road, Hounslow TW6 2GW, UK',
    shippingAddress: 'Heathrow Logistics Hub, Bedfont Road, Feltham TW14 8RF, UK',
    contacts: [
      { name: 'Rachel Adams',   email: 'r.adams@heathrow.com',  phone: '+44 20 8745 0001' },
      { name: 'Charlie Cole',   email: 'c.cole@heathrow.com',   phone: '+44 20 8745 0042' },
    ],
    notes: 'Airside escort required for terminal-side visits. Coordinate with airside ops 24 h ahead.',
  },
  { id: 'sg', name: 'Société Générale', shortName: 'SocGen', industry: 'Financial Services', color: '#DB4670', parentId: null,
    address: '29 Boulevard Haussmann, 75009 Paris, France',
    shippingAddress: 'SG Logistique, 17 Rue de la Banque, 92800 Puteaux, France',
    contacts: [{ name: 'Stéphane Wattier', email: 's.wattier@socgen.com', phone: '+33 1 42 14 20 00' }],
    notes: '',
  },
  { id: 'kr', name: 'Klépierre Retail', shortName: 'Klépierre', industry: 'Retail & Shopping Centres', color: '#F05C25', parentId: null,
    address: '26 Boulevard des Capucines, 75009 Paris, France',
    shippingAddress: '',
    contacts: [{ name: 'Camille Dubois', email: 'c.dubois@klepierre.com', phone: '+33 1 40 67 57 40' }],
    notes: '',
  },
  { id: 'az', name: 'Azure Tech Campuses', shortName: 'Azure', industry: 'Technology & Data Centres', color: '#A1D246', parentId: null,
    address: '1 Innovation Drive, Reading RG6 1WG, UK',
    shippingAddress: '1 Innovation Drive, Reading RG6 1WG, UK',
    contacts: [
      { name: 'Priya Shah',   email: 'priya.shah@azuretc.com',   phone: '+44 118 555 9911' },
      { name: 'Tom Marshall', email: 'tom.marshall@azuretc.com', phone: '+44 118 555 9912' },
    ],
    notes: 'Data hall access requires badge + biometric. Visitor badges issued at the gatehouse.',
  },

  // CBRE parent-child
  { id: 'cbre', name: 'CBRE Group Inc.', shortName: 'CBRE', industry: 'Property Management', color: '#006340', parentId: null,
    address: '2100 McKinney Avenue, Dallas, TX 75201, USA',
    shippingAddress: '',
    contacts: [{ name: 'Helen Park', email: 'helen.park@cbre.com', phone: '+1 214 555 0102' }],
    notes: '',
  },
  { id: 'cbre_il', name: 'CBRE Israel', shortName: 'CBRE Israel', industry: 'Property Management', color: '#006340', parentId: 'cbre',
    address: 'HaArbaʼa 28, Tel Aviv-Yafo, Israel',
    shippingAddress: '',
    contacts: [{ name: 'Daniel Levin', email: 'd.levin@cbre.co.il', phone: '+972 3 555 0100' }],
    notes: '',
  },
  { id: 'cbre_uk', name: 'CBRE UK', shortName: 'CBRE UK', industry: 'Property Management', color: '#006340', parentId: 'cbre',
    address: 'Henrietta House, Henrietta Place, London W1G 0NB, UK',
    shippingAddress: '',
    contacts: [{ name: 'Amelia Clarke', email: 'a.clarke@cbre.co.uk', phone: '+44 20 7182 2000' }],
    notes: '',
  },

  // Tidhar
  { id: 'tidhar', name: 'Tidhar Construction Group', shortName: 'Tidhar', industry: 'Residential Construction', color: '#8B5CF6', parentId: null,
    address: 'HaMelacha 15, Rosh HaʼAyin, 4809222, Israel',
    shippingAddress: 'HaMelacha 19, Rosh HaʼAyin, 4809222, Israel',
    contacts: [
      { name: 'James Lee',     email: 'james.lee@tidhar.co.il',     phone: '+972 3 776 1010' },
      { name: 'Maya Tal',      email: 'maya.tal@tidhar.co.il',      phone: '+972 3 776 1011' },
      { name: 'Yossi Shapira', email: 'yossi.shapira@tidhar.co.il', phone: '+972 3 776 1012' },
    ],
    notes: 'Out-of-hours emergency line: +972 3 776 1099. Service visits booked through the site manager only.',
  },

  // Bank Leumi
  { id: 'leumi', name: 'Bank Leumi Le-Israel', shortName: 'Bank Leumi', industry: 'Financial Services', color: '#1D4ED8', parentId: null,
    address: 'Yehuda Halevi 34, Tel Aviv-Yafo, 6513615, Israel',
    shippingAddress: '',
    contacts: [{ name: 'Ronen Avraham', email: 'ronen.avraham@leumi.co.il', phone: '+972 76 885 0000' }],
    notes: '',
  },

  // Aldar Properties
  { id: 'aldar', name: 'Aldar Properties PJSC', shortName: 'Aldar', industry: 'Real Estate', color: '#B45309', parentId: null,
    address: 'HQ Building, Al Raha Beach, Abu Dhabi, UAE',
    shippingAddress: '',
    contacts: [{ name: 'Khalid Al Mansoori', email: 'k.almansoori@aldar.com', phone: '+971 2 810 5555' }],
    notes: '',
  },

  // Weizmann Institute
  { id: 'weizmann', name: 'Weizmann Institute of Science', shortName: 'Weizmann', industry: 'Research & Education', color: '#7C3AED', parentId: null,
    address: '234 Herzl St, Rehovot 7610001, Israel',
    shippingAddress: '',
    contacts: [{ name: 'Dr. Avi Cohen', email: 'avi.cohen@weizmann.ac.il', phone: '+972 8 934 3111' }],
    notes: '',
  },
];

export function getAccountById(id) {
  return ACCOUNTS.find(a => a.id === id);
}

export function getChildAccounts(parentId) {
  return ACCOUNTS.filter(a => a.parentId === parentId);
}

export function getRootAccounts() {
  return ACCOUNTS.filter(a => a.parentId === null);
}
