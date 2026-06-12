// Location hierarchy: Account > L1 (Country) > L2 (Region) > L3 (City) > L4 (Building) > Systems

export const ACCOUNT_HIERARCHIES = {
  // ─── Suffolk Construction ───────────────────────────────────────────────────
  'sc': [
    {
      id: 'sc-uk', name: 'United Kingdom', type: 'level1', levelType: 'Country',
      children: [
        {
          id: 'sc-nwe', name: 'NW England', type: 'level2', levelType: 'Region',
          children: [
            {
              id: 'sc-manchester', name: 'Manchester', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'sc-towerone', name: 'Tower One', type: 'level4', levelType: 'Building',
                  children: [
                    { id: 'ct1', name: 'Cooling Tower #1', type: 'system' },
                    { id: 'ct2', name: 'Cooling Tower #2', type: 'system' },
                    { id: 'msl', name: 'Main Supply Line', type: 'system' },
                    { id: 'dcw', name: 'DCW Floors 1\u201318', type: 'system' },
                    { id: 'dhw1', name: 'DHW Floors 1\u201318', type: 'system' },
                  ],
                },
                {
                  id: 'sc-parking', name: 'Parking Level B1', type: 'level4', levelType: 'Floor',
                  children: [
                    { id: 'sp', name: 'Sump Pump B1', type: 'system' },
                  ],
                },
              ],
            },
            {
              id: 'sc-liverpool', name: 'Liverpool', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'sc-hqbuilding', name: 'HQ Building', type: 'level4', levelType: 'Building',
                  children: [
                    { id: 'mshq', name: 'Main Supply HQ', type: 'system' },
                    { id: 'dhwhq', name: 'DHW Ground Floor', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'sc-see', name: 'SE England', type: 'level2', levelType: 'Region',
          children: [
            {
              id: 'sc-london', name: 'London', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'sc-canarywharf', name: 'Canary Wharf', type: 'level4', levelType: 'Building',
                  children: [
                    { id: 'mscw', name: 'Main Supply CW', type: 'system' },
                    { id: 'ctcw', name: 'Cooling Tower CW', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'sc-de', name: 'Germany', type: 'level1', levelType: 'Country',
      children: [
        {
          id: 'sc-bavaria', name: 'Bavaria', type: 'level2', levelType: 'Region',
          children: [
            {
              id: 'sc-munich', name: 'Munich', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'sc-munichoffice', name: 'Munich Office', type: 'level4', levelType: 'Building',
                  children: [
                    { id: 'msm', name: 'Main Supply Munich', type: 'system' },
                    { id: 'br1', name: 'Boiler Room #1', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ─── Heathrow Airport Authority ─────────────────────────────────────────────
  'ha': [
    {
      id: 'ha-uk', name: 'United Kingdom', type: 'level1', levelType: 'Country',
      children: [
        {
          id: 'ha-hwl', name: 'Heathrow & West London', type: 'level2', levelType: 'Area',
          children: [
            {
              id: 'ha-heathrow', name: 'Heathrow Airport', type: 'level3', levelType: 'Airport',
              children: [
                {
                  id: 'ha-terminal2', name: 'Terminal 2', type: 'level4', levelType: 'Terminal',
                  children: [
                    { id: 'mst2', name: 'Main Supply T2', type: 'system' },
                    { id: 'ctt2', name: 'Cooling Tower T2', type: 'system' },
                    { id: 'dhwt2', name: 'DHW Staff Areas T2', type: 'system' },
                  ],
                },
                {
                  id: 'ha-terminal5', name: 'Terminal 5', type: 'level4', levelType: 'Terminal',
                  children: [
                    { id: 'mst5', name: 'Main Supply T5', type: 'system' },
                    { id: 'ctt5', name: 'Cooling Tower T5', type: 'system' },
                    { id: 'bht5', name: 'Baggage Hall Supply', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ─── Soci\u00e9t\u00e9 G\u00e9n\u00e9rale ──────────────────────────────────────────────────────
  'sg': [
    {
      id: 'sg-fr', name: 'France', type: 'level1', levelType: 'Country',
      children: [
        {
          id: 'sg-idf', name: '\u00cele-de-France', type: 'level2', levelType: 'Region',
          children: [
            {
              id: 'sg-ladefense', name: 'La D\u00e9fense', type: 'level3', levelType: 'Business District',
              children: [
                {
                  id: 'sg-sgtowera', name: 'SG Tower A', type: 'level4', levelType: 'Tower',
                  children: [
                    { id: 'msta', name: 'Main Supply Tower A', type: 'system' },
                    { id: 'cpta', name: 'Chiller Plant Tower A', type: 'system' },
                    { id: 'f1a', name: 'Floor 1 \u2014 DCW/DHW', type: 'system' },
                    { id: 'f2a', name: 'Floor 2 \u2014 DCW/DHW', type: 'system' },
                    { id: 'f3a', name: 'Floor 3 \u2014 DCW/DHW', type: 'system' },
                    { id: 'f4a', name: 'Floor 4 \u2014 DCW/DHW', type: 'system' },
                    { id: 'f5a', name: 'Floor 5 \u2014 DCW/DHW', type: 'system' },
                    { id: 'f6a', name: 'Floor 6 \u2014 DCW/DHW', type: 'system' },
                    { id: 'f7a', name: 'Floor 7 \u2014 DCW/DHW', type: 'system' },
                    { id: 'f8a', name: 'Floor 8 \u2014 DCW/DHW', type: 'system' },
                    { id: 'f9a', name: 'Floor 9 \u2014 DCW/DHW', type: 'system' },
                    { id: 'f10a', name: 'Floor 10 \u2014 DCW/DHW', type: 'system' },
                    { id: 'f11a', name: 'Floor 11 \u2014 DCW/DHW', type: 'system' },
                    ...Array.from({ length: 17 }, (_, i) => ({ id: `f${i + 12}a`, name: `Floor ${i + 12} \u2014 DCW/DHW`, type: 'system' })),
                  ],
                },
                {
                  id: 'sg-sgtowerb', name: 'SG Tower B', type: 'level4', levelType: 'Tower',
                  children: [
                    { id: 'mstb', name: 'Main Supply Tower B', type: 'system' },
                    { id: 'ctb', name: 'Cooling Tower B', type: 'system' },
                    { id: 'dhwb', name: 'DHW Floors 1\u20138', type: 'system' },
                    { id: 'spb', name: 'Sump Pump B1', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ─── Kl\u00e9pierre Retail ──────────────────────────────────────────────────────
  'kr': [
    {
      id: 'kr-fr', name: 'France', type: 'level1', levelType: 'Country',
      children: [
        {
          id: 'kr-idf', name: '\u00cele-de-France', type: 'level2', levelType: 'Region',
          children: [
            {
              id: 'kr-paris', name: 'Paris', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'kr-forumdeshalles', name: 'Forum des Halles', type: 'level4', levelType: 'Mall',
                  children: [
                    { id: 'msf', name: 'Main Supply Forum', type: 'system' },
                    { id: 'csf', name: 'Cooling System Forum', type: 'system' },
                    { id: 'fsf', name: 'Fire Suppression Main', type: 'system' },
                  ],
                },
              ],
            },
            {
              id: 'kr-yvelines', name: 'Yvelines', type: 'level3', levelType: 'Area',
              children: [
                {
                  id: 'kr-velizy2', name: 'V\u00e9lizy 2', type: 'level4', levelType: 'Mall',
                  children: [
                    { id: 'msv', name: 'Main Supply V\u00e9lizy', type: 'system' },
                    { id: 'csv', name: 'Cooling System V\u00e9lizy', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ─── Azure Tech Campuses ────────────────────────────────────────────────────
  'az': [
    {
      id: 'az-nl', name: 'Netherlands', type: 'level1', levelType: 'Country',
      children: [
        {
          id: 'az-nh', name: 'North Holland', type: 'level2', levelType: 'Province',
          children: [
            {
              id: 'az-amsterdam', name: 'Amsterdam', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'az-azureamsterdam', name: 'Azure Amsterdam', type: 'level4', levelType: 'Campus',
                  children: [
                    { id: 'msa', name: 'Main Supply Amsterdam', type: 'system' },
                    { id: 'shc', name: 'Server Hall Cooling', type: 'system' },
                    { id: 'dhwa', name: 'DHW Staff Block', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'az-ie', name: 'Ireland', type: 'level1', levelType: 'Country',
      children: [
        {
          id: 'az-leinster', name: 'Leinster', type: 'level2', levelType: 'Province',
          children: [
            {
              id: 'az-dublin', name: 'Dublin', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'az-azuredublin', name: 'Azure Dublin', type: 'level4', levelType: 'Campus',
                  children: [
                    { id: 'msd', name: 'Main Supply Dublin', type: 'system' },
                    { id: 'shd', name: 'Server Hall Cooling Dublin', type: 'system' },
                    { id: 'ctd', name: 'Cooling Tower Dublin', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ─── CBRE Israel ──────────────────────────────────────────────────────────
  'cbre_il': [
    {
      id: 'cbre_il-il', name: 'Israel', type: 'level1', levelType: 'Country',
      children: [
        {
          id: 'cbre_il-central', name: 'Central', type: 'level2', levelType: 'Region',
          children: [
            {
              id: 'cbre_il-herzliya', name: 'Herzliya', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'cbre_il-herzliya_campus_a', name: 'Herzliya Campus A', type: 'level4', levelType: 'Building',
                  children: [
                    { id: 'cbre_il_hz_ms', name: 'Main Supply', type: 'system' },
                    { id: 'cbre_il_hz_ct', name: 'Cooling Tower', type: 'system' },
                    { id: 'cbre_il_hz_dhw', name: 'DHW Building A', type: 'system' },
                    { id: 'cbre_il_hz_fr', name: 'Fire Riser', type: 'system' },
                  ],
                },
              ],
            },
            {
              id: 'cbre_il-ramat_gan', name: 'Ramat Gan', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'cbre_il-ramat_gan_tower', name: 'Ramat Gan Tower', type: 'level4', levelType: 'Building',
                  children: [
                    { id: 'cbre_il_rg_ms', name: 'Main Supply', type: 'system' },
                    { id: 'cbre_il_rg_ct', name: 'Cooling Tower', type: 'system' },
                    { id: 'cbre_il_rg_dhw', name: 'DHW Floors 1-10', type: 'system' },
                    { id: 'cbre_il_rg_hvac', name: 'HVAC North Wing', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ─── CBRE UK ─────────────────────────────────────────────────────────────
  'cbre_uk': [
    {
      id: 'cbre_uk-gb', name: 'United Kingdom', type: 'level1', levelType: 'Country',
      children: [
        {
          id: 'cbre_uk-england', name: 'England', type: 'level2', levelType: 'Region',
          children: [
            {
              id: 'cbre_uk-london', name: 'London', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'cbre_uk-henrietta_house', name: 'Henrietta House', type: 'level4', levelType: 'Building',
                  children: [
                    { id: 'cbre_uk_ln_ms', name: 'Main Supply', type: 'system' },
                    { id: 'cbre_uk_ln_ct', name: 'Cooling Tower', type: 'system' },
                    { id: 'cbre_uk_ln_dhw', name: 'DHW', type: 'system' },
                  ],
                },
              ],
            },
            {
              id: 'cbre_uk-manchester', name: 'Manchester', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'cbre_uk-manchester_exchange', name: 'Manchester Exchange', type: 'level4', levelType: 'Building',
                  children: [
                    { id: 'cbre_uk_mc_ms', name: 'Main Supply', type: 'system' },
                    { id: 'cbre_uk_mc_ct', name: 'Cooling Tower', type: 'system' },
                    { id: 'cbre_uk_mc_fs', name: 'Fire Suppression', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ─── Tidhar (3-level hierarchy — systems under L3 directly) ──────────────
  'tidhar': [
    {
      id: 'tidhar-il', name: 'Israel', type: 'level1', levelType: 'Country',
      children: [
        {
          id: 'tidhar-central', name: 'Central District', type: 'level2', levelType: 'District',
          children: [
            {
              id: 'tidhar-petah_tikva', name: 'Petah Tikva', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'tidhar_towers', name: 'Tidhar Towers', type: 'level4', levelType: 'Building',
                  children: Array.from({ length: 200 }, (_, i) => ({
                    id: `tidhar_apt_${i + 1}`, name: `Apt ${i + 1}`, type: 'system',
                  })),
                },
              ],
            },
            {
              id: 'tidhar-netanya', name: 'Netanya', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'tidhar_sea_view', name: 'Tidhar Sea View', type: 'level4', levelType: 'Building',
                  children: [
                    { id: 'dl_apt_sea_view', name: 'Sea View Apt', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ─── Bank Leumi ──────────────────────────────────────────────────────────
  'leumi': [
    {
      id: 'leumi-il', name: 'Israel', type: 'level1', levelType: 'Country',
      children: [
        {
          id: 'leumi-tlv_district', name: 'Tel Aviv District', type: 'level2', levelType: 'District',
          children: [
            {
              id: 'leumi-tel_aviv', name: 'Tel Aviv', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'leumi-hq_yehuda_halevi', name: 'HQ Yehuda Halevi St.', type: 'level4', levelType: 'Building',
                  children: [
                    { id: 'leumi_ms', name: 'Main Supply', type: 'system' },
                    { id: 'leumi_ct', name: 'Cooling Tower', type: 'system' },
                    { id: 'leumi_dhw', name: 'DHW Floors 1-8', type: 'system' },
                    { id: 'leumi_fs', name: 'Fire Suppression', type: 'system' },
                  ],
                },
                {
                  id: 'leumi_residential', name: 'Leumi Tower Residences', type: 'level4', levelType: 'Building',
                  children: [
                    { id: 'dl_apt_leumi_tower', name: 'Apt 8B \u2014 Leumi Tower', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ─── Aldar Properties ────────────────────────────────────────────────────
  'aldar': [
    {
      id: 'aldar-ae', name: 'United Arab Emirates', type: 'level1', levelType: 'Country',
      children: [
        {
          id: 'aldar-abu_dhabi', name: 'Abu Dhabi', type: 'level2', levelType: 'Emirate',
          children: [
            {
              id: 'aldar-yas_island', name: 'Yas Island', type: 'level3', levelType: 'Area',
              children: [
                {
                  id: 'aldar-yas_tower', name: 'Yas Tower', type: 'level4', levelType: 'Building',
                  children: [
                    { id: 'aldar_ms', name: 'Main Supply', type: 'system' },
                    { id: 'aldar_ct', name: 'Cooling Tower', type: 'system' },
                    { id: 'aldar_dhw', name: 'DHW', type: 'system' },
                    { id: 'aldar_hvac', name: 'HVAC Central', type: 'system' },
                    { id: 'aldar_irr', name: 'Irrigation', type: 'system' },
                  ],
                },
                {
                  id: 'yas_acres', name: 'Yas Acres', type: 'level4', levelType: 'Building',
                  children: [
                    { id: 'dl_apt_aldar_yas', name: 'Villa 23 \u2014 Yas Island', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],

  // ─── Weizmann Institute ──────────────────────────────────────────────────
  'weizmann': [
    {
      id: 'weizmann-il', name: 'Israel', type: 'level1', levelType: 'Country',
      children: [
        {
          id: 'weizmann-central_district', name: 'Central District', type: 'level2', levelType: 'District',
          children: [
            {
              id: 'weizmann-rehovot', name: 'Rehovot', type: 'level3', levelType: 'City',
              children: [
                {
                  id: 'weizmann-weizmann_campus', name: 'Weizmann Campus', type: 'level4', levelType: 'Campus',
                  children: [
                    { id: 'weizmann_ms', name: 'Main Supply', type: 'system' },
                    { id: 'weizmann_ct', name: 'Cooling Tower', type: 'system' },
                    { id: 'weizmann_lwa', name: 'Lab Water A', type: 'system' },
                    { id: 'weizmann_lwb', name: 'Lab Water B', type: 'system' },
                    { id: 'weizmann_dhw', name: 'DHW', type: 'system' },
                    { id: 'weizmann_irr', name: 'Irrigation', type: 'system' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// ─── Utility functions ───────────────────────────────────────────────────────

export function getHierarchyForAccount(accountId) {
  return ACCOUNT_HIERARCHIES[accountId] || [];
}

export function collectSystemIds(node) {
  if (node.type === 'system') return [node.id];
  if (!node.children) return [];
  return node.children.flatMap(child => collectSystemIds(child));
}

export function getSystemsUnderNode(node, allSystems) {
  const ids = new Set(collectSystemIds(node));
  return allSystems.filter(s => ids.has(s.id));
}

export function countDescendants(node) {
  const systemIds = collectSystemIds(node);
  const childLevels = (node.children || []).filter(c => c.type !== 'system').length;
  return { systemCount: systemIds.length, childLevelCount: childLevels };
}
