-- supabase/migrations/20260407100300_seed_egenkontroll_templates.sql
-- Seed real Swedish construction egenkontroll templates based on:
-- BBR (Boverkets Byggregler), GVK (Säkra Våtrum), ELSÄK-FS, AMA, Säker Vatten, EKS

-- Insert templates for each existing tenant
-- 7 templates: Grund, Våtrum, Stomme, Brand, El, VVS, Isolering

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT id FROM public.tenants LOOP

    -- 1. Egenkontroll – Grund & Platta på mark
    INSERT INTO public.checklist_templates (tenant_id, name, description, category, structure)
    VALUES (
      t.id,
      'Egenkontroll – Grund & Platta på mark',
      'Kontrollpunkter för grundläggning, platta på mark, armering och betonggjutning enligt BBR och konstruktionsritningar.',
      'Grund',
      '{
        "sections": [
          {
            "name": "Markarbeten & Dränering",
            "items": [
              { "label": "Schaktbotten kontrollerad mot ritning (nivå och mått)", "type": "yes_no" },
              { "label": "Dränering utförd enligt ritning och ansluten", "type": "yes_no" },
              { "label": "Kapillärbrytande lager – tjocklek", "type": "measurement", "config": { "unit": "mm" } },
              { "label": "Bärlager komprimerat och avjämnat", "type": "yes_no" }
            ]
          },
          {
            "name": "Radon & Fuktskydd",
            "items": [
              { "label": "Radonskydd/radonmembran monterat enligt ritning", "type": "yes_no" },
              { "label": "Radonmembran – skarvar och genomföringar tätade", "type": "yes_no" },
              { "label": "Markfuktskydd / ångspärr under platta", "type": "yes_no" }
            ]
          },
          {
            "name": "Isolering",
            "items": [
              { "label": "Isolering under platta – tjocklek enligt ritning", "type": "measurement", "config": { "unit": "mm" } },
              { "label": "Kantisolering monterad", "type": "yes_no" },
              { "label": "Isolering – inga springor eller skador", "type": "yes_no" }
            ]
          },
          {
            "name": "Armering & Gjutning",
            "items": [
              { "label": "Armering enligt konstruktionsritning (dimension, cc-avstånd)", "type": "yes_no" },
              { "label": "Täckskikt armering", "type": "measurement", "config": { "unit": "mm" } },
              { "label": "Kantbalkar armerade enligt ritning", "type": "yes_no" },
              { "label": "Betongkvalitet (hållfasthetsklass)", "type": "dropdown", "config": { "options": ["C20/25", "C25/30", "C28/35", "C30/37", "C32/40"] } },
              { "label": "Gjuttemperatur (luft vid gjutning)", "type": "measurement", "config": { "unit": "°C" } },
              { "label": "Avvikelser / anmärkningar", "type": "text" }
            ]
          }
        ]
      }'::jsonb
    ) ON CONFLICT DO NOTHING;

    -- 2. Egenkontroll – Våtrum & Tätskikt
    INSERT INTO public.checklist_templates (tenant_id, name, description, category, structure)
    VALUES (
      t.id,
      'Egenkontroll – Våtrum & Tätskikt',
      'Kontrollpunkter för tätskikt, golvbrunn, fall och ytskikt i våtrum enligt GVK Säkra Våtrum och BBR.',
      'Våtrum',
      '{
        "sections": [
          {
            "name": "Förutsättningar innan tätskiktsarbete",
            "items": [
              { "label": "Underlag golv – jämnt, torrt, rent och fritt från sprickor", "type": "yes_no" },
              { "label": "Underlag vägg – jämnt, torrt och grundat", "type": "yes_no" },
              { "label": "Relativ fuktighet i underlag", "type": "measurement", "config": { "unit": "% RF", "max": 100 } },
              { "label": "Golvbrunn monterad och fastgjuten enligt SS-EN 1253", "type": "yes_no" },
              { "label": "VVS-installationer klara och provade innan tätskikt", "type": "yes_no" }
            ]
          },
          {
            "name": "Golvfall & Golvbrunn",
            "items": [
              { "label": "Fall mot golvbrunn i duschzon (min 1:100)", "type": "yes_no" },
              { "label": "Uppmätt fall mot golvbrunn", "type": "measurement", "config": { "unit": "mm/m" } },
              { "label": "Inget motfall förekommer", "type": "yes_no" },
              { "label": "Golvbrunnstyp", "type": "dropdown", "config": { "options": ["Gjutjärn", "Plast PP", "Plast PE", "Rostfritt stål", "Annan"] } }
            ]
          },
          {
            "name": "Tätskikt",
            "items": [
              { "label": "Tätskiktssystem (fabrikat och typ)", "type": "text" },
              { "label": "Tätskikt applicerat enligt tillverkarens anvisning", "type": "yes_no" },
              { "label": "Manschetter vid rörgenomföringar monterade", "type": "yes_no" },
              { "label": "Förstärkningsband i inner- och ytterhörn", "type": "yes_no" },
              { "label": "Klämring monterad vid golvbrunn", "type": "yes_no" },
              { "label": "Överlapp tätskikt vid skarvar", "type": "measurement", "config": { "unit": "mm" } },
              { "label": "Täthetskontroll utförd och godkänd", "type": "yes_no" }
            ]
          },
          {
            "name": "Ytskikt & Dokumentation",
            "items": [
              { "label": "Keramiska plattor – fästmetod och fix/bruk enligt anvisning", "type": "yes_no" },
              { "label": "Fotodokumentation före kakling (tätskikt synligt)", "type": "yes_no" },
              { "label": "Avvikelser / anmärkningar", "type": "text" }
            ]
          }
        ]
      }'::jsonb
    ) ON CONFLICT DO NOTHING;

    -- 3. Egenkontroll – Stomme & Regelstomme
    INSERT INTO public.checklist_templates (tenant_id, name, description, category, structure)
    VALUES (
      t.id,
      'Egenkontroll – Stomme & Regelstomme',
      'Kontrollpunkter för trästomme/regelstomme, bjälklag, takstolar och infästningar enligt EKS och konstruktionsritningar.',
      'Stomme',
      '{
        "sections": [
          {
            "name": "Regelstomme väggar",
            "items": [
              { "label": "Regeldimension enligt konstruktionsritning", "type": "yes_no" },
              { "label": "CC-avstånd reglar", "type": "measurement", "config": { "unit": "mm" } },
              { "label": "Stomme i lod (max avvikelse ±3mm per meter)", "type": "yes_no" },
              { "label": "Syll monterad och förankrad i grund/bjälklag", "type": "yes_no" },
              { "label": "Hammarband/överstycke monterat", "type": "yes_no" },
              { "label": "Förband och infästningar enligt ritning", "type": "yes_no" }
            ]
          },
          {
            "name": "Bjälklag",
            "items": [
              { "label": "Bjälklagsdimension enligt konstruktionsritning", "type": "yes_no" },
              { "label": "CC-avstånd bjälkar", "type": "measurement", "config": { "unit": "mm" } },
              { "label": "Bjälklag i våg (max tillåten avvikelse)", "type": "yes_no" },
              { "label": "Infästning mot bärande väggar utförd", "type": "yes_no" }
            ]
          },
          {
            "name": "Takstolar & Takkonstruktion",
            "items": [
              { "label": "Takstolar monterade enligt tillverkarens anvisning", "type": "yes_no" },
              { "label": "CC-avstånd takstolar", "type": "measurement", "config": { "unit": "mm" } },
              { "label": "Vindförband/stagning monterade", "type": "yes_no" },
              { "label": "Takstolar i lod och rätt placering", "type": "yes_no" }
            ]
          },
          {
            "name": "Fukt & Väderskydd",
            "items": [
              { "label": "Virke fuktkvot vid inbyggnad", "type": "measurement", "config": { "unit": "%", "max": 18 } },
              { "label": "Väderskydd under byggtid", "type": "dropdown", "config": { "options": ["Tält/presenning", "Väderskyddstält", "Provisoriskt tak", "Inget (motivering krävs)"] } },
              { "label": "Avvikelser / anmärkningar", "type": "text" }
            ]
          }
        ]
      }'::jsonb
    ) ON CONFLICT DO NOTHING;

    -- 4. Egenkontroll – Brandskydd
    INSERT INTO public.checklist_templates (tenant_id, name, description, category, structure)
    VALUES (
      t.id,
      'Egenkontroll – Brandskydd',
      'Kontrollpunkter för brandcellsindelning, brandavskiljning, utrymning och brandtekniska installationer enligt BBR kap 5.',
      'Brand',
      '{
        "sections": [
          {
            "name": "Brandceller & Avskiljning",
            "items": [
              { "label": "Brandcellsgränser utförda enligt brandskyddsbeskrivning", "type": "yes_no" },
              { "label": "Brandteknisk klass på väggar/bjälklag", "type": "dropdown", "config": { "options": ["EI 15", "EI 30", "EI 60", "EI 90", "EI 120", "REI 60", "REI 90", "REI 120"] } },
              { "label": "Genomföringar i brandcellsgräns tätade med godkänt material", "type": "yes_no" },
              { "label": "Brandtätning – fabrikat och typ", "type": "text" },
              { "label": "Luckor/inspektionsluckor i brandcellsgräns – rätt brandklass", "type": "yes_no" }
            ]
          },
          {
            "name": "Dörrar i brandcellsgräns",
            "items": [
              { "label": "Branddörrar monterade med rätt brandklass", "type": "yes_no" },
              { "label": "Branddörr – dörrstängare fungerar (dörren sluter helt)", "type": "yes_no" },
              { "label": "Branddörr – tätningslister hela och intakta", "type": "yes_no" },
              { "label": "Inga branddörrar uppkilade eller blockerade", "type": "yes_no" }
            ]
          },
          {
            "name": "Utrymning",
            "items": [
              { "label": "Utrymningsvägar fria och tillgängliga", "type": "yes_no" },
              { "label": "Utrymningsskyltar monterade enligt ritning", "type": "yes_no" },
              { "label": "Nödbelysning installerad och testad", "type": "yes_no" },
              { "label": "Fri bredd utrymningsväg", "type": "measurement", "config": { "unit": "mm", "min": 900 } }
            ]
          },
          {
            "name": "Brandtekniska installationer",
            "items": [
              { "label": "Brandvarnare/brandlarm monterade och testade", "type": "yes_no" },
              { "label": "Handbrandsläckare placerade enligt plan", "type": "yes_no" },
              { "label": "Avvikelser / anmärkningar", "type": "text" }
            ]
          }
        ]
      }'::jsonb
    ) ON CONFLICT DO NOTHING;

    -- 5. Egenkontroll – Elinstallation
    INSERT INTO public.checklist_templates (tenant_id, name, description, category, structure)
    VALUES (
      t.id,
      'Egenkontroll – Elinstallation',
      'Kontrollpunkter för elinstallation enligt Elsäkerhetsverkets föreskrifter (ELSÄK-FS) och SS 436 40 00.',
      'El',
      '{
        "sections": [
          {
            "name": "Centralutrustning",
            "items": [
              { "label": "Elcentral monterad enligt ritning (placering, höjd)", "type": "yes_no" },
              { "label": "Jordfelsbrytare installerade (typ och märkström)", "type": "yes_no" },
              { "label": "Automatsäkringar/dvärgbrytare – rätt dimensionerade", "type": "yes_no" },
              { "label": "Gruppförteckning upprättad och monterad i central", "type": "yes_no" }
            ]
          },
          {
            "name": "Ledningsdragning",
            "items": [
              { "label": "Kabeltyp och dimension enligt ritning", "type": "yes_no" },
              { "label": "Kablar fästa med rätt klammningsavstånd", "type": "yes_no" },
              { "label": "Skyddsrör vid genomföringar och i betong/mark", "type": "yes_no" },
              { "label": "Kablar separerade från vatten- och värmerör", "type": "yes_no" }
            ]
          },
          {
            "name": "Provning & Mätning",
            "items": [
              { "label": "Isolationsmätning utförd och godkänd", "type": "yes_no" },
              { "label": "Isolationsresistans", "type": "measurement", "config": { "unit": "MΩ", "min": 1 } },
              { "label": "Skyddsjordsmätning utförd", "type": "yes_no" },
              { "label": "Skyddsutjämning platta/armering kontrollerad", "type": "yes_no" },
              { "label": "Funktionsprovning av jordfelsbrytare", "type": "yes_no" },
              { "label": "Avvikelser / anmärkningar", "type": "text" }
            ]
          }
        ]
      }'::jsonb
    ) ON CONFLICT DO NOTHING;

    -- 6. Egenkontroll – VVS (Tappvatten & Avlopp)
    INSERT INTO public.checklist_templates (tenant_id, name, description, category, structure)
    VALUES (
      t.id,
      'Egenkontroll – VVS (Tappvatten & Avlopp)',
      'Kontrollpunkter för tappvatten- och avloppsinstallationer enligt BBR och Säker Vatten branschregler.',
      'VVS',
      '{
        "sections": [
          {
            "name": "Tappvatteninstallation",
            "items": [
              { "label": "Rördragning enligt ritning (dimension, material)", "type": "yes_no" },
              { "label": "Avstängningsventiler monterade vid varje tappställe", "type": "yes_no" },
              { "label": "Täthetsprovning utförd (vattentryck)", "type": "yes_no" },
              { "label": "Provtryck", "type": "measurement", "config": { "unit": "bar" } },
              { "label": "Varmvattentemperatur vid tappställe", "type": "measurement", "config": { "unit": "°C", "min": 50 } },
              { "label": "Isolering av rör (kallvatten mot kondens, varmvatten mot värmeförlust)", "type": "yes_no" }
            ]
          },
          {
            "name": "Avloppsinstallation",
            "items": [
              { "label": "Avloppsrör – dimension och fall enligt ritning", "type": "yes_no" },
              { "label": "Fall på liggande avlopp", "type": "measurement", "config": { "unit": "mm/m" } },
              { "label": "Avloppsledningar provade (täthetsprov/vattenfyllning)", "type": "yes_no" },
              { "label": "Rensöppningar/rensluckor monterade på tillgänglig plats", "type": "yes_no" },
              { "label": "Ventilation av avloppssystem (luftning)", "type": "yes_no" }
            ]
          },
          {
            "name": "Dokumentation",
            "items": [
              { "label": "Installationer dokumenterade med foton innan inbyggnad", "type": "yes_no" },
              { "label": "Avvikelser / anmärkningar", "type": "text" }
            ]
          }
        ]
      }'::jsonb
    ) ON CONFLICT DO NOTHING;

    -- 7. Egenkontroll – Värmeisolering & Klimatskal
    INSERT INTO public.checklist_templates (tenant_id, name, description, category, structure)
    VALUES (
      t.id,
      'Egenkontroll – Värmeisolering & Klimatskal',
      'Kontrollpunkter för värmeisolering av väggar, tak och golv samt klimatskalets lufttäthet enligt BBR kap 9.',
      'Isolering',
      '{
        "sections": [
          {
            "name": "Värmeisolering väggar",
            "items": [
              { "label": "Isoleringsmaterial enligt beskrivning (typ och fabrikat)", "type": "text" },
              { "label": "Isoleringstjocklek i yttervägg", "type": "measurement", "config": { "unit": "mm" } },
              { "label": "Isolering tryckt mot underlag utan springor/köldbryggor", "type": "yes_no" },
              { "label": "Ångspärr/diffusionsspärr monterad på varm sida", "type": "yes_no" },
              { "label": "Ångspärr – skarvar tejpade/limmade (överlapp min 200 mm)", "type": "yes_no" }
            ]
          },
          {
            "name": "Värmeisolering tak/vindsbjälklag",
            "items": [
              { "label": "Isoleringstjocklek i tak/vindsbjälklag", "type": "measurement", "config": { "unit": "mm" } },
              { "label": "Vindskydd monterat (undertaksskiva/duk)", "type": "yes_no" },
              { "label": "Ventilerad luftspalt under takpanel", "type": "yes_no" }
            ]
          },
          {
            "name": "Lufttäthet",
            "items": [
              { "label": "Lufttäthetsprovning (Blower door) utförd", "type": "yes_no" },
              { "label": "Uppmätt luftläckage", "type": "measurement", "config": { "unit": "l/s·m² vid 50 Pa", "max": 0.6 } },
              { "label": "Tätning vid fönster- och dörranslutningar", "type": "yes_no" },
              { "label": "Tätning vid genomföringar (el, VVS, ventilation)", "type": "yes_no" },
              { "label": "Avvikelser / anmärkningar", "type": "text" }
            ]
          }
        ]
      }'::jsonb
    ) ON CONFLICT DO NOTHING;

  END LOOP;
END $$;
