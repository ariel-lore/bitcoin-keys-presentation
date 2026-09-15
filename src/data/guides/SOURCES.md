# Guide sources (assumed)

Educational choice trees mirror public setup docs. **Verify live product UX yourself** — apps change.

| Path | Assumed sources |
|------|-----------------|
| **Federated · Fedi (member)** | Fedi / Fedimint public onboarding: install from official store, join via invite QR/link, social backup, personal backup before PIN |
| **Hot · BlueWallet** | [bluewallet.io](https://bluewallet.io) docs: add Bitcoin wallet, BIP84/BIP49, backup & verify seed, receive/send; Lightning/LNDHub called out as optional custodial-leaning branch |
| **Cold · Trezor + passphrase** | Trezor Suite guides: official Suite + firmware, authenticity check, create wallet, seed from device screen, PIN, enable passphrase, enter on device, store separately, verify receive |
| **Cold · Trezor Multi-share (2-of-3)** | Trezor Multi-share Backup / SLIP39 docs: 3 shares threshold 2, write+verify each share, geographic storage, never digitize, recombine on device |
| **Multisig · Seedsigner + Sparrow** | SeedSigner + Sparrow Wallet multisig guides: per-key entropy & SeedQR, Sparrow 2-of-3 native SegWit, xpub QR import, descriptor export, address verify, PSBT QR signing |

**User-story defaults (not universal best practice):**

- Shamir share locations: Home · Physical storage · Family
- Multisig key locations: Family · Home · Nearby physical storage
- Descriptor copied to all three locations (some guides advise *against* storing descriptors with seeds — tradeoff vulns are attached)

Breadth hooks (metal backup, dice, Seedpicker/solitaire, Casa stub, air-gapped phone, Coldcard dice) are intentionally shorter.
