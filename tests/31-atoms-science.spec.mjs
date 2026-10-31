// Atom Builder science model, checked on its own (no browser): the exact file the app loads, games/atoms-sci.js, run in
// Node. Reference values below are typed in from the sources named next to them, not copied from the app's tables,
// so a wrong number in the app shows up as a disagreement here. Passing the old UI tests is not taken as proof of any of this.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../games/atoms-sci.js', import.meta.url), 'utf8');
const ctx = {}; vm.createContext(ctx); vm.runInContext(code, ctx);
const S = vm.runInContext('ATOM_SCI', ctx);

/* IUPAC 2021 abridged standard atomic weights (CIAAW) */
const WEIGHTS = { H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.180,
  Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.95, K: 39.098, Ca: 40.078 };
const NAMES = ['Hydrogen', 'Helium', 'Lithium', 'Beryllium', 'Boron', 'Carbon', 'Nitrogen', 'Oxygen', 'Fluorine', 'Neon', 'Sodium',
  'Magnesium', 'Aluminium', 'Silicon', 'Phosphorus', 'Sulfur', 'Chlorine', 'Argon', 'Potassium', 'Calcium'];
/* mass numbers of the stable (observationally stable) isotopes, NNDC chart of nuclides */
const STABLE_A = { 1: [1, 2], 2: [3, 4], 3: [6, 7], 4: [9], 5: [10, 11], 6: [12, 13], 7: [14, 15], 8: [16, 17, 18], 9: [19], 10: [20, 21, 22],
  11: [23], 12: [24, 25, 26], 13: [27], 14: [28, 29, 30], 15: [31], 16: [32, 33, 34, 36], 17: [35, 37], 18: [36, 38, 40], 19: [39, 41], 20: [40, 42, 43, 44, 46] };
/* ground-state electron configurations of the neutral atoms (NIST Atomic Spectra Database) */
const CONFIG = ['1s1', '1s2', '1s2 2s1', '1s2 2s2', '1s2 2s2 2p1', '1s2 2s2 2p2', '1s2 2s2 2p3', '1s2 2s2 2p4', '1s2 2s2 2p5', '1s2 2s2 2p6',
  '1s2 2s2 2p6 3s1', '1s2 2s2 2p6 3s2', '1s2 2s2 2p6 3s2 3p1', '1s2 2s2 2p6 3s2 3p2', '1s2 2s2 2p6 3s2 3p3', '1s2 2s2 2p6 3s2 3p4',
  '1s2 2s2 2p6 3s2 3p5', '1s2 2s2 2p6 3s2 3p6', '1s2 2s2 2p6 3s2 3p6 4s1', '1s2 2s2 2p6 3s2 3p6 4s2'];
const plain = t => t.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, c => '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c));
/* standard enthalpies of formation, kJ/mol, 298 K (NIST Chemistry WebBook) */
const DHF = { H2: 0, O2: 0, N2: 0, Cl2: 0, H2O: -241.83, CO2: -393.52, CH4: -74.6, NH3: -45.9, HCl: -92.3, H2O2: -136.1, C2H6: -84.0, CH3OH: -201.0, C2H4: 52.4, NH4Cl: -314.4 };
/* reaction enthalpies from the literature (gas-phase water), kJ for the equation as written */
const DH_RX = { h2burn: -483.6, ch4burn: -802.3, meohburn: -1352.0, c2h4burn: -1323.0, peroxide: -211.4, haber: -91.8, hydrog: -136.3, smoke: -176.2, hcl: -184.6 };
/* typical bond lengths, pm (CRC Handbook) */
const BONDS = [['C', 'H', 1, 109], ['O', 'H', 1, 96], ['N', 'H', 1, 101], ['H', 'H', 1, 74], ['H', 'Cl', 1, 127], ['C', 'C', 1, 154], ['C', 'C', 2, 134],
  ['C', 'C', 3, 120], ['C', 'O', 2, 120], ['N', 'N', 3, 110], ['O', 'O', 2, 121], ['Cl', 'Cl', 1, 199], ['C', 'N', 3, 116]];

test.describe('Atom Builder science: atoms', () => {
  test('elements 1-20: symbols, names and standard atomic weights match IUPAC', () => {
    expect(S.MAXZ).toBe(20);
    for (let z = 1; z <= 20; z++) {
      const [sym, name, w] = S.ELEMENTS[z];
      expect(name).toBe(NAMES[z - 1]);
      expect(Math.abs(w - WEIGHTS[sym]), sym).toBeLessThan(0.0006);
    }
  });

  test('stable isotopes match the chart of nuclides, and natural abundances add up to 100%', () => {
    for (let z = 1; z <= 20; z++) {
      expect(S.stableNeutrons(z).map(n => n + z).sort((a, b) => a - b), `Z=${z}`).toEqual(STABLE_A[z]);
      let sum = S.stableNeutrons(z).reduce((t, n) => t + S.nuclide(z, n).abundance, 0);
      for (const [n] of S.RADIO[z] || []) sum += S.nuclide(z, n).abundance || 0;   // primordial radioactive ones: K-40, Ca-48
      expect(Math.abs(sum - 100), `abundances of Z=${z}`).toBeLessThan(0.02);
    }
  });

  test('well-known radioactive isotopes have the right half-lives, and unknown nuclei are never called stable', () => {
    expect(S.nuclide(6, 8)).toMatchObject({ stable: false, known: true, halfLife: '5,700 years' });            // carbon-14
    expect(S.nuclide(1, 2)).toMatchObject({ stable: false, known: true, halfLife: '12.3 years' });             // tritium
    expect(S.nuclide(19, 21).halfLife).toBe('1.25 billion years');                                         // potassium-40
    expect(S.nuclide(9, 9).halfLife).toBe('110 minutes');                                                  // fluorine-18
    expect(S.nuclide(11, 13).stable).toBe(false);                                                          // sodium-24
    expect(S.nuclide(1, 5)).toMatchObject({ stable: false, known: false });                                // hydrogen-6
    expect(S.nuclide(20, 28).stable).toBe(false);                                                          // calcium-48 decays (very slowly)
  });

  test('electron configurations of all 20 neutral atoms match NIST, and shells add up', () => {
    for (let z = 1; z <= 20; z++) {
      expect(plain(S.configText(z)), `Z=${z}`).toBe(CONFIG[z - 1]);
      expect(S.shells(z).reduce((a, b) => a + b, 0)).toBe(z);
    }
    expect(S.shells(20)).toEqual([2, 8, 8, 2]);
    expect(S.shells(11)).toEqual([2, 8, 1]);
  });

  test('ions: common ions, noble-gas arrangements, anions that cannot exist alone', () => {
    expect(S.ionInfo(11, 10)).toMatchObject({ q: 1, kind: 'common' });            // Na⁺
    expect(plain(S.configText(10))).toBe(CONFIG[9]);                                // Na⁺ has neon's arrangement
    expect(S.ionInfo(17, 18)).toMatchObject({ q: -1, kind: 'common' });           // Cl⁻
    expect(S.ionInfo(8, 10)).toMatchObject({ q: -2, kind: 'solid' });             // O²⁻ only in compounds
    expect(S.ionInfo(2, 3).kind).toBe('impossible');                               // He⁻ is not bound
    expect(S.ionInfo(7, 8).kind).toBe('impossible');                               // N⁻ is not bound (negative electron affinity)
    expect(S.ionInfo(10, 11).kind).toBe('impossible');                             // Ne⁻
    expect(S.ionInfo(6, 7).kind).toBe('possible');                                 // C⁻ is bound
    expect(S.ionInfo(9, 11).kind).toBe('impossible');                              // F²⁻
    expect(S.ionInfo(13, 10)).toMatchObject({ q: 3, kind: 'common' });            // Al³⁺
    expect(S.ionInfo(11, 8).kind).toBe('extreme');                                 // Na³⁺
    expect(S.ionInfo(1, 0).kind).toBe('common');                                   // H⁺
  });

  test('nuclear stability and chemistry are separate: neutrons change the first, never the second', () => {
    expect(S.chemistry.length, 'chemistry(z, electrons) takes no neutron count').toBe(2);
    expect(S.nuclide(6, 6).stable).toBe(true); expect(S.nuclide(6, 8).stable).toBe(false);   // carbon-12 vs carbon-14
    for (let z = 1; z <= 20; z++) expect(S.isStable(z, S.stableNeutrons(z)[0])).toBe(true);
    expect(S.chemistry(2, 2).text).toMatch(/full/);       // noble gas: unreactive
    expect(S.chemistry(11, 11).text).toMatch(/reactive/);  // sodium: reactive
  });
});

test.describe('Atom Builder science: molecules', () => {
  const lib = k => S.LIB.find(m => m.key === k);
  const shuffled = (m, seed) => { // same molecule with atoms listed in a different order
    const r = S.rng(seed), ord = m.atoms.map((_, i) => i).sort(() => r() - 0.5), inv = []; ord.forEach((o, i) => { inv[o] = i; });
    return { atoms: ord.map(i => m.atoms[i]), bonds: m.bonds.map(([i, j, o]) => [inv[j], inv[i], o]) };
  };

  test('the 12 target molecules keep their place in the discovery list', () => {
    expect(S.TARGETS.map(m => m.name)).toEqual(['Water', 'Carbon dioxide', 'Methane', 'Ammonia', 'Oxygen gas', 'Hydrogen gas', 'Nitrogen gas',
      'Hydrochloric acid', 'Hydrogen peroxide', 'Ethane', 'Methanol', 'Ethylene']);
  });

  test('every molecule in the library is recognised from its structure, whatever order the atoms were added in', () => {
    for (const m of S.LIB) for (const seed of [1, 2, 3]) {
      const s = shuffled(m, seed), a = S.analyze(s.atoms, s.bonds);
      expect(a.complete, m.name).toBe(true);
      expect(a.match && a.match.key, m.name).toBe(m.key);
    }
  });

  test('connectivity, not the formula, decides the molecule: ethanol vs dimethyl ether', () => {
    const e = lib('C₂H₅OH'), d = lib('CH₃OCH₃');
    expect(S.formula(S.countOf(e.atoms))).toBe(S.formula(S.countOf(d.atoms)));
    expect(S.analyze(e.atoms, e.bonds).match.name).toBe('Ethanol');
    expect(S.analyze(d.atoms, d.bonds).match.name).toBe('Dimethyl ether');
    // water's atoms joined wrongly (H–H–O) cannot be water
    expect(S.analyze(['O', 'H', 'H'], [[1, 2, 1], [0, 1, 1]]).match).toBe(null);
  });

  test('structures that merely satisfy valence are not called real molecules', () => {
    const ring = S.analyze(['O', 'O', 'O'], [[0, 1, 1], [1, 2, 1], [2, 0, 1]]);              // cyclic O₃
    expect(ring.complete).toBe(true); expect(ring.match).toBe(null);
    const chain = S.analyze(['H', 'O', 'O', 'O', 'H'], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1]]);
    expect(chain.match).toBe(null);
    const co = S.analyze(['C', 'O'], [[0, 1, 3]]);                                          // C≡O needs formal charges: not complete here
    expect(co.complete).toBe(false);
    const split = S.analyze(['H', 'H', 'H', 'H'], [[0, 1, 1], [2, 3, 1]]);                   // two H₂ is not one molecule
    expect(split.connected).toBe(false); expect(split.match).toBe(null); expect(split.pieces).toBe(2);
    const over = S.analyze(['H', 'H'], [[0, 1, 2]]);
    expect(over.over.length).toBe(2); expect(over.complete).toBe(false);
  });

  test('formulas in Hill order, and masses', () => {
    expect(S.formula({ H: 4, C: 1, O: 1 })).toBe('CH₄O');
    expect(S.formula({ Cl: 1, H: 1 })).toBe('ClH');           // Hill order without carbon is alphabetical
    const w = S.analyze(['O', 'H', 'H'], [[0, 1, 1], [0, 2, 1]]);
    expect(w.nominal).toBe(18); expect(w.molar).toBeCloseTo(18.015, 3);
  });

  test('bond lengths match typical measured values', () => {
    for (const [a, b, o, pm] of BONDS) expect(S.bondPm(a, b, o), `${a}${o}${b}`).toBe(pm);
  });

  const angle = (P, a, c, b) => { const u = ['x', 'y', 'z'].map(k => P[a][k] - P[c][k]), v = ['x', 'y', 'z'].map(k => P[b][k] - P[c][k]); return Math.acos((u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / Math.hypot(...u) / Math.hypot(...v)) * 180 / Math.PI; };
  function relaxed(key, seed = 3) {
    const m = lib(key), r = S.rng(seed), cons = S.shapeConstraints(m.atoms, m.bonds), P = m.atoms.map(() => ({ x: r() * 100, y: r() * 100, z: r() * 100 }));
    for (let i = 0; i < 500; i++) S.relax(P, cons, 1, 4);
    return { m, P };
  }
  test('3-D shapes relax to the VSEPR geometry: tetrahedral, bent, pyramid, linear, flat', () => {
    for (const seed of [1, 7, 13]) {
      let { P } = relaxed('CH₄', seed); for (const [a, b] of [[1, 2], [1, 3], [2, 4], [3, 4]]) expect(angle(P, a, 0, b)).toBeCloseTo(109.5, 0);
      ({ P } = relaxed('H₂O', seed)); expect(angle(P, 1, 0, 2)).toBeCloseTo(104.5, 0);
      ({ P } = relaxed('NH₃', seed)); expect(angle(P, 1, 0, 2)).toBeCloseTo(107, 0);
      ({ P } = relaxed('CO₂', seed)); expect(angle(P, 1, 0, 2)).toBeGreaterThan(174);
      ({ P } = relaxed('HCN', seed)); expect(angle(P, 0, 1, 2)).toBeGreaterThan(174);
      const e = relaxed('C₂H₄', seed); P = e.P;
      expect(angle(P, 2, 0, 3)).toBeCloseTo(120, -1); expect(angle(P, 1, 0, 2)).toBeCloseTo(120, -1);
      // ethylene is flat: every atom within 15 pm of the plane through C, C and one H
      const [A, B, C] = [P[0], P[1], P[2]], u = [B.x - A.x, B.y - A.y, B.z - A.z], v = [C.x - A.x, C.y - A.y, C.z - A.z];
      const nrm = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], L = Math.hypot(...nrm);
      for (const Q of P) expect(Math.abs(((Q.x - A.x) * nrm[0] + (Q.y - A.y) * nrm[1] + (Q.z - A.z) * nrm[2]) / L)).toBeLessThan(15);
    }
    const w = S.analyze(['O', 'H', 'H'], [[0, 1, 1], [0, 2, 1]]).geo[0];
    expect(w).toMatchObject({ shape: 'bent', lonePairs: 2, angle: 104.5 });
    const m = S.analyze(['C', 'H', 'H', 'H', 'H'], [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]).geo[0];
    expect(m).toMatchObject({ shape: 'tetrahedral', lonePairs: 0 });
  });
});

test.describe('Atom Builder science: reactions', () => {
  test('formation enthalpies match NIST', () => {
    for (const [k, v] of Object.entries(DHF)) expect(Math.abs(S.SPECIES[k].dHf - v), k).toBeLessThan(0.8);
  });

  test('every reaction balances atoms and charge, and its ΔH matches the literature', () => {
    for (const rx of S.REACTIONS) {
      const a = S.atomTally(rx.re), b = S.atomTally(rx.pr);
      expect(Object.entries(a).sort(), rx.id).toEqual(Object.entries(b).sort());
      expect(S.chargeTally(rx.re)).toBe(S.chargeTally(rx.pr));
      expect(Math.abs(rx.dH - DH_RX[rx.id]), rx.id).toBeLessThan(1.5);
    }
    expect(S.SPECIES.NH4Cl.charge).toBe(0);
    expect(S.SPECIES.NH4Cl.ions.reduce((t, i) => t + i[1], 0)).toBe(0);
  });

  /* conservation: atoms, charge and energy over long runs of every experiment, with sparks, heat, catalyst and light */
  test('atoms, charge and energy are conserved in every experiment, every second', () => {
    test.setTimeout(240_000);
    for (const exp of S.EXPERIMENTS) {
      const c = S.setup(exp), atoms0 = JSON.stringify(Object.entries(c.atoms()).sort()), E0 = c.energyTotal(), q0 = c.charge();
      for (let s = 0; s < 40; s++) {
        if (s === 3) c.spark(400, 250);
        if (s === 10) c.set({ catalyst: true });
        if (s === 14) c.set({ light: true, T: 1200 });
        if (s === 25) c.set({ T: 200 });
        for (let f = 0; f < 60; f++) c.step(1 / 60);
        expect(JSON.stringify(Object.entries(c.atoms()).sort()), `${exp.id} atoms at ${s}s`).toBe(atoms0);
        expect(c.charge()).toBe(q0);
        expect(Math.abs(c.energyTotal() - E0), `${exp.id} energy at ${s}s`).toBeLessThan(1e-6);
      }
      // chemical energy changed by exactly (reactions that happened × ΔH)
      let want = 0; for (const rx of S.REACTIONS) want += c.state.stats.rx[rx.id].fired * rx.dH;
      const start = Object.entries(c.state.startCounts).reduce((t, [k, n]) => t + n * S.SPECIES[k].dHf, 0);
      expect(c.chemEnergy() - start).toBeCloseTo(want, 6);
    }
  });

  test('nothing burns at room temperature without a spark, however long you wait', () => {
    test.setTimeout(120_000);
    for (const id of ['pop', 'flame', 'lean']) {
      const c = S.setup(S.EXPERIMENTS.find(x => x.id === id));
      for (let f = 0; f < 90 * 60; f++) c.step(1 / 60);
      expect(c.state.stats.rx[id === 'pop' ? 'h2burn' : 'ch4burn'].fired, id).toBe(0);
      expect(c.counts()).toEqual(c.state.startCounts);
    }
  });

  test('a spark ignites hydrogen and methane, and the mixture heats up (Semenov: heat made outruns heat lost)', () => {
    for (const [id, rx, min] of [['pop', 'h2burn', 8], ['flame', 'ch4burn', 6]]) {
      let lit = 0;
      for (let seed = 1; seed <= 5; seed++) {
        const c = S.setup({ ...S.EXPERIMENTS.find(x => x.id === id), seed });
        for (let f = 0; f < 60; f++) c.step(1 / 60);
        c.spark(400, 250);
        let peak = 0; for (let f = 0; f < 15 * 60; f++) { c.step(1 / 60); peak = Math.max(peak, c.temperature()); }
        if (c.state.stats.rx[rx].fired >= min) { lit++; expect(peak).toBeGreaterThan(1500); }
      }
      expect(lit, `${id} ignited in ${lit}/5 runs`).toBeGreaterThanOrEqual(4);
    }
  });

  test('activation conditions: catalyst, light and "no trigger" reactions behave as their real counterparts', () => {
    const run = (id, opts, secs = 20) => { const c = S.setup({ ...S.EXPERIMENTS.find(x => x.id === id), ...opts }); for (let f = 0; f < secs * 60; f++) c.step(1 / 60); return c; };
    const ex = id => S.EXPERIMENTS.find(x => x.id === id).focus;
    expect(run('fizz', {}).state.stats.rx.peroxide.fired).toBe(0);
    expect(run('fizz', { catalyst: true }).state.stats.rx.peroxide.fired).toBeGreaterThan(3);
    expect(run('haber', { catalyst: false }).state.stats.rx.haber.fired).toBe(0);
    expect(run('haber', { catalyst: true }).state.stats.rx.haber.fired).toBeGreaterThan(2);
    expect(run('light', {}).state.stats.rx.hcl.fired).toBe(0);
    expect(run('light', { light: true }).state.stats.rx.hcl.fired).toBeGreaterThan(3);
    const smoke = run('smoke', {});
    expect(smoke.state.stats.rx.smoke.fired).toBeGreaterThan(3);
    expect(smoke.state.parts.some(p => p.stuck)).toBe(true);
    expect(ex('smoke')).toBe('smoke');
  });

  test('unsupported combinations never react, even very hot: no invented products', () => {
    const c = S.chamber({ seed: 4, T: 1500 });
    for (const s of ['N2', 'O2', 'CO2', 'H2O', 'HCl', 'C2H6', 'NH3', 'CH3OH', 'CH4']) c.add(s, 4);
    c.mark();
    const before = c.counts();
    for (let f = 0; f < 30 * 60; f++) c.step(1 / 60);
    // methane, methanol and O₂ are a real fuel mix and may burn at 1500 K; everything that happened must be a known reaction
    const fired = Object.entries(c.state.stats.rx).filter(([, s]) => s.fired).map(([k]) => k);
    for (const k of fired) expect(['ch4burn', 'meohburn', 'smoke'].includes(k), k).toBe(true);
    const inert = S.chamber({ seed: 4, T: 1500 }); for (const s of ['N2', 'O2', 'CO2', 'H2O', 'HCl', 'C2H6']) inert.add(s, 5); inert.mark();
    for (let f = 0; f < 30 * 60; f++) inert.step(1 / 60);
    expect(inert.counts()).toEqual(inert.state.startCounts);
    expect(Object.values(inert.state.stats.rx).every(s => s.fired === 0)).toBe(true);
    expect(Object.keys(before).length).toBeGreaterThan(0);
  });

  test('collision energies follow exp(-E/RT) (2-D Maxwell-Boltzmann), and light molecules move faster', () => {
    const T = 600, RT = S.R * T / 1000, Es = [];
    const c = S.chamber({ seed: 9, T, probe: E => Es.push(E) });
    c.add('N2', 30); c.add('H2', 20);
    let ksum = 0, kn = 0, v2 = { H2: [0, 0], N2: [0, 0] };
    for (let f = 0; f < 60 * 60; f++) {
      c.step(1 / 60);
      if (f > 120 && f % 6 === 0) { ksum += c.kineticT(); kn++; for (const p of c.state.parts) { v2[p.s][0] += p.vx * p.vx + p.vy * p.vy; v2[p.s][1]++; } }
    }
    expect(Es.length).toBeGreaterThan(3000);
    for (const k of [1, 2, 3]) {
      const frac = Es.filter(E => E >= k * RT).length / Es.length;
      expect(Math.abs(Math.log(frac) + k), `fraction above ${k}RT = ${frac.toFixed(4)}, expected e^-${k}`).toBeLessThan(0.15);
    }
    expect(Math.abs(ksum / kn / T - 1)).toBeLessThan(0.08);                       // molecules are at the gas temperature
    const ratio = Math.sqrt((v2.H2[0] / v2.H2[1]) / (v2.N2[0] / v2.N2[1]));
    expect(Math.abs(ratio - Math.sqrt(S.SPECIES.N2.M / S.SPECIES.H2.M))).toBeLessThan(0.4);   // Graham: √(28/2) ≈ 3.7
  });

  test('fixed time step: 30, 60 and 144 frames per second give exactly the same run', () => {
    const exp = S.EXPERIMENTS.find(x => x.id === 'pop');
    const snap = c => JSON.stringify([c.state.t, c.counts(), c.state.parts.map(p => [p.s, p.x, p.y, p.vx, p.vy])]);
    const go = fps => { const c = S.setup(exp); for (let f = 0; f < 4 * fps; f++) { if (f === fps) c.spark(400, 250); c.step(1 / fps); } return snap(c); };
    const a = go(60);
    expect(go(30)).toBe(a);
    expect(go(144)).toBe(a);
    expect(go(120)).toBe(a);
    // a frame longer than 0.25 s is clipped (a hidden tab must not make the chamber jump)
    const c = S.setup(exp); c.step(5); expect(c.state.t).toBeCloseTo(0.25, 6);
  });

  test('experiments are repeatable: the same seed replays exactly', () => {
    for (const exp of S.EXPERIMENTS) {
      const go = () => { const c = S.setup(exp); for (let f = 0; f < 300; f++) { if (f === 60) c.spark(300, 200); c.step(1 / 60); } return JSON.stringify([c.counts(), c.state.parts.map(p => [p.x, p.y])]); };
      expect(go(), exp.id).toBe(go());
    }
  });

  test('numerical stability: two minutes hot and busy stays finite, inside the box, and within limits', () => {
    test.setTimeout(120_000);
    for (const id of ['flame', 'haber', 'smoke']) {
      const c = S.setup(S.EXPERIMENTS.find(x => x.id === id));
      c.set({ T: 1500, catalyst: true, light: true });
      for (let s = 0; s < 120; s++) {
        if (s % 20 === 0) c.spark(400, 250);
        for (let f = 0; f < 60; f++) c.step(1 / 60);
        expect(Number.isFinite(c.temperature()) && c.temperature() > 0).toBe(true);
        expect(c.state.parts.length).toBeLessThanOrEqual(90);
        for (const p of c.state.parts) {
          expect(Number.isFinite(p.x + p.y + p.vx + p.vy)).toBe(true);
          expect(p.x >= p.r - 1e-6 && p.x <= S.BOX.w - p.r + 1e-6 && p.y >= p.r - 1e-6 && p.y <= S.BOX.h - p.r + 1e-6).toBe(true);
        }
      }
    }
  });

  test('the explanation is worked out from the run itself', () => {
    const exp = S.EXPERIMENTS.find(x => x.id === 'pop');
    const c = S.setup(exp); for (let f = 0; f < 300; f++) c.step(1 / 60);
    const quiet = S.explain(c).join(' ');
    expect(quiet).toMatch(/No reaction/);
    expect(quiet).toContain(`${c.state.stats.rx.h2burn.meet} times`);
    expect(quiet).toContain(`${Math.round(c.state.stats.rx.h2burn.maxE)} kJ/mol`);
    c.spark(400, 250); for (let f = 0; f < 900; f++) c.step(1 / 60);
    const n = c.state.stats.rx.h2burn.fired;
    expect(n).toBeGreaterThan(0);
    expect(S.explain(c).join(' ')).toContain(`it happened ${n} time`);
    const lean = S.chamber({ seed: 2, T: 298 }); lean.add('CH4', 3); lean.add('O2', 2); lean.mark();
    lean.spark(400, 250); for (let f = 0; f < 900; f++) lean.step(1 / 60);
    if (lean.state.stats.rx.ch4burn.fired && !lean.counts().O2) expect(S.explain(lean).join(' ')).toMatch(/O₂ ran out/);
  });
});
