# Atom Builder: the science model

Everything Atom Builder says about atoms, molecules and reactions comes from `games/atoms-sci.js` (`ATOM_SCI`), a plain
script with no drawing or DOM code. `games/atoms.js` only draws it and turns touches into actions.
`tests/31-atoms-science.spec.mjs` loads that exact file in Node and checks it against reference values typed in from the
sources below (not copied from the app), so a wrong number in the app shows up as a disagreement.

## Data and where it comes from

| What | Source |
|---|---|
| Standard atomic weights, elements 1–20 | IUPAC/CIAAW 2021 abridged values |
| Stable isotopes and natural abundances | IUPAC representative isotopic compositions; stable set checked against the NNDC chart of nuclides |
| Half-lives of the radioactive isotopes shown (H-3, C-14, K-40, F-18, Na-22, …) | NUBASE2020, rounded for children |
| Electron configurations | NIST Atomic Spectra Database (ground states) |
| Whether a free negative ion is bound (sign of the electron affinity) | NIST / CRC Handbook |
| Typical bond lengths | CRC Handbook; Pyykkö covalent radii as a fallback for pairs not in the table |
| Bond angles | VSEPR (180°, 120°, 109.5°; 107° and 104.5° with one and two lone pairs) |
| Enthalpies of formation ΔfH° (298 K) | NIST Chemistry WebBook / CODATA |
| Reaction enthalpies ΔH | Worked out from ΔfH° with Hess's law, never typed in, then checked against literature values in the tests |
| Autoignition temperatures (H₂ 585 °C, CH₄ 580 °C, CH₃OH 464 °C, C₂H₄ 490 °C) | NFPA / CRC |

## What each part models

**Atoms.** The element is the proton count. The nucleus card comes only from the neutron count (stable, radioactive with a
real half-life, or "falls apart almost instantly" for nuclei that aren't on the list). The chemistry card comes only from
the electrons (`chemistry(z, electrons)` has no neutron argument), so carbon-12 and carbon-14 read the same. Ions are
labelled as common, possible, only-inside-compounds (O²⁻, S²⁻, N³⁻, P³⁻) or impossible (He⁻, Be⁻, N⁻, Ne⁻, Mg⁻, Ar⁻,
and any doubly charged free anion).

**Molecules.** A structure is named only when it is connected, every atom has exactly its usual number of bonds, and
the graph (elements, connections and bond orders) is isomorphic to a known structure. Ethanol and dimethyl ether have the
same atoms and are told apart. A structure that satisfies every valence but isn't in the list (cyclic O₃, H–O–O–O–H) is
reported as "Not in our molecule list", never as a molecule. The 12 discovery targets are unchanged and in their
original order; 12 more real molecules are recognised as bonus finds.

**Shape.** Each molecule relaxes in 3-D under distance constraints: bond lengths, VSEPR angles (as 1–3 distances), and
cis/trans distances across double bonds so ethylene stays flat. Dragging empty space turns a molecule.

**Reaction chamber.** A well-stirred 2-D box. Each drawn molecule stands for 1 mmol, so one reaction moves ΔH (kJ/mol)
joules. The simulation runs in fixed steps of 1/360 s, counted in whole steps (so 30, 60, 120 or 144 fps give identical
runs), and is completely separate from drawing. It keeps an exact account of energy:

    chemical energy (Σ ΔfH) + molecules' kinetic energy + heat in the unseen gas + heat that left through the walls
      − energy added by sparks = constant

- Molecules are hard disks with perfectly elastic collisions. They keep bumping into the unseen gas (Andersen
  thermostat), and walls re-emit them with a Rayleigh-distributed normal speed (a proper thermal wall), so speeds follow
  the 2-D Maxwell–Boltzmann distribution. Light molecules move faster (Graham's law falls out).
- A collision starts a reaction only if the energy along the line of centres, taken at the moment of contact, clears the
  barrier. In 2-D the share of collisions that do is exactly exp(−E/RT); the tests measure this.
- Fuels also need the gas to be above their real autoignition temperature. A spark adds 3 kJ of heat; if the mixture
  then makes heat faster than the walls remove it, it runs away (Semenov's thermal explosion). Lean mixtures can fizzle.
- Every reaction has an explicit, balanced equation. The colliding pair starts it; the other molecules the equation
  needs must be within reach, or nothing happens. Collisions between molecules with no listed reaction just bounce.
- Catalyst and light lower the barrier of the reactions that need them. NH₃ + HCl needs no trigger.

## Intentional simplifications

- **Barriers are model values.** Real activation energies of these multi-step reactions are far larger; at the chamber's
  scale nothing would happen in a child's lifetime. The model barriers keep the real order (no reaction at room
  temperature, faster when hotter or catalysed) and the energy diagram labels them "(model)". Every ΔH is real.
- **Overall equations, not mechanisms.** Real combustion runs through dozens of radical steps; the chamber shows the
  overall reaction. Hydrogen + chlorine in light is really a radical chain; here light lowers the barrier.
- **Well-stirred:** one gas temperature for the whole chamber. No flame fronts, no pressure.
- **Forward reactions only.** The Haber reaction is reversible in reality; reversal is not modelled.
- **Gas-phase values throughout,** including hydrogen peroxide (usually met as a liquid).
- **No formal charges** in the molecule builder: CO and O₃ are real molecules but need formal charges, so they can't be
  completed here.
- **Not modelled:** NO formation in very hot air, ionisation and radicals in the chamber, sublimation of the salt smoke.
- **Pictures:** the shell view is a Bohr-style diagram and says so on screen; the cloud view draws s and p orbitals
  schematically; nuclei and atoms are drawn far out of scale (also stated on screen). In the molecule builder bond lengths
  are to scale but atoms are drawn bigger so fingers can grab them. Molecule spin and reaction flashes in the chamber are
  decoration and do not feed back into the simulation.
- The chamber caps at 90 molecules; the heater runs from 100 K to 1,500 K.
