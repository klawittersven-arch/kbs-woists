/*
 * Die Begriffe im Spiel. Diese Datei darfst du auf GitHub ändern (Stift-Symbol, dann „Commit changes“).
 * Diese Datei lesen Handys, Beamer UND der Cloudflare-Dienst. Nach dem Hochladen gilt sie überall.
 *
 * Jede Zeile ist ein Begriff:
 *   stelle   Kennung der gezeichneten Stelle. Nicht ändern! Alle gezeichneten Stellen stehen in der README.
 *   bild     Auf welcher Abbildung gesucht wird:
 *            'skelett-vorn', 'skelett-hinten', 'muskeln-vorn', 'muskeln-hinten' oder 'organe'.
 *            Mehrere sind möglich, z. B. ['muskeln-vorn', 'muskeln-hinten'], dann wird jedes Mal ausgelost.
 *   einfach  So heißt die Stelle bei „Einfach“ (deutsches Wort).
 *   schwer   So heißt die Stelle bei „Schwer“ (Fachbegriff).
 *   nur      (wahlweise) nur: 'schwer' bedeutet: Der Begriff kommt nur bei „Schwer“ dran.
 *
 * Ändern: nur den Text zwischen den Hochkommas ' … ' ändern.
 * Weglassen: Zeile löschen oder zwei Schrägstriche // an den Anfang der Zeile schreiben.
 * In der Auflösung nach einem Fehler steht immer beides da, z. B. „Femur = Oberschenkelknochen“.
 */
export const BEGRIFFE = [
  // ---------------------------------------------------------------- Skelett
  { stelle: 'cranium', bild: 'skelett-vorn', einfach: 'Schädel', schwer: 'Cranium' },
  { stelle: 'os-frontale', bild: 'skelett-vorn', einfach: 'Stirnbein', schwer: 'Os frontale' },
  { stelle: 'os-parietale', bild: 'skelett-hinten', einfach: 'Scheitelbein', schwer: 'Os parietale', nur: 'schwer' },
  { stelle: 'os-occipitale', bild: 'skelett-hinten', einfach: 'Hinterhauptbein', schwer: 'Os occipitale' },
  { stelle: 'orbita', bild: 'skelett-vorn', einfach: 'Augenhöhle', schwer: 'Orbita' },
  { stelle: 'os-zygomaticum', bild: 'skelett-vorn', einfach: 'Jochbein', schwer: 'Os zygomaticum', nur: 'schwer' },
  { stelle: 'maxilla', bild: 'skelett-vorn', einfach: 'Oberkiefer', schwer: 'Maxilla' },
  { stelle: 'mandibula', bild: 'skelett-vorn', einfach: 'Unterkiefer', schwer: 'Mandibula' },
  { stelle: 'clavicula', bild: 'skelett-vorn', einfach: 'Schlüsselbein', schwer: 'Clavicula' },
  { stelle: 'sternum', bild: 'skelett-vorn', einfach: 'Brustbein', schwer: 'Sternum' },
  { stelle: 'costae', bild: 'skelett-vorn', einfach: 'Rippen', schwer: 'Costae' },
  { stelle: 'scapula', bild: 'skelett-hinten', einfach: 'Schulterblatt', schwer: 'Scapula' },
  { stelle: 'columna', bild: 'skelett-hinten', einfach: 'Wirbelsäule', schwer: 'Columna vertebralis' },
  { stelle: 'vertebrae-cervicales', bild: 'skelett-hinten', einfach: 'Halswirbel', schwer: 'Vertebrae cervicales' },
  { stelle: 'vertebrae-thoracicae', bild: 'skelett-hinten', einfach: 'Brustwirbel', schwer: 'Vertebrae thoracicae' },
  { stelle: 'vertebrae-lumbales', bild: ['skelett-vorn', 'skelett-hinten'], einfach: 'Lendenwirbel', schwer: 'Vertebrae lumbales' },
  { stelle: 'humerus', bild: 'skelett-vorn', einfach: 'Oberarmknochen', schwer: 'Humerus' },
  { stelle: 'radius', bild: 'skelett-vorn', einfach: 'Speiche', schwer: 'Radius' },
  { stelle: 'ulna', bild: 'skelett-vorn', einfach: 'Elle', schwer: 'Ulna' },
  { stelle: 'manus', bild: 'skelett-vorn', einfach: 'Hand', schwer: 'Ossa manus' },
  { stelle: 'ossa-carpi', bild: 'skelett-vorn', einfach: 'Handwurzelknochen', schwer: 'Ossa carpi', nur: 'schwer' },
  { stelle: 'ossa-metacarpi', bild: 'skelett-vorn', einfach: 'Mittelhandknochen', schwer: 'Ossa metacarpi', nur: 'schwer' },
  { stelle: 'phalanges-manus', bild: 'skelett-vorn', einfach: 'Fingerknochen', schwer: 'Phalanges manus' },
  { stelle: 'pelvis', bild: 'skelett-vorn', einfach: 'Becken', schwer: 'Pelvis' },
  { stelle: 'os-ilium', bild: 'skelett-vorn', einfach: 'Darmbein', schwer: 'Os ilium' },
  { stelle: 'os-pubis', bild: 'skelett-vorn', einfach: 'Schambein', schwer: 'Os pubis', nur: 'schwer' },
  { stelle: 'os-ischii', bild: 'skelett-hinten', einfach: 'Sitzbein', schwer: 'Os ischii', nur: 'schwer' },
  { stelle: 'os-sacrum', bild: 'skelett-hinten', einfach: 'Kreuzbein', schwer: 'Os sacrum' },
  { stelle: 'os-coccygis', bild: 'skelett-hinten', einfach: 'Steißbein', schwer: 'Os coccygis' },
  { stelle: 'femur', bild: 'skelett-vorn', einfach: 'Oberschenkelknochen', schwer: 'Femur' },
  { stelle: 'patella', bild: 'skelett-vorn', einfach: 'Kniescheibe', schwer: 'Patella' },
  { stelle: 'tibia', bild: 'skelett-vorn', einfach: 'Schienbein', schwer: 'Tibia' },
  { stelle: 'fibula', bild: 'skelett-vorn', einfach: 'Wadenbein', schwer: 'Fibula' },
  { stelle: 'pes', bild: 'skelett-vorn', einfach: 'Fuß', schwer: 'Ossa pedis' },
  { stelle: 'ossa-tarsi', bild: 'skelett-vorn', einfach: 'Fußwurzelknochen', schwer: 'Ossa tarsi', nur: 'schwer' },
  { stelle: 'ossa-metatarsi', bild: 'skelett-vorn', einfach: 'Mittelfußknochen', schwer: 'Ossa metatarsi', nur: 'schwer' },
  { stelle: 'phalanges-pedis', bild: 'skelett-vorn', einfach: 'Zehenknochen', schwer: 'Phalanges pedis' },
  { stelle: 'calcaneus', bild: 'skelett-hinten', einfach: 'Fersenbein', schwer: 'Calcaneus' },

  // ---------------------------------------------------------------- Muskeln
  { stelle: 'm-occipitofrontalis', bild: 'muskeln-vorn', einfach: 'Stirnmuskel', schwer: 'M. occipitofrontalis' },
  { stelle: 'm-temporalis', bild: 'muskeln-vorn', einfach: 'Schläfenmuskel', schwer: 'M. temporalis', nur: 'schwer' },
  { stelle: 'm-orbicularis-oculi', bild: 'muskeln-vorn', einfach: 'Ringmuskel des Auges', schwer: 'M. orbicularis oculi' },
  { stelle: 'm-orbicularis-oris', bild: 'muskeln-vorn', einfach: 'Ringmuskel des Mundes', schwer: 'M. orbicularis oris' },
  { stelle: 'm-masseter', bild: 'muskeln-vorn', einfach: 'Kaumuskel', schwer: 'M. masseter' },
  { stelle: 'm-sternocleidomastoideus', bild: 'muskeln-vorn', einfach: 'Kopfwender', schwer: 'M. sternocleidomastoideus' },
  { stelle: 'm-trapezius', bild: 'muskeln-hinten', einfach: 'Kapuzenmuskel', schwer: 'M. trapezius' },
  { stelle: 'm-deltoideus', bild: ['muskeln-vorn', 'muskeln-hinten'], einfach: 'Deltamuskel', schwer: 'M. deltoideus' },
  { stelle: 'm-pectoralis-major', bild: 'muskeln-vorn', einfach: 'Großer Brustmuskel', schwer: 'M. pectoralis major' },
  { stelle: 'm-serratus-anterior', bild: 'muskeln-vorn', einfach: 'Vorderer Sägemuskel', schwer: 'M. serratus anterior', nur: 'schwer' },
  { stelle: 'm-rectus-abdominis', bild: 'muskeln-vorn', einfach: 'Gerader Bauchmuskel', schwer: 'M. rectus abdominis' },
  { stelle: 'm-obliquus-externus-abdominis', bild: 'muskeln-vorn', einfach: 'Äußerer schräger Bauchmuskel', schwer: 'M. obliquus externus abdominis' },
  { stelle: 'm-biceps-brachii', bild: 'muskeln-vorn', einfach: 'Bizeps (zweiköpfiger Armmuskel)', schwer: 'M. biceps brachii' },
  { stelle: 'm-triceps-brachii', bild: 'muskeln-hinten', einfach: 'Trizeps (dreiköpfiger Armmuskel)', schwer: 'M. triceps brachii' },
  { stelle: 'm-brachioradialis', bild: 'muskeln-vorn', einfach: 'Oberarm-Speichen-Muskel', schwer: 'M. brachioradialis', nur: 'schwer' },
  { stelle: 'm-latissimus-dorsi', bild: 'muskeln-hinten', einfach: 'Breiter Rückenmuskel', schwer: 'M. latissimus dorsi' },
  { stelle: 'm-infraspinatus', bild: 'muskeln-hinten', einfach: 'Untergrätenmuskel', schwer: 'M. infraspinatus', nur: 'schwer' },
  { stelle: 'm-teres-major', bild: 'muskeln-hinten', einfach: 'Großer Rundmuskel', schwer: 'M. teres major', nur: 'schwer' },
  { stelle: 'm-erector-spinae', bild: 'muskeln-hinten', einfach: 'Rückenstrecker', schwer: 'M. erector spinae' },
  { stelle: 'm-gluteus-maximus', bild: 'muskeln-hinten', einfach: 'Großer Gesäßmuskel', schwer: 'M. gluteus maximus' },
  { stelle: 'm-gluteus-medius', bild: 'muskeln-hinten', einfach: 'Mittlerer Gesäßmuskel', schwer: 'M. gluteus medius' },
  { stelle: 'm-tensor-fasciae-latae', bild: 'muskeln-vorn', einfach: 'Schenkelbindenspanner', schwer: 'M. tensor fasciae latae', nur: 'schwer' },
  { stelle: 'm-quadriceps-femoris', bild: 'muskeln-vorn', einfach: 'Vierköpfiger Oberschenkelmuskel', schwer: 'M. quadriceps femoris' },
  { stelle: 'm-rectus-femoris', bild: 'muskeln-vorn', einfach: 'Gerader Oberschenkelmuskel', schwer: 'M. rectus femoris', nur: 'schwer' },
  { stelle: 'm-vastus-lateralis', bild: 'muskeln-vorn', einfach: 'Äußerer Oberschenkelmuskel', schwer: 'M. vastus lateralis', nur: 'schwer' },
  { stelle: 'm-vastus-medialis', bild: 'muskeln-vorn', einfach: 'Innerer Oberschenkelmuskel', schwer: 'M. vastus medialis', nur: 'schwer' },
  { stelle: 'm-sartorius', bild: 'muskeln-vorn', einfach: 'Schneidermuskel', schwer: 'M. sartorius' },
  { stelle: 'mm-adductores', bild: 'muskeln-vorn', einfach: 'Adduktoren (Schenkelanzieher)', schwer: 'Mm. adductores' },
  { stelle: 'mm-ischiocrurales', bild: 'muskeln-hinten', einfach: 'Hintere Oberschenkelmuskeln', schwer: 'Mm. ischiocrurales' },
  { stelle: 'm-biceps-femoris', bild: 'muskeln-hinten', einfach: 'Zweiköpfiger Oberschenkelmuskel', schwer: 'M. biceps femoris', nur: 'schwer' },
  { stelle: 'm-semitendinosus', bild: 'muskeln-hinten', einfach: 'Halbsehnenmuskel', schwer: 'M. semitendinosus', nur: 'schwer' },
  { stelle: 'm-tibialis-anterior', bild: 'muskeln-vorn', einfach: 'Vorderer Schienbeinmuskel', schwer: 'M. tibialis anterior' },
  { stelle: 'm-gastrocnemius', bild: 'muskeln-hinten', einfach: 'Zwillingswadenmuskel', schwer: 'M. gastrocnemius' },
  { stelle: 'm-soleus', bild: 'muskeln-hinten', einfach: 'Schollenmuskel', schwer: 'M. soleus', nur: 'schwer' },
  { stelle: 'tendo-calcaneus', bild: 'muskeln-hinten', einfach: 'Achillessehne', schwer: 'Tendo calcaneus' },

  // ---------------------------------------------------------------- Organe
  { stelle: 'cerebrum', bild: 'organe', einfach: 'Großhirn', schwer: 'Cerebrum' },
  { stelle: 'oculus', bild: 'organe', einfach: 'Auge', schwer: 'Oculus' },
  { stelle: 'larynx', bild: 'organe', einfach: 'Kehlkopf', schwer: 'Larynx' },
  { stelle: 'glandula-thyreoidea', bild: 'organe', einfach: 'Schilddrüse', schwer: 'Glandula thyreoidea' },
  { stelle: 'trachea', bild: 'organe', einfach: 'Luftröhre', schwer: 'Trachea' },
  { stelle: 'bronchi', bild: 'organe', einfach: 'Bronchien', schwer: 'Bronchi' },
  { stelle: 'oesophagus', bild: 'organe', einfach: 'Speiseröhre', schwer: 'Oesophagus' },
  { stelle: 'pulmo', bild: 'organe', einfach: 'Lunge', schwer: 'Pulmo' },
  { stelle: 'cor', bild: 'organe', einfach: 'Herz', schwer: 'Cor' },
  { stelle: 'diaphragma', bild: 'organe', einfach: 'Zwerchfell', schwer: 'Diaphragma' },
  { stelle: 'hepar', bild: 'organe', einfach: 'Leber', schwer: 'Hepar' },
  { stelle: 'vesica-biliaris', bild: 'organe', einfach: 'Gallenblase', schwer: 'Vesica biliaris' },
  { stelle: 'gaster', bild: 'organe', einfach: 'Magen', schwer: 'Gaster' },
  { stelle: 'splen', bild: 'organe', einfach: 'Milz', schwer: 'Splen (Lien)' },
  { stelle: 'pancreas', bild: 'organe', einfach: 'Bauchspeicheldrüse', schwer: 'Pancreas' },
  { stelle: 'duodenum', bild: 'organe', einfach: 'Zwölffingerdarm', schwer: 'Duodenum' },
  { stelle: 'ren', bild: 'organe', einfach: 'Niere', schwer: 'Ren' },
  { stelle: 'intestinum-tenue', bild: 'organe', einfach: 'Dünndarm', schwer: 'Intestinum tenue' },
  { stelle: 'intestinum-crassum', bild: 'organe', einfach: 'Dickdarm', schwer: 'Intestinum crassum' },
  { stelle: 'colon', bild: 'organe', einfach: 'Grimmdarm', schwer: 'Colon', nur: 'schwer' },
  { stelle: 'caecum', bild: 'organe', einfach: 'Blinddarm', schwer: 'Caecum' },
  { stelle: 'appendix', bild: 'organe', einfach: 'Wurmfortsatz', schwer: 'Appendix vermiformis' },
  { stelle: 'vesica-urinaria', bild: 'organe', einfach: 'Harnblase', schwer: 'Vesica urinaria' },
];
