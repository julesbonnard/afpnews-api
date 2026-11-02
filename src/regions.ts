/** Régions de l'AFP (découpage des desks) : codes pays `country` en minuscules. */
export const AFP_REGIONS = {
  france: ['and', 'fra', 'pyf', 'atf', 'glp', 'mtq', 'myt', 'mco', 'reu', 'blm', 'maf', 'spm'],
  europe: ['ala', 'alb', 'arm', 'aut', 'aze', 'blr', 'bel', 'bes', 'bih', 'iot', 'bgr', 'hrv', 'cze', 'dnk', 'est', 'fro', 'fin', 'geo', 'deu', 'gib', 'grc', 'grl', 'ggy', 'vat', 'hun', 'isl', 'irl', 'imn', 'ita', 'jey', 'lva', 'lie', 'ltu', 'lux', 'mlt', 'mda', 'mne', 'nld', 'mkd', 'nor', 'pol', 'prt', 'rou', 'rus', 'smr', 'srb', 'sxm', 'svk', 'svn', 'esp', 'sjm', 'swe', 'che', 'tur', 'ukr', 'gbr', 'vgb', 'wlf', 'xko'],
  africa: ['ago', 'ben', 'bwa', 'bfa', 'bdi', 'cpv', 'cmr', 'caf', 'tcd', 'com', 'cog', 'cod', 'civ', 'dji', 'gnq', 'eri', 'swz', 'eth', 'gab', 'gmb', 'gha', 'gin', 'gnb', 'ken', 'lso', 'lbr', 'mdg', 'mwi', 'mli', 'mrt', 'mus', 'moz', 'nam', 'ner', 'nga', 'rwa', 'shn', 'stp', 'sen', 'syc', 'sle', 'som', 'zaf', 'ssd', 'tza', 'tgo', 'uga', 'zmb', 'zwe'],
  mena: ['dza', 'bhr', 'cyp', 'egy', 'irn', 'irq', 'isr', 'jor', 'kwt', 'lbn', 'lby', 'mar', 'omn', 'pse', 'qat', 'sau', 'sdn', 'syr', 'tun', 'are', 'esh', 'yem', 'zzz'],
  'asia-pacific': ['afg', 'aus', 'bgd', 'btn', 'brn', 'khm', 'chn', 'cxr', 'cck', 'cok', 'fji', 'hmd', 'hkg', 'ind', 'idn', 'jpn', 'kaz', 'kir', 'prk', 'kor', 'kgz', 'lao', 'mac', 'mys', 'mdv', 'fsm', 'mng', 'mmr', 'nru', 'npl', 'ncl', 'nzl', 'niu', 'nfk', 'pak', 'plw', 'png', 'phl', 'pcn', 'wsm', 'sgp', 'slb', 'lka', 'twn', 'tjk', 'tha', 'tls', 'tkl', 'ton', 'tkm', 'tuv', 'uzb', 'vut', 'vnm'],
  'north-america': ['asm', 'bhs', 'brb', 'bmu', 'can', 'gum', 'hti', 'jam', 'mhl', 'mnp', 'kna', 'lca', 'vct', 'tca', 'usa', 'umi', 'vir'],
  'latin-america': ['aia', 'atg', 'arg', 'abw', 'blz', 'bol', 'bvt', 'bra', 'cym', 'chl', 'col', 'cri', 'cub', 'cuw', 'dma', 'dom', 'ecu', 'slv', 'flk', 'guf', 'grd', 'gtm', 'guy', 'hnd', 'mex', 'msr', 'nic', 'pan', 'pry', 'per', 'pri', 'sgs', 'sur', 'tto', 'ury', 'ven'],
  antarctica: ['ata'],
} as const satisfies Record<string, readonly string[]>

export type AfpRegion = keyof typeof AFP_REGIONS
