-- ============================================================================
-- DOMUN CONTROL OBRA - RESPALDO DE BASE DE DATOS (SQL DUMP)
-- Tipo: Completo
-- Generado: 2026-10-13T04:00:02.025Z
-- Generado por: Joshua Da Figue Figueroa
-- Alcance: Datos completos de las entidades seleccionadas
-- Total tablas objetivo: 46
-- ============================================================================

BEGIN;
SET statement_timeout = 0;
SET client_encoding = 'UTF8';

-- ----------------------------------------------------------------------------
-- TABLA: public."rol" (7 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."rol" ("id", "nombre_rol", "nivel_permisos", "permisos", "activo", "created_at", "descripcion") VALUES
  ('20736fbd-759b-4313-8a9b-47c67038a487', 'IngenieroResidente', 70, '{"clima":["read","write"],"plazos":["read","write"],"bitacora":["read","write","aprobar"],"reportes":["read","export"],"proyectos":["read"],"hoja_sabana":["read","write","editar_ajustada"],"control_calidad":["read","write"],"evidencia_fotografica":["read","write"]}'::jsonb, TRUE, '2026-08-08T18:47:31.487341+00:00', 'Responsable legal de la obra, valida registros técnicos y firma la bitácora digital'),
  ('7c2c1948-ed67-426e-a16f-3daafa880a4f', 'Contratante', 20, '{"reportes":["read","export"],"dashboard":["read"],"proyectos":["read"],"hoja_sabana":["read"],"evidencia_fotografica":["read"]}'::jsonb, TRUE, '2026-08-08T18:47:31.487341+00:00', 'Perfil de solo lectura para consulta de avances reales y descarga de reportes oficiales'),
  ('ae3a6e64-378a-47ef-a232-e8707d3e8304', 'Laboratorista', 0, '{"Dashboard limitado":["*"],"Ver proyectos asignados":["*"],"Crear notas de bitácora":["*"],"Firma digital de bitácora":["*"],"Subir fotografías y evidencias":["*"]}'::jsonb, TRUE, '2026-08-08T18:47:31.487341+00:00', 'Ingreso de resultados de ensayos de calidad y cumplimiento de normas del Libro Azul'),
  ('21f49b24-7aa3-4fa1-b78a-124da0616ce3', 'Administrador', 0, '{"Dashboard completo":["*"],"Dashboard limitado":["*"],"Eliminar proyectos":["*"],"Gestionar usuarios":["*"],"Dashboard ejecutivo":["*"],"Ver proyectos asignados":["*"],"Crear notas de bitácora":["*"],"Crear y editar proyectos":["*"],"Supervisar avances viales":["*"],"Aprobar notas de bitácora":["*"],"Firma digital de bitácora":["*"],"Gestionar roles y permisos":["*"],"Asignar delegados residentes":["*"],"Generar reportes PDF / Excel":["*"],"Reportes avanzados de costos":["*"],"Configurar plan de trabajo DGC":["*"],"Subir fotografías y evidencias":["*"],"Acceso a Mantenimiento de Tablas":["*"],"Gestión de Catálogos de Empresas":["*"],"Configuración General de la Empresa":["*"]}'::jsonb, TRUE, '2026-08-08T18:47:31.487341+00:00', 'Acceso total, configuración global y gestión de usuarios y roles'),
  ('42fac085-845f-4a51-bf05-a8a3e0301fd7', 'AuxiliarDeCampo', 0, '{"Dashboard limitado":["*"],"Ver proyectos asignados":["*"],"Crear notas de bitácora":["*"],"Firma digital de bitácora":["*"],"Subir fotografías y evidencias":["*"]}'::jsonb, TRUE, '2026-08-08T18:47:31.487341+00:00', 'Registro diario de avances físicos, condiciones climáticas y captura de evidencias con GPS'),
  ('a62d6e9f-ee72-4211-863d-758a81586329', 'Gerencia', 80, '{"alertas":["read"],"bitacora":["read"],"finanzas":["read"],"reportes":["read","export"],"usuarios":["read","write"],"dashboard":["read"],"proyectos":["read"],"hoja_sabana":["read"],"evidencia_fotografica":["read"]}'::jsonb, TRUE, '2026-08-08T18:47:31.487341+00:00', 'Monitoreo estratégico del portafolio, consulta de dashboards y alertas de riesgo'),
  ('f9e22c0f-4e92-4ea9-909c-df84632242df', 'Topografo', 0, '{"Dashboard limitado":["*"],"Ver proyectos asignados":["*"],"Crear notas de bitácora":["*"],"Firma digital de bitácora":["*"],"Subir fotografías y evidencias":["*"]}'::jsonb, TRUE, '2026-09-20T17:28:51.56619+00:00', 'Mide, analiza y representa gráficamente la superficie y los elementos de un terreno') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."departamento" (22 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."departamento" ("id", "nombre") VALUES
  ('4664e194-329c-40aa-b847-6218fbdf706f', 'Guatemala'),
  ('e6e3b49b-b48d-4f6d-a1ec-729d6ca02c2e', 'El Progreso'),
  ('e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'Chimaltenango'),
  ('bf20e310-7d53-4804-a127-5e4521deaf22', 'Escuintla'),
  ('7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'Santa Rosa'),
  ('ba911aad-377a-4914-9ea3-33f624b38a33', 'Quetzaltenango'),
  ('129eeca6-57ed-4407-9e98-85f1014a72b6', 'Retalhuleu'),
  ('34d3b333-0de6-42c3-94f3-485d1523670e', 'San Marcos'),
  ('628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Huehuetenango'),
  ('6eb81692-1fc4-42c9-82cd-e926e65e6ed9', 'Baja Verapaz'),
  ('295eb63a-2755-480c-b22f-a470dca77d3a', 'Alta Verapaz'),
  ('db47e10e-a627-4b75-abfd-843f67128d1b', 'Izabal'),
  ('5d655811-e3f8-4130-bfef-30c45aaac7e4', 'Zacapa'),
  ('75ac4938-c221-4f1a-9498-cac517768189', 'Chiquimula'),
  ('3a9660f9-8f3d-440e-861d-f8d20c3a6eb8', 'Jalapa'),
  ('5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Jutiapa'),
  ('871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'Sacatepéquez'),
  ('8dac770c-4ba8-48a0-9518-b34c75c851ed', 'Sololá'),
  ('04d36f0f-d624-4a3b-bfd8-0669e0e53398', 'Totonicapán'),
  ('0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'Suchitepéquez'),
  ('97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Quiché'),
  ('5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'Petén') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."municipio" (338 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."municipio" ("id", "departamento_id", "nombre") VALUES
  ('36775702-1241-41c4-ab30-625cd65d931e', '295eb63a-2755-480c-b22f-a470dca77d3a', 'San Pedro Carchá'),
  ('1e122c06-84b6-4a07-afbb-171a51ea6d3f', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'Chimaltenango'),
  ('19d840b8-e697-4ab9-bf69-e62ee5da7ade', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'El Tejar'),
  ('3f87c903-aef9-4fcc-90ac-f9cf21c18a94', 'e6e3b49b-b48d-4f6d-a1ec-729d6ca02c2e', 'Guastatoya'),
  ('9193b4d2-1fc8-4530-a26d-5a9eaba40913', 'e6e3b49b-b48d-4f6d-a1ec-729d6ca02c2e', 'Sanarate'),
  ('ae8d8f74-375a-4ef7-975a-c8700567fc61', 'bf20e310-7d53-4804-a127-5e4521deaf22', 'Escuintla'),
  ('676412db-60c6-4c8a-99de-f7434e85a6c3', 'bf20e310-7d53-4804-a127-5e4521deaf22', 'San José'),
  ('ba94c547-1f56-4001-bc25-7e52f1365fa6', 'bf20e310-7d53-4804-a127-5e4521deaf22', 'Santa Lucía Cotzumalguapa'),
  ('ddff80cc-6370-4c72-bec7-0af3f5c911d7', '4664e194-329c-40aa-b847-6218fbdf706f', 'Guatemala'),
  ('73ea6193-6850-443e-8d62-31561b4ee308', '4664e194-329c-40aa-b847-6218fbdf706f', 'Mixco'),
  ('0b2d746b-ef2d-4f8d-8dcf-9b2f12c71ba8', '4664e194-329c-40aa-b847-6218fbdf706f', 'San Juan Sacatepéquez'),
  ('39aeddd2-362b-4afc-b04b-f2891ae5babc', '4664e194-329c-40aa-b847-6218fbdf706f', 'San Miguel Petapa'),
  ('6daa1c9c-d23a-439a-be6f-5bb54ceda770', '4664e194-329c-40aa-b847-6218fbdf706f', 'Santa Catarina Pinula'),
  ('1d2ff04e-d193-435e-a98f-7788d80ece68', '4664e194-329c-40aa-b847-6218fbdf706f', 'Villa Nueva'),
  ('0d0e9c37-fdf2-4f4a-85a0-b21a73bf50a6', 'db47e10e-a627-4b75-abfd-843f67128d1b', 'Morales'),
  ('d4336f9a-5b73-4bdb-9431-b1db852c5304', 'db47e10e-a627-4b75-abfd-843f67128d1b', 'Puerto Barrios'),
  ('7d90218e-b1a5-483c-b305-25a5cb317682', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'Flores'),
  ('5f526ef6-0365-403b-8121-87e9e82ddd88', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'San Benito'),
  ('31f7cd11-29e8-41f4-ac06-5cc3f2c81337', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Coatepeque'),
  ('72ed4cbb-ef50-492a-a8dd-8fe00a363215', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Quetzaltenango'),
  ('9da41896-478b-46ee-bf25-3c177855464d', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Salcajá'),
  ('dca68c80-9cdd-47aa-b352-a4da80be7d67', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'Antigua Guatemala'),
  ('14ef1907-d207-463c-a0cd-81f365cda2ac', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'Pueblo Nuevo'),
  ('b5200afb-29db-4fcc-94d3-b80fbc73eac3', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'Nahualá'),
  ('ae54af53-92ac-45cd-840f-939c6ae7770d', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'Ciudad Vieja'),
  ('2039ac20-bb7a-4fe6-8650-deb5f4629103', '3a9660f9-8f3d-440e-861d-f8d20c3a6eb8', 'San Pedro Pinula'),
  ('6ea097a3-8635-4f75-9653-5a89d2445db8', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'Cuyotenango'),
  ('a7ed4929-4bb0-4417-83bb-5c82d32cbcfc', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Santa Catarina Mita'),
  ('adeb0594-37b7-4605-b50f-721150dbedbe', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Nentón'),
  ('fb9da18c-c8f6-4fb0-88f6-e2b0638b7791', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'San Juan Comalapa'),
  ('307f8c19-92e7-4b2f-b8d3-6c73c3570493', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Chisec'),
  ('601f91d6-9094-4df3-b429-3db8d8779122', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'El Adelanto'),
  ('aa26f560-b38e-4244-b589-68995114a047', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'San Pedro Nécta'),
  ('29fb474e-340f-4536-b432-5f0a7ac34f24', '4664e194-329c-40aa-b847-6218fbdf706f', 'San José Pinula'),
  ('d3d74b46-32a4-4309-853a-c3b0e0428635', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Sacapulas'),
  ('e6aa8e59-1f2a-4ae0-b7e0-2a46c59bc02f', '75ac4938-c221-4f1a-9498-cac517768189', 'Esquipulas'),
  ('715ae701-1316-42bc-bbc7-9a2dbd0885a0', '129eeca6-57ed-4407-9e98-85f1014a72b6', 'Nuevo San Carlos'),
  ('83b820fc-08a9-4eac-ada7-d63dfeb42f15', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Cuilco'),
  ('0145b108-51a0-4c35-a50d-87f9e2ccabd2', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Tamahú'),
  ('25ff115d-bf71-4942-b9c8-ba220246995d', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Tactic'),
  ('7f8b81da-16a5-4f69-bbce-7a1b28c20b48', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Tucurú'),
  ('42e714ca-20a9-4b91-9c16-83a62a8d7d3b', '5d655811-e3f8-4130-bfef-30c45aaac7e4', 'La Unión'),
  ('aa85dd53-9fb8-4909-b323-4858a2b9820b', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'San José La Máquina'),
  ('934bb46f-8e18-4937-a1fe-55c375aea878', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Santa Bárbara'),
  ('8d76069e-e19e-4a96-be89-b5d6082b24e4', '34d3b333-0de6-42c3-94f3-485d1523670e', 'San José Ojetenam'),
  ('33f65574-0e65-438f-b4e6-e80a8047a14e', '75ac4938-c221-4f1a-9498-cac517768189', 'San Juan Ermita'),
  ('e156863f-d73a-468a-b191-08e6c336462d', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'Casillas'),
  ('bf51d1b2-bccd-4519-a033-16609d741180', 'e6e3b49b-b48d-4f6d-a1ec-729d6ca02c2e', 'San Cristóbal Acasaguastlán'),
  ('3f855e00-fb3d-432e-9378-64bea3bd08bb', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'San Juan Tecuaco'),
  ('e20b1ec9-ecc2-48f6-99da-f17ed1f46c98', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'Santa Clara La Laguna') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "public"."municipio" ("id", "departamento_id", "nombre") VALUES
  ('d8eb9f89-98f6-495f-aa87-629f640666e0', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Patzité'),
  ('236c1bcd-68e1-49c3-9dc7-de695cda80dd', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'Santiago Sacatepéquez'),
  ('1b29a27e-8d6c-4650-80f4-b0ce906e3a9a', '04d36f0f-d624-4a3b-bfd8-0669e0e53398', 'San Francisco El Alto'),
  ('93436331-f9ac-43d9-8b1f-7fe3c0342418', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'San Pedro La Laguna'),
  ('62ecbbb5-a5ac-404e-bff6-e09ed314bb81', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'San Mateo'),
  ('ea4c5236-b665-4d7a-9fb0-b9c9f4391e6c', '3a9660f9-8f3d-440e-861d-f8d20c3a6eb8', 'Jalapa'),
  ('1a24f700-6f18-400d-a7c0-0d8d25fabd12', 'e6e3b49b-b48d-4f6d-a1ec-729d6ca02c2e', 'El Jícaro'),
  ('b1dd510b-cfd2-4e59-bb4f-4214bbf5f32d', '6eb81692-1fc4-42c9-82cd-e926e65e6ed9', 'Salamá'),
  ('958a2713-3b81-49e7-9b0c-cd17a3715655', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'Mazatenango'),
  ('ce8e684f-427f-444c-b3ba-fd78c9902807', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Chiché'),
  ('0d0ba4f6-3774-4b8c-8700-7e4f334bfb67', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'San Lucas Sacatepéquez'),
  ('0c3ec985-bad7-4ac4-bcdd-de30164d2c58', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'San Pablo Jocopilas'),
  ('57de542f-8539-42c8-8445-9bbc16d0e874', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'San Rafael Pétzal'),
  ('27cabf5d-59d8-4721-98d3-b5d2880d906f', 'bf20e310-7d53-4804-a127-5e4521deaf22', 'San Vicente Pacaya'),
  ('5e3458ed-f3d1-4a0a-9eb0-6fd654827634', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'San Miguel Sigüilá'),
  ('78dd0bc6-36eb-4668-ac25-58b46a755765', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Zapotitlán'),
  ('f2600252-ba62-4189-a121-5e1b3e6a1f7c', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Colomba Costa Cuca'),
  ('de30e525-6b4d-4330-a289-a7fcfee67a96', '129eeca6-57ed-4407-9e98-85f1014a72b6', 'Champerico'),
  ('5e566b6d-67f2-4b1e-ba33-405a2aa34c87', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Zunil'),
  ('92f5dfe3-1244-4b36-b47f-36d970613379', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Santa Ana Huista'),
  ('40b790c3-c885-4408-87c4-b0b38b08a0e5', '75ac4938-c221-4f1a-9498-cac517768189', 'Olopa'),
  ('0d9e85c6-f91f-4820-ba73-b213ccc0a815', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'Santa Rosa de Lima'),
  ('189aa9d8-46ac-4358-aa85-c0e6afc20167', '5d655811-e3f8-4130-bfef-30c45aaac7e4', 'San Diego'),
  ('62183ae6-ecb8-419b-a5cf-de9d1e11bdee', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'Pueblo Nuevo Viñas'),
  ('2876710e-360d-4f9d-9fc3-4b1d937eb2f8', '34d3b333-0de6-42c3-94f3-485d1523670e', 'San Cristóbal Cucho'),
  ('52bb3db8-3e50-49dd-a701-c00d44f230b9', 'e6e3b49b-b48d-4f6d-a1ec-729d6ca02c2e', 'San Agustín Acasaguastlán'),
  ('72660b31-d9e7-485a-a9e8-1c1f532d4164', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'San Rafael las Flores'),
  ('10de303e-097b-4221-9fb2-bb2fcc39a9c4', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Cobán'),
  ('d112bf03-3f1a-493e-8510-2601063aa420', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Jacaltenango'),
  ('9e7b53d9-ad77-4d9d-97ac-1775cadae969', '5d655811-e3f8-4130-bfef-30c45aaac7e4', 'Zacapa'),
  ('bba50ba0-c67a-48a6-80a1-50688cc78356', '34d3b333-0de6-42c3-94f3-485d1523670e', 'La Reforma'),
  ('4a7eb3f0-d2a7-4064-851d-5edfa7f5709e', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'Zunilito'),
  ('e78ac9a4-0fc2-4e7d-a911-c923f270a6fb', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'Santa Cruz Naranjo'),
  ('02cfe193-2e94-43d5-b923-86897ca2b1d5', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'San Miguel Dueñas'),
  ('9d0f2c09-0845-4603-976b-7a6356b1f377', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Cahabón'),
  ('e35aba9b-49a3-4fc1-b964-c311e22f1d01', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'El Chal'),
  ('192a6568-d954-4350-8790-174f898392de', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'San José El Ídolo'),
  ('07821020-15db-4a3c-bc6e-abee8eafbd6d', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'Santo Domingo Suchitepéquez'),
  ('f942aadc-2921-42c0-b8d0-dba8d99a9fce', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'Patzicía'),
  ('2320b0ed-d0ab-47e8-8eed-b72bbf048b50', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'San Gabriel'),
  ('68957bc5-6546-4af2-9741-cef1a8a9499e', '4664e194-329c-40aa-b847-6218fbdf706f', 'San José del Golfo'),
  ('8fe903d7-0792-4ebc-b810-15ab9647e261', '5d655811-e3f8-4130-bfef-30c45aaac7e4', 'Teculután'),
  ('b487162d-64e2-465c-9e61-bdd483401133', '4664e194-329c-40aa-b847-6218fbdf706f', 'Chinautla'),
  ('de4ef85f-97eb-49d5-8e56-eb98cbc12871', '5d655811-e3f8-4130-bfef-30c45aaac7e4', 'Gualán'),
  ('7220cb14-5d48-4b96-9702-ab59ea36c87d', '34d3b333-0de6-42c3-94f3-485d1523670e', 'San Antonio Sacatepéquez'),
  ('c922bc34-ed9d-452a-a1d0-b1e72a6199f8', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Santa Catalina la Tinta'),
  ('024ef33f-fdab-427b-8d37-2e68dabd2c45', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Quesada'),
  ('cf740de7-181d-4e3c-87cd-5702ca2d58c6', '75ac4938-c221-4f1a-9498-cac517768189', 'Quetzaltepeque'),
  ('21413692-4e54-4325-bbe1-18a2a5174b2d', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Comapa'),
  ('dc34b7e8-888e-47e2-a4ba-6ae65c5d732f', '75ac4938-c221-4f1a-9498-cac517768189', 'Concepción Las Minas') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "public"."municipio" ("id", "departamento_id", "nombre") VALUES
  ('6159e6ef-c7e1-4c71-a66c-7bc7d8c63657', '129eeca6-57ed-4407-9e98-85f1014a72b6', 'San Sebastián'),
  ('604cc06d-3cd1-420e-95c0-6114ef52fa76', '129eeca6-57ed-4407-9e98-85f1014a72b6', 'El Asintal'),
  ('56569d5f-560b-49ca-a069-003be618ed21', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'San Pedro Soloma'),
  ('8594391e-8630-43e0-8933-a412b780d302', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'San Antonio Ilotenango'),
  ('e9d1549c-2bd7-4c3a-9fc2-78967aa57276', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Flores Costa Cuca'),
  ('dbc475d3-cf40-44d2-838b-6e2ecf2dc583', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'Zaragoza'),
  ('920c8444-2539-4cce-95c5-d7fcf74c35d9', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Huehuetenango'),
  ('fedff5e9-8d6b-4589-906f-379ac15da83e', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'Santa Bárbara'),
  ('2f180984-1788-4f96-ace9-ae0decc1d366', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Malacatán'),
  ('7007d62f-f9a1-471e-aae3-8128c73fe64b', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'Chicacao'),
  ('e2a7c104-0fb7-4f0d-837b-080c14135672', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Concepción Tutuapa'),
  ('a758bdc9-7f45-4238-9fde-861cfae784d8', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Joyabaj'),
  ('369b08bb-aeb6-44c5-81ec-827647d5f9f4', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'San José'),
  ('edecd578-9849-4eae-a04e-10664b14ee8c', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Chinique'),
  ('4e07ae41-bd89-498f-b471-800f01521f0f', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Canillá'),
  ('75a89d75-cad2-4869-ae73-4b1c03a78104', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'San Bartolomé Milpas Altas'),
  ('e3c3dac5-c126-4267-8cb5-f889c2fd1716', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'Taxisco'),
  ('122da1c3-dd5d-413e-9969-3d6c1c46c74e', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'Santa María Visitación'),
  ('4626de0c-1b68-4147-b3de-faaa2b9c1865', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Senahú'),
  ('c9ab0ee0-e4a3-4a30-b96d-8d01632d00ae', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'Santa Catarina Palopó'),
  ('69da8bab-1988-4717-b86e-1e0747fc01ad', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'San Antonio Huista'),
  ('b07585fb-08b4-4ec0-9b25-07b057468bc0', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Santa Cruz Barillas'),
  ('2fd27ca1-5fcb-4c54-b3aa-3161cdb98324', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Cabricán'),
  ('3e13679e-6519-48d5-ba87-bab6ccfafabb', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Aguacatán'),
  ('27b659d3-8453-4196-9c77-ad168cd02030', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Palestina de Los Altos'),
  ('74c1a62b-f5f2-4196-9dd3-92f474135fc7', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'Samayac'),
  ('2c0a157d-1284-49b5-bb90-525a19701a2e', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'La Democracia'),
  ('845eb1b8-75a7-44cc-8add-db3e8eb72075', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Tajumulco'),
  ('25c71266-428b-4ef9-8c86-f3cf5b025aa7', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Ixcán'),
  ('79b24ed3-ca64-4c9c-bc67-4ca707cd4842', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'San Francisco Zapotitlán'),
  ('f12851e6-c681-44d2-b877-5d67710e7a75', '34d3b333-0de6-42c3-94f3-485d1523670e', 'San Marcos'),
  ('66133744-1157-49c4-88ae-881c6ded0d18', '4664e194-329c-40aa-b847-6218fbdf706f', 'Chuarrancho'),
  ('02396cf1-247f-41f8-878f-2c3a3d9b1730', '6eb81692-1fc4-42c9-82cd-e926e65e6ed9', 'Cubulco'),
  ('bb62e865-538c-4511-a29b-60169c484df2', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'Sololá'),
  ('9aed5b92-0703-44e4-b4f3-0061d09ea82d', 'bf20e310-7d53-4804-a127-5e4521deaf22', 'La Gomera'),
  ('8b68cb0b-dc74-4b68-8290-8a136edac0a5', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'San Miguel Panán'),
  ('9e4de566-e287-4c21-b400-2c89db03f3c5', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'Acatenango'),
  ('e402fbdc-a8d1-4d46-8c66-e9d7acb63207', 'bf20e310-7d53-4804-a127-5e4521deaf22', 'Guanagazapa'),
  ('7f1ff38f-0d72-4566-a2d2-7c59e847b8e4', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'San Antonio Aguas Calientes'),
  ('29e3da41-5eff-4aec-b4f3-b0eeff439e7e', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'San Pedro Yepocapa'),
  ('aca7ca52-0890-413d-bada-7cf04a1b9b35', '129eeca6-57ed-4407-9e98-85f1014a72b6', 'San Felipe'),
  ('bad75a0f-6ceb-4834-9e9d-e96c2971cf76', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'San Andrés Semetabaj'),
  ('cace5b51-730c-4ac5-86ac-985119fafe43', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'Pastores'),
  ('f38546aa-e03c-415e-9475-20d65b8150c7', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'Panajachel'),
  ('c81132f4-3547-4e8d-bcc0-631ffad8533e', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'La Esperanza'),
  ('155cca1f-8539-47c7-9498-4d9f33e01748', '3a9660f9-8f3d-440e-861d-f8d20c3a6eb8', 'San Luis Jilotepeque'),
  ('569b19cb-5f5f-4d29-8425-612391b7766a', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Jutiapa'),
  ('fa6a163b-463e-4844-a229-6e4e53daadb9', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'San Ildefonso Ixtahuacán'),
  ('10e7159c-f70d-48a7-9b16-4b3afba1a07d', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Lanquín'),
  ('0087fa3a-6f45-44ce-bc6f-1e32061b6679', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'El Progreso') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "public"."municipio" ("id", "departamento_id", "nombre") VALUES
  ('7a8572f7-7890-4f68-8a2b-ad36e6bd7117', '34d3b333-0de6-42c3-94f3-485d1523670e', 'San Rafael Pie de la Cuesta'),
  ('11174fc3-d52b-4544-bec2-5319d085909e', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'San Antonio Suchitepéquez'),
  ('912f2529-2866-4f9a-906e-68e4c7d4ebdc', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'Santiago Atitlán'),
  ('89830f31-c1ff-4221-b864-27a070bd9938', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Ixchiguán'),
  ('35b9e3be-4fbc-4778-9dd7-3e3c77df8d88', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Ayutla'),
  ('bd2e687d-ddda-4252-ac39-cc9c3ec79c78', '6eb81692-1fc4-42c9-82cd-e926e65e6ed9', 'Purulhá'),
  ('49f60b12-8a09-4dfd-9f6b-4e5d4a059d5f', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Esquipulas Palo Gordo'),
  ('70950a31-7f35-4eb8-81cf-94d5e0a53cca', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Colotenango'),
  ('8b4573e1-c7fe-4d0c-b340-d9bbaa55f642', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Pachalum'),
  ('5f6e0798-a16d-42c8-a006-a48ccf306577', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'San Lorenzo'),
  ('6ef78921-c9ab-457a-b7f1-44de0e95abf0', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Catarina'),
  ('d5f43038-a076-49e9-bedf-a2a0a1238c0e', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'Alotenango'),
  ('a1f4d20f-0f0e-4491-9538-223945f93805', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'San Juan Ostuncalco'),
  ('f0a00cc2-1c43-405f-95f5-ecb440ebf1f9', '6eb81692-1fc4-42c9-82cd-e926e65e6ed9', 'San Miguel Chicaj'),
  ('6612c073-e2eb-400d-a026-eda9dd803667', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Agua Blanca'),
  ('f29bb3a1-16eb-4633-bc3b-bfc5a769f2e0', '6eb81692-1fc4-42c9-82cd-e926e65e6ed9', 'San Jerónimo'),
  ('3174b01a-1764-40c4-b63d-4cdafe05e1ab', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'San José Poaquíl'),
  ('0cbe46f0-84c8-4c62-ad3d-26e5c361a8e8', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Nebaj'),
  ('ff7a7b1a-6cfd-4b48-b547-dd01770eacf3', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'La Libertad'),
  ('c240b89f-af13-45e6-91d6-23ceaf95a930', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'San Andrés Itzapa'),
  ('4f5f55e2-7a29-42b1-8d28-8b7f6e76e43a', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'San Andrés Sajcabajá'),
  ('e84686cf-f7fd-438f-89b4-7cfaaf6c3982', '295eb63a-2755-480c-b22f-a470dca77d3a', 'San Cristóbal Verapaz'),
  ('8752f567-78ce-4cf1-8c08-49bd5c444df5', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'Santa María de Jesús'),
  ('148c17b6-ca45-42a9-a5ca-6d791850cd53', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'San Carlos Sija'),
  ('52eb21b7-6f01-4ff1-b634-762a20525e6d', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'San Bernardino'),
  ('55c6c2b0-310e-48af-b67c-e11664a65bfa', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Cantel'),
  ('3cde1e61-7196-473e-9c16-e1cbbf99595f', '4664e194-329c-40aa-b847-6218fbdf706f', 'San Pedro Sacatepéquez'),
  ('e526565d-254d-4660-b895-af9ba04af430', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Tacaná'),
  ('88555aac-2b43-4fc2-9e09-c3aa33e2b374', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Cunén'),
  ('ed390bd3-2de2-467f-81f4-692cf8d36fa1', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Zacualpa'),
  ('dae17de2-4984-463f-84f7-f8d1a1ff4b31', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'San Pablo La Laguna'),
  ('32290c46-e658-4968-9922-4a32e1e93f00', '04d36f0f-d624-4a3b-bfd8-0669e0e53398', 'Santa María Chiquimula'),
  ('741c4d0a-7aa2-44aa-bcf3-eb471d47f19b', '34d3b333-0de6-42c3-94f3-485d1523670e', 'La Blanca'),
  ('cd5afe96-02ed-462e-984a-67717bd9398d', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Tectitán'),
  ('f71ed64f-dc16-4e4e-97fd-8622eaa612b3', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'San Mateo Ixtatán'),
  ('ba43747d-0908-4bcc-a99e-f6cbd1554e61', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Jerez'),
  ('2de4e988-c262-4819-93c2-04ab64eb9581', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'Jocotenango'),
  ('f9757f5b-13d2-44b5-9a99-0ff6980c372a', '129eeca6-57ed-4407-9e98-85f1014a72b6', 'San Andrés Villa Seca'),
  ('51e575f1-a7ac-46e6-9282-8ce8d2760db6', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Sibilia'),
  ('6f688fc6-79f0-430d-a2f6-b51da25fd11b', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'Santa María Ixhuatán'),
  ('7ccf57f6-df54-4ef1-af9e-8132a0724376', 'db47e10e-a627-4b75-abfd-843f67128d1b', 'Livingston'),
  ('f1bf468c-b686-4329-bca2-786c46cfdea0', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Comitancillo'),
  ('508b3836-c9cf-48c9-9ce1-5469f94340ba', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Atescatempa'),
  ('5314a6f7-08da-4232-8800-0e0fdf279ddf', '295eb63a-2755-480c-b22f-a470dca77d3a', 'San Juan Chamelco'),
  ('74d3959b-b99e-4187-b725-c3cdd2083e4b', '3a9660f9-8f3d-440e-861d-f8d20c3a6eb8', 'Monjas'),
  ('0e020367-67a7-427c-8a1b-9c460daf2e94', '4664e194-329c-40aa-b847-6218fbdf706f', 'Palencia'),
  ('ad846721-d340-4ce8-8914-a81503d09041', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'Dolores'),
  ('e781686f-2024-4267-a832-ce8fdf2e68ad', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'Tecpán Guatemala'),
  ('64cf5601-b7d5-4002-80b3-f516b2622102', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'San Francisco La Unión'),
  ('6e69359b-7848-4f12-8012-0eae1c3d70b0', '3a9660f9-8f3d-440e-861d-f8d20c3a6eb8', 'San Manuel Chaparrón') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "public"."municipio" ("id", "departamento_id", "nombre") VALUES
  ('e3cd6e15-acc0-4cb7-a76f-69ba5f6ff877', '129eeca6-57ed-4407-9e98-85f1014a72b6', 'Retalhuleu'),
  ('e8744677-16d6-4f7f-a810-ef8a2a791222', '4664e194-329c-40aa-b847-6218fbdf706f', 'Amatitlán'),
  ('9085365e-7719-474c-b587-2407567244fe', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'Pochuta'),
  ('6dc6d5ec-6723-4763-97d1-ddba59987c0d', '04d36f0f-d624-4a3b-bfd8-0669e0e53398', 'Totonicapán'),
  ('69e1571d-8463-44e1-b3eb-086bf44f0a04', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'San Martín Jilotepeque'),
  ('20aa0a97-89bd-4375-bb2e-759b721ee0a2', 'db47e10e-a627-4b75-abfd-843f67128d1b', 'Los Amates'),
  ('c29cbfe8-6486-4ebb-b590-9efc7a52e977', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'Santa Cruz La Laguna'),
  ('9435ff8d-319d-4018-a379-8ac576357d9f', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'Parramos'),
  ('d3817daa-537a-4602-804d-c2483a7eb3fd', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'San Francisco'),
  ('4dc64feb-690c-435c-b7db-2fd9e1275dde', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'Santo Tomás La Unión'),
  ('2027dd14-75ac-4193-af5c-cd1a7ae2e639', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'San Luis'),
  ('ba850539-8145-400d-86e7-b88f57a868ba', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'San Sebastián Coatán'),
  ('4348635c-996b-41e9-aadc-c9a0a09615b5', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Panzós'),
  ('1a1ddf4e-dc65-4afa-bd26-81130fa19b03', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'San José Acatempa'),
  ('1ed307c2-27bc-442a-9fed-fca94cc33706', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Santiago Chimaltenango'),
  ('5c170f6a-5f54-48d9-8627-4c731183389c', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'Las Cruces'),
  ('e5ade4f3-1972-4516-acdc-7b4b60dacf7b', 'bf20e310-7d53-4804-a127-5e4521deaf22', 'Iztapa'),
  ('c75a253d-2bfa-4834-b19d-3ca1377b30d9', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'Sumpango'),
  ('2e8e1795-3006-4e0f-9e0d-b4f43063115c', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'San Miguel Acatán'),
  ('0c76df3f-6086-4176-b816-16aa73b5fba4', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'Sayaxché'),
  ('eaabee8b-5174-4366-b7ae-1f0451c6af23', '04d36f0f-d624-4a3b-bfd8-0669e0e53398', 'Momostenango'),
  ('dd3b4d8a-2313-422e-b39a-7b9cfe4eadaf', '6eb81692-1fc4-42c9-82cd-e926e65e6ed9', 'Granados'),
  ('2f1f0394-7937-4d27-85ff-b09b4fe82ae6', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'San Pedro Jocopilas'),
  ('764c0161-42e1-4e37-92ed-47709dbc4ad4', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'El Palmar'),
  ('f428fa20-69db-4b8f-a323-56e5a10336a2', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'Santa Catarina Ixtahuacán'),
  ('1d8bff7b-02f1-45e3-9654-3268d8649202', '5d655811-e3f8-4130-bfef-30c45aaac7e4', 'Estanzuela'),
  ('b4c38076-0d45-417f-afa4-eac40be92250', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Moyuta'),
  ('284111c1-45d3-4e54-9b83-f66a8aa1cc05', 'e6e3b49b-b48d-4f6d-a1ec-729d6ca02c2e', 'Morazán'),
  ('ecc7224b-fde6-4f89-9378-28c4a34c6cba', '5d655811-e3f8-4130-bfef-30c45aaac7e4', 'Cabañas'),
  ('a9c74beb-5c14-4ecf-8385-5182f79ecb1c', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Chajul'),
  ('3a166120-dac2-4c45-b8bd-29467733056f', 'bf20e310-7d53-4804-a127-5e4521deaf22', 'La Democracia'),
  ('cb012692-ee30-4c91-94f5-b7421f4d680a', '5d655811-e3f8-4130-bfef-30c45aaac7e4', 'Usumatlán'),
  ('9992a2b9-f5b5-47f5-a6dd-15957d8f7b57', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'Cuilapa'),
  ('7cf76260-022c-4fe3-849b-e98fae8a63f9', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'Santa Apolonia'),
  ('c054fd86-8cf5-4fc1-99cc-5ea6985a2d7f', '04d36f0f-d624-4a3b-bfd8-0669e0e53398', 'San Cristóbal Totonicapán'),
  ('48062262-ad19-4f86-8e8d-172e2503db69', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Ocós'),
  ('571ab3c7-d70f-4132-8793-d8e3bc51117e', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'San Martín Sacatepéquez'),
  ('e94e5b88-0f7e-416a-b048-0994d068795a', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'Melchor de Mencos'),
  ('3f400a24-5216-443e-a258-9466f04417cb', 'bf20e310-7d53-4804-a127-5e4521deaf22', 'Nueva Concepción'),
  ('4393a929-e398-46c5-8bcc-396d7756319d', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Santo Tomás Chichicastenango'),
  ('7c586423-5d34-4f88-a13b-d663246f7191', 'bf20e310-7d53-4804-a127-5e4521deaf22', 'Palín'),
  ('f8acb4e7-d2c4-4a0a-a213-609656da6233', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'Patzún'),
  ('ec1f2421-4ddf-423b-a50f-4fd9d5db85fc', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Pajapita'),
  ('434bd3c2-9f79-4eb6-a6d3-ffd224e556a1', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Uspantán'),
  ('2db12097-a2d8-425b-8170-b5d41612ba7f', '4664e194-329c-40aa-b847-6218fbdf706f', 'Fraijanes'),
  ('8f4c531e-da56-49a7-9413-9e3205ab0c77', '5d655811-e3f8-4130-bfef-30c45aaac7e4', 'San Jorge'),
  ('d4a82f4a-bcc3-4d29-ab84-95b23a23ea9a', 'bf20e310-7d53-4804-a127-5e4521deaf22', 'Siquinalá'),
  ('53c35b63-3dd5-49f2-82f3-4863a64d42a5', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'Chiquimulilla'),
  ('e958b237-6725-4f9d-9a4e-7e2f76f8c547', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'San Juan Bautista'),
  ('0f1c7da4-64fb-4915-9ff0-1ae031704af4', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Asunción Mita') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "public"."municipio" ("id", "departamento_id", "nombre") VALUES
  ('736dbd4c-4e4c-450a-b8d3-0272560b908b', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Fray Bartolomé de las Casas'),
  ('8b4e089a-7152-40c8-aa8d-fe5f73c12a26', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Unión Cantinil'),
  ('7365b8e3-5b6d-468c-9acd-f784badd9308', '4664e194-329c-40aa-b847-6218fbdf706f', 'San Pedro Ayampuc'),
  ('c4d14408-0a30-4bb3-a649-e2a39d6841e5', 'e1eb507b-5bd9-47f9-b5f6-e14bf0aa59ba', 'Santa Cruz Balanyá'),
  ('9dcbad25-91ab-469b-83ae-7094877e7b0f', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'Santo Domingo Xenacoj'),
  ('04f0c6fe-7b00-4d1c-b9c4-a5da74e7d0e7', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'La Libertad'),
  ('1ad0c7c2-69d6-45f2-927b-7ab89c1308cf', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'San Gaspar Ixchil'),
  ('1c0e8783-0b1d-42ee-8036-38add379e0a8', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Raxruhá'),
  ('7aab846d-0ede-449b-8844-7373f547fe8a', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'Santa Lucía Milpas Altas'),
  ('fd35c4d5-8566-4afb-95bd-5aea56369bc7', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Chicamán'),
  ('dc3b822f-dba0-4745-a308-b2aec0648643', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Jalpatagua'),
  ('bc532645-f331-4249-b1b8-6cc13a9b7b3d', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'Poptún'),
  ('c7405bf2-65f4-459d-b0c0-d1a1c6256fac', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Chahal'),
  ('058b2768-b001-4144-b1c8-f0c2640222b8', '129eeca6-57ed-4407-9e98-85f1014a72b6', 'San Martín Zapotitlán'),
  ('2f4f75f2-0c23-4ed2-aabe-467384f6d7db', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'San Sebastián Huehuetenango'),
  ('fb3caaf7-3ac6-4140-9dc1-90f8ce2eee71', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Huitán'),
  ('04027a11-bb06-42fe-930f-97e76cd6fe28', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Malacatancito'),
  ('7cbc50ac-aa88-4672-a523-88bdf70f2024', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Pasaco'),
  ('3165b3b2-f802-4bf8-9434-6dee67f2fea8', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Sipacapa'),
  ('274b2d7f-b67f-40e1-aed1-eb8a5211464b', '4664e194-329c-40aa-b847-6218fbdf706f', 'Villa Canales'),
  ('a5ba37c0-79b2-4461-8b8a-09115e4b2d7a', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Concepción Chiquirichapa'),
  ('f9231c70-46ea-4b47-96c7-3da02844da0f', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Nuevo Progreso'),
  ('c72be708-030f-47bf-a53a-30aef766aaf0', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'Santa Catarina Barahona'),
  ('206fbf0e-a408-4c8a-bdab-772ea8c89e7f', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'Barberena'),
  ('abbf0564-4d24-4818-850a-0c582fcd8bd2', '34d3b333-0de6-42c3-94f3-485d1523670e', 'San Pedro Sacatepéquez'),
  ('457c49e9-562a-4943-a613-bb6fb966b748', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'San Juan Cotzal'),
  ('fcff0ea4-3fcb-4578-b181-9768a0f89258', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'San Rafael La Independencia'),
  ('71b57990-78df-4d82-a006-5441d22ef889', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'San Marcos La Laguna'),
  ('d60af289-624d-406e-9d43-e567f781b06c', '75ac4938-c221-4f1a-9498-cac517768189', 'San Jacinto'),
  ('6595c821-b3d0-482a-9982-4b4493c4285b', '871717bd-c0f0-4a37-966d-8b8a251a3bb4', 'Magdalena Milpas Altas'),
  ('6d3bb524-975f-478f-8035-2e3b6edc68b4', '34d3b333-0de6-42c3-94f3-485d1523670e', 'San José El Rodeo'),
  ('4055283d-91c6-4c33-ab3c-325a0c2daed1', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Conguaco'),
  ('5c77490c-b60d-4877-8040-09de4e16c941', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'Santa Lucía Utatlán'),
  ('5cb893f5-2fcc-489f-929c-6903c20db1c1', '04d36f0f-d624-4a3b-bfd8-0669e0e53398', 'Santa Lucía La Reforma'),
  ('bf934784-1da0-479b-939d-258b41bedc48', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Chiantla'),
  ('ec26615e-56dd-4840-ae70-eed1574ccef2', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Olintepeque'),
  ('b35da04a-c14e-4dbf-830b-de36e3f749e8', '4664e194-329c-40aa-b847-6218fbdf706f', 'San Raymundo'),
  ('a059809e-afc1-4888-84b1-569f291354b6', '34d3b333-0de6-42c3-94f3-485d1523670e', 'El Tumbador'),
  ('75f04aa4-babd-4327-b366-d96a8fb04f84', '75ac4938-c221-4f1a-9498-cac517768189', 'Chiquimula'),
  ('5a8898fc-c6d2-4095-8ea0-31cd3361aab6', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'San José Chacayá'),
  ('8391822e-40f8-4732-91f0-5fba9434d4a9', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Génova'),
  ('0add8605-aec3-4b33-a992-022bbabbcaa6', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'Santa Ana'),
  ('58320186-e53f-4712-af68-61aa9ddf4734', '34d3b333-0de6-42c3-94f3-485d1523670e', 'San Miguel Ixtahuacán'),
  ('1b9ddb89-e6f5-46e2-9c3a-4921c37b9928', '75ac4938-c221-4f1a-9498-cac517768189', 'Ipala'),
  ('e79c5890-187d-4d74-a764-42e9c290deed', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'San Juan Atitán'),
  ('a3e19f6a-9ddc-48b6-b87b-e200ad1b9a7d', '04d36f0f-d624-4a3b-bfd8-0669e0e53398', 'San Andrés Xecul'),
  ('7e4533a0-8d52-4a24-a872-ca4983f3451a', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'Santa Cruz del Quiché'),
  ('0cc2431e-eafb-45d9-a695-e8757f9c1e05', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Cajolá'),
  ('4613ba13-8307-4ba4-9af0-74961c797beb', '5d655811-e3f8-4130-bfef-30c45aaac7e4', 'Río Hondo'),
  ('bbd995e0-3fab-4fae-a498-56e921429e1f', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Tejutla') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "public"."municipio" ("id", "departamento_id", "nombre") VALUES
  ('83b33e3b-630c-4aa3-8d94-d8a1c6f2e60e', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'San Juan La Laguna'),
  ('509af2c8-db35-4ab5-b4da-e56723df12ce', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'San Antonio Palopó'),
  ('cefb3c23-5994-4598-b6a4-aac77f537c5f', '129eeca6-57ed-4407-9e98-85f1014a72b6', 'Santa Cruz Muluá'),
  ('ecad51c8-7712-4417-9329-4e19a1bcf93c', 'ba911aad-377a-4914-9ea3-33f624b38a33', 'Almolonga'),
  ('5e6c7a57-4222-4336-a4d0-77e666b83d9b', '295eb63a-2755-480c-b22f-a470dca77d3a', 'Santa Cruz Verapaz'),
  ('e97ce406-726f-4e38-a6a9-7efdf643f68d', '5d655811-e3f8-4130-bfef-30c45aaac7e4', 'Huité'),
  ('1c529cea-0eb8-4287-b794-8165fa6c2590', '6eb81692-1fc4-42c9-82cd-e926e65e6ed9', 'Rabinal'),
  ('8a641d85-c55f-428e-8424-07450ac308ee', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Concepción Huista'),
  ('a9d6161f-c21c-4dcb-b748-dd75e8f7d422', '34d3b333-0de6-42c3-94f3-485d1523670e', 'El Quetzal'),
  ('8180e1e4-c544-4d6d-8188-aba7a0666b8b', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'San Lucas Tolimán'),
  ('66b52fef-a742-461f-b212-b87e2d854f0e', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'Nueva Santa Rosa'),
  ('cf495c21-310d-45ee-8e2a-f564148fea96', '34d3b333-0de6-42c3-94f3-485d1523670e', 'San Lorenzo'),
  ('77e3fe3f-a59b-4c3e-9c7d-9b1949688f52', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'San Juan Ixcoy'),
  ('f62ec038-513c-4bc7-96b6-77f875405e3e', '34d3b333-0de6-42c3-94f3-485d1523670e', 'San Pablo'),
  ('f9090343-5002-40dd-8087-e5c523097ad3', '3a9660f9-8f3d-440e-861d-f8d20c3a6eb8', 'San Carlos Alzatate'),
  ('7d40d40e-e55f-4643-bc0f-d567f85c13ca', '5858e2de-cf30-4006-b4d1-66ccf48c7321', 'Yupiltepeque'),
  ('34f12de3-f851-48bc-afb5-55fae094450e', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Todos Santos Cuchumatán'),
  ('55335793-a498-4a26-baa5-b1c1c1b668d3', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'Patulul'),
  ('8b24ef1c-95b4-4eb0-9ed4-b09053227a94', 'db47e10e-a627-4b75-abfd-843f67128d1b', 'El Estor'),
  ('4777cce5-7eda-45e5-9003-ff7f51427803', '5d8b25ce-0fb9-44d7-8d41-b73f3dcdf7b1', 'San Andrés'),
  ('7aff33cc-e2bc-497a-9e1a-b1980f5be3d9', '8dac770c-4ba8-48a0-9518-b34c75c851ed', 'Concepción'),
  ('57dd787c-a2f5-4aac-9fd4-fe2a965c35b5', '628b51e7-4e54-4c7c-bf20-7f5ce09fdb7a', 'Santa Eulalia'),
  ('dc3a5b19-ccbc-4304-86e0-4c9f772252e4', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Río Blanco'),
  ('a444f23d-9577-4973-8b65-ca53d3b172e8', '75ac4938-c221-4f1a-9498-cac517768189', 'Jocotán'),
  ('63b309e3-040e-4bf3-b3c6-b932c5293b1b', '6eb81692-1fc4-42c9-82cd-e926e65e6ed9', 'Santa Cruz el Chol'),
  ('ffb677cc-c80a-4ce6-b86f-01946c48645b', '04d36f0f-d624-4a3b-bfd8-0669e0e53398', 'San Bartolo'),
  ('bf01cc0d-73b4-4c5c-af3b-0fc6b3618e28', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'Oratorio'),
  ('c24c8e3a-7665-4d3b-a2a7-c9a0d46e2389', 'bf20e310-7d53-4804-a127-5e4521deaf22', 'Tiquisate'),
  ('54783b13-699b-44c9-aabf-0b83b5157ebf', '0e0ba31e-ccea-4c9a-9716-31fb1df7a2f6', 'Río Bravo'),
  ('b236f74b-c9c2-4d14-a78c-4e6666687c1a', '7d1ce6e1-3e1e-4d88-8d6b-0d9d47bf5bf5', 'Guazacapán'),
  ('8373b719-de61-4d95-8108-bb4706b0ab0e', '3a9660f9-8f3d-440e-861d-f8d20c3a6eb8', 'Mataquescuintla'),
  ('21115136-0433-41bb-832d-e8e2b5b00802', 'e6e3b49b-b48d-4f6d-a1ec-729d6ca02c2e', 'San Antonio La Paz'),
  ('7454a627-ea10-4036-8193-c244d480084a', '75ac4938-c221-4f1a-9498-cac517768189', 'San José la Arada'),
  ('231c75a2-e70e-4677-ac87-00e0a430f19b', '97250a4a-32d6-4113-a4b2-f38809bd0af1', 'San Bartolomé Jocotenango'),
  ('59b049e8-8a61-46a0-be11-b374e84b5316', '34d3b333-0de6-42c3-94f3-485d1523670e', 'Sibinal'),
  ('e1593d4c-d895-49f0-816a-5711d688be9d', 'bf20e310-7d53-4804-a127-5e4521deaf22', 'Masagua'),
  ('05437464-e3ce-40b2-9ad9-898170ecc9b0', 'e6e3b49b-b48d-4f6d-a1ec-729d6ca02c2e', 'Sansare'),
  ('832d0ff0-6903-483e-a647-a27f4762cacc', '75ac4938-c221-4f1a-9498-cac517768189', 'Camotán') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."catalogo" (1 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."catalogo" ("id", "codigo", "nombre", "descripcion", "activo", "created_at") VALUES
  ('aa548cb3-8382-4a62-8b90-1185b2418326', 'estado_proyecto', 'Estado de Proyecto', 'Estados del ciclo de vida de un proyecto', TRUE, '2026-08-29T22:28:50.313725+00:00') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."catalogo_item" (6 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."catalogo_item" ("id", "catalogo_id", "codigo", "nombre", "descripcion", "color", "orden", "activo", "created_at", "updated_at") VALUES
  ('3b537e95-661f-42d7-8a1f-1c0274b8b87a', 'aa548cb3-8382-4a62-8b90-1185b2418326', 'borrador', 'Borrador', NULL, NULL, 1, TRUE, '2026-08-30T14:17:25.703347+00:00', '2026-08-30T14:17:25.703347+00:00'),
  ('8b71cce7-f8bd-4f05-a341-bbdc62145444', 'aa548cb3-8382-4a62-8b90-1185b2418326', 'activo', 'Activo', NULL, NULL, 2, TRUE, '2026-08-30T14:17:25.703347+00:00', '2026-08-30T14:17:25.703347+00:00'),
  ('fb5505ce-62b3-49e0-9145-2373d3bbe944', 'aa548cb3-8382-4a62-8b90-1185b2418326', 'en_revision', 'En Revisión', NULL, NULL, 3, TRUE, '2026-08-30T14:17:25.703347+00:00', '2026-08-30T14:17:25.703347+00:00'),
  ('ee8ef0b7-22f3-4679-9b29-b12b9b7d2295', 'aa548cb3-8382-4a62-8b90-1185b2418326', 'completado', 'Completado', NULL, NULL, 4, TRUE, '2026-08-30T14:17:25.703347+00:00', '2026-08-30T14:17:25.703347+00:00'),
  ('3b8350d8-58e0-4a74-90dc-1b9072960a93', 'aa548cb3-8382-4a62-8b90-1185b2418326', 'inactivo', 'Inactivo', NULL, NULL, 6, TRUE, '2026-09-05T23:33:00.369102+00:00', '2026-09-05T23:33:00.369102+00:00'),
  ('9a17a22a-d6bd-40c3-8909-27de9d3f5a84', 'aa548cb3-8382-4a62-8b90-1185b2418326', 'pausado', 'Pausado', NULL, NULL, 5, TRUE, '2026-08-30T14:17:25.703347+00:00', '2026-08-30T14:17:25.703347+00:00') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."catalogo_descuento_tecnico" (1 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."catalogo_descuento_tecnico" ("id", "descripcion", "factor_seccion_transversal", "created_at") VALUES
  ('a20a8700-e690-410a-928d-5e9d985b3f5c', 'Descuento Alcantarilla 1Ø36', 0.5, '2026-09-11T01:58:48.750199+00:00') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."unidad_medida" (15 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."unidad_medida" ("id", "nombre", "abreviatura", "es_discreta") VALUES
  ('f50d7c1f-5c25-4efa-870d-539af7cb3a0a', 'Metro Cuadrado', 'm2', FALSE),
  ('08f6d382-d4e4-4987-a60b-ac4e42310f07', 'Metro Cúbico', 'm3', FALSE),
  ('98d82509-2061-4d96-afee-74353358272a', 'Metro Lineal', 'ml', FALSE),
  ('45f682f9-3e04-4cf0-8c4f-fca4700604ba', 'Hectárea', 'Ha', FALSE),
  ('a54eaa80-e771-4309-825c-510e14bdc053', 'Kilómetro', 'km', FALSE),
  ('1e48e477-66ab-45c1-8bfc-cb6ca9cf07c4', 'Tonelada', 'Ton', FALSE),
  ('67c1e270-ba68-40b5-a5cc-2cac2bf0a1d5', 'Galones', 'gls', FALSE),
  ('1d01d563-1230-415d-9bde-8ce8c40d95d9', 'Kilogramo', 'kg', FALSE),
  ('5c483145-68e7-452f-b097-3e74b3319a66', 'Metro', 'm', FALSE),
  ('6e52ef87-81ac-4b18-959b-43bd6733dff6', 'Metro cúbico-kilómetro (acarreo)', 'm3-km', FALSE),
  ('1f2e7ead-9acc-45e7-b526-17a4195dd7cb', 'Mes', 'mes', TRUE),
  ('551e918c-8863-44d8-9c24-757bac51aabe', 'Unidad', 'u', TRUE),
  ('4810a4f3-b5d5-4e49-8773-e55259463d13', 'Global', 'Glb', TRUE),
  ('49cb2c52-6aa3-4111-8388-403f3150446c', 'Hoja', 'hoja', TRUE),
  ('dc024988-7e8b-4732-a1e7-8ffdb3ca6c2c', 'Árbol', 'arbol', TRUE) ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."configuracion_general" (8 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."configuracion_general" ("id", "clave", "valor", "categoria", "updated_at", "cambiado_por") VALUES
  ('a223eed1-5924-4694-91f0-0f97e60c7b9e', 'direccion_empresa', 'Ciudad de Guatemala, Guatemala', 'empresa', '2026-09-01T23:56:02.497288+00:00', NULL),
  ('04408b98-24b0-4882-b4b0-8ae056b454cb', 'telefono_empresa', '+502 2222-3333', 'empresa', '2026-09-01T23:56:02.497288+00:00', NULL),
  ('3e08a234-7771-419e-8d82-b24837caeb87', 'correo_empresa', 'contacto@domun.gt', 'empresa', '2026-09-01T23:56:02.497288+00:00', NULL),
  ('9fb3dcbf-1606-42fd-aedf-df7035c4b7f2', 'direccion', 'Ciudad de Guatemala, Guatemala', 'empresa', '2026-09-06T22:02:04.867469+00:00', NULL),
  ('03c8a279-38dc-402b-ab2f-af3ee1935130', 'telefono', '+502 2222-3333', 'empresa', '2026-09-06T22:02:05.041273+00:00', NULL),
  ('bd1d0d3f-5816-4eac-a324-37ab62297872', 'correo', 'contacto@domun.gt', 'empresa', '2026-09-06T22:02:05.222237+00:00', NULL),
  ('515d6a4e-fb76-4ac4-9fc1-a0cecc0268ab', 'nombre_empresa', 'Domun S.A', 'empresa', '2026-09-01T23:56:02.497288+00:00', NULL),
  ('50b56495-54e0-4a85-a136-058a387f3e63', 'empresa', 'Domun S.A', 'empresa', '2026-09-06T22:02:04.517458+00:00', NULL) ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."usuario" (14 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."usuario" ("id", "auth_user_id", "correo", "rol_id", "activo", "ultimo_acceso", "fecha_registro", "updated_at") VALUES
  ('31976eb7-b773-43b8-8609-3c4e87876c6e', 'a4eb4507-07a4-4e96-b1cf-a04c15e5c629', 'josuedanielf2002@gmail.com', '7c2c1948-ed67-426e-a16f-3daafa880a4f', TRUE, '2026-09-22T20:35:58.693+00:00', '2026-09-07T00:08:25.472024+00:00', '2026-09-07T00:08:25.472024+00:00'),
  ('1f471ba3-d9da-402b-8ec5-6669cfa9a291', '0c0a5381-1b59-43dc-8178-68a02fe54ea0', 'jorge.figueroa@domunnet.test', 'a62d6e9f-ee72-4211-863d-758a81586329', TRUE, '2026-09-27T00:17:43.291+00:00', '2026-08-30T05:50:30.607841+00:00', '2026-08-30T05:50:30.607841+00:00'),
  ('a700035f-b306-437e-9539-668333dfd3ec', '71741202-c67d-4d48-9262-f2e9bf469e53', 'mario.tzul@domunnet.test', 'ae3a6e64-378a-47ef-a232-e8707d3e8304', TRUE, '2026-09-20T18:10:08.641+00:00', '2026-08-31T04:20:11.134921+00:00', '2026-09-21T00:18:34.503+00:00'),
  ('67af47af-0091-47b4-9b31-b53710f4ddd5', 'be448022-b94a-4116-978e-20970aa283c0', 'gusbarri@gmail.com', 'ae3a6e64-378a-47ef-a232-e8707d3e8304', TRUE, '2026-09-16T17:27:25.932+00:00', '2026-09-16T17:24:48.099112+00:00', '2026-09-21T00:18:34.503+00:00'),
  ('7b035b68-787c-44dc-bc04-0b19c5e904aa', '5c41390d-8a46-46b8-96d9-6797c413017f', 'juancarlos_e2e_contacto_5@test.com', '7c2c1948-ed67-426e-a16f-3daafa880a4f', TRUE, NULL, '2026-09-01T22:58:42.678778+00:00', '2026-09-06T21:33:17.037+00:00'),
  ('149ff0d5-5e97-4491-8547-c896778fda40', '3387c171-777a-4eb7-8861-dadb231885b4', 'jfigueroah4@miug.edu.gt', '7c2c1948-ed67-426e-a16f-3daafa880a4f', TRUE, NULL, '2026-08-31T02:21:48.721658+00:00', '2026-09-06T21:33:35.997+00:00'),
  ('ba1da530-2364-4ecb-99d2-c7ae90ec1432', 'acfb7727-b970-4979-a02e-fe310619259d', 'jfigueroah4@misug.edu.gt', '7c2c1948-ed67-426e-a16f-3daafa880a4f', TRUE, NULL, '2026-09-07T00:09:44.196378+00:00', '2026-09-07T00:09:44.196378+00:00'),
  ('829b3416-2e1b-4d42-b378-08db3d1ce2f5', '1c917abf-9c10-4610-a9a8-7ef4fbf0835b', 'danieli.figeures@domun.gt', '20736fbd-759b-4313-8a9b-47c67038a487', TRUE, NULL, '2026-09-07T00:37:45.198291+00:00', '2026-09-07T00:37:45.198291+00:00'),
  ('73a069f0-1ad2-42d7-8557-b7eae96689c6', '1c792050-a022-43c6-a9d3-23bacc002d38', 'heriberto.escobar@domun.com', '21f49b24-7aa3-4fa1-b78a-124da0616ce3', TRUE, NULL, '2026-09-14T02:23:44.806608+00:00', '2026-09-21T00:18:44.95+00:00'),
  ('20871649-1a52-442c-a11c-bc3cb3a837cc', '1d1d0718-d897-425d-9d06-5d5050b2a0ea', 'paola.recinos@domunnet.test', '7c2c1948-ed67-426e-a16f-3daafa880a4f', TRUE, '2026-09-21T12:48:57.611+00:00', '2026-09-14T15:28:46.7405+00:00', '2026-09-14T15:28:46.7405+00:00'),
  ('b50ebad6-7e1a-49ec-ba13-dfbbc57a7a19', '48f3d7c9-7cd1-4050-b5c0-c383cc16abb0', 'daniel.figueroa@domunnet.test', '21f49b24-7aa3-4fa1-b78a-124da0616ce3', TRUE, '2026-10-13T03:58:04.451+00:00', '2026-09-07T05:55:57.260139+00:00', '2026-10-13T01:38:26.831+00:00'),
  ('d748d536-d8b4-4231-82a1-769424fb8cbb', '9a5e3698-3bba-4163-bd3f-56cc64f75eef', 'raul.alvarado@domunnet.test', '20736fbd-759b-4313-8a9b-47c67038a487', TRUE, '2026-10-11T00:47:12.736+00:00', '2026-08-08T21:06:36.345644+00:00', '2026-08-08T21:06:36.345644+00:00'),
  ('f83a3120-7aea-4945-a727-28f00ad1fcba', '74401bf6-a23b-4f20-8596-5a0a25c11e8c', 'camila.figueroa@domunnet.test', '42fac085-845f-4a51-bf05-a8a3e0301fd7', TRUE, '2026-10-11T00:47:58.501+00:00', '2026-09-14T15:28:45.79515+00:00', '2026-09-21T00:19:09.553+00:00'),
  ('52a4fd96-1e81-4c67-ad2a-8316947e83f9', '57fbbd14-37f7-426a-889c-5af6ba955f8e', 'jfigueroah4@miug.edu.gs', 'f9e22c0f-4e92-4ea9-909c-df84632242df', TRUE, NULL, '2026-09-21T00:24:36.531587+00:00', '2026-09-28T03:53:47.496+00:00') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."dato_usuario" (14 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."dato_usuario" ("id", "usuario_id", "email", "password_hash", "username", "primer_nombre", "segundo_nombre", "primer_apellido", "segundo_apellido", "telefono", "direccion", "fecha_nacimiento", "avatar_url", "estado", "fecha_registro", "ultimo_acceso", "updated_at") VALUES
  ('1061bef3-9af9-4a09-856a-e605d33a5f2d', 'd748d536-d8b4-4231-82a1-769424fb8cbb', 'raul.alvarado@domunnet.test', NULL, 'ralvarado', 'Raul', NULL, 'Alvarado', NULL, '12345678', NULL, NULL, NULL, 'Activo', '2026-08-08T21:06:36.441212+00:00', NULL, '2026-08-08T21:06:36.441212+00:00'),
  ('bcffbb9d-dfd3-408b-a653-743c7529f56d', '7b035b68-787c-44dc-bc04-0b19c5e904aa', 'juancarlos_e2e_contacto_5@test.com', NULL, 'j.pruebacontacto5', 'Juan', 'Carlos', 'PruebaContacto', 'Final', '55551234', 'Calle Falsa 123', '2002-12-02', NULL, 'Activo', '2026-09-01T22:58:42.796426+00:00', NULL, '2026-09-06T21:33:17.491+00:00'),
  ('33965896-71b4-406e-ac16-6af6d639aee0', '149ff0d5-5e97-4491-8547-c896778fda40', 'jfigueroah4@miug.edu.gt', NULL, 'jfigueroa_figue', 'Josue', 'Daniel', 'Figueroa', 'Herrear', '56252922', '1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemal', '2002-12-02', NULL, 'Activo', '2026-08-31T02:21:48.876565+00:00', NULL, '2026-09-06T21:33:36.357+00:00'),
  ('2dfa0f35-b43b-4861-bbb6-e9b4cd0a8b02', '31976eb7-b773-43b8-8609-3c4e87876c6e', 'josuedanielf2002@gmail.com', NULL, 'jf_camip', 'Josue', 'Daniel', 'Figueroa', 'Herrera', '56252844', '1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemal', '2002-09-02', NULL, 'Activo', '2026-09-07T00:08:25.637512+00:00', NULL, '2026-09-07T00:08:25.637512+00:00'),
  ('94ccc34e-f9ba-4d4a-b875-c54be6c2d6d3', '829b3416-2e1b-4d42-b378-08db3d1ce2f5', 'danieli.figeures@domun.gt', NULL, 'dfigeures', 'Danieli', 'Jorge Arturo', 'Figeures', 'Figueroa Miranda', '56252920', '1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemal', '2002-05-03', NULL, 'Activo', '2026-09-07T00:37:45.303237+00:00', NULL, '2026-09-07T00:37:45.303237+00:00'),
  ('38622853-3d48-4862-980b-9461237e7e52', 'ba1da530-2364-4ecb-99d2-c7ae90ec1432', 'jfigueroah4@misug.edu.mx', NULL, 'jf_camili', 'Josue', 'Daniel', 'Figueroa', 'Herrera', '56252930', '1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemal', '2002-09-01', NULL, 'Activo', '2026-09-07T00:09:44.301402+00:00', NULL, '2026-09-07T05:08:19.955+00:00'),
  ('fb028e25-0a02-45d0-8be2-d4dfa8123808', '1f471ba3-d9da-402b-8ec5-6669cfa9a291', 'jorge.figueroa@domunnet.test', NULL, 'jfiguerao', 'Jorge', 'Arturo', 'Figuerao', 'Miranda', '56252922', NULL, NULL, NULL, 'Activo', '2026-08-30T05:50:30.706979+00:00', NULL, '2026-08-30T05:50:30.706979+00:00'),
  ('a55fd990-6d31-44bd-ac31-d411cd054117', '67af47af-0091-47b4-9b31-b53710f4ddd5', 'gusbarri@gmail.com', NULL, 'elgusi', 'Gustavo', 'Ariel', 'Barrientos ', 'García', '56214123', NULL, NULL, NULL, 'Activo', '2026-09-16T17:24:48.265107+00:00', NULL, '2026-09-18T22:09:25.451+00:00'),
  ('804c0f04-7543-40a2-942f-e4b510fd9ee2', '73a069f0-1ad2-42d7-8557-b7eae96689c6', 'heriberto.escobar@domun.com', NULL, 'hescobar', 'Heriberto', 'Antonio', 'Escobar', NULL, '50200000000', NULL, NULL, NULL, 'Activo', '2026-09-14T02:23:44.806608+00:00', NULL, '2026-09-14T02:23:44.806608+00:00'),
  ('5ee7fe88-77d5-4440-bbb9-7d52969690f7', 'a700035f-b306-437e-9539-668333dfd3ec', 'mario.tzul@domunnet.test', NULL, 'fgonalzes', 'Freedu', 'Pedro', 'Gonalzes', 'Fernades', '56252922', 'mario.tzul@domunnet.test', '2007-05-03', NULL, 'Activo', '2026-08-31T04:20:11.236775+00:00', NULL, '2026-09-14T02:42:34.397+00:00'),
  ('6a1c6202-6288-445a-9952-1493cdaaf64f', 'f83a3120-7aea-4945-a727-28f00ad1fcba', 'camila.figueroa@domunnet.test', NULL, 'camilafigueroa', 'Camila', NULL, 'Figueroa', NULL, '12345678', NULL, NULL, NULL, 'Activo', '2026-09-14T15:28:46.137854+00:00', NULL, '2026-09-14T15:28:46.137854+00:00'),
  ('bb693bc0-6810-409e-8341-693f357e1155', '20871649-1a52-442c-a11c-bc3cb3a837cc', 'paola.recinos@domunnet.test', NULL, 'paolarecinos', 'Paola', NULL, 'Recinos', NULL, '12345678', NULL, NULL, NULL, 'Activo', '2026-09-14T15:28:47.140893+00:00', NULL, '2026-09-14T15:28:47.140893+00:00'),
  ('fa371ce9-71a8-4166-abda-cf85eab66c67', '52a4fd96-1e81-4c67-ad2a-8316947e83f9', 'jfigueroah4@miug.edu.gs', NULL, 'djuarros', 'Diana', 'Paola', 'Juarros', 'Feliz', '56252922', '1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemal', '2000-02-28', NULL, 'Activo', '2026-09-21T00:24:36.645003+00:00', NULL, '2026-09-28T03:53:10.686+00:00'),
  ('cf73b411-8341-4343-b631-5d54ec50e214', 'b50ebad6-7e1a-49ec-ba13-dfbbc57a7a19', 'daniel.figueroa@domunnet.test', NULL, 'dani', 'Joshua', 'Da', 'Figue', 'Figueroa', '56252928', '1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemala', '2003-12-02', NULL, 'Activo', '2026-09-07T05:55:57.408762+00:00', NULL, '2026-10-13T01:38:27.136+00:00') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."empresa" (1 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."empresa" ("id", "nombre", "nit", "direccion", "telefono", "correo", "logo_url", "marca_agua_url", "updated_at") VALUES
  ('c19b7c0c-79db-4254-bd53-153d0246fd05', 'DomunNet Tenant', '12345678', NULL, '12345678', 'admin@domunnet.com', NULL, NULL, '2026-08-30T14:39:00.249735+00:00') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."entidad_contratante" (5 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."entidad_contratante" ("id", "nombre", "nit", "direccion", "telefono", "correo_institucional", "activo", "created_at", "updated_at") VALUES
  ('ea20057c-9c7d-454d-b024-cf9672e40603', 'Entidad E2E Contratante', NULL, NULL, NULL, NULL, TRUE, '2026-09-01T22:58:34.919584+00:00', '2026-09-01T22:58:34.919584+00:00'),
  ('7db83cad-655d-4a60-be59-4e06c25f4a1a', 'Cami Project', '853800K', '1 calle 51-06', '56252922', 'josuedanief20@gmail.com', TRUE, '2026-09-07T00:08:26.134251+00:00', '2026-09-07T00:08:26.134251+00:00'),
  ('961eb672-e149-443d-b76a-ba3bea0991d0', 'dgc-entidad-master', NULL, NULL, NULL, NULL, TRUE, '2026-09-30T03:22:22.124055+00:00', '2026-09-30T03:22:22.124055+00:00'),
  ('739642c2-b655-4e75-85bf-2a6acf22832e', 'DIRECCIÓN GENERAL DE CAMINOS (DGC / CIV)', NULL, NULL, NULL, NULL, TRUE, '2026-09-30T03:23:41.923787+00:00', '2026-09-30T03:23:41.923787+00:00'),
  ('99bef7bc-eac7-4c8e-b1bc-49d82da55f11', 'DIRECCION GENERAL DE CAMINOS', NULL, NULL, NULL, NULL, TRUE, '2026-09-30T03:25:08.779839+00:00', '2026-09-30T03:25:08.779839+00:00') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."empresa_contratista" (1 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."empresa_contratista" ("id", "nombre", "nit", "direccion", "telefono", "correo_institucional", "activo", "created_at", "updated_at") VALUES
  ('3cb3654f-afa2-4177-8050-200445060690', 'Camilita 123', '853800K', '1 aclle 51-06, naciones 2', '56252930', 'josuedanielf2002@gmail.gt', TRUE, '2026-09-07T00:09:44.786402+00:00', '2026-09-07T05:08:17.354+00:00') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."empresa_externa" (1 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."empresa_externa" ("id", "nombre", "nit", "direccion", "telefono", "correo_institucional", "activo", "created_at", "updated_at") VALUES
  ('faf9af29-902e-4a5c-b01e-d578117958dc', 'Figues', '853800K', '1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemal', '56252922', 'jfigueroah46@mium.edu.gt', TRUE, '2026-08-31T02:21:49.229359+00:00', '2026-08-31T02:21:49.229359+00:00') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."contacto_entidad" (2 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."contacto_entidad" ("id", "entidad_contratante_id", "cargo", "created_at", "updated_at", "usuario_id") VALUES
  ('812adc47-be3f-4339-bacb-4aa2e2c5e191', 'ea20057c-9c7d-454d-b024-cf9672e40603', 'Gerente de Infraestructura', '2026-09-01T22:58:43.503302+00:00', '2026-09-01T22:58:43.503302+00:00', '7b035b68-787c-44dc-bc04-0b19c5e904aa'),
  ('95bacdff-70eb-4eef-9c58-de929dcc24af', '7db83cad-655d-4a60-be59-4e06c25f4a1a', 'Gerente', '2026-09-07T00:08:26.273407+00:00', '2026-09-07T00:08:26.273407+00:00', '31976eb7-b773-43b8-8609-3c4e87876c6e') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."contacto_contratista" (1 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."contacto_contratista" ("id", "empresa_contratista_id", "cargo", "created_at", "updated_at", "usuario_id") VALUES
  ('0835f69f-800e-4910-b269-356071551b03', '3cb3654f-afa2-4177-8050-200445060690', 'Gerente', '2026-09-07T00:09:44.897119+00:00', '2026-09-07T05:08:20.066+00:00', 'ba1da530-2364-4ecb-99d2-c7ae90ec1432') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."contacto_empresa_externa" (1 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."contacto_empresa_externa" ("id", "empresa_externa_id", "usuario_id", "nombre", "cargo", "telefono", "correo", "created_at", "updated_at") VALUES
  ('0a94146d-2822-46ca-b488-79f7978558f4', 'faf9af29-902e-4a5c-b01e-d578117958dc', '149ff0d5-5e97-4491-8547-c896778fda40', 'Josue Daniel Figueroa Herrear', 'Empresa', '56252922', 'jfigueroah4@miug.edu.gt', '2026-08-31T02:21:49.482777+00:00', '2026-08-31T02:21:49.482777+00:00') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."proyecto" (5 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."proyecto" ("id", "empresa_id", "codigo", "nombre", "descripcion", "ubicacion", "fecha_inicio", "fecha_fin_estimada", "estado_id", "responsable_id", "created_at", "updated_at", "en_replanificacion") VALUES
  ('a322bafc-c581-45d1-a137-5bbad6c5661e', 'c19b7c0c-79db-4254-bd53-153d0246fd05', 'PROY-5916', 'Proyecto Prueba ', 'Proyecto Pruebassssss', '34 Avenida, Colonia El Cerrito, Zona 18, Ciudad de Guatemala, Departamento de Guatemala', '2026-09-08', '2026-09-30', '8b71cce7-f8bd-4f05-a341-bbdc62145444', 'b50ebad6-7e1a-49ec-ba13-dfbbc57a7a19', '2026-09-07T05:49:34.67069+00:00', '2026-09-07T05:49:34.67069+00:00', FALSE),
  ('1a1b0242-e13d-431a-8e4c-50fb29e4fe57', 'c19b7c0c-79db-4254-bd53-153d0246fd05', 'DOM-VIAL-007', 'CONSTRUCCION DE FASE 1, CONEXION VAS - HINCAPIE (TRAMO SB UNO)', 'tdtdtdtddtd', 'McDonald''s, 20 Calle, Villas del Sur, Zona 6, San Miguel Petapa, Departamento de Guatemala', '2026-10-11', '2026-11-10', '3b537e95-661f-42d7-8a1f-1c0274b8b87a', NULL, '2026-10-11T00:40:47.468458+00:00', '2026-10-11T00:40:47.468458+00:00', FALSE),
  ('9a9253b1-5e08-48fa-a6e4-25e443e05240', 'c19b7c0c-79db-4254-bd53-153d0246fd05', 'PROY-BIT-TEST-0786', 'REPOSICIÓN DE CARRETERA TRAMO KM 45 A KM 60', NULL, NULL, '2026-01-01', '2026-12-31', '8b71cce7-f8bd-4f05-a341-bbdc62145444', NULL, '2026-09-30T03:37:43.251734+00:00', '2026-09-30T03:37:43.251734+00:00', FALSE),
  ('033973cb-3e6c-464d-9f11-b3756978d555', 'c19b7c0c-79db-4254-bd53-153d0246fd05', 'PROY-246', 'Proyecto Camis', 'Proyecto Camis', '8-57, 4a Calle, Residenciales Las Maravillas, Zona 1, Villa Mixco, Mixco, Zona 4, Departamento de Guatemala, 01901, Guatemala', '2026-09-06', '2026-12-03', '3b537e95-661f-42d7-8a1f-1c0274b8b87a', '829b3416-2e1b-4d42-b378-08db3d1ce2f5', '2026-09-07T00:37:55.766554+00:00', '2026-09-07T00:37:55.766554+00:00', FALSE),
  ('3c732c5f-9961-4e19-a44e-d77dfc103b94', 'c19b7c0c-79db-4254-bd53-153d0246fd05', 'PROY-6186', 'PROYECTO TEST AUTOMATIZADO BORRADOR VIAL 2026', NULL, NULL, '2026-09-28', '2026-10-28', '3b537e95-661f-42d7-8a1f-1c0274b8b87a', NULL, '2026-09-28T18:34:42.762375+00:00', '2026-09-28T18:34:42.762375+00:00', FALSE) ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."proyecto_detalle" (5 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."proyecto_detalle" ("id", "proyecto_id", "tipo_obra", "nombre_oficial", "descripcion_proyecto", "municipio_id", "tramo", "kilometro_inicio", "kilometro_fin", "numero_contrato_original", "fecha_firma_contrato_original", "numero_contrato_modificatorio", "fecha_firma_contrato_modificatorio", "acuerdo_ministerial_original", "acuerdo_ministerial_modificatorio", "numero_escritura_publica", "fecha_adjudicacion", "fecha_inicio_contractual", "fecha_finalizacion_real", "monto_original", "monto_ajustado", "empresa_contratante_id", "contacto_contratante_id", "updated_at", "empresa_supervisora", "plazo_ejecucion_original", "plazo_ejecucion_ampliado", "empresa_contratista_id", "contacto_contratista_id", "departamento_id", "latitud", "longitud", "direccion", "monto_final", "delegado_residente_id", "departamento_fin_id", "municipio_fin_id", "direccion_fin") VALUES
  ('fa14d667-09b7-4197-955a-7583e9efb645', '9a9253b1-5e08-48fa-a6e4-25e443e05240', NULL, 'REPOSICIÓN DE CARRETERA TRAMO KM 45 A KM 60', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-01', NULL, NULL, NULL, NULL, NULL, '2026-09-30T03:37:43.356564+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('52540c3a-ec5a-4d95-bbde-16569b327680', '033973cb-3e6c-464d-9f11-b3756978d555', NULL, 'Proyecto Camis', 'Proyecto Camis', '73ea6193-6850-443e-8d62-31561b4ee308', '8-57, 4a Calle, Residenciales Las Maravillas, Zona 1, Villa Mixco, Mixco, Zona 4, Departamento de Guatemala, 01901, Guatemala', 5, 11, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-06', '2026-09-06', NULL, 0, NULL, 'ea20057c-9c7d-454d-b024-cf9672e40603', NULL, '2026-09-07T00:37:55.867726+00:00', 'Domun S.A', 88, NULL, '3cb3654f-afa2-4177-8050-200445060690', NULL, '4664e194-329c-40aa-b847-6218fbdf706f', 14.630718, -90.60616, '8-57, 4a Calle, Residenciales Las Maravillas, Zona 1, Villa Mixco, Mixco, Zona 4, Departamento de Guatemala, 01901, Guatemala', NULL, '829b3416-2e1b-4d42-b378-08db3d1ce2f5', NULL, NULL, NULL),
  ('80c65b81-3b9a-46bb-bea4-0d727bb9008e', '3c732c5f-9961-4e19-a44e-d77dfc103b94', NULL, 'PROYECTO TEST AUTOMATIZADO BORRADOR VIAL 2026', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-28T18:34:42.922301+00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('3012a631-8687-4914-b567-ba830e055f3a', 'a322bafc-c581-45d1-a137-5bbad6c5661e', NULL, 'Proyecto Prueba ', 'Proyecto Pruebassssss', 'ddff80cc-6370-4c72-bec7-0af3f5c911d7', '34 Avenida, Colonia El Cerrito, Zona 18, Ciudad de Guatemala, Departamento de Guatemala', 5, 10, NULL, NULL, NULL, NULL, NULL, NULL, '142AA', '2026-09-06', '2026-09-08', '2026-09-30', 16240, NULL, 'ea20057c-9c7d-454d-b024-cf9672e40603', NULL, '2026-09-07T05:49:34.802019+00:00', 'Domun S.A', 16, NULL, '3cb3654f-afa2-4177-8050-200445060690', NULL, '4664e194-329c-40aa-b847-6218fbdf706f', 14.654344, -90.43705, '34 Avenida, Colonia El Cerrito, Zona 18, Ciudad de Guatemala, Departamento de Guatemala', NULL, 'd748d536-d8b4-4231-82a1-769424fb8cbb', '4664e194-329c-40aa-b847-6218fbdf706f', 'ddff80cc-6370-4c72-bec7-0af3f5c911d7', 'Zona 25, Ciudad de Guatemala, Departamento de Guatemala'),
  ('396ee4c3-9ab2-4fef-a87e-6c41128f00bc', '1a1b0242-e13d-431a-8e4c-50fb29e4fe57', NULL, 'CONSTRUCCION DE FASE 1, CONEXION VAS - HINCAPIE (TRAMO SB UNO)', 'tdtdtdtddtd', '39aeddd2-362b-4afc-b04b-f2891ae5babc', 'McDonald''s, 20 Calle, Villas del Sur, Zona 6, San Miguel Petapa, Departamento de Guatemala', 3000, 3400, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '99bef7bc-eac7-4c8e-b1bc-49d82da55f11', NULL, '2026-10-11T00:40:48.439534+00:00', NULL, NULL, NULL, NULL, NULL, '4664e194-329c-40aa-b847-6218fbdf706f', NULL, NULL, 'McDonald''s, 20 Calle, Villas del Sur, Zona 6, San Miguel Petapa, Departamento de Guatemala', NULL, NULL, '4664e194-329c-40aa-b847-6218fbdf706f', '1d2ff04e-d193-435e-a98f-7788d80ece68', 'naciones unidas 2') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."proyecto_usuario" (10 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."proyecto_usuario" ("id", "proyecto_id", "usuario_id", "rol_proyecto", "fecha_asignacion", "activo") VALUES
  ('e6d5486f-4beb-486b-b66c-d29f7f88e9b5', 'a322bafc-c581-45d1-a137-5bbad6c5661e', 'd748d536-d8b4-4231-82a1-769424fb8cbb', 'Delegado Residente', '2026-10-07', TRUE),
  ('e4c8c67d-19ef-4e02-8af4-b1ea4b628bd6', 'a322bafc-c581-45d1-a137-5bbad6c5661e', 'b50ebad6-7e1a-49ec-ba13-dfbbc57a7a19', 'Administrador', '2026-10-07', TRUE),
  ('f66e3942-5c4d-450b-9048-f58f68a4624e', 'a322bafc-c581-45d1-a137-5bbad6c5661e', '1f471ba3-d9da-402b-8ec5-6669cfa9a291', 'Gerencia', '2026-10-07', TRUE),
  ('dc690f15-1f22-46c5-9051-775a1138ffd5', 'a322bafc-c581-45d1-a137-5bbad6c5661e', '52a4fd96-1e81-4c67-ad2a-8316947e83f9', 'Topografo', '2026-10-07', TRUE),
  ('ac317fe7-a772-4b4c-a1de-32196d4b5458', 'a322bafc-c581-45d1-a137-5bbad6c5661e', 'f83a3120-7aea-4945-a727-28f00ad1fcba', 'AuxiliarDeCampo', '2026-10-07', TRUE),
  ('330e12cb-aa1e-437f-bf2e-3aea7be866e8', 'a322bafc-c581-45d1-a137-5bbad6c5661e', '67af47af-0091-47b4-9b31-b53710f4ddd5', 'Laboratorista', '2026-10-07', TRUE),
  ('6d1040a1-ca21-41d3-b199-b049df35bbf7', '033973cb-3e6c-464d-9f11-b3756978d555', '829b3416-2e1b-4d42-b378-08db3d1ce2f5', 'Delegado Residente', '2026-09-07', TRUE),
  ('7c318b2d-6dd1-467f-ad1a-e80ab4a5eeea', '033973cb-3e6c-464d-9f11-b3756978d555', 'a700035f-b306-437e-9539-668333dfd3ec', 'Laboratorista', '2026-09-07', TRUE),
  ('c6dfe123-2c03-4907-a36d-ca2beb3d1694', 'a322bafc-c581-45d1-a137-5bbad6c5661e', '829b3416-2e1b-4d42-b378-08db3d1ce2f5', 'IngenieroResidente', '2026-10-07', TRUE),
  ('3ac6e8ac-f417-4e74-b47f-a23273290f18', 'a322bafc-c581-45d1-a137-5bbad6c5661e', '73a069f0-1ad2-42d7-8557-b7eae96689c6', 'Administrador', '2026-10-07', TRUE) ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."parametro_proyecto" (5 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."parametro_proyecto" ("id", "proyecto_id", "porcentaje_indirectos", "porcentaje_iva", "porcentaje_amortizacion_anticipo", "monto_etapa_construccion", "monto_anticipo_total", "anticipo_total_recibido", "updated_at") VALUES
  ('f83e6a34-5a7c-4e9e-98ba-ed376c4d2938', 'a322bafc-c581-45d1-a137-5bbad6c5661e', 0.5, 0.12, 0.2, NULL, 0, NULL, '2026-09-11T01:22:25.921852+00:00'),
  ('c883e939-7615-46a0-9198-344959241728', '033973cb-3e6c-464d-9f11-b3756978d555', 0.45, 0.12, 0.2, NULL, 0, NULL, '2026-09-11T01:26:48.351566+00:00'),
  ('64c7619c-fcd9-463a-a954-59fdc926cf6b', '1a1b0242-e13d-431a-8e4c-50fb29e4fe57', 0.45, 0.12, 0.2, NULL, 0, NULL, '2026-10-11T00:40:48.61537+00:00'),
  ('85e380ec-fe39-4b46-9bee-4a29a7607f2b', '3c732c5f-9961-4e19-a44e-d77dfc103b94', 0.45, 0.12, 0.2, NULL, 0, NULL, '2026-09-28T18:34:43.021527+00:00'),
  ('a0521cd3-5ce2-4763-8b09-21b1d717b974', '9a9253b1-5e08-48fa-a6e4-25e443e05240', 0.45, 0.12, 0.2, NULL, 0, NULL, '2026-09-30T03:37:43.449888+00:00') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."renglon_trabajo" (2 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."renglon_trabajo" ("id", "proyecto_id", "categoria_id", "especificacion_id", "capitulo_id", "unidad_id", "tipo_renglon", "aplica_indirectos", "aplica_iva", "descripcion", "cantidad_contractual", "cantidad_ejecutada", "cantidad_ajustada", "precio_unitario_directo", "costo_total_directo_ajustado", "fecha_ultimo_avance", "codigo") VALUES
  ('ef319f19-44e9-4a39-8fb8-dfbe3e646a7f', 'a322bafc-c581-45d1-a137-5bbad6c5661e', NULL, NULL, NULL, NULL, 'COSTO_DIRECTO', TRUE, TRUE, 'Excavación en roca mediante voladura en talud inestable (201.03b)', 1500, 0, 1500, 0, 0, NULL, '201.03b'),
  ('ba100f44-58b4-4eed-813b-6f0c3434cc29', 'a322bafc-c581-45d1-a137-5bbad6c5661e', NULL, NULL, NULL, 'f50d7c1f-5c25-4efa-870d-539af7cb3a0a', 'COSTO_DIRECTO', TRUE, TRUE, 'Excavación en roca mediante voladura en talud inestable (201.03b)', 1500, 0, 1500, 0, 0, NULL, '201.03b') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."capitulo_sabana" (9 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."capitulo_sabana" ("id", "numero_capitulo", "nombre_capitulo", "descripcion", "created_at") VALUES
  ('86d47390-2130-416e-9218-25c564022c5c', 1, 'ESTUDIOS, PLANOS FINALES Y MANTENIMIENTO DE LA CARRETERA', NULL, '2026-08-08T17:34:40.293284+00:00'),
  ('ee7910c6-cab4-4595-9b6c-c69b2e4a479c', 2, 'MOVIMIENTO DE TIERRAS', NULL, '2026-08-08T17:34:40.293284+00:00'),
  ('5f33d60c-6643-41af-94ca-c0d358582082', 3, 'TERRAPLENES ESTRUCTURALES', NULL, '2026-08-08T17:34:40.293284+00:00'),
  ('6ce3b1fd-176f-4929-94f6-88afbebb6688', 4, 'SUBBASES Y BASES', NULL, '2026-08-08T17:34:40.293284+00:00'),
  ('fff38853-0cd0-4657-97fc-ae291e8828e5', 5, 'PAVIMENTOS ASFÁLTICOS', NULL, '2026-08-08T17:34:40.293284+00:00'),
  ('bd20261b-c730-4a6f-b756-c3143d836c18', 6, 'ESTRUCTURAS DE DRENAJE', NULL, '2026-08-08T17:34:40.293284+00:00'),
  ('71208098-4e83-4993-9c41-1a092f2a82c8', 7, 'BÓVEDADAS METÁLICAS', NULL, '2026-08-08T17:34:40.293284+00:00'),
  ('43c95b31-2ca6-4156-b44e-91ceb4b198cd', 8, 'CONSTRUCCIONES COMPLEMENTARIAS (SEÑALIZACIÓN)', NULL, '2026-08-08T17:34:40.293284+00:00'),
  ('14fb3235-3ec2-4c4b-94da-4ac3f53c1080', 9, 'ASPECTOS AMBIENTALES', NULL, '2026-08-30T15:31:15.767928+00:00') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."condicion_climatica" (1 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."condicion_climatica" ("id", "bitacora_entrada_id", "temperatura", "precipitacion", "viento", "visibilidad", "estado_general") VALUES
  ('5cf10bf6-17b9-4db3-a57f-558c4e2d4788', '577b45f5-038c-4227-be1a-1f59c5560bff', NULL, 0, NULL, 'Normal', 'Nublado') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."bitacora_entrada" (4 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."bitacora_entrada" ("id", "proyecto_id", "usuario_id", "tipo_bitacora_id", "categoria_actividad_id", "titulo", "fecha", "hora", "turno", "ubicacion", "descripcion", "estado_general_id", "comentarios", "firma_url", "publicada", "bloqueada", "created_at", "updated_at") VALUES
  ('577b45f5-038c-4227-be1a-1f59c5560bff', 'a322bafc-c581-45d1-a137-5bbad6c5661e', 'b50ebad6-7e1a-49ec-ba13-dfbbc57a7a19', NULL, NULL, 'Registro de Campo - 2026-09-28', '2026-09-28', '22:07', 'Diurno', 'Lat: 14.500167, Lng: -90.617015 (±209m)', 'Registro de bitácora Campo en 2026-09-28', NULL, NULL, NULL, TRUE, FALSE, '2026-09-28T04:07:59.187093+00:00', '2026-09-28T04:07:59.187093+00:00'),
  ('83f0c131-c6e4-487f-995d-5ba6168457c5', '9a9253b1-5e08-48fa-a6e4-25e443e05240', 'b50ebad6-7e1a-49ec-ba13-dfbbc57a7a19', NULL, NULL, 'Registro de Campo - 2026-10-04', '2026-10-04', '10:10', 'Diurno', 'Est. 1+200 a 50+20 (Ambos)', 'distribuccion de los registroa asigandos', NULL, NULL, NULL, TRUE, FALSE, '2026-10-04T16:10:39.585789+00:00', '2026-10-04T16:10:39.585789+00:00'),
  ('4897a01e-6c05-4ff3-bd97-ffee63604b83', '9a9253b1-5e08-48fa-a6e4-25e443e05240', 'b50ebad6-7e1a-49ec-ba13-dfbbc57a7a19', NULL, NULL, 'Registro de Campo - 2026-10-05', '2026-10-05', '21:41', 'Diurno', 'Est. 2+500 a 3+800 (Ambos)', 'Jornada laboral desarrollada con normalidad según programación', NULL, NULL, NULL, TRUE, FALSE, '2026-10-05T03:41:22.365422+00:00', '2026-10-05T03:41:22.365422+00:00'),
  ('2b720b29-74ff-489b-9329-dfc57852d3e5', '9a9253b1-5e08-48fa-a6e4-25e443e05240', 'b50ebad6-7e1a-49ec-ba13-dfbbc57a7a19', NULL, NULL, 'Registro de Campo - 2026-10-11', '2026-10-11', '18:46', 'Diurno', 'Pasaje Aycinena, Ciudad de Guatemala, Departamento de Guatemala', 'No ', NULL, NULL, NULL, TRUE, FALSE, '2026-10-11T00:46:40.229346+00:00', '2026-10-11T00:46:40.229346+00:00') ON CONFLICT ("id") DO NOTHING;

-- ----------------------------------------------------------------------------
-- TABLA: public."bitacora_pendiente" (4 registros)
-- ----------------------------------------------------------------------------
INSERT INTO "public"."bitacora_pendiente" ("id", "renglon_id", "proyecto_id", "registrado_por", "fecha_medicion", "estimacion_origen", "lado_via", "ubicacion_especifica", "estacion_inicial", "estacion_final", "longitud_medida", "ancho", "altura_espesor", "volumen_area_bruto", "descuento_aplicado_id", "cantidad_neta_cobrar", "es_derrumbre", "estado_conciliacion", "observaciones", "created_at", "updated_at", "bitacora_entrada_id", "anulado_en", "anulado_por", "motivo_anulacion", "estimacion_id") VALUES
  ('b2e13832-e1e1-48fd-b345-835d07324f75', 'ba100f44-58b4-4eed-813b-6f0c3434cc29', 'a322bafc-c581-45d1-a137-5bbad6c5661e', 'b50ebad6-7e1a-49ec-ba13-dfbbc57a7a19', '2026-09-28', NULL, 'Izquierdo', NULL, 1.5, 1.52, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, 'Pendiente', 'Conforme a especificaciones técnicas', '2026-09-28T04:07:59.345804+00:00', '2026-09-28T04:07:59.345804+00:00', '577b45f5-038c-4227-be1a-1f59c5560bff', NULL, NULL, NULL, NULL),
  ('58451853-cc2c-4702-94cd-b6681603ad65', 'ba100f44-58b4-4eed-813b-6f0c3434cc29', 'a322bafc-c581-45d1-a137-5bbad6c5661e', NULL, '2026-09-11', NULL, 'Derecho', 'Estación 14+200 a 14+600 Carril Derecho', 14.2, 14.6, 400, 3.65, 0.25, 365, NULL, 365, FALSE, 'Pendiente', 'Prueba de conciliación con trigger PostgreSQL', '2026-09-11T01:39:44.880309+00:00', '2026-09-11T01:39:44.880309+00:00', NULL, NULL, NULL, NULL, NULL),
  ('7ad4eac0-7b3f-4cb0-b781-01181c4329f4', 'ba100f44-58b4-4eed-813b-6f0c3434cc29', 'a322bafc-c581-45d1-a137-5bbad6c5661e', NULL, '2026-09-11', NULL, 'Sección Completa', 'Tramo con Descuento Alcantarilla', 20, 20.1, 100, 3, 0.5, 150, 'a20a8700-e690-410a-928d-5e9d985b3f5c', 100, FALSE, 'Pendiente', 'Prueba de resta automatica por v_factor', '2026-09-11T01:58:49.134389+00:00', '2026-09-11T01:58:49.134389+00:00', NULL, NULL, NULL, NULL, NULL),
  ('da2c602f-b532-4a6d-b2e5-66a2452e7728', 'ba100f44-58b4-4eed-813b-6f0c3434cc29', '9a9253b1-5e08-48fa-a6e4-25e443e05240', 'b50ebad6-7e1a-49ec-ba13-dfbbc57a7a19', '2026-10-04', NULL, 'Sección Completa', NULL, 0, 0.5, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, 'Pendiente', NULL, '2026-10-04T01:27:19.747501+00:00', '2026-10-04T01:27:19.747501+00:00', NULL, NULL, NULL, NULL, NULL) ON CONFLICT ("id") DO NOTHING;

COMMIT;

-- Respaldo completado exitosamente: 26 tablas con datos.